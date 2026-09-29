import { useMemo, useState } from 'react'
import { ArrowLeft, Briefcase, Check, ChevronDown, Copy, Loader2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from '../api/axiosClient'

const TABS = [
  { id: 'headline', label: 'Headline' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'checklist', label: 'Checklist' },
]

const EMPTY_PROFILE = { headline: '', about: '', experience: '', skills: '', targetRole: '', jobDescription: '' }
const DEFAULT_CHECKLIST = [
  { id: 'photo', label: 'Professional profile photo', weight: 5 },
  { id: 'banner', label: 'Custom banner image', weight: 2 },
  { id: 'customUrl', label: 'Custom LinkedIn URL', weight: 3 },
  { id: 'featured', label: 'Featured section (project, post or link)', weight: 3 },
  { id: 'recommendations', label: 'At least 2 recommendations', weight: 4 },
  { id: 'activity', label: 'Posted or commented in the last 30 days', weight: 3 },
]
const TONES = ['professional', 'friendly', 'bold']

const sectionStatusStyle = {
  strong: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  'needs work': 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  weak: 'border-red-400/20 bg-red-400/10 text-red-300',
}

const bulletStatusStyle = {
  strong: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  'weak verb': 'border-red-400/20 bg-red-400/10 text-red-300',
  'no metrics': 'border-orange-400/20 bg-orange-400/10 text-orange-300',
  vague: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
}

const FieldLabel = ({ children, detail }) => (
  <span className='flex items-center justify-between gap-2 text-sm font-medium text-text'>
    {children}{detail && <span className='text-xs font-normal text-text-dim'>{detail}</span>}
  </span>
)

const Feedback = ({ section }) => {
  if (!section) return null
  return (
    <div className='mt-5 border-t border-border pt-5'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold text-text'>Section review</h3>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${sectionStatusStyle[section.status] || sectionStatusStyle.weak}`}>
          {section.status}
        </span>
      </div>
      {section.findings?.length > 0 && (
        <ul className='mt-3 space-y-2'>
          {section.findings.map((finding, index) => {
            const dot = finding.type === 'good' ? 'bg-emerald-400' : finding.type === 'warn' ? 'bg-amber-300' : 'bg-red-400'
            return <li key={`${finding.msg}-${index}`} className='flex items-start gap-2.5 text-sm leading-relaxed text-text-dim'><span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />{finding.msg}</li>
          })}
        </ul>
      )}
      {section.feedback && <p className='mt-4 text-sm leading-relaxed text-text-dim'>{section.feedback}</p>}
      {section.suggestion && <p className='mt-3 rounded-r-lg border-l-2 border-primary bg-primary/10 px-4 py-3 text-sm leading-relaxed text-text'>{section.suggestion}</p>}
    </div>
  )
}

const LinkedInOptimization = () => {
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [tab, setTab] = useState('headline')
  const [jobDescriptionOpen, setJobDescriptionOpen] = useState(false)
  const [showFullAbout, setShowFullAbout] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedBullet, setCopiedBullet] = useState('')
  const [copiedText, setCopiedText] = useState('')
  const [aboutTone, setAboutTone] = useState('professional')
  const [checklist, setChecklist] = useState(Object.fromEntries(DEFAULT_CHECKLIST.map((item) => [item.id, false])))
  const [analysisSnapshot, setAnalysisSnapshot] = useState(null)

  const sections = result?.sections || []
  const currentSection = sections.find((section) => section.key === tab)
  const experienceSection = sections.find((section) => section.key === 'experience')
  const skillsCount = useMemo(() => profile.skills.split(/[,\n•;|]+/).map((skill) => skill.trim()).filter(Boolean).length, [profile.skills])
  const aboutPreview = profile.about.length > 210 && !showFullAbout ? `${profile.about.slice(0, 210).trimEnd()}...` : profile.about
  const strength = result?.strength
  const strengthPercent = Math.max(0, Math.min(100, Number(strength?.score) || 0))
  const currentSnapshot = JSON.stringify({ profile, checklist })
  const changesNotAnalyzed = Boolean(result && analysisSnapshot && currentSnapshot !== analysisSnapshot)
  const headlineOptions = Array.isArray(result?.headlineOptions) ? result.headlineOptions : []
  const aboutVersions = Array.isArray(result?.aboutVersions) ? result.aboutVersions : []
  const activeAboutVersion = aboutVersions.find((version) => version.tone === aboutTone)
  const checklistItems = result?.checklist?.items || DEFAULT_CHECKLIST
  const visibilityRows = result?.visibility?.rows || []
  const actions = result?.actions || []

  const updateProfile = (field, value) => setProfile((previous) => ({ ...previous, [field]: value }))

  const analyzeProfile = async (event) => {
    event.preventDefault()
    setError('')
    if (!profile.targetRole.trim()) {
      setError('Add a target role for the most useful suggestions.')
      return
    }
    if (![profile.headline, profile.about, profile.experience, profile.skills].some((value) => value.trim())) {
      setError('Add at least a headline, About, experience, or skills section to analyze.')
      return
    }

    setLoading(true)
    const submittedProfile = { ...profile }
    const submittedChecklist = { ...checklist }
    const submittedSnapshot = JSON.stringify({ profile: submittedProfile, checklist: submittedChecklist })
    try {
      const { data } = await axios.post('/api/linkedin-optimization', {
        ...submittedProfile,
        checklist: submittedChecklist,
      })
      setResult(data)
      setAnalysisSnapshot(submittedSnapshot)
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || requestError.message || 'Could not analyze the profile. Your text is still here; please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyRewrite = async (bullet) => {
    try {
      await navigator.clipboard.writeText(bullet.rewrite)
      setCopiedBullet(bullet.original)
      window.setTimeout(() => setCopiedBullet(''), 1600)
    } catch {
      setError('Copy was unavailable in this browser. You can still select the rewrite and copy it manually.')
    }
  }

  const copyText = async (value, id) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedText(id)
      window.setTimeout(() => setCopiedText(''), 1600)
    } catch {
      setError('Copy was unavailable in this browser. You can still select the text and copy it manually.')
    }
  }

  const applyHeadline = (value) => {
    updateProfile('headline', value)
    setTab('headline')
  }

  const applyAbout = (value) => {
    updateProfile('about', value)
    setTab('about')
    setShowFullAbout(false)
  }

  const openActionSection = (section) => setTab(section === 'checklist' ? 'checklist' : TABS.some((item) => item.id === section) ? section : 'headline')

  const inputClass = 'mt-2 w-full rounded-xl border border-border bg-white/[0.04] px-3.5 py-3 text-sm text-text outline-none placeholder:text-text-dim/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/10'

  return (
    <main className='min-h-screen bg-bg px-4 py-8 text-text sm:px-7 lg:px-10 lg:py-10'>
      <div className='mx-auto max-w-[1500px]'>
        <Link to='/ai' className='mb-6 inline-flex items-center gap-2 text-sm text-text-dim transition hover:text-text'>
          <ArrowLeft className='h-4 w-4' /> Back to tools
        </Link>

        <header className='mb-7'>
          <div className='flex items-center gap-3'>
            <span className='flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary'><Briefcase className='h-5 w-5' /></span>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>LinkedIn Optimization</h1>
              <p className='mt-1 text-sm text-text-dim'>Optimize your headline, About and skills so recruiters find you.</p>
            </div>
          </div>
        </header>

        <div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]'>
          <form onSubmit={analyzeProfile} className='rounded-2xl border border-border bg-white/[0.025] p-4 sm:p-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='sm:col-span-2'>
                <FieldLabel detail='recommended for better keyword matching'>Target role</FieldLabel>
                <input value={profile.targetRole} onChange={(event) => updateProfile('targetRole', event.target.value)} maxLength={120} placeholder='e.g. Frontend Developer' className={inputClass} />
              </label>

              <div className='sm:col-span-2'>
                <button type='button' onClick={() => setJobDescriptionOpen((open) => !open)} className='flex items-center gap-2 text-sm text-text-dim transition hover:text-text'>
                  <ChevronDown className={`h-4 w-4 transition-transform ${jobDescriptionOpen ? 'rotate-180' : ''}`} />
                  Job description <span className='text-xs'>(optional)</span>
                </button>
                {jobDescriptionOpen && <textarea value={profile.jobDescription} onChange={(event) => updateProfile('jobDescription', event.target.value)} maxLength={4000} rows={4} placeholder='Paste the job description to map relevant keywords.' className={`${inputClass} resize-y`} />}
              </div>
            </div>

            <div className='mt-6 border-b border-border'>
              <div className='flex gap-1 overflow-x-auto' role='tablist' aria-label='Profile sections'>
                {TABS.map((item) => (
                  <button key={item.id} type='button' role='tab' aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${tab === item.id ? 'border-primary text-text' : 'border-transparent text-text-dim hover:text-text'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='min-h-[265px] pt-5'>
              {tab === 'headline' && (
                <label>
                  <FieldLabel detail={<span className={profile.headline.length > 220 ? 'text-red-400' : ''}>{profile.headline.length} / 220</span>}>Headline</FieldLabel>
                  <input value={profile.headline} onChange={(event) => updateProfile('headline', event.target.value)} maxLength={300} placeholder='Role | Key skills | Value you deliver' className={inputClass} />
                  <p className='mt-2 text-xs text-text-dim'>LinkedIn headlines can be up to 220 characters.</p>
                </label>
              )}
              {tab === 'about' && (
                <label className='block'>
                  <FieldLabel detail={<span className={profile.about.length > 2600 ? 'text-red-400' : ''}>{profile.about.length} / 2600</span>}>About</FieldLabel>
                  <div className='relative mt-2'>
                    <textarea value={profile.about} onChange={(event) => updateProfile('about', event.target.value)} maxLength={2600} rows={8} placeholder='Tell your professional story, strengths and measurable impact.' className={`${inputClass} mt-0 resize-y pb-10`} />
                  </div>
                  <div className='relative mt-3 h-1 rounded-full bg-white/10' aria-label='About preview marker at 210 characters'>
                    <div className='h-full rounded-full bg-primary/50 transition-all' style={{ width: `${Math.min(profile.about.length / 2600 * 100, 100)}%` }} />
                    <span className='absolute -top-1 h-3 w-px bg-primary-light' style={{ left: `${210 / 2600 * 100}%` }} />
                  </div>
                  <p className='mt-2 text-[10px] text-text-dim'>Only this much shows before “see more” · 210 characters</p>
                </label>
              )}
              {tab === 'experience' && (
                <label className='block'>
                  <FieldLabel detail='one achievement per line'>Experience</FieldLabel>
                  <textarea value={profile.experience} onChange={(event) => updateProfile('experience', event.target.value)} maxLength={6000} rows={8} placeholder={'Led a project that improved...\nReduced processing time by...'} className={`${inputClass} resize-y`} />
                </label>
              )}
              {tab === 'skills' && (
                <label className='block'>
                  <FieldLabel detail={`${skillsCount} skills`}>Skills</FieldLabel>
                  <textarea value={profile.skills} onChange={(event) => updateProfile('skills', event.target.value)} maxLength={1500} rows={8} placeholder='React, TypeScript, Node.js, accessibility...' className={`${inputClass} resize-y`} />
                </label>
              )}
              {tab === 'checklist' && (
                <div>
                  <div className='space-y-2'>
                    {checklistItems.map((item) => (
                      <label key={item.id} className='flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-3.5 py-3 text-sm text-text transition hover:bg-white/[0.05]'>
                        <input type='checkbox' checked={Boolean(checklist[item.id])} onChange={(event) => setChecklist((previous) => ({ ...previous, [item.id]: event.target.checked }))} className='h-4 w-4 accent-[#5044E5]' />
                        <span className='flex-1'>{item.label}</span>
                        {typeof item.weight === 'number' && <span className='text-xs text-text-dim'>+{item.weight}</span>}
                      </label>
                    ))}
                  </div>
                  <p className='mt-3 text-xs text-text-dim'>Checked items add up to 20 points of your Profile Strength.</p>
                </div>
              )}

              {tab !== 'checklist' && <Feedback section={currentSection} />}

              {tab === 'headline' && headlineOptions.length > 0 && (
                <section className='mt-5 border-t border-border pt-5'>
                  <h3 className='text-sm font-semibold text-text'>Headline Lab</h3>
                  <div className='mt-3 grid gap-3'>
                    {headlineOptions.map((option, index) => {
                      const id = `headline-${index}`
                      return (
                        <article key={`${option.style}-${index}`} className='rounded-xl border border-border bg-white/[0.02] p-3.5'>
                          <div className='flex items-center justify-between gap-3'>
                            <span className='rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] capitalize text-primary-light'>{option.style}</span>
                            <span className={`text-xs ${option.text.length > 220 ? 'text-red-400' : 'text-text-dim'}`}>{option.text.length} / 220</span>
                          </div>
                          <p className='mt-3 break-words text-sm leading-relaxed text-text'>{option.text}</p>
                          <div className='mt-3 flex flex-wrap gap-2'>
                            <button type='button' onClick={() => copyText(option.text, id)} className='rounded-full border border-border px-3 py-1.5 text-xs text-text-dim transition hover:bg-white/5 hover:text-text'>{copiedText === id ? 'Copied' : 'Copy'}</button>
                            <button type='button' onClick={() => applyHeadline(option.text)} className='rounded-full bg-primary/15 px-3 py-1.5 text-xs text-primary-light transition hover:bg-primary/25'>Use this</button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )}

              {tab === 'about' && aboutVersions.length > 0 && (
                <section className='mt-5 border-t border-border pt-5'>
                  <h3 className='text-sm font-semibold text-text'>About Builder</h3>
                  <div className='mt-3 inline-flex rounded-full border border-border bg-black/10 p-1' role='tablist' aria-label='About tone'>
                    {TONES.map((tone) => <button key={tone} type='button' role='tab' aria-selected={aboutTone === tone} onClick={() => setAboutTone(tone)} className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${aboutTone === tone ? 'bg-primary text-white' : 'text-text-dim hover:text-text'}`}>{tone}</button>)}
                  </div>
                  {activeAboutVersion && (
                    <div className='mt-3 rounded-xl border border-border bg-white/[0.02] p-3.5'>
                      <div className='flex items-center justify-between gap-3'>
                        <span className='text-xs capitalize text-text-dim'>{activeAboutVersion.tone} version</span>
                        <span className={`text-xs ${activeAboutVersion.text.length > 2600 ? 'text-red-400' : 'text-text-dim'}`}>{activeAboutVersion.text.length} / 2600</span>
                      </div>
                      <p className='mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-text'>{activeAboutVersion.text}</p>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        <button type='button' onClick={() => copyText(activeAboutVersion.text, `about-${activeAboutVersion.tone}`)} className='rounded-full border border-border px-3 py-1.5 text-xs text-text-dim transition hover:bg-white/5 hover:text-text'>{copiedText === `about-${activeAboutVersion.tone}` ? 'Copied' : 'Copy'}</button>
                        <button type='button' onClick={() => applyAbout(activeAboutVersion.text)} className='rounded-full bg-primary/15 px-3 py-1.5 text-xs text-primary-light transition hover:bg-primary/25'>Use this</button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {tab === 'experience' && experienceSection?.bullets?.length > 0 && (
                <div className='mt-5 border-t border-border pt-5'>
                  <h3 className='text-sm font-semibold text-text'>Experience bullet review</h3>
                  <div className='mt-3 space-y-4'>
                    {experienceSection.bullets.map((bullet, index) => (
                      <article key={`${bullet.original}-${index}`} className='rounded-xl border border-border bg-black/10 p-3.5'>
                        <div className='flex items-start justify-between gap-3'>
                          <p className={`text-sm leading-relaxed ${bullet.tag === 'strong' ? 'text-text' : bullet.rewrite ? 'text-text-dim/70 line-through decoration-red-400/60' : 'text-text-dim'}`}>{bullet.original}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${bulletStatusStyle[bullet.tag] || bulletStatusStyle.vague}`}>{bullet.tag}</span>
                        </div>
                        {bullet.tag !== 'strong' && (bullet.rewrite ? (
                          <div className='mt-3'>
                            <div className='flex items-start justify-between gap-3 rounded-r-lg border-l-2 border-primary bg-primary/10 px-3 py-2.5'>
                              <p className='text-sm leading-relaxed text-text'>{bullet.rewrite}</p>
                              <button type='button' onClick={() => copyRewrite(bullet)} className='inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs text-text-dim transition hover:bg-white/5 hover:text-text'>
                                {copiedBullet === bullet.original ? <Check className='h-3.5 w-3.5 text-emerald-300' /> : <Copy className='h-3.5 w-3.5' />}
                                {copiedBullet === bullet.original ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        ) : bullet.rewriteUnavailable ? <p className='mt-3 text-xs italic text-text-dim'>Rewrite unavailable</p> : null)}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p role='alert' className='mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-3 text-sm text-red-200'>{error}</p>}
            {result && result.aiAvailable === false && <p className='mt-4 text-xs text-text-dim'>AI suggestions are unavailable right now, the checks below still apply.</p>}

            <div className='mt-5 flex flex-wrap items-center gap-3'>
              <button type='submit' disabled={loading} className='inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-light disabled:cursor-wait disabled:opacity-70 sm:w-auto'>
                {loading ? <><Loader2 className='h-4 w-4 animate-spin' /> Analyzing profile…</> : <><Sparkles className='h-4 w-4' /> Analyze profile</>}
              </button>
              {changesNotAnalyzed && <span className='text-xs text-amber-200'>Changes not analyzed yet</span>}
            </div>
          </form>

          <aside className='space-y-4 xl:sticky xl:top-6'>
            <section className='rounded-2xl border border-border bg-white/[0.025] p-5 sm:p-6'>
              <div className='mb-4 flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-text'>Profile Strength</p>
                  <p className='mt-1 text-xs text-text-dim'>{strength ? strength.level : 'Not analyzed yet'}</p>
                </div>
                {strength ? <span className='text-2xl font-semibold text-primary'>{strength.score}<span className='text-xs font-normal text-text-dim'> / 100</span></span> : <span className='text-sm text-text-dim'>—</span>}
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-white/10' role='progressbar' aria-label='Profile strength' aria-valuemin={0} aria-valuemax={100} aria-valuenow={strength ? strengthPercent : 0}>
                <div className='h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700' style={{ width: `${strength ? strengthPercent : 0}%` }} />
              </div>
            </section>

            <section className='rounded-2xl border border-border bg-white/[0.025] p-5 sm:p-6'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <h2 className='text-sm font-semibold text-text'>Action Plan</h2>
                {actions.length > 0 && <span className='text-xs text-text-dim'>{actions.length} prioritized</span>}
              </div>
              {actions.length > 0 ? (
                <ol className='space-y-2.5'>
                  {actions.slice(0, 5).map((action, index) => {
                    const impactStyle = action.impact === 'High' ? 'bg-red-400/10 text-red-300' : action.impact === 'Medium' ? 'bg-amber-300/10 text-amber-200' : 'bg-white/10 text-text-dim'
                    return (
                      <li key={`${action.section}-${index}`}>
                        <button type='button' onClick={() => openActionSection(action.section)} className='flex w-full items-start gap-3 rounded-lg p-2 text-left transition hover:bg-white/[0.04]'>
                          <span className={`mt-0.5 shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${impactStyle}`}>{action.impact}</span>
                          <span className='text-xs leading-relaxed text-text-dim'>{action.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              ) : <p className='text-sm text-text-dim'>Analyze your profile to get a prioritized action plan.</p>}
            </section>

            <section className='rounded-2xl border border-border bg-white/[0.025] p-5 sm:p-6'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <h2 className='text-sm font-semibold text-text'>Search Visibility Map</h2>
                {result?.visibility && <span className='text-xs text-text-dim'>Keyword coverage: {result.visibility.coverage}%</span>}
              </div>
              {visibilityRows.length ? (
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[460px] text-left text-xs'>
                    <thead>
                      <tr className='border-b border-border text-text-dim'>
                        <th className='py-2 pr-3 font-medium'>Keyword</th><th className='px-2 py-2 text-center font-medium'>Headline</th><th className='px-2 py-2 text-center font-medium'>About</th><th className='px-2 py-2 text-center font-medium'>Experience</th><th className='px-2 py-2 text-center font-medium'>Skills</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibilityRows.map((row) => (
                        <tr key={row.keyword} className={`border-b border-border/60 last:border-0 ${row.found === 0 ? 'bg-red-400/[0.045]' : ''}`}>
                          <th className='py-2.5 pr-3 font-medium text-text'>
                            <span>{row.keyword}</span>{row.found === 0 && <span className='ml-2 whitespace-nowrap rounded-full bg-red-400/10 px-1.5 py-0.5 text-[9px] font-normal text-red-300'>Missing everywhere</span>}
                          </th>
                          {['headline', 'about', 'experience', 'skills'].map((key) => <td key={key} className='px-2 py-2.5 text-center'>{row[key] ? <Check className='mx-auto h-3.5 w-3.5 text-emerald-300' aria-label='Found' /> : <span className='text-text-dim/50' aria-label='Not found'>—</span>}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className='text-sm text-text-dim'>Add a target role to see keyword coverage.</p>}
            </section>

            <section className='overflow-hidden rounded-2xl border border-border bg-[#11151b] shadow-[0_18px_55px_rgba(0,0,0,0.22)]'>
              <div className='h-24 bg-gradient-to-r from-[#27235e] via-[#5147a4] to-[#27235e] sm:h-28' />
              <div className='px-5 pb-6 sm:px-6'>
                <div className='-mt-9 flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-[#11151b] bg-[#252433] text-2xl font-semibold text-primary-light'>Y</div>
                <div className='mt-3'>
                  <h2 className='text-lg font-semibold text-text'>Your name</h2>
                  <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${profile.headline ? 'text-text' : 'text-text-dim'}`}>
                    {profile.headline || 'Your headline appears here'}
                  </p>
                  <p className='mt-2 text-xs text-text-dim'>Your network · Contact info</p>
                </div>
                <div className='mt-5 border-t border-border pt-4'>
                  <h3 className='text-sm font-semibold text-text'>About</h3>
                  {profile.about ? (
                    <p className='mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-dim'>
                      {aboutPreview}{profile.about.length > 210 && <button type='button' onClick={() => setShowFullAbout((show) => !show)} className='ml-1 inline text-primary hover:text-primary-light'>{showFullAbout ? 'see less' : 'see more'}</button>}
                    </p>
                  ) : <p className='mt-2 text-sm italic text-text-dim'>Your About section appears here.</p>}
                </div>
                <div className='mt-5 border-t border-border pt-4'>
                  <h3 className='text-sm font-semibold text-text'>Skills</h3>
                  <p className='mt-2 text-sm leading-relaxed text-text-dim'>{profile.skills || 'Your skills appear here.'}</p>
                </div>
              </div>
            </section>

            {loading && <div className='animate-pulse rounded-2xl border border-border bg-white/[0.025] p-5'><div className='h-4 w-1/3 rounded bg-white/10' /><div className='mt-4 h-3 w-full rounded bg-white/10' /><div className='mt-2 h-3 w-4/5 rounded bg-white/10' /></div>}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default LinkedInOptimization
