import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OWNER_EMAIL = 'hello@yaqzakids.com'

interface CreateEmployeeBody {
  email?: string
  password?: string
  fullName?: string
  role?: string
  status?: string
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
    return jsonResponse({ error: 'Only the owner can create employee accounts' }, 403)
  }

  let body: CreateEmployeeBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''
  const fullName = (body.fullName ?? '').trim()
  const role = body.role ?? 'editor'
  const status = body.status ?? 'active'

  if (!email || !password) {
    return jsonResponse({ error: 'Email and temporary password are required' }, 400)
  }
  if (password.length < 8) {
    return jsonResponse({ error: 'Password must be at least 8 characters' }, 400)
  }
  if (email === OWNER_EMAIL) {
    return jsonResponse({ error: 'Cannot create an account for the owner email' }, 400)
  }
  if (!['admin', 'editor', 'support', 'content_writer', 'reviewer'].includes(role)) {
    return jsonResponse({ error: 'Invalid role' }, 400)
  }
  if (!['active', 'invited', 'suspended'].includes(status)) {
    return jsonResponse({ error: 'Invalid status' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: existingUserId } = await adminClient.rpc('get_auth_user_id_by_email', { p_email: email })

  let userId: string

  if (existingUserId) {
    const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(existingUserId, {
      password,
      email_confirm: true,
    })
    if (updateError) {
      return jsonResponse({ error: updateError.message }, 400)
    }
    userId = updated.user.id
  } else {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || null, is_admin_team: true },
    })
    if (createError) {
      return jsonResponse({ error: createError.message }, 400)
    }
    userId = created.user.id
  }

  const { data: row, error: upsertError } = await adminClient
    .from('admin_users')
    .upsert(
      {
        email,
        role,
        status,
        full_name: fullName || null,
        user_id: userId,
        created_by: caller.id,
        must_change_password: true,
      },
      { onConflict: 'email' }
    )
    .select('id, email, role, status, full_name, user_id, created_at, last_login_at, must_change_password')
    .single()

  if (upsertError) {
    return jsonResponse({ error: upsertError.message }, 400)
  }

  return jsonResponse({ success: true, employee: row })
})
