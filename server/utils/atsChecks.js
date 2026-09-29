const BULLET_RE = /^\s*[•●▪◦·*–—-]\s*(\S.*)$/;
const IRREGULAR_VERBS = ['led', 'built', 'ran', 'drove', 'grew', 'cut', 'won', 'wrote', 'made', 'oversaw', 'sold', 'taught', 'began', 'spearheaded'];
const METRIC_RE = /(\d+\s?%|\$\s?\d|\b\d{2,}\b|\d+\+|\b\d+\s?[kKmMxX]\b)/;

const STOP = new Set(('the and for with you your our are will have has this that from they their been were what when where which who how not but can all any able about into over such than then them these those also more most other some very well etc ' +
  'experience work team ability strong skills skill years year requirements responsibilities responsibility role job company candidate including required preferred looking join using use good great plus must should would could like need needs knowledge working across within between while being make making help helping new').split(' '));

const getBullets = (text) =>
  text.split('\n').map((l) => l.match(BULLET_RE)).filter(Boolean).map((m) => m[1].trim());

const startsWithActionVerb = (bullet) => {
  const first = bullet.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  return first.endsWith('ed') || IRREGULAR_VERBS.includes(first);
};

export const runAtsChecks = (text) => {
  const bullets = getBullets(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const metricBullets = bullets.filter((b) => METRIC_RE.test(b)).length;
  const verbBullets = bullets.filter(startsWithActionVerb).length;
  const pronouns = (text.match(/\b(I|my|me)\b/g) || []).length;
  const yearMentions = (text.match(/\b(19|20)\d{2}\b/g) || []).length;

  const checks = [];
  const add = (label, passed, weight, tip) => checks.push({ label, passed, weight, tip: passed ? undefined : tip });

  add('Email address found', /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text), 3, 'Add a professional email address at the top.');
  add('Phone number found', /\+?\d[\d\s().-]{8,}\d/.test(text), 2, 'Add a phone number in the contact section.');
  add('LinkedIn / GitHub link found', /linkedin\.com|github\.com/i.test(text), 1, 'Add your LinkedIn or GitHub profile URL.');
  add('Experience section detected', /^\s*(work |professional )?(experience|employment( history)?)\b/im.test(text), 3, 'Use a standard heading like "Work Experience".');
  add('Education section detected', /^\s*education\b/im.test(text), 2, 'Add a clear "Education" heading.');
  add('Skills section detected', /^\s*(technical |core |key )?skills\b/im.test(text), 3, 'Add a dedicated "Skills" section.');
  add('Reasonable length (300-900 words)', wordCount >= 300 && wordCount <= 900, 2, wordCount < 300 ? 'Resume looks too short. Add more detail on impact.' : 'Resume looks long. Trim to 1-2 pages.');
  add('Uses bullet points (5+)', bullets.length >= 5, 2, 'Describe your experience in short bullet points.');
  add('Bullets start with action verbs', bullets.length > 0 && verbBullets / bullets.length >= 0.5, 2, 'Start bullets with verbs like "Led", "Built", "Reduced".');
  add('Quantified achievements (3+ bullets)', metricBullets >= 3, 3, 'Add numbers (%, $, team size, time saved) to at least 3 bullets.');
  add('Dates present', yearMentions >= 2, 2, 'Include start and end dates for roles and education.');
  add('Avoids first-person pronouns', pronouns <= 2, 1, 'Remove "I", "my", "me" from bullets.');
  add('No garbled characters', !/\(cid:\d+\)|\uFFFD/.test(text), 3, 'Text extraction looks garbled. Avoid tables, columns and unusual fonts.');

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const passed = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  const impactScore = Math.min(100, Math.round((metricBullets / Math.max(bullets.length, 1)) / 0.6 * 100));

  return {
    checks: checks.map(({ label, passed, tip }) => ({ label, passed, tip })),
    score: Math.round((passed / total) * 100),
    impactScore,
    stats: { wordCount, bulletCount: bullets.length, metricBullets },
  };
};

const tokenize = (t) =>
  (t.toLowerCase().match(/[a-z][a-z0-9+#./-]+/g) || []).map((w) => w.replace(/[./-]+$/, '')).filter((w) => w.length >= 3 && !STOP.has(w));

export const matchKeywords = (resumeText, jobDescription) => {
  const freq = new Map();
  tokenize(jobDescription).forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([w]) => w);
  if (!keywords.length) return null;

  const resumeWords = new Set(tokenize(resumeText));
  const matched = keywords.filter((k) => resumeWords.has(k));
  const missing = keywords.filter((k) => !resumeWords.has(k));
  return { matchPercent: Math.round((matched.length / keywords.length) * 100), matched, missing: missing.slice(0, 12) };
};

// Missing components (null) are dropped and remaining weights re-normalised.
export const computeScores = ({ atsScore, contentScore, impactScore, keywordScore }) => {
  const parts = [
    [atsScore, 30],
    [contentScore, 30],
    [impactScore, 20],
    [keywordScore, 20],
  ].filter(([v]) => typeof v === 'number');
  const totalW = parts.reduce((s, [, w]) => s + w, 0);
  const overall = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / totalW);
  return {
    overall,
    breakdown: { format: atsScore, content: contentScore, impact: impactScore, keywords: keywordScore },
  };
};
