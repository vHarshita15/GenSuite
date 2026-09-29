const BULLET_LINE_RE = /^\s*(?:[\u2022\u25cf\u25aa\u25e6\u00b7*\u2013\u2014-]\s+|\d+[.)]\s+)(\S.*)$/;
const METRIC_RE = /(?:\$\s?\d[\d,.]*(?:\s?[kmb])?|\b\d+(?:\.\d+)?(?:\s?%|\s?(?:x|k|m|b)\b|\+)?|\b\d+(?:\.\d+)?\s?(?:hours?|days?|weeks?|months?|years?|users?|customers?|clients?|projects?|people|employees|teams?)\b)/i;
const WEAK_VERB_RE = /^\s*(?:responsible\s+for|helped|worked\s+on|assisted|was\s+in\s+charge\s+of)\b/i;
const VAGUE_WORD_RE = /\b(?:various|stuff|things|team\s+projects?|different\s+tasks?|multiple\s+duties)\b/i;
const STRONG_VERBS = new Set((
  'achieved analyzed automated built launched created delivered designed developed drove established exceeded expanded generated improved increased ' +
  'implemented initiated introduced led managed optimized organized reduced resolved secured streamlined transformed upgraded won wrote ' +
  'spearheaded negotiated accelerated administered advised aligned allocated architected audited boosted collaborated consolidated constructed ' +
  'coordinated decreased deployed directed enabled engineered enhanced executed forecasted grew influenced integrated mentored migrated modernized ' +
  'owned performed produced programmed redesigned restored saved scaled trained translated validated facilitated presented researched tested'
).split(/\s+/));

export const extractResumeBullets = (text) => String(text || '')
  .split(/\n+/)
  .map((line) => line.match(BULLET_LINE_RE)?.[1]?.trim())
  .filter((line) => line && line.length >= 8)
  .filter((line, index, all) => all.indexOf(line) === index)
  .slice(0, 40);

const startsWithStrongVerb = (bullet) => {
  const firstWord = String(bullet).trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  return STRONG_VERBS.has(firstWord);
};

export const classifyBullet = (original) => {
  const hasMetric = METRIC_RE.test(original);
  let tag = 'no metrics';
  if (hasMetric && startsWithStrongVerb(original)) tag = 'strong';
  else if (WEAK_VERB_RE.test(original)) tag = 'weak verb';
  else if (VAGUE_WORD_RE.test(original)) tag = 'vague';
  return { original, tag, hasMetric, rewrite: null };
};

export const buildBulletRewriteMessages = (bullets) => [
  {
    role: 'system',
    content: 'You are a resume coach. For each bullet, rewrite it to start with a strong action verb and show impact. Do not invent numbers or companies; use [X%] or [N] placeholders when data is missing. Keep each rewrite under 25 words. Return ONLY JSON: {"bullets":[{"original":"","tag":"","rewrite":""}]}',
  },
  {
    role: 'user',
    content: `Rewrite every bullet below. Return one entry per bullet in the same order, copying each original and tag exactly.\n\nBULLETS:\n${JSON.stringify(bullets.map(({ original, tag }) => ({ original, tag })))}`
  },
];

const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
export const parseBulletRewrites = (raw, bullets) => {
  const cleaned = String(raw || '').replace(/```(?:json)?|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('AI did not return JSON for bullet rewrites');
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  const items = Array.isArray(parsed) ? parsed : parsed?.bullets;
  if (!Array.isArray(items)) throw new Error('AI bullet rewrite response did not include a bullets array');

  const byOriginal = new Map(items.map((item) => [normalize(item?.original), item]));
  return bullets.map((bullet) => {
    const item = byOriginal.get(normalize(bullet.original));
    const rewrite = String(item?.rewrite || '').replace(/\s+/g, ' ').trim();
    if (!rewrite || rewrite.split(/\s+/).length > 25) return bullet;

    // Reject extra numeric claims; placeholders are allowed when the source has no metric.
    const numbers = rewrite.match(/\$?\b\d+(?:[,.]\d+)*(?:\s?%)?\b/g) || [];
    const sourceNumbers = bullet.original.match(/\$?\b\d+(?:[,.]\d+)*(?:\s?%)?\b/g) || [];
    if (numbers.some((number) => !sourceNumbers.includes(number))) return bullet;

    const startsWithAction = startsWithStrongVerb(rewrite);
    const hasPlaceholder = /\[(?:x|n)(?:%|\+)?\]/i.test(rewrite);
    const includesMetric = METRIC_RE.test(rewrite) || hasPlaceholder;
    if (!startsWithAction || (!bullet.hasMetric && !hasPlaceholder) || !includesMetric) return bullet;

    // Keep a placeholder marker if the source had none, even when the model omitted one.
    const safeRewrite = bullet.hasMetric || hasPlaceholder ? rewrite : rewrite.replace(/([.!?]?)$/, ' [X%]$1');
    return { ...bullet, rewrite: safeRewrite };
  });
};
