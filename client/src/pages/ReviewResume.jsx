
import React, { useState, useEffect } from 'react'
import axios from '../api/axiosClient'
import toast from 'react-hot-toast'
import { UploadCloud, Check, X, RotateCcw, Download, ArrowLeft, ArrowRight, Loader2, FileText } from 'lucide-react'
import ResumeSectionReview from '../components/ResumeSectionReview'

const STEPS = ['Upload', 'Scan', 'Score', 'Fixes']
const SCAN_TASKS = ['Reading your file', 'Checking ATS formatting', 'Matching keywords', 'Reviewing bullet quality', 'Writing fixes']

const useCountUp = (target, active) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) {
      const resetFrame = requestAnimationFrame(() => setValue(0))
      return () => cancelAnimationFrame(resetFrame)
    }
    let raf, start
    const tick = (t) => {
      start ??= t
      const p = Math.min((t - start) / 900, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active])
  return value
}

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white/[0.03] border border-border p-6 sm:p-8 ${className}`}>{children}</div>
)

const ReviewResume = () => {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [dragging, setDragging] = useState(false)
  const [scanIdx, setScanIdx] = useState(0)
  const [data, setData] = useState(null)

  const score = useCountUp(data?.score || 0, step === 3)

  useEffect(() => {
    if (step !== 2) return
    const id = setInterval(() => setScanIdx((i) => Math.min(i + 1, SCAN_TASKS.length - 1)), 1300)
    return () => clearInterval(id)
  }, [step])

  const pickFile = (f) => {
    if (!f) return
    if (!/\.(pdf|docx)$/i.test(f.name)) return toast.error('Only PDF or DOCX files are supported.')
    if (f.size > 5 * 1024 * 1024) return toast.error('File is larger than 5MB.')
    setFile(f)
  }

  const analyze = async () => {
    setScanIdx(0)
    setStep(2)
    const form = new FormData()
    form.append('resume', file)
    if (jd.trim()) form.append('jobDescription', jd.trim())
    try {
      const { data: res } = await axios.post('/api/ai/resume-review', form)
      if (!res.success) throw new Error(res.message)
      setData(res.data)
      setStep(3)
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Something went wrong. Try again.')
      setStep(1)
    }
  }

  const reset = () => { setStep(1); setFile(null); setJd(''); setData(null) }

  const downloadReport = () => {
    const lines = [
      `Resume score: ${data.score}/100`,
      `ATS score: ${data.atsScore}/100`,
      data.detectedRole && `Detected role: ${data.detectedRole}`,
      '',
      'ATS checks:',
      ...data.atsChecks.map((c) => `${c.passed ? '[pass]' : '[fail]'} ${c.label}${c.tip ? ` - ${c.tip}` : ''}`),
      '',
      'Suggestions:',
      ...data.suggestions.map((s) => `- ${s}`),
      '',
      'Bullet review:',
      ...(data.bulletReviews || []).map((b) => `${b.tag}: ${b.original}${b.rewrite ? `\nRewrite: ${b.rewrite}` : b.tag !== 'strong' ? '\nRewrite unavailable' : ''}`),
      data.missingKeywords.length ? `Missing keywords: ${data.missingKeywords.join(', ')}` : '',
    ].filter((l) => l !== false && l !== undefined)
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'resume-review.txt' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const breakdownRows = data
    ? [['ATS format', data.breakdown.format], ['Content quality', data.breakdown.content], ['Impact', data.breakdown.impact], ['Keyword match', data.breakdown.keywords]].filter(([, v]) => typeof v === 'number')
    : []

  return (
    <div className='relative min-h-screen bg-bg px-4 sm:px-8 py-16 overflow-hidden'>
      <div
        className='pointer-events-none absolute -top-[20%] right-0 w-[600px] h-[600px] rounded-full'
        style={{ background: 'radial-gradient(circle, rgba(80,68,229,0.25) 0%, rgba(80,68,229,0) 70%)' }}
      ></div>

      <div className='relative z-10 max-w-3xl mx-auto'>
        <h1 className='text-3xl sm:text-4xl font-semibold text-text'>Review your resume</h1>
        <p className='mt-2 text-text-dim'>Get an ATS score, a content score, and rewritten bullets in under a minute.</p>

        {/* step indicator */}
        <div className='mt-8 flex items-center'>
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = step > n
            const current = step === n
            return (
              <React.Fragment key={label}>
                <div className='flex items-center gap-2'>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-colors
                    ${done || current ? 'bg-primary border-primary text-white' : 'border-border text-text-dim'}`}>
                    {done ? <Check className='w-4 h-4' /> : n}
                  </span>
                  <span className={`text-sm hidden sm:block ${current ? 'text-text' : 'text-text-dim'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${step > n ? 'bg-primary' : 'bg-border'}`}></div>}
              </React.Fragment>
            )
          })}
        </div>

        <div className='mt-8'>
          {/* STEP 1: upload */}
          {step === 1 && (
            <Card>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]) }}
                className={`flex flex-col items-center text-center gap-3 border border-dashed rounded-2xl px-6 py-10 cursor-pointer transition-colors
                  ${dragging ? 'border-primary bg-white/[0.06]' : 'border-border hover:border-primary/50 hover:bg-white/[0.04]'}`}
              >
                <input type='file' accept='.pdf,.docx' className='hidden' onChange={(e) => pickFile(e.target.files[0])} />
                <div className='w-12 h-12 rounded-xl bg-white/[0.06] border border-border flex items-center justify-center'>
                  {file ? <FileText className='w-6 h-6 text-primary' /> : <UploadCloud className='w-6 h-6 text-primary' />}
                </div>
                {file ? (
                  <>
                    <p className='text-text font-medium break-all'>{file.name}</p>
                    <p className='text-text-dim text-xs'>{(file.size / 1024).toFixed(0)} KB · click to change</p>
                  </>
                ) : (
                  <>
                    <p className='text-text font-medium'>Drop your resume here or <span className='text-primary underline'>choose a file</span></p>
                    <p className='text-text-dim text-xs'>PDF or DOCX, up to 5MB. Text-based files only, not scans.</p>
                  </>
                )}
              </label>

              <label className='block mt-6 text-sm text-text'>
                Job description <span className='text-text-dim'>(optional, adds a keyword match score)</span>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={4}
                  placeholder='Paste the job posting here'
                  className='mt-2 w-full rounded-xl bg-white/[0.04] border border-border px-4 py-3 text-sm text-text placeholder:text-text-dim outline-none focus:border-primary/60 resize-none'
                />
              </label>

              <button
                onClick={analyze}
                disabled={!file}
                className='mt-6 w-full bg-primary text-white py-3 rounded-full font-medium transition enabled:hover:scale-[1.01] enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Review resume
              </button>
            </Card>
          )}

          {/* STEP 2: scanning */}
          {step === 2 && (
            <Card className='py-10'>
              <p className='text-text font-medium text-center'>Reviewing {file?.name}</p>
              <ul className='mt-6 max-w-xs mx-auto space-y-3'>
                {SCAN_TASKS.map((task, i) => (
                  <li key={task} className={`flex items-center gap-3 text-sm transition-opacity ${i > scanIdx ? 'opacity-30' : 'opacity-100'}`}>
                    {i < scanIdx ? <Check className='w-4 h-4 text-primary' /> : i === scanIdx ? <Loader2 className='w-4 h-4 text-primary animate-spin' /> : <span className='w-4 h-4'></span>}
                    <span className='text-text-dim'>{task}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* STEP 3: score */}
          {step === 3 && data && (
            <div className='space-y-4'>
              <Card>
                <div className='flex flex-wrap items-end justify-between gap-6'>
                  <div>
                    <p className='text-sm text-text-dim'>Resume score</p>
                    <p className='text-6xl font-semibold text-primary leading-none mt-2'>{score}<span className='text-lg text-text-dim'>/100</span></p>
                    {data.detectedRole && <p className='mt-3 text-sm text-text-dim'>Reads as: {data.detectedRole}</p>}
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-text-dim'>ATS readiness</p>
                    <p className='text-3xl font-semibold text-text mt-1'>{data.atsScore}<span className='text-sm text-text-dim'>/100</span></p>
                    <p className='text-[11px] text-text-dim mt-1'>An estimate, not a real ATS result</p>
                  </div>
                </div>
                {data.summary && <p className='mt-6 text-sm text-text-dim leading-relaxed'>{data.summary}</p>}
                <div className='mt-6 space-y-3'>
                  {breakdownRows.map(([label, v]) => (
                    <div key={label}>
                      <div className='flex justify-between text-xs text-text-dim mb-1'><span>{label}</span><span>{v}</span></div>
                      <div className='h-1.5 rounded-full bg-white/10 overflow-hidden'>
                        <div className='h-full rounded-full bg-primary transition-all duration-700' style={{ width: `${v}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <p className='text-text font-medium mb-4'>ATS checks</p>
                <ul className='space-y-3'>
                  {data.atsChecks.map((c) => (
                    <li key={c.label} className='flex items-start gap-3 text-sm'>
                      {c.passed ? <Check className='w-4 h-4 text-primary mt-0.5 shrink-0' /> : <X className='w-4 h-4 text-red-400 mt-0.5 shrink-0' />}
                      <div>
                        <p className={c.passed ? 'text-text-dim' : 'text-text'}>{c.label}</p>
                        {c.tip && <p className='text-xs text-text-dim mt-0.5'>{c.tip}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <div className='flex justify-between'>
                <button onClick={reset} className='flex items-center gap-2 text-sm text-text-dim hover:text-text transition'><RotateCcw className='w-4 h-4' /> Start over</button>
                <button onClick={() => setStep(4)} className='flex items-center gap-2 bg-primary text-white text-sm px-6 py-2.5 rounded-full hover:scale-[1.02] active:scale-95 transition'>
                  See fixes <ArrowRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: fixes */}
          {step === 4 && data && (
            <div className='space-y-4'>
              {!data.aiAvailable && (
                <div role='status' className='rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100'>
                  The AI review was unavailable, so rewrites are unavailable. The rule-based review below is still valid.
                </div>
              )}

              <ResumeSectionReview sections={data.sections || []} />

              {(data.keywords?.missing?.length > 0 || data.keywords?.matched?.length > 0) && (
                <Card className='p-4 sm:p-5'>
                  {data.keywords?.missing?.length > 0 && (
                    <div>
                      <p className='text-sm text-text font-medium mb-3'>Missing keywords</p>
                      <div className='flex flex-wrap gap-2'>
                        {data.keywords.missing.map((keyword) => (
                          <span key={keyword} className='text-xs text-text-dim bg-white/[0.05] border border-border px-3 py-1 rounded-full'>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.keywords?.matched?.length > 0 && (
                    <div className={data.keywords?.missing?.length > 0 ? 'mt-4' : ''}>
                      <p className='text-xs text-text-dim mb-2'>Matched keywords</p>
                      <div className='flex flex-wrap gap-2'>
                        {data.keywords.matched.map((keyword) => (
                          <span key={keyword} className='text-xs text-text-dim/60 bg-white/[0.02] border border-border/60 px-3 py-1 rounded-full'>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {data.suggestions?.length > 0 && (
                <Card>
                  <p className='text-text font-medium mb-4'>What to change first</p>
                  <ol className='space-y-2 text-sm text-text-dim list-decimal list-inside'>
                    {data.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </Card>
              )}

              <div className='flex flex-wrap justify-between gap-3'>
                <button onClick={() => setStep(3)} className='flex items-center gap-2 text-sm text-text-dim hover:text-text transition'><ArrowLeft className='w-4 h-4' /> Back to score</button>
                <div className='flex gap-3'>
                  <button onClick={downloadReport} className='flex items-center gap-2 border border-border text-text text-sm px-5 py-2.5 rounded-full hover:bg-white/[0.05] transition'>
                    <Download className='w-4 h-4' /> Download report
                  </button>
                  <button onClick={reset} className='flex items-center gap-2 bg-primary text-white text-sm px-5 py-2.5 rounded-full hover:scale-[1.02] active:scale-95 transition'>
                    <RotateCcw className='w-4 h-4' /> Review another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewResume
