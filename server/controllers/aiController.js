import Groq from "groq-sdk";
import sql from "../configs/db.js";
import axios from "axios";
import { cloudinary } from "../configs/cloudinary.js";
import fs from "fs";
import { extractResumeText } from "../utils/extractText.js";
import { runAtsChecks, computeScores } from "../utils/atsChecks.js";
import { parseAiJson } from "../utils/resumeAI.js";
export { parseAiJson };
import { reviewSections, buildSectionMessages, mergeSectionFeedback } from "../utils/sectionReview.js";
import { keywordGap, mergeRewrites } from "../utils/bulletAnalyzer.js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
let AI = null;
if (!GROQ_API_KEY) {
  console.warn('Missing GROQ_API_KEY in environment — AI endpoints will be disabled or use fallbacks.');
} else {
  AI = new Groq({ apiKey: GROQ_API_KEY });
}

const AI_MODEL = process.env.AI_MODEL || 'llama-3.1-8b-instant';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const localArticleFallback = (prompt, length = 400) => {
  const wordCount = (() => {
    if (!length) return 400;
    if (typeof length === 'string') length = Number(length) || 400;
    if (length <= 300) return 250;
    if (length <= 800) return 500;
    return 900;
  })();

  const topic = String(prompt || '').trim() || 'This topic';
  const sentences = [
    `${topic}.`,
    `This article explores ${topic} and why it matters for its audience.`,
    `Key considerations for ${topic} include clarity of purpose, measurable outcomes, and alignment with user needs.`,
    `Practical recommendations for implementing ${topic} involve small pilots, clear metrics, and continuous iteration.`,
    `Common challenges when adopting ${topic} include resource constraints, integration complexity, and change management.`,
    `Successful projects focusing on ${topic} prioritize data quality, user feedback, and maintainable processes.`,
    `Future developments in ${topic} will likely emphasize specialization, tooling improvements, and better safety/quality controls.`,
    `To get started with ${topic}, focus on a single measurable problem and build a repeatable feedback loop.`
  ];

  let body = sentences.join(' ');
  while (body.split(/\s+/).length < wordCount) {
    body += ' ' + sentences[Math.floor(Math.random() * sentences.length)];
  }
  const words = body.split(/\s+/).slice(0, wordCount);
  return words.join(' ') + '\n\n[NOTE: This is a generated fallback article because the configured AI model was unavailable.]';
};

