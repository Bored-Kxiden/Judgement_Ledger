import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  connectorApiKey: required('CONNECTOR_API_KEY'),
  // Optional: the trigger call is skipped (not a boot-time failure) if these
  // aren't set yet, since not every deploy of this server needs Yoxa wired up.
  yoxaTriggerUrl: process.env.YOXA_TRIGGER_URL || null,
  yoxaDeploymentSecret: process.env.YOXA_DEPLOYMENT_SECRET || null,
  // Deployed HITL. Also optional: the receiver returns 503 rather than
  // failing at boot, so the server still starts before these are generated.
  yoxaHitlWebhookSigningSecret: process.env.YOXA_HITL_WEBHOOK_SIGNING_SECRET || null,
  yoxaHitlResponseSecret: process.env.YOXA_HITL_RESPONSE_SECRET || null,
}
