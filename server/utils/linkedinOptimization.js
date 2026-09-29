//
import { analyzeBullets, bulletScore, keywordGap, hasTerm, mergeRewrites } from './bulletAnalyzer.js'

const f = (type, msg) => ({ type, msg }) // type: good | warn | bad
const statusOf = (s) => (s >= 80 ? 'strong' : s >= 50 ? 'needs work' : 'weak')
const levelOf = (s) => (s >= 85 ? 'All-Star' : s >= 65 ? 'Advanced' : s >= 40 ? 'Intermediate' : 'Beginner')
const words = (t) => t.split(/\s+/).filter(Boolean).length
const clamp = (n) => Math.max(0, Math.min(100, n))
const GENERIC = /(seeking|looking for)\s+(new\s+)?(opportunit|job|role)|open to work|fresher|hard[- ]?working|passionate|self[- ]motivated|team player/i
const ROLE_STOP = new Set(['the', 'and', 'for', 'with', 'junior', 'senior', 'intern'])

function roleWords(role) {
  return (role || '').toLowerCase().split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2)
}

function reviewHeadline(h, role) {
  if (!h.trim()) return { score: 0, findings: [f('bad', 'Headline is empty. LinkedIn will show only your job title.')] }
  let score = 100
  const out = []
  const len = h.length
  if (len < 40) { out.push(f('warn', `Headline is short (${len} chars). Use up to 220 to pack in keywords.`)); score -= 25 }
  else if (len > 220) { out.push(f('bad', `Headline is ${len} chars. LinkedIn allows only 220.`)); score -= 20 }
  else out.push(f('good', `Good length (${len} chars).`))
  if (!/[|•·]/.test(h)) { out.push(f('warn', 'Use separators to structure it: Role | Key skill | Key skill | Value.')); score -= 10 }
  if (GENERIC.test(h)) { out.push(f('warn', 'Generic phrases like "Fresher" or "Seeking opportunities" waste your most visible line.')); score -= 15 }
  const rw = roleWords(role)
  if (rw.length) {
    if (rw.some((w) => h.toLowerCase().includes(w))) out.push(f('good', 'Headline mentions your target role.'))
    else { out.push(f('bad', 'Headline does not mention your target role, so recruiters searching for it may not find you.')); score -= 20 }
  }
  return { score: clamp(score), findings: out }
}