const callAI = async (prompt, systemMessage = '', maxTokens = 800) => {
  if (!AI) throw new Error('GROQ_API_KEY not configured. Set GROQ_API_KEY to enable AI features.');

  const tryModel = async (model) => {
    const response = await AI.chat.completions.create({
      model,
      messages: [...(systemMessage ? [{ role: 'system', content: systemMessage }] : []), { role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens
    });
    return response.choices[0].message.content;
  };

  try {
    return await tryModel(AI_MODEL);
  } catch (error) {
    const errCode = error?.response?.data?.code || error?.code || '';
    const errMsg = error?.response?.data?.message || error?.message || '';
    if (errCode === 'model_not_found' || errCode === 'model_decommissioned' || /model.*not.*found/i.test(errMsg) || /decommissioned/i.test(errMsg)) {
      const fallbackEnv = process.env.AI_MODEL_FALLBACKS || '';
      const fallbacks = fallbackEnv ? fallbackEnv.split(',').map(s => s.trim()).filter(Boolean) : ['gemma2-9b-it', 'llama-3.1-8b-instant'];
      for (const candidate of fallbacks) {
        try { return await tryModel(candidate); } catch (e) { /* continue */ }
      }
      throw new Error(`AI model not found: ${AI_MODEL}. Tried fallbacks: ${fallbacks.join(', ')}.`);
    }
    throw error;
  }
};

// JSON-mode call used by the resume review
export const callAIJson = async (messages, maxTokens = 4000) => {
  if (!AI) throw new Error('GROQ_API_KEY not configured.');
  const params = {
    model: AI_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  };
  if (/gpt-oss/i.test(AI_MODEL)) params.reasoning_effort = 'low';
  const response = await AI.chat.completions.create(params);
  return response.choices[0].message.content;
};

const isRateLimitedError = (error) => {
  const status = error?.status || error?.response?.status;
  const message = (error?.message || '').toLowerCase();
  return status === 429 || status === 503 || message.includes('rate limit') || message.includes('high demand');
};

const rateLimitMessage = 'Rate limit hit. Please try again in a few seconds.';

const formatAIError = (error) => {
  const status = error?.status || error?.response?.status;
  const body = error?.response?.data || error?.message || 'Unknown AI error';
  if (status === 403) return `Groq permission denied (403). Check your GROQ_API_KEY. ${typeof body === 'string' ? body : JSON.stringify(body)}`;
  return typeof body === 'string' ? body : JSON.stringify(body);
};

const withRateLimitRetry = async (fn, { retries = 3, baseDelayMs = 1000 } = {}) => {
  let attempt = 0;
  while (true) {
    try { return await fn(); } catch (error) { attempt += 1; if (!isRateLimitedError(error) || attempt > retries) throw error; const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250); await sleep(delay); }
  }
};

export const generateArticle = async (req, res) => {
  try {
    const userId = req.userId || null;
    const { prompt, length } = req.body || {};
    if (!prompt) return res.json({ success: false, message: 'Prompt is required' });
    try {
      const content = await withRateLimitRetry(() => callAI(prompt, '', length || 800), { retries: 0 });
      if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`; } catch (e) { } }
      return res.json({ success: true, content });
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('groq_api_key') || msg.includes('model not found') || msg.includes('tried fallbacks')) {
        const content = localArticleFallback(prompt, length);
        if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`; } catch (e) { } }
        return res.json({ success: true, content, fallback: true });
      }
      if (isRateLimitedError(err)) return res.json({ success: false, message: rateLimitMessage });
      return res.json({ success: false, message: formatAIError(err) });
    }
  } catch (error) { return res.json({ success: false, message: error.message || 'Unknown error' }); }
};

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId || null;
    const { prompt, publish } = req.body || {};
    const hasCloudinary = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY);
    if (!process.env.CLIPDROP_API_KEY || !hasCloudinary) {
      const placeholderText = encodeURIComponent(String(prompt || 'Image Fallback'));
      const placeholder = `https://via.placeholder.com/1024.png?text=${placeholderText}`;
      if (userId) {
        try { await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${placeholder}, 'image', ${publish ?? false})`; } catch (e) { }
      }
      return res.json({ success: true, content: placeholder, fallback: true, message: 'Using local placeholder image because CLIPDROP_API_KEY or CLOUDINARY_URL is not configured.' });
    }

    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('prompt', prompt);
      const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', form, { headers: { 'x-api-key': process.env.CLIPDROP_API_KEY, ...form.getHeaders() }, responseType: 'arraybuffer' });
      const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;
      const { secure_url } = await cloudinary.uploader.upload(base64Image);
      if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`; } catch (e) { } }
      return res.json({ success: true, content: secure_url });
    } catch (err) {
      const msg = (err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || '').toLowerCase();
      if (msg.includes('api_key') || msg.includes('must supply') || err?.response?.status === 401 || err?.response?.status === 403) {
        const placeholderText = encodeURIComponent(String(prompt || 'Image Fallback'));
        const placeholder = `https://via.placeholder.com/1024.png?text=${placeholderText}`;
        if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${placeholder}, 'image', ${publish ?? false})`; } catch (e) { } }
        return res.json({ success: true, content: placeholder, fallback: true, message: 'Using placeholder because image provider returned authentication/error.' });
      }
      return res.json({ success: false, message: err.message || 'Image generation failed' });
    }
  } catch (error) { return res.json({ success: false, message: error.message || 'Image generation failed' }); }
};

export const removeImageBackground = async (req, res) => {
  try {
    const userId = req.userId || null;
    const image = req.file;
    if (!image) return res.json({ success: false, message: 'Image is required' });

    const hasCloudinary = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY);
    if (!hasCloudinary) {
      const placeholderText = encodeURIComponent('Background Removal');
      const placeholder = `https://via.placeholder.com/1024.png?text=${placeholderText}`;
      if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${'Remove background from image'}, ${placeholder}, 'image')`; } catch (e) { } }
      return res.json({ success: true, content: placeholder, fallback: true, message: 'Using placeholder because CLOUDINARY_URL is not configured.' });
    }

    try {
      const { secure_url } = await cloudinary.uploader.upload(image.path, { transformation: [{ effect: 'background_removal' }] });
      if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${'Remove background from image'}, ${secure_url}, 'image')`; } catch (e) { } }
      return res.json({ success: true, content: secure_url });
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('api') || msg.includes('auth') || err?.http_code === 401 || err?.http_code === 403) {
        const placeholderText = encodeURIComponent('Background Removal');
        const placeholder = `https://via.placeholder.com/1024.png?text=${placeholderText}`;
        if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${'Remove background from image'}, ${placeholder}, 'image')`; } catch (e) { } }
        return res.json({ success: true, content: placeholder, fallback: true, message: 'Using placeholder because Cloudinary returned an error.' });
      }
      return res.json({ success: false, message: err.message || 'Background removal failed' });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message || 'Background removal failed' });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const userId = req.userId || null;
    const { object } = req.body || {};
    const image = req.file;
    if (!image) return res.json({ success: false, message: 'Image is required' });
    if (!object || !object.trim()) return res.json({ success: false, message: 'Object name is required' });
    const objectLabel = object.trim();

    const hasCloudinary = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY);
    if (!hasCloudinary) {
      const placeholderText = encodeURIComponent(`Removed ${objectLabel}`);
      const placeholder = `https://via.placeholder.com/1024.png?text=${placeholderText}`;
      if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${objectLabel} from image`}, ${placeholder}, 'image')`; } catch (e) { } }
      return res.json({ success: true, content: placeholder, fallback: true, message: 'Using placeholder because CLOUDINARY_URL is not configured.' });
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(image.path, { resource_type: 'image' });
      const imageUrl = cloudinary.url(uploadResult.public_id, { secure: true, resource_type: 'image', transformation: [{ effect: `gen_remove:${objectLabel}` }] });
      if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${objectLabel} from image`}, ${imageUrl}, 'image')`; } catch (e) { } }
      return res.json({ success: true, content: imageUrl });
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('api') || msg.includes('auth') || err?.http_code === 401 || err?.http_code === 403) {
        const placeholderText = encodeURIComponent(`Removed ${objectLabel}`);
        const placeholder = `https://via.placeholder.com/1024.png?text=${placeholderText}`;
        if (userId) { try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Removed ${objectLabel} from image`}, ${placeholder}, 'image')`; } catch (e) { } }
        return res.json({ success: true, content: placeholder, fallback: true, message: 'Using placeholder because Cloudinary returned an error.' });
      }
      return res.json({ success: false, message: err.message || 'Object removal failed' });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message || 'Object removal failed' });
  }
};

