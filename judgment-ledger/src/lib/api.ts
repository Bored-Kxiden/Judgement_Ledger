const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://judgement-ledger.onrender.com'

export interface SubmitDeployPayload {
  id: string
  author: string
  authorInitials: string
  service: string
  branch: string
  commitRef: string
  testsPassed: number
  testsTotal: number
  files: unknown
}

export interface SubmitDeployResponse {
  submission: { id: string; status: string; workflow_run_id: string | null }
  workflowTriggered: boolean
  workflowTriggerError: string | null
}

/**
 * Calls the real Judgment Ledger backend — no Yoxa connector API key needed
 * here, since this is the app's own public-facing submission action, not a
 * Yoxa-to-server tool call. Persists the submission and fires Yoxa's entry
 * trigger; does not wait for or return the routing decision, since that
 * happens asynchronously inside the Yoxa workflow.
 */
export async function submitDeploy(payload: SubmitDeployPayload): Promise<SubmitDeployResponse> {
  const res = await fetch(`${API_BASE}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  }
  return body as SubmitDeployResponse
}
