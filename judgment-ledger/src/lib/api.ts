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
export interface ApprovalOption {
  option_id: string
  title: string
  description?: string
}

export interface ApprovalRequest {
  request_id: string
  workflow_run_id: string | null
  title: string | null
  description: string | null
  options: ApprovalOption[]
  status: 'pending' | 'answered'
  selected_option_id: string | null
  override_message: string | null
  answered_by: string | null
  answered_at: string | null
  created_at: string
  submission: {
    id: string
    author: string
    service: string
    branch: string | null
    commit_ref: string | null
    category: string | null
    status: string
  } | null
}

/** Pending human approvals Yoxa has handed to this app. */
export async function fetchApprovals(status: 'pending' | 'answered' = 'pending'): Promise<ApprovalRequest[]> {
  const res = await fetch(`${API_BASE}/api/hitl/requests?status=${status}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  return body.requests as ApprovalRequest[]
}

/**
 * Submits the human's decision through our own server, which holds the Yoxa
 * response secret. The browser never talks to Yoxa directly.
 */
export async function respondToApproval(
  requestId: string,
  decision: { selectedOptionId?: string; overrideMessage?: string; decidedBy?: string },
): Promise<{ alreadyAnswered: boolean }> {
  const res = await fetch(`${API_BASE}/api/hitl/requests/${requestId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  return { alreadyAnswered: Boolean(body.alreadyAnswered) }
}

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
