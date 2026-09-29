// server/utils/sectionReview.js
// Har section ka descriptive review: status, score, findings, tips.
// Rule-based hai, isliye AI fail hone par bhi kaam karta hai.
import { analyzeBullets, bulletScore } from './bulletAnalyzer.js'

const SECTION_ALIASES = {
  summary: ['summary', 'profile', 'objective', 'about me', 'professional summary'],
  experience: ['experience', 'work experience', 'employment', 'work history', 'internship', 'internships'],
  education: ['education', 'academics', 'qualifications'],
  skills: ['skills', 'technical skills', 'core skills', 'tech stack'],
  projects: ['projects', 'personal projects', 'academic projects'],
  certifications: ['certifications', 'certificates', 'achievements', 'awards'],
}

const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, '').trim()

function headingOf(line) {
  const n = norm(line)
  if (!n || line.length > 40) return null
  for (const [key, names] of Object.entries(SECTION_ALIASES)) {
    if (names.includes(n)) return key
  }
  return null
}

// Resume text ko sections mein todta hai. Pehla hissa = contact/header.
export function splitSections(text) {
  const out = { header: [] }
  let cur = 'header'
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const h = headingOf(line)
    if (h) { cur = h; out[cur] = out[cur] || []; continue }
    out[cur].push(line)
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n')]))
}

const finding = (type, msg) => ({ type, msg }) // type: good | warn | bad

function statusOf(score) {
  return score >= 80 ? 'strong' : score >= 50 ? 'needs work' : 'weak'
}

function reviewHeader(t) {
  const f = []
  let score = 100
  const chk = (ok, good, bad, pen) => {
    if (ok) f.push(finding('good', good))
    else { f.push(finding('bad', bad)); score -= pen }
  }
  chk(/[\w.+-]+@[\w-]+\.[\w.]+/.test(t), 'Email found.', 'No email found. Recruiters cannot contact you.', 30)
  chk(/(\+?\d[\d\s-]{8,})/.test(t), 'Phone number found.', 'No phone number found.', 20)
  chk(/linkedin\.com|github\.com/i.test(t), 'LinkedIn/GitHub link present.', 'Add a LinkedIn or GitHub link.', 15)
  return { score: Math.max(score, 0), findings: f }
}

function reviewSummary(t) {
  const f = []
  let score = 100
  const words = t.split(/\s+/).filter(Boolean).length
  if (words < 25) { f.push(finding('warn', `Summary is short (${words} words). Aim for 30-60.`)); score -= 25 }
  else if (words > 80) { f.push(finding('warn', `Summary is long (${words} words). Trim to 60 or less.`)); score -= 15 }
  else f.push(finding('good', `Good length (${words} words).`))
  if (/\b(I|my|me)\b/.test(t)) { f.push(finding('warn', 'Avoid first person (I, my). Start with your role instead.')); score -= 10 }
  if (!/\d/.test(t)) { f.push(finding('warn', 'No numbers. Add years of experience or one key result.')); score -= 15 }
  return { score: Math.max(score, 0), findings: f }
}

function reviewExperience(t) {
  const tagged = analyzeBullets(t.split('\n').map((l) => (/^[•\-–*]/.test(l) ? l : '')).join('\n'))
  const f = []
  if (!tagged.length) {
    return { score: 30, findings: [finding('bad', 'No bullet points detected. Use bullets that start with action verbs.')], bullets: [] }
  }
  const score = bulletScore(tagged)
  const count = (tag) => tagged.filter((b) => b.tag === tag).length
  const strong = count('strong')
  f.push(finding(strong ? 'good' : 'bad', `${strong} of ${tagged.length} bullets are strong (action verb + metric).`))
  if (count('weak verb')) f.push(finding('bad', `${count('weak verb')} bullet(s) start with weak phrases like "Responsible for" or "Helped".`))
  if (count('no metrics')) f.push(finding('warn', `${count('no metrics')} bullet(s) have no numbers or measurable impact.`))
  if (count('vague')) f.push(finding('warn', `${count('vague')} bullet(s) are vague ("various", "team projects").`))
  if (tagged.length > 6 * 3) f.push(finding('warn', 'Too many bullets. Keep 3-5 per role.'))
  return { score, findings: f, bullets: tagged }
}