export const resumeReview = async (req, res) => {
  const resume = req.file;
  try {
    const userId = req.userId || null;
    if (!resume) return res.status(400).json({ success: false, message: 'Resume file is required' });
    const jobDescription = String(req.body?.jobDescription || '').trim().slice(0, 4000);

    let resumeText;
    try { resumeText = await extractResumeText(resume); }
    catch (e) { return res.status(400).json({ success: false, message: e.message }); }

    const ats = runAtsChecks(resumeText);
    let sections = reviewSections(resumeText);
    const keywords = keywordGap(resumeText, jobDescription || '');
    const rewriteTargets = sections.filter((section) => ['experience', 'projects'].includes(section.key));
    const bulletsToRewrite = rewriteTargets.flatMap((section) =>
      (section.bullets || []).filter((bullet) => !bullet.strong).map(({ original, tag }) => ({ original, tag }))
    );

    const rewriteTask = callAIJson([
      {
        role: 'system',
        content: 'You are a resume coach. For each bullet below, rewrite it to start with a strong action verb and show impact. Do not invent numbers or companies; use [X%] or [N] placeholders when data is missing. Keep each rewrite under 25 words. Return ONLY JSON: {"bullets":[{"original":"","tag":"","rewrite":""}]}',
      },
      { role: 'user', content: JSON.stringify(bulletsToRewrite) },
    ]).then(parseAiJson);
    const sectionFeedbackTask = callAIJson(buildSectionMessages(resumeText, jobDescription || '')).then(parseAiJson);
    const [rewriteResult, sectionFeedbackResult] = await Promise.allSettled([rewriteTask, sectionFeedbackTask]);

    for (const result of [rewriteResult, sectionFeedbackResult]) {
      if (result.status === 'rejected') console.error('[resumeReview] AI step failed:', result.reason?.message);
    }

    const rewriteAiResult = rewriteResult.status === 'fulfilled' ? rewriteResult.value : null;
    sections = sections.map((section) => (
      ['experience', 'projects'].includes(section.key)
        ? { ...section, bullets: mergeRewrites(section.bullets || [], rewriteAiResult) }
        : section
    ));

    const sectionAiResult = sectionFeedbackResult.status === 'fulfilled' ? sectionFeedbackResult.value : null;
    if (sectionAiResult) sections = mergeSectionFeedback(sections, sectionAiResult);

    const aiAvailable = rewriteResult.status === 'fulfilled' || sectionFeedbackResult.status === 'fulfilled';
    const bulletReviews = sections
      .filter((section) => ['experience', 'projects'].includes(section.key))
      .flatMap((section) => section.bullets || []);
    const keywordCount = keywords.matched.length + keywords.missing.length;
    const keywordScore = keywordCount ? Math.round((keywords.matched.length / keywordCount) * 100) : null;

    const { overall, breakdown } = computeScores({
      atsScore: ats.score,
      impactScore: ats.impactScore,
      contentScore: null,
      keywordScore,
    });

    const suggestions = ats.checks.filter((c) => !c.passed).map((c) => c.tip).slice(0, 8);

    const data = {
      score: overall,
      atsScore: ats.score,
      breakdown,
      atsChecks: ats.checks,
      stats: ats.stats,
      bulletReviews,
      bulletFixCount: bulletReviews.filter((bullet) => bullet.tag !== 'strong').length,
      suggestions,
      missingKeywords: keywords.missing,
      matchedKeywords: keywords.matched,
      detectedRole: '',
      summary: '',
      sections,
      keywords,
      aiAvailable,
    };

    const content = `Resume score: ${overall}/100 · ATS: ${ats.score}/100\n\n${data.summary}`;
    if (userId) {
      try { await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${'Review the uploaded resume'}, ${content}, 'resume-review')`; } catch (e) { }
    }

    return res.json({ success: true, data, content });
  } catch (error) {
    console.error('[resumeReview] error', error?.message || error);
    return res.status(500).json({ success: false, message: error.message || 'Resume review failed' });
  } finally {
    if (resume?.path) fs.unlink(resume.path, () => {});
  }
};
