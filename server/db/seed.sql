-- The Judgment Ledger — seed data
-- Ported directly from the reference docs (service dependency graph, trust
-- boundary configuration, judgment ledger history) so the real backend starts
-- from the same evidence the frontend mock was built against.

insert into service_dependencies (service, downstream) values
  ('billing-service',          array['checkout-service','invoicing-service','refunds-service','notification-service','fraud-detection-service','reporting-service']),
  ('auth-service',             array['checkout-service','billing-service','user-profile-service','admin-console','reporting-service','notification-service','fraud-detection-service','mobile-gateway','partner-api']),
  ('checkout-service',         array['order-service','notification-service']),
  ('user-profile-service',     array['checkout-service','notification-service','marketing-site']),
  ('order-service',            array['invoicing-service','reporting-service']),
  ('marketing-site',           array[]::text[]),
  ('notification-service',     array[]::text[]),
  ('reporting-service',        array[]::text[]),
  ('fraud-detection-service',  array['billing-service','checkout-service']),
  ('refunds-service',          array['invoicing-service','reporting-service']),
  ('invoicing-service',        array['reporting-service']),
  ('admin-console',            array[]::text[]),
  ('mobile-gateway',           array['checkout-service','billing-service']),
  ('partner-api',              array['order-service','invoicing-service'])
on conflict (service) do update set downstream = excluded.downstream;

insert into trust_boundaries (category, status, min_sample_required, current_sample_size, confidence_floor, corrections, correction_severity, recommendation, reasoning) values
  ('payments logic',        'escalation required',   20, 6,  0.68, 2, 'severe', 'hold as-is', 'Only 6 entries against a 20-entry minimum, and 2 of those 6 required a human correction — including one that caught a rounding error pre-deploy. Sample size and correction rate both argue against loosening.'),
  ('config change',         'auto-approve trusted',  20, 41, 0.68, 0, 'none',   'hold as-is', '41 entries, zero corrections. Comfortably above threshold — no action needed.'),
  ('text/copy change',      'auto-approve trusted',  20, 63, 0.68, 0, 'none',   'hold as-is', 'Highest-trust category in the system — 63 entries, zero corrections, zero incidents.'),
  ('auth/permissions',      'escalation required',   20, 9,  0.68, 1, 'severe', 'hold as-is', 'One correction would have exposed an internal endpoint pre-deploy. Given the severity of what was caught, this category should if anything be scrutinized further, not loosened, even once sample size grows.'),
  ('data schema migration', 'escalation required',   20, 3,  0.68, 0, 'none',   'hold as-is', 'Too thin to trust regardless of outcome quality — only 3 entries. Stays escalation-required purely on sample size.'),
  ('infra/scaling',         'escalation required',   20, 0,  0.68, 0, 'none',   'hold as-is', 'No data yet. Nothing to evaluate.')
on conflict (category) do update set
  status = excluded.status, min_sample_required = excluded.min_sample_required,
  current_sample_size = excluded.current_sample_size, confidence_floor = excluded.confidence_floor,
  corrections = excluded.corrections, correction_severity = excluded.correction_severity,
  recommendation = excluded.recommendation, reasoning = excluded.reasoning;

-- One submissions row per historical ledger entry, so judgment_ledger's FK is satisfiable.
-- service is a placeholder (billing-service / marketing-site by category) since the
-- original mock data doesn't carry per-entry service names.
insert into submissions (id, author, service, category, blast_radius, confidence, matched_history_count, status)
select
  v.submission_id, 'historical', case when v.category = 'text/copy change' then 'marketing-site' else 'billing-service' end,
  v.category, v.blast_radius, v.confidence, v.evidence_sample_size, 'shipped'
