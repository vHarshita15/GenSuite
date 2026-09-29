import { callAIJson, parseAiJson } from './aiController.js'
import {
  analyzeLinkedIn,
  buildOptimizationMessages,
  mergeOptimizationAI,
} from '../utils/linkedinOptimization.js'

const TEXT_LIMITS = {
  headline: 300,
  about: 2600,
  experience: 6000,
  skills: 1500,
  targetRole: 120,
  jobDescription: 4000,
}

export const optimizeLinkedIn = async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}
  const input = {}

  for (const [field, maxLength] of Object.entries(TEXT_LIMITS)) {
    const value = body[field] === undefined ? '' : body[field]
    if (typeof value !== 'string') return res.status(400).json({ error: `${field} must be a string.` })
    if (value.length > maxLength) return res.status(400).json({ error: `${field} must be ${maxLength} characters or fewer.` })
    input[field] = value
  }

  if (!['headline', 'about', 'experience', 'skills'].some((field) => input[field].trim())) {
    return res.status(400).json({ error: 'Provide at least one of headline, about, experience, or skills.' })
  }

  const checklistValue = body.checklist
  const isPlainChecklist = checklistValue && typeof checklistValue === 'object' && !Array.isArray(checklistValue) &&
    (Object.getPrototypeOf(checklistValue) === Object.prototype || Object.getPrototypeOf(checklistValue) === null)
  input.checklist = isPlainChecklist
    ? Object.fromEntries(Object.entries(checklistValue).filter(([, value]) => typeof value === 'boolean'))
    : {}

  const result = analyzeLinkedIn(input)
  let merged
  let aiAvailable = false

  try {
    const experience = result.sections.find((section) => section.key === 'experience')
    const weakBullets = (experience?.bullets || []).filter((bullet) => bullet.tag !== 'strong')
    const parsed = parseAiJson(await callAIJson(buildOptimizationMessages(input, weakBullets)))
    merged = mergeOptimizationAI(result, parsed)
    aiAvailable = true
  } catch (err) {
    console.error('[linkedinOptimization] AI step failed:', err.message)
    merged = mergeOptimizationAI(result, null)
  }

  return res.json({ ...merged, aiAvailable })
}
