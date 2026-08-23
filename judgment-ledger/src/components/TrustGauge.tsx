export function TrustGauge({
  currentSampleSize,
  minSampleRequired,
  confidence,
  confidenceFloor,
}: {
  currentSampleSize: number
  minSampleRequired: number
  confidence: number
  confidenceFloor: number
}) {
  const samplePct = Math.min(100, (currentSampleSize / minSampleRequired) * 100)
  const confPct = Math.min(100, confidence * 100)
  const floorPct = confidenceFloor * 100
  const meetsSample = currentSampleSize >= minSampleRequired
  const meetsConfidence = confidence >= confidenceFloor

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-fg-muted">Evidence sample</span>
          <span className="font-mono text-fg">
            {currentSampleSize} / {minSampleRequired} required
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-raised">
          <div
            className={`h-full rounded-full ${meetsSample ? 'bg-teal' : 'bg-amber'}`}
            style={{ width: `${samplePct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-fg-muted">Confidence</span>
          <span className="font-mono text-fg">
            {(confidence * 100).toFixed(0)}% (floor {(confidenceFloor * 100).toFixed(0)}%)
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-surface-raised">
          <div
            className={`h-full rounded-full ${meetsConfidence ? 'bg-teal' : 'bg-red'}`}
            style={{ width: `${confPct}%` }}
          />
          <div
            className="absolute top-0 h-2 w-px bg-fg-subtle"
            style={{ left: `${floorPct}%` }}
            title="Confidence floor to auto-approve"
          />
        </div>
      </div>
    </div>
  )
}