function reviewAbout(a, role) {
  if (!a.trim()) return { score: 0, findings: [f('bad', 'About section is empty. This is your best place for keywords and story.')] }
  let score = 100
  const out = []
  const w = words(a)
  if (w < 80) { out.push(f('bad', `About is very short (${w} words). Aim for 150-300.`)); score -= 30 }
  else if (w < 150) { out.push(f('warn', `About is a bit short (${w} words). Aim for 150-300.`)); score -= 10 }
  else if (w > 450) { out.push(f('warn', `About is long (${w} words). Trim to 300 or less.`)); score -= 15 }
  else out.push(f('good', `Good length (${w} words).`))
  if (a.length > 2600) { out.push(f('bad', 'About is over the 2,600 character limit.')); score -= 20 }
  if (GENERIC.test(a.slice(0, 210))) { out.push(f('warn', 'Opening is generic. Only about 210 characters show before "see more", so open with a strong hook.')); score -= 10 }
  if (/^(i am|i'm|hello|hi)\b/i.test(a.trim())) { out.push(f('warn', 'Avoid starting with "I am..." or "Hi". Start with what you do and the result you deliver.')); score -= 5 }
  if (!/\d/.test(a)) { out.push(f('warn', 'No numbers. Add years of experience or one measurable result.')); score -= 15 }
  if (!/(contact|reach|email|connect|@|open to)/i.test(a)) { out.push(f('warn', 'No call to action. End with how people can contact you.')); score -= 10 }
  const rw = roleWords(role)
  if (rw.length && !rw.some((x) => a.toLowerCase().includes(x))) { out.push(f('warn', 'About does not mention your target role keywords.')); score -= 10 }
  return { score: clamp(score), findings: out }
}

function reviewExperience(t) {
  const text = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    .map((l) => (/^[•\-–—*▪●◦]\s+/.test(l) ? l : `• ${l}`)).join('\n')
  const tagged = analyzeBullets(text)
  if (!tagged.length) return { score: 30, findings: [f('bad', 'No experience descriptions found. Add 3-5 achievement bullets per role.')], bullets: [] }
  const c = (tag) => tagged.filter((b) => b.tag === tag).length
  const out = [f(c('strong') ? 'good' : 'bad', `${c('strong')} of ${tagged.length} lines are strong (action verb + metric).`)]
  if (c('weak verb')) out.push(f('bad', `${c('weak verb')} line(s) start with weak phrases like "Responsible for" or "Helped".`))
  if (c('no metrics')) out.push(f('warn', `${c('no metrics')} line(s) have no numbers or measurable impact.`))
  if (c('vague')) out.push(f('warn', `${c('vague')} line(s) are vague ("various", "team projects").`))
  return { score: bulletScore(tagged), findings: out, bullets: tagged }
}

function reviewSkills(s, role, jd) {
  const items = s.split(/[,|\n•;]/).map((x) => x.trim()).filter(Boolean)
  if (!items.length) return { score: 0, findings: [f('bad', 'No skills listed. LinkedIn search relies heavily on skills.')] }
  let score = 100
  const out = []
  if (items.length < 10) { out.push(f('warn', `Only ${items.length} skills. Add at least 10 relevant ones (LinkedIn allows 50).`)); score -= 25 }
  else if (items.length > 50) { out.push(f('bad', `${items.length} skills is over the limit of 50.`)); score -= 15 }
  else out.push(f('good', `${items.length} skills listed.`))
  const gap = keywordGap(items.join(' '), `${role || ''} ${jd || ''}`)
  if (gap.missing.length) { out.push(f('warn', `Missing skills for your target role: ${gap.missing.join(', ')}.`)); score -= Math.min(30, gap.missing.length * 8) }
  else if (gap.matched.length) out.push(f('good', 'Your skills cover the keywords in your target role.'))
  return { score: clamp(score), findings: out }
}

// ---- Search visibility map: which target keywords appear in which section ----
export function keywordVisibility({ headline = '', about = '', experience = '', skills = '', targetRole = '', jobDescription = '' } = {}) {
  let kws = keywordGap('', `${targetRole} ${jobDescription}`).missing // all tech terms in role/JD
  if (!kws.length) kws = roleWords(targetRole).filter((w) => !ROLE_STOP.has(w))
  kws = [...new Set(kws)].slice(0, 12)
  const rows = kws.map((k) => {
    const where = { headline: hasTerm(headline, k), about: hasTerm(about, k), experience: hasTerm(experience, k), skills: hasTerm(skills, k) }
    return { keyword: k, ...where, found: Object.values(where).filter(Boolean).length }
  })
  const covered = rows.filter((r) => r.found > 0).length
  return { rows, coverage: rows.length ? Math.round((covered / rows.length) * 100) : 0 }
}

// ---- Checklist for things that cannot be pasted (max 20 points) ----
export const CHECKLIST_ITEMS = [
  { id: 'photo', label: 'Professional profile photo', weight: 5 },
  { id: 'banner', label: 'Custom banner image', weight: 2 },
  { id: 'customUrl', label: 'Custom LinkedIn URL', weight: 3 },
  { id: 'featured', label: 'Featured section (project, post or link)', weight: 3 },
  { id: 'recommendations', label: 'At least 2 recommendations', weight: 4 },
  { id: 'activity', label: 'Posted or commented in the last 30 days', weight: 3 },
]

function scoreChecklist(state = {}) {
  const items = CHECKLIST_ITEMS.map((i) => ({ ...i, done: !!state[i.id] }))
  return { items, score: items.filter((i) => i.done).reduce((a, i) => a + i.weight, 0) }
}

// ---- Prioritized action plan (top 5) ----
export function buildActions(sections, visibility, checklist) {
  const acts = []
  for (const s of sections) {
    for (const x of s.findings) {
      if (x.type === 'bad') acts.push({ title: x.msg, impact: 'High', section: s.key })
      else if (x.type === 'warn') acts.push({ title: x.msg, impact: 'Medium', section: s.key })
    }
  }
  const missing = visibility.rows.filter((r) => r.found === 0).map((r) => r.keyword)
  if (missing.length) acts.push({ title: `These target keywords appear nowhere in your profile: ${missing.join(', ')}.`, impact: 'High', section: 'skills' })
  for (const i of checklist.items) {
    if (!i.done) acts.push({ title: `Complete: ${i.label}.`, impact: i.weight >= 4 ? 'Medium' : 'Low', section: 'checklist' })
  }
  const rank = { High: 0, Medium: 1, Low: 2 }
  return acts.sort((a, b) => rank[a.impact] - rank[b.impact]).slice(0, 5)
}

const WEIGHTS = { headline: 20, about: 25, experience: 25, skills: 10 } // content = 80, checklist = 20
const LABELS = { headline: 'Headline', about: 'About', experience: 'Experience', skills: 'Skills' }

export function analyzeLinkedIn(input = {}) {
  const { headline = '', about = '', experience = '', skills = '', targetRole = '', jobDescription = '', checklist: cl = {} } = input
  const r = {
    headline: reviewHeadline(headline, targetRole),
    about: reviewAbout(about, targetRole),
    experience: reviewExperience(experience),
    skills: reviewSkills(skills, targetRole, jobDescription),
  }
  const sections = Object.entries(r).map(([key, v]) => ({ key, label: LABELS[key], status: statusOf(v.score), ...v }))
  const visibility = keywordVisibility({ headline, about, experience, skills, targetRole, jobDescription })
  const checklist = scoreChecklist(cl)
  const content = sections.reduce((a, s) => a + s.score * WEIGHTS[s.key], 0) / 100
  const score = Math.round(content + checklist.score)
  return {
    strength: { score, level: levelOf(score) },
    sections, visibility, checklist,
    actions: buildActions(sections, visibility, checklist),
  }
}

// ---- AI part (ONE call): headline options, About versions, section feedback, experience rewrites ----
export function buildOptimizationMessages(input = {}, weakBullets = []) {
  const { headline = '', about = '', experience = '', skills = '', targetRole = '', jobDescription = '' } = input
  return [
    {
      role: 'system',
      content:
        'You are a LinkedIn profile coach. Improve the profile for the target role. Never invent facts, employers, ' +
        'numbers or skills the person did not mention; use placeholders like [X%] or [N] when data is missing. ' +
        'Headline options: exactly 3, each under 220 characters, styles "role", "skills" and "value", formatted like "Role | Skill | Skill | Value". ' +
        'About versions: exactly 3 with tones "professional", "friendly" and "bold"; first person, under 1800 characters, ' +
        'a strong hook in the first two lines, ending with a call to action. ' +
        'Experience rewrites: only for the weak bullets given, start with a strong action verb, under 25 words, keep "original" exactly as given. ' +
        'Return ONLY JSON: {"headlineOptions":[{"style":"role","text":""}],"aboutVersions":[{"tone":"professional","text":""}],'+
        '"experienceRewrites":[{"original":"","rewrite":""}],'+
        '"sectionFeedback":[{"key":"headline|about|experience|skills","feedback":"2-3 specific sentences","suggestion":"one concrete fix"}]}',
    },
    {
      role: 'user',
      content: JSON.stringify({
        targetRole,
        jobDescription: jobDescription.slice(0, 1500),
        headline: headline.slice(0, 300),
        about: about.slice(0, 2600),
        experience: experience.slice(0, 3000),
        skills: skills.slice(0, 800),
        weakBullets: weakBullets.slice(0, 12).map((b) => ({ original: b.original, tag: b.tag })),
      }),
    },
  ]
}

export function mergeOptimizationAI(result, ai) {
  const fb = new Map((ai?.sectionFeedback || []).map((s) => [s.key, s]))
  const okText = (o, max) => o && typeof o.text === 'string' && o.text.trim() && o.text.length <= max
  return {
    ...result,
    headlineOptions: (ai?.headlineOptions || []).filter((o) => okText(o, 220)).slice(0, 3),
    aboutVersions: (ai?.aboutVersions || []).filter((o) => okText(o, 2600)).slice(0, 3),
    sections: result.sections.map((s) => ({
      ...s,
      feedback: fb.get(s.key)?.feedback || null,
      suggestion: fb.get(s.key)?.suggestion || null,
      ...(s.key === 'experience' ? { bullets: mergeRewrites(s.bullets || [], { bullets: ai?.experienceRewrites || [] }) } : {}),
    })),
  }
}
