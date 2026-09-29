export const buildResumeMessages = (resumeText, jobDescription = '') => {
  const system = 'You are a senior technical recruiter and resume reviewer. Respond with a single valid JSON object and nothing else.';

  const user = `Review the resume below using this rubric.

RUBRIC for contentScore (0-100):
- Summary/headline is specific and role-targeted
- Experience shows progression, scope, and ownership
- Bullets are action-verb led and describe outcomes, not duties
- Consistent tense (past for old roles, present for current)
- Skills are grouped, relevant, and not padded
- No clichÃ©s or filler ("hard-working", "team player", "responsible for")
- Concise and scannable

RULES:
- Base everything ONLY on the resume text. Never invent employers, clients, tools, or numbers.
- Return at most 5 suggestions, each under 100 characters.
${jobDescription ? '- A job description is provided; tailor suggestions to it.' : '- No job description given; also return up to 8 role-relevant missingKeywords.'}

JSON SCHEMA:
{
  "contentScore": number,
  "detectedRole": string,
  "summary": string (2 sentences max),
  "suggestions": [string],
  "missingKeywords": [string]
}
${jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription}\n` : ''}
RESUME:
${resumeText}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
};

export const parseAiJson = (raw) => {
  const cleaned = String(raw || '').replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI did not return JSON');
  return JSON.parse(cleaned.slice(start, end + 1));
};

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const strList = (arr, max) => (Array.isArray(arr) ? arr.map((s) => String(s).trim()).filter(Boolean).slice(0, max) : []);

export const sanitizeAiResult = (ai) => {
  return {
    contentScore: clamp(ai.contentScore),
    detectedRole: String(ai.detectedRole || '').slice(0, 80),
    summary: String(ai.summary || '').slice(0, 300),
    suggestions: strList(ai.suggestions, 5),
    missingKeywords: strList(ai.missingKeywords, 8),
  };
};
