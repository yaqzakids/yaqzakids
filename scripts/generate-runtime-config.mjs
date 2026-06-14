import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
const outPath = path.join(root, 'public', 'assets', 'runtime-config.json')
const legacyOutPath = path.join(root, 'public', 'runtime-config.json')

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const env = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator === -1) continue
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    env[key] = value
  }
  return env
}

const env = readEnvFile(envPath)

const config = {
  supabaseUrl: env.VITE_SUPABASE_URL || 'https://cgvzeydhhkwosphixznd.supabase.co',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  siteUrl: env.VITE_SITE_URL || 'https://www.yaqzakids.com',
}

if (!config.supabaseAnonKey) {
  console.warn('[generate-runtime-config] VITE_SUPABASE_ANON_KEY missing — public/runtime-config.json will be incomplete.')
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`)
fs.writeFileSync(legacyOutPath, `${JSON.stringify(config, null, 2)}\n`)
console.log('[generate-runtime-config] wrote public/assets/runtime-config.json')
