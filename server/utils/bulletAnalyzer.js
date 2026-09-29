// server/utils/bulletAnalyzer.js
// Rule-based checks: AI ke bina bhi tags, score aur keywords kaam karte hain.

const WEAK_STARTS = [
  'responsible for', 'helped', 'help with', 'worked on', 'work on', 'assisted',
  'was in charge of', 'in charge of', 'involved in', 'participated in',
  'tasked with', 'duties included', 'handled', 'looked after',
]

const VAGUE_WORDS = [
  'various', 'several', 'multiple', 'many', 'some', 'stuff', 'things',
  'team projects', 'different tasks', 'day-to-day', 'etc', 'and more',
]

const STRONG_VERBS = [
  'reduced', 'improved', 'increased', 'decreased', 'grew', 'cut', 'built',
  'designed', 'developed', 'launched', 'led', 'managed', 'delivered', 'created',
  'implemented', 'optimized', 'automated', 'migrated', 'scaled', 'saved',
  'achieved', 'streamlined', 'architected', 'shipped', 'boosted', 'drove',
]

// number, %, $, k/m suffix, "from X to Y", "5+"
const METRIC_RE = /(\d+(\.\d+)?\s?(%|x|k|m|\+)?)|\$\s?\d+/i

export function extractBullets(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[•\-–—*▪●◦]\s+/.test(l))
    .map((l) => l.replace(/^[•\-–—*▪●◦]\s+/, '').trim())
    .filter((l) => l.split(/\s+/).length >= 4)
}

export function tagBullet(bullet) {
  const b = bullet.toLowerCase().trim()
  const hasMetric = METRIC_RE.test(b)
  const startsWeak = WEAK_STARTS.some((w) => b.startsWith(w))
  const isVague = VAGUE_WORDS.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(b))
  const firstWord = b.split(/\s+/)[0]
  const startsStrong = STRONG_VERBS.includes(firstWord)

  // Priority: weak verb > vague > no metrics > strong
  let tag
  if (startsWeak) tag = 'weak verb'
  else if (isVague) tag = 'vague'
  else if (!hasMetric) tag = 'no metrics'
  else if (startsStrong) tag = 'strong'
  else tag = 'no metrics' // metric hai par verb strong nahi
  return { original: bullet, tag, strong: tag === 'strong' }
}

export function analyzeBullets(text) {
  return extractBullets(text).map(tagBullet)
}

// Score: strong bullets ka ratio (0-100)
export function bulletScore(tagged) {
  if (!tagged.length) return 0
  const strong = tagged.filter((t) => t.strong).length
  return Math.round((strong / tagged.length) * 100)
}

// ---- Keywords: stopwords hatao, tech list se match karo ----
const TECH_TERMS = [
  'react', 'typescript', 'javascript', 'node', 'nodejs', 'express', 'graphql',
  'rest', 'docker', 'kubernetes', 'ci/cd', 'jest', 'cypress', 'redux', 'zustand',
  'next.js', 'nextjs', 'aws', 'vercel', 'git', 'github actions', 'html', 'css',
  'tailwind', 'mongodb', 'sql', 'postgresql', 'python', 'java', 'agile', 'scrum',
  'apollo', 'webpack', 'vite', 'testing', 'accessibility', 'wcag', 'figma',
  'react testing library', 'core web vitals',
]

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')
export const hasTerm = (text, term) =>
  new RegExp(`(?<![a-z0-9])${escRe(term)}(?![a-z0-9])`, 'i').test(text)

export function keywordGap(resumeText, jdText) {
  const inJd = TECH_TERMS.filter((t) => hasTerm(jdText, t))
  const missing = inJd.filter((t) => !hasTerm(resumeText, t))
  const matched = inJd.filter((t) => hasTerm(resumeText, t))
  return { missing, matched }
}

// ---- AI rewrites ko merge karo (AI fail ho to null) ----
export function mergeRewrites(tagged, aiResult) {
  const map = new Map(
    (aiResult?.bullets || []).map((b) => [b.original?.trim(), b.rewrite])
  )
  return tagged.map((t) => ({
    ...t,
    rewrite: t.strong ? null : map.get(t.original.trim()) || null,
    rewriteUnavailable: !t.strong && !map.get(t.original.trim()),
  }))
}
