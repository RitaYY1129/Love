// Deploy in Supabase Dashboard: Edge Functions -> Deploy a new function.
// The admin key is supplied securely by Supabase at runtime, never by the browser.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type' }

const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}') as Record<string, string>
const adminKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405, headers: cors })
  try {
    const { username, phone, password } = await request.json()
    if (!String(username || '').trim() || !/^1[3-9]\d{9}$/.test(String(phone || '')) || String(password || '').length < 6) {
      throw new Error('Please provide a username, a valid phone number, and a password with at least 6 characters.')
    }
    const projectUrl = Deno.env.get('SUPABASE_URL')
    if (!projectUrl || !adminKey) throw new Error('Supabase function secrets are unavailable.')
    const admin = createClient(projectUrl, adminKey)
    const email = `phone-${phone}@love-diary.local`
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { username: String(username).trim().toLowerCase(), identifier: String(phone) }
    })
    if (error) throw error
    return Response.json({ user: data.user }, { headers: cors })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return Response.json({ message }, { status: 400, headers: cors })
  }
})