from (values
  ('SUB-71092','payments logic',6,0.52,6),
  ('SUB-65510','payments logic',5,0.71,5),
  ('SUB-80217','payments logic',4,0.48,6),
  ('SUB-58210','payments logic',8,0.40,5),
  ('SUB-52204','payments logic',3,0.55,4),
  ('SUB-77340','payments logic',6,0.50,6),
  ('SUB-90112','config change',1,0.94,41),
  ('SUB-90340','config change',2,0.91,41),
  ('SUB-90501','config change',1,0.93,41),
  ('SUB-90889','config change',1,0.95,41),
  ('SUB-91022','text/copy change',1,0.98,63),
  ('SUB-91190','text/copy change',1,0.97,63),
  ('SUB-91344','text/copy change',1,0.98,63),
  ('SUB-83012','auth/permissions',9,0.44,9),
  ('SUB-83220','auth/permissions',7,0.38,9),
  ('SUB-83501','auth/permissions',10,0.41,9),
  ('SUB-76650','data schema migration',12,0.35,3),
  ('SUB-76890','data schema migration',11,0.37,3)
) as v(submission_id, category, blast_radius, confidence, evidence_sample_size)
on conflict (id) do nothing;

insert into judgment_ledger (submission_id, category, blast_radius, decision, confidence, evidence_sample_size, human_corrected, observation_status, outcome, verdict) values
  ('SUB-71092', 'payments logic', 6,  'escalated → approved', 0.52, 6, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-65510', 'payments logic', 5,  'auto-approved',         0.71, 5, true,  'complete', 'double-charged 12 users, rolled back', 'confirmed problem'),
  ('SUB-80217', 'payments logic', 4,  'escalated → approved', 0.48, 6, false, 'pending',  'monitoring window still open', 'still inconclusive'),
  ('SUB-58210', 'payments logic', 8,  'escalated → blocked',  0.40, 5, true,  'complete', 'caught a rounding error pre-deploy', 'confirmed problem (caught pre-deploy)'),
  ('SUB-52204', 'payments logic', 3,  'escalated → approved', 0.55, 4, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-77340', 'payments logic', 6,  'escalated → approved', 0.50, 6, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-90112', 'config change',  1,  'auto-approved',         0.94, 41, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-90340', 'config change',  2,  'auto-approved',         0.91, 41, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-90501', 'config change',  1,  'auto-approved',         0.93, 41, false, 'complete', 'brief latency spike, self-resolved', 'confirmed safe'),
  ('SUB-90889', 'config change',  1,  'auto-approved',         0.95, 41, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-91022', 'text/copy change', 1, 'auto-approved',        0.98, 63, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-91190', 'text/copy change', 1, 'auto-approved',        0.97, 63, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-91344', 'text/copy change', 1, 'auto-approved',        0.98, 63, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-83012', 'auth/permissions', 9, 'escalated → approved', 0.44, 9, false, 'complete', 'no incident', 'confirmed safe'),
  ('SUB-83220', 'auth/permissions', 7, 'escalated → blocked',  0.38, 9, true,  'complete', 'would have exposed an internal endpoint', 'confirmed problem (caught pre-deploy)'),
  ('SUB-83501', 'auth/permissions', 10,'escalated → approved', 0.41, 9, false, 'pending',  'monitoring window still open', 'still inconclusive'),
  ('SUB-76650', 'data schema migration', 12, 'escalated → approved', 0.35, 3, false, 'complete', 'required a follow-up patch, minor', 'confirmed problem (minor)'),
  ('SUB-76890', 'data schema migration', 11, 'escalated → approved', 0.37, 3, false, 'complete', 'no incident', 'confirmed safe')
on conflict (submission_id) do nothing;

insert into deployment_observations (submission_id, fast_window_status, fast_window_summary, slow_window_status, slow_window_summary) values
  ('SUB-65510', 'complete', 'Error rate spiked to 4.1% in the first 30 minutes; 12 customers were double-charged before the retry logic was rolled back.', 'complete', 'Rollback held; no further duplicate charges in the 24 hours after revert.'),
  ('SUB-80217', 'complete', 'No errors or crashes detected in the first 2 hours post-deploy.', 'pending', 'Payments-category slow-feedback window remains open for 72 hours from deploy.')
on conflict (submission_id) do nothing;
