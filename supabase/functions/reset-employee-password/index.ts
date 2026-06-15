import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OWNER_EMAIL = 'hello@yaqzakids.com'

interface ResetPasswordBody {
  adminUserId?: string
  password?: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const callerEmail = (caller.email ?? '').trim().toLowerCase()
  if (callerEmail !== OWNER_EMAIL) {
    return jsonResponse({ error: 'Only the owner can reset employee passwords' }, 403)
  }

  let body: ResetPasswordBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const adminUserId = body.adminUserId
  const password = body.password ?? ''

  if (!adminUserId || !password) {
    return jsonResponse({ error: 'Employee id and new temporary password are required' }, 400)
  }
  if (password.length < 8) {
    return jsonResponse({ error: 'Password must be at least 8 characters' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: employee, error: fetchError } = await adminClient
    .from('admin_users')
    .select('id, email, user_id')
    .eq('id', adminUserId)
    .maybeSingle()

  if (fetchError || !employee) {
    return jsonResponse({ error: 'Employee not found' }, 404)
  }

  if ((employee.email ?? '').toLowerCase() === OWNER_EMAIL) {
    return jsonResponse({ error: 'Cannot reset the owner password here' }, 400)
  }

  const email = (employee.email ?? '').trim().toLowerCase()
  let userId = employee.user_id as string | null

  if (!userId) {
    const { data: existingUserId } = await adminClient.rpc('get_auth_user_id_by_email', { p_email: email })

    if (existingUserId) {
      userId = existingUserId
    } else {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { is_admin_team: true },
      })
      if (createError) {
        return jsonResponse({ error: createError.message }, 400)
      }
      userId = created.user.id
    }

    await adminClient.from('admin_users').update({ user_id: userId }).eq('id', adminUserId)
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    password,
  })

  if (authError) {
    return jsonResponse({ error: authError.message }, 400)
  }

  const { error: updateError } = await adminClient
    .from('admin_users')
    .update({ must_change_password: true })
    .eq('id', adminUserId)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 400)
  }

  return jsonResponse({ success: true })
})
