import sql from '../configs/db.js'

let tableReady = false

const ensureTable = async () => {
  if (tableReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS community_resources (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      display_name VARCHAR(80) NOT NULL,
      title VARCHAR(140) NOT NULL,
      category VARCHAR(60) NOT NULL,
      description VARCHAR(600) NOT NULL DEFAULT '',
      resource_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  tableReady = true
}

export const getCommunityResources = async (_req, res) => {
  try {
    await ensureTable()
    const resources = await sql`
      SELECT id, display_name, title, category, description, resource_url, created_at
      FROM community_resources
      ORDER BY created_at DESC
      LIMIT 100
    `
    return res.json({ success: true, resources })
  } catch (error) {
    console.error('[communityResources] load failed:', error?.message || error)
    return res.status(500).json({ success: false, message: 'Could not load community resources.' })
  }
}

export const createCommunityResource = async (req, res) => {
  const displayName = String(req.body?.displayName || '').trim()
  const title = String(req.body?.title || '').trim()
  const category = String(req.body?.category || '').trim()
  const description = String(req.body?.description || '').trim()
  const resourceUrl = String(req.body?.resourceUrl || '').trim()
  const categories = [
    'DSA & SDE preparation', 'SQL & database practice', 'System design',
    'Web development', 'Resume & career', 'Semester preparation', 'Internships & opportunities', 'Other',
  ]

  if (!displayName || displayName.length > 80) {
    return res.status(400).json({ success: false, message: 'Enter a name up to 80 characters.' })
  }
  if (!title || title.length > 140) {
    return res.status(400).json({ success: false, message: 'Enter a title up to 140 characters.' })
  }
  if (!categories.includes(category)) {
    return res.status(400).json({ success: false, message: 'Choose a valid resource category.' })
  }
  if (description.length > 600) {
    return res.status(400).json({ success: false, message: 'Description must be 600 characters or fewer.' })
  }
  let parsedUrl
  try {
    parsedUrl = new URL(resourceUrl)
  } catch {
    return res.status(400).json({ success: false, message: 'Enter a valid http or https link.' })
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ success: false, message: 'Resource link must use http or https.' })
  }

  try {
    await ensureTable()
    const [resource] = await sql`
      INSERT INTO community_resources (user_id, display_name, title, category, description, resource_url)
      VALUES (${req.userId}, ${displayName}, ${title}, ${category}, ${description}, ${parsedUrl.toString()})
      RETURNING id, display_name, title, category, description, resource_url, created_at
    `
    return res.status(201).json({ success: true, resource })
  } catch (error) {
    console.error('[communityResources] create failed:', error?.message || error)
    return res.status(500).json({ success: false, message: 'Could not share this resource. Please try again.' })
  }
}
