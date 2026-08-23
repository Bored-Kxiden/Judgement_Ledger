export type Category =
  | 'payments logic'
  | 'config change'
  | 'text/copy change'
  | 'auth/permissions'
  | 'data schema migration'
  | 'infra/scaling'

export type TrustStatus = 'auto-approve trusted' | 'escalation required'

export interface CategoryTrust {
  category: Category
  status: TrustStatus
  minSampleRequired: number
  currentSampleSize: number
  confidenceFloor: number
  corrections: number
  correctionSeverity: 'none' | 'minor' | 'severe'
  recommendation: 'expand trust' | 'restore trust' | 'hold as-is'
  reasoning: string
}

export const trustBoundaries: CategoryTrust[] = [
  {
    category: 'payments logic',
    status: 'escalation required',
    minSampleRequired: 20,
    currentSampleSize: 6,
    confidenceFloor: 0.68,
    corrections: 2,
    correctionSeverity: 'severe',
    recommendation: 'hold as-is',
    reasoning:
      'Only 6 entries against a 20-entry minimum, and 2 of those 6 required a human correction — including one that caught a rounding error pre-deploy. Sample size and correction rate both argue against loosening.',
  },
  {
    category: 'config change',
    status: 'auto-approve trusted',
    minSampleRequired: 20,
    currentSampleSize: 41,
    confidenceFloor: 0.68,
    corrections: 0,
    correctionSeverity: 'none',
    recommendation: 'hold as-is',
    reasoning: '41 entries, zero corrections. Comfortably above threshold — no action needed.',
  },
  {
    category: 'text/copy change',
    status: 'auto-approve trusted',
    minSampleRequired: 20,
    currentSampleSize: 63,
    confidenceFloor: 0.68,
    corrections: 0,
    correctionSeverity: 'none',
    recommendation: 'hold as-is',
    reasoning: 'Highest-trust category in the system — 63 entries, zero corrections, zero incidents.',
  },
  {
    category: 'auth/permissions',
    status: 'escalation required',
    minSampleRequired: 20,
    currentSampleSize: 9,
    confidenceFloor: 0.68,
    corrections: 1,
    correctionSeverity: 'severe',
    recommendation: 'hold as-is',
    reasoning:
      'One correction would have exposed an internal endpoint pre-deploy. Given the severity of what was caught, this category should if anything be scrutinized further, not loosened, even once sample size grows.',
  },
  {
    category: 'data schema migration',
    status: 'escalation required',
    minSampleRequired: 20,
    currentSampleSize: 3,
    confidenceFloor: 0.68,
    corrections: 0,
    correctionSeverity: 'none',
    recommendation: 'hold as-is',
    reasoning: 'Too thin to trust regardless of outcome quality — only 3 entries. Stays escalation-required purely on sample size.',
  },
  {
    category: 'infra/scaling',
    status: 'escalation required',
    minSampleRequired: 20,
    currentSampleSize: 0,
    confidenceFloor: 0.68,
    corrections: 0,
    correctionSeverity: 'none',
    recommendation: 'hold as-is',
    reasoning: 'No data yet. Nothing to evaluate.',
  },
]

export type Verdict =
  | 'confirmed safe'
  | 'confirmed problem'
  | 'confirmed problem (caught pre-deploy)'
  | 'confirmed problem (minor)'
  | 'still inconclusive'

export interface LedgerEntry {
  submissionId: string
  category: Category
  blastRadius: number
  decision: string
  confidence: number
  evidenceSampleSize: number
  humanCorrected: boolean
  outcome: string
  verdict: Verdict
}

