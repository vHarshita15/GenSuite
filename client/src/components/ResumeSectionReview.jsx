// client/src/components/ResumeSectionReview.jsx
// Reference design: paper on the left (per-line tags + Autofix), score panel on the right.
// Props: sections (from /review API), each: { key, label, status, score, findings[], bullets?[], text?, feedback?, suggestion? }
import { useState, useMemo } from 'react'

const css = `
.rsr{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;font-family:inherit}
@media(max-width:800px){.rsr{grid-template-columns:1fr}}
.rsr-paper{background:#fff;color:#2a2a3c;border-radius:12px;padding:24px 26px;font-family:Georgia,serif}
.rsr-h{font:700 11px/1 system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#5b45c9;
  border-bottom:1px solid #e6e6ee;padding:6px 0;margin:18px 0 10px;display:flex;justify-content:space-between;align-items:center}
.rsr-h:first-child{margin-top:0}
.rsr-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin:8px 0;font-size:14.5px;line-height:1.45}
.rsr-pill{font:600 11px/1 system-ui,sans-serif;padding:5px 9px;border-radius:99px;white-space:nowrap}
.rsr-good{background:#e4f3ea;color:#2f7a4d}.rsr-bad{background:#fbe7e1;color:#b5472b}.rsr-warn{background:#fdf1d8;color:#9a6a12}
.rsr-old{text-decoration:line-through;text-decoration-color:#e0703c;text-decoration-thickness:2px;color:#777}
.rsr-new{background:#efecfb;border-left:3px solid #5b45c9;padding:10px 12px;border-radius:0 8px 8px 0;margin:6px 0 10px;font-size:14.5px}
.rsr-note{font:13px/1.4 system-ui,sans-serif;margin:5px 0;display:flex;gap:8px}
.rsr-dot{width:8px;height:8px;border-radius:50%;margin-top:5px;flex:none}
.rsr-sug{font:13px/1.45 system-ui,sans-serif;background:#f5f4fb;border-radius:8px;padding:10px 12px;margin-top:8px;color:#3b3b55}
.rsr-side{background:linear-gradient(160deg,#4a35b8,#7b5bd6);color:#fff;border-radius:12px;padding:22px;height:fit-content}
.rsr-lab{font:700 11px system-ui;letter-spacing:.14em;opacity:.8}
.rsr-score{font:800 64px/1 system-ui;margin:8px 0}.rsr-score small{font-size:20px;opacity:.7;font-weight:500}
.rsr-bar{height:6px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden;margin:6px 0 10px}
.rsr-bar i{display:block;height:100%;background:linear-gradient(90deg,#e0703c,#f2c94c,#7be0a0)}
.rsr-chk{background:rgba(255,255,255,.12);border-radius:10px;padding:10px 12px;margin:8px 0;font:13px system-ui;display:flex;gap:8px;align-items:center}
.rsr-btn{width:100%;margin-top:14px;padding:12px;border:0;border-radius:10px;background:#fff;color:#4a35b8;font:700 14px system-ui;cursor:pointer}
`

const TONE = { strong: 'good', fixed: 'good', 'needs work': 'warn', weak: 'bad', 'weak verb': 'bad', 'no metrics': 'bad', vague: 'bad' }
const DOT = { good: '#2f7a4d', warn: '#d9a11c', bad: '#c4482a' }

const Pill = ({ t }) => <span className={`rsr-pill rsr-${TONE[t] || 'warn'}`}>{t === 'strong' || t === 'fixed' ? `${t} ✓` : t}</span>

export default function ResumeSectionReview({ sections = [] }) {
  const [fixed, setFixed] = useState(false)

  const stats = useMemo(() => {
    const bullets = sections.flatMap((s) => s.bullets || [])
    const weak = bullets.filter((b) => !b.strong)
    const rewritten = weak.filter((b) => b.rewrite)
    const otherBad = sections.filter((s) => !s.bullets).flatMap((s) => s.findings).filter((f) => f.type === 'bad').length
    const scoreOf = (s, afterFix) => {
      if (!s.bullets?.length) return s.score
      const ok = s.bullets.filter((b) => b.strong || (afterFix && b.rewrite)).length
      return Math.round((ok / s.bullets.length) * 100)
    }
    const avg = (afterFix) => Math.round(sections.reduce((a, s) => a + scoreOf(s, afterFix), 0) / (sections.length || 1))
    return {
      before: avg(false), after: avg(true),
      issuesBefore: weak.length + otherBad,
      issuesAfter: weak.length - rewritten.length + otherBad,
      rewrittenWeakVerb: rewritten.filter((b) => b.tag === 'weak verb').length,
      addedMetrics: rewritten.filter((b) => b.tag !== 'weak verb').length,
      canFix: rewritten.length > 0,
    }
  }, [sections])

  const score = fixed ? stats.after : stats.before
  const issues = fixed ? stats.issuesAfter : stats.issuesBefore

  return (
    <div className="rsr">
      <style>{css}</style>

      <div className="rsr-paper">
        {sections.map((s) => (
          <div key={s.key}>
            <div className="rsr-h"><span>{s.label}</span><Pill t={s.status} /></div>

            {/* Bullet sections: each bullet tagged, like the reference */}
            {s.bullets?.map((b, i) => {
              const showFix = fixed && b.rewrite
              return (
                <div key={i}>
                  <div className="rsr-row">
                    <span className={showFix ? 'rsr-old' : ''}>• {b.original}</span>
                    <Pill t={showFix ? 'fixed' : b.tag} />
                  </div>
                  {showFix && <div className="rsr-new">• {b.rewrite}</div>}
                  {!fixed && b.rewriteUnavailable && <div className="rsr-note" style={{ color: '#888' }}>Rewrite unavailable</div>}
                </div>
              )
            })}

            {/* Non-bullet sections: show the text, then the review notes */}
            {!s.bullets && s.text && s.text.split('\n').map((l, i) => <div key={i} className="rsr-row"><span>{l}</span></div>)}

            {s.findings?.map((f, i) => (
              <div key={i} className="rsr-note">
                <span className="rsr-dot" style={{ background: DOT[f.type] }} />{f.msg}
              </div>
            ))}

            {s.feedback && <div className="rsr-note" style={{ color: '#3b3b55' }}>{s.feedback}</div>}
            {s.suggestion && <div className="rsr-sug"><b>Suggestion:</b> {s.suggestion}</div>}
          </div>
        ))}
      </div>

      <aside className="rsr-side">
        <div className="rsr-lab">RESUME SCORE</div>
        <div className="rsr-score">{score}<small> /100</small></div>
        <div className="rsr-bar"><i style={{ width: `${score}%` }} /></div>
        <div style={{ font: '13px system-ui', opacity: 0.85 }}>
          {issues === 0 ? '0 issues left' : `${issues} fix${issues > 1 ? 'es' : ''} ${fixed ? 'left' : 'found'}`}
        </div>

        {fixed && stats.rewrittenWeakVerb > 0 && <div className="rsr-chk">✓ Rewrote {stats.rewrittenWeakVerb} weak-verb bullet(s)</div>}
        {fixed && stats.addedMetrics > 0 && <div className="rsr-chk">✓ Added impact to {stats.addedMetrics} bullet(s)</div>}

        {stats.canFix && (
          <button className="rsr-btn" onClick={() => setFixed((v) => !v)}>
            {fixed ? 'Show original' : 'Autofix bullets'}
          </button>
        )}
      </aside>
    </div>
  )
}