function reviewEducation(t) {
  const f = []
  let score = 100
  if (/b\.?tech|b\.?e\b|bachelor|master|m\.?tech|mba|bca|mca|b\.?sc|m\.?sc|diploma/i.test(t)) f.push(finding('good', 'Degree found.'))
  else { f.push(finding('bad', 'Degree name not clear (e.g. B.Tech in Computer Science).')); score -= 30 }
  if (/(19|20)\d{2}/.test(t)) f.push(finding('good', 'Year found.'))
  else { f.push(finding('warn', 'Add graduation year.')); score -= 20 }
  if (!/(cgpa|gpa|%|percentage)/i.test(t)) { f.push(finding('warn', 'Optional: add CGPA/percentage if it is strong.')); score -= 5 }
  return { score: Math.max(score, 0), findings: f }
}

function reviewSkills(t) {
  const f = []
  let score = 100
  const items = t.split(/[,|\n•;:]/).map((s) => s.trim()).filter((s) => s && s.length < 30)
  if (items.length < 6) { f.push(finding('warn', `Only ${items.length} skills listed. Add more relevant ones.`)); score -= 25 }
  else if (items.length > 30) { f.push(finding('warn', `${items.length} skills is too many. Keep the top 15-20.`)); score -= 15 }
  else f.push(finding('good', `${items.length} skills listed.`))
  if (!/:/.test(t)) { f.push(finding('warn', 'Group skills (Languages, Frameworks, Tools) so they scan faster.')); score -= 10 }
  return { score: Math.max(score, 0), findings: f }
}

function reviewProjects(t) {
  const r = reviewExperience(t)
  if (!/github\.com|http|live|demo/i.test(t)) {
    r.findings.push(finding('warn', 'Add a GitHub or live demo link to each project.'))
    r.score = Math.max(r.score - 10, 0)
  }
  return r
}

const REVIEWERS = {
  header: reviewHeader, summary: reviewSummary, experience: reviewExperience,
  education: reviewEducation, skills: reviewSkills, projects: reviewProjects,
}

const LABELS = {
  header: 'Contact', summary: 'Summary', experience: 'Experience',
  education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications',
}

export function reviewSections(resumeText) {
  const sections = splitSections(resumeText)
  const result = Object.entries(sections).map(([key, text]) => {
    const r = REVIEWERS[key] ? REVIEWERS[key](text) : { score: 100, findings: [] }
    return { key, label: LABELS[key] || key, status: statusOf(r.score), text, ...r }
  })
  // Missing sections
  for (const need of ['summary', 'experience', 'education', 'skills']) {
    if (!sections[need]) {
      result.push({
        key: need, label: LABELS[need], status: 'weak', score: 0,
        findings: [finding('bad', `${LABELS[need]} section not found. ATS may skip it.`)],
      })
    }
  }
  return result
}

// AI ke liye: har section ka 2-3 line descriptive feedback maango.
export function buildSectionMessages(resumeText, jd = '') {
  return [
    {
      role: 'system',
      content:
        'You are a senior resume reviewer. For each resume section, write 2-3 sentences of specific, ' +
        'honest feedback: what works, what is missing, and one concrete fix. Do not invent facts, ' +
        'numbers or companies. Return ONLY JSON: {"sections":[{"key":"experience","feedback":"...","suggestion":"..."}]}',
    },
    { role: 'user', content: `RESUME:\n${resumeText.slice(0, 6000)}\n\nJOB DESCRIPTION:\n${jd.slice(0, 2000)}` },
  ]
}

export function mergeSectionFeedback(reviewed, ai) {
  const map = new Map((ai?.sections || []).map((s) => [s.key, s]))
  return reviewed.map((s) => ({
    ...s,
    feedback: map.get(s.key)?.feedback || null,
    suggestion: map.get(s.key)?.suggestion || null,
  }))
}