export const ledgerHistory: LedgerEntry[] = [
  { submissionId: 'SUB-71092', category: 'payments logic', blastRadius: 6, decision: 'escalated → approved', confidence: 0.52, evidenceSampleSize: 6, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-65510', category: 'payments logic', blastRadius: 5, decision: 'auto-approved', confidence: 0.71, evidenceSampleSize: 5, humanCorrected: true, outcome: 'double-charged 12 users, rolled back', verdict: 'confirmed problem' },
  { submissionId: 'SUB-80217', category: 'payments logic', blastRadius: 4, decision: 'escalated → approved', confidence: 0.48, evidenceSampleSize: 6, humanCorrected: false, outcome: 'monitoring window still open', verdict: 'still inconclusive' },
  { submissionId: 'SUB-58210', category: 'payments logic', blastRadius: 8, decision: 'escalated → blocked', confidence: 0.40, evidenceSampleSize: 5, humanCorrected: true, outcome: 'caught a rounding error pre-deploy', verdict: 'confirmed problem (caught pre-deploy)' },
  { submissionId: 'SUB-52204', category: 'payments logic', blastRadius: 3, decision: 'escalated → approved', confidence: 0.55, evidenceSampleSize: 4, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-77340', category: 'payments logic', blastRadius: 6, decision: 'escalated → approved', confidence: 0.50, evidenceSampleSize: 6, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-90112', category: 'config change', blastRadius: 1, decision: 'auto-approved', confidence: 0.94, evidenceSampleSize: 41, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-90340', category: 'config change', blastRadius: 2, decision: 'auto-approved', confidence: 0.91, evidenceSampleSize: 41, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-90501', category: 'config change', blastRadius: 1, decision: 'auto-approved', confidence: 0.93, evidenceSampleSize: 41, humanCorrected: false, outcome: 'brief latency spike, self-resolved', verdict: 'confirmed safe' },
  { submissionId: 'SUB-90889', category: 'config change', blastRadius: 1, decision: 'auto-approved', confidence: 0.95, evidenceSampleSize: 41, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-91022', category: 'text/copy change', blastRadius: 1, decision: 'auto-approved', confidence: 0.98, evidenceSampleSize: 63, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-91190', category: 'text/copy change', blastRadius: 1, decision: 'auto-approved', confidence: 0.97, evidenceSampleSize: 63, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-91344', category: 'text/copy change', blastRadius: 1, decision: 'auto-approved', confidence: 0.98, evidenceSampleSize: 63, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-83012', category: 'auth/permissions', blastRadius: 9, decision: 'escalated → approved', confidence: 0.44, evidenceSampleSize: 9, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
  { submissionId: 'SUB-83220', category: 'auth/permissions', blastRadius: 7, decision: 'escalated → blocked', confidence: 0.38, evidenceSampleSize: 9, humanCorrected: true, outcome: 'would have exposed an internal endpoint', verdict: 'confirmed problem (caught pre-deploy)' },
  { submissionId: 'SUB-83501', category: 'auth/permissions', blastRadius: 10, decision: 'escalated → approved', confidence: 0.41, evidenceSampleSize: 9, humanCorrected: false, outcome: 'monitoring window still open', verdict: 'still inconclusive' },
  { submissionId: 'SUB-76650', category: 'data schema migration', blastRadius: 12, decision: 'escalated → approved', confidence: 0.35, evidenceSampleSize: 3, humanCorrected: false, outcome: 'required a follow-up patch, minor', verdict: 'confirmed problem (minor)' },
  { submissionId: 'SUB-76890', category: 'data schema migration', blastRadius: 11, decision: 'escalated → approved', confidence: 0.37, evidenceSampleSize: 3, humanCorrected: false, outcome: 'no incident', verdict: 'confirmed safe' },
]

export const serviceDependencies: Record<string, string[]> = {
  'billing-service': ['checkout-service', 'invoicing-service', 'refunds-service', 'notification-service', 'fraud-detection-service', 'reporting-service'],
  'auth-service': ['checkout-service', 'billing-service', 'user-profile-service', 'admin-console', 'reporting-service', 'notification-service', 'fraud-detection-service', 'mobile-gateway', 'partner-api'],
  'checkout-service': ['order-service', 'notification-service'],
  'user-profile-service': ['checkout-service', 'notification-service', 'marketing-site'],
  'order-service': ['invoicing-service', 'reporting-service'],
  'marketing-site': [],
  'notification-service': [],
  'reporting-service': [],
  'fraud-detection-service': ['billing-service', 'checkout-service'],
  'refunds-service': ['invoicing-service', 'reporting-service'],
  'invoicing-service': ['reporting-service'],
  'admin-console': [],
  'mobile-gateway': ['checkout-service', 'billing-service'],
  'partner-api': ['order-service', 'invoicing-service'],
}

export interface DiffFile {
  filename: string
  status: 'modified' | 'added'
  hunks: {
    header: string
    lines: { type: 'context' | 'add' | 'remove'; content: string }[]
  }[]
}

export interface Submission {
  id: string
  author: string
  authorInitials: string
  service: string
  branch: string
  commit: string
  category: Category
  testsPassed: number
  testsTotal: number
  timestamp: string
  blastRadius: number
  affectedServices: string[]
  files: DiffFile[]
  confidence: number
  matchedHistoryCount: number
}

export const riskySubmission: Submission = {
  id: 'SUB-88214',
  author: 'A. Verma',
  authorInitials: 'AV',
  service: 'billing-service',
  branch: 'fix/retry-cap-increase',
  commit: 'a91f3e2',
  category: 'payments logic',
  testsPassed: 41,
  testsTotal: 41,
  timestamp: '2026-08-18T14:22:00Z',
  blastRadius: 6,
  affectedServices: ['checkout-service', 'invoicing-service', 'refunds-service', 'notification-service', 'fraud-detection-service', 'reporting-service'],
  confidence: 0.52,
  matchedHistoryCount: 6,
  files: [
    {
      filename: 'billing/retry_policy.py',
      status: 'modified',
      hunks: [
        {
          header: '@@ -12,7 +12,8 @@ class RetryPolicy:',
          lines: [
            { type: 'context', content: '    def __init__(self):' },
            { type: 'remove', content: '        self.MAX_RETRIES = 3' },
            { type: 'remove', content: '        self.BACKOFF_MULTIPLIER = 1.4' },
            { type: 'add', content: '        self.MAX_RETRIES = 5' },
            { type: 'add', content: '        self.BACKOFF_MULTIPLIER = 1.8' },
            { type: 'add', content: '        self.RETRY_ON_TIMEOUT = True' },
            { type: 'context', content: '' },
            { type: 'context', content: '    def should_retry(self, attempt, error):' },
            { type: 'remove', content: '        return attempt < self.MAX_RETRIES' },
            { type: 'add', content: '        if error.code == "DUPLICATE_CHARGE_RISK":' },
            { type: 'add', content: '            return False' },
            { type: 'add', content: '        return attempt < self.MAX_RETRIES' },
          ],
        },
      ],
    },
    {
      filename: 'billing/webhook_handler.py',
      status: 'modified',
      hunks: [
        {
          header: '@@ -45,6 +45,9 @@ def handle_payment_webhook(payload):',
          lines: [
            { type: 'context', content: '    idempotency_key = payload.get("idempotency_key")' },
            { type: 'add', content: '    if not idempotency_key:' },
            { type: 'add', content: '        logger.warning("Missing idempotency key, generating fallback")' },
            { type: 'add', content: '        idempotency_key = generate_fallback_key(payload)' },
            { type: 'context', content: '    process_payment(payload, idempotency_key)' },
          ],
        },
      ],
    },
    { filename: 'billing/tests/test_retry_policy.py', status: 'modified', hunks: [] },
    { filename: 'billing/config/retry_defaults.yaml', status: 'modified', hunks: [] },
  ],
}

export const trivialSubmission: Submission = {
  id: 'SUB-91501',
  author: 'R. Iyer',
  authorInitials: 'RI',
  service: 'marketing-site',
  branch: 'copy/hero-banner-tweak',
  commit: 'f22ab90',
  category: 'text/copy change',
  testsPassed: 12,
  testsTotal: 12,
  timestamp: '2026-08-19T09:04:00Z',
  blastRadius: 0,
  affectedServices: [],
  confidence: 0.98,
  matchedHistoryCount: 63,
  files: [
    {
      filename: 'homepage/copy/hero_banner.txt',
      status: 'modified',
      hunks: [
        {
          header: '@@ -1 +1 @@',
          lines: [
            { type: 'remove', content: 'Ship faster with confidence' },
            { type: 'add', content: 'Ship faster, with total confidence.' },
          ],
        },
      ],
    },
  ],
}

export const categorySummaries: Record<Category, string> = {
  'payments logic': '6 entries, 2 human corrections — well below trust threshold.',
  'config change': '41+ entries, 0 corrections — comfortably trusted.',
  'text/copy change': '63+ entries, 0 corrections — highest-trust category in the system.',
  'auth/permissions': '9 entries, 1 severe human correction — stays escalation-required.',
  'data schema migration': 'Only 3 entries — too thin to trust regardless of outcome quality.',
  'infra/scaling': 'No data yet.',
}
