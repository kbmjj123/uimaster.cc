// server/api/share/create.post.ts
// Creates a share token and writes it to D1 share_records.
// POST body: { effect_id: string }
// Response:  { token: string }

import { randomUUID } from 'node:crypto'

interface CreateBody {
  effect_id: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateBody>(event)

  if (!body?.effect_id?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'effect_id is required' })
  }

  const effectId = body.effect_id.trim()
  const token    = randomUUID()
  const now      = new Date().toISOString()
  const id       = randomUUID()

  // Access Cloudflare D1 binding via nitro cloudflare-module
  const db = (event.context as { cloudflare?: { env?: { DB?: D1Database } } })
    ?.cloudflare?.env?.DB

  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database not available' })
  }

  // Verify the effect exists
  const effect = await db
    .prepare('SELECT id FROM html_effects WHERE id = ?')
    .bind(effectId)
    .first()

  if (!effect) {
    throw createError({ statusCode: 404, statusMessage: `Effect "${effectId}" not found` })
  }

  // Insert share record
  await db
    .prepare(`
      INSERT INTO share_records (id, effect_id, share_token, created_at, visitor_count)
      VALUES (?, ?, ?, ?, 0)
    `)
    .bind(id, effectId, token, now)
    .run()

  // Increment share_count on the effect
  await db
    .prepare('UPDATE html_effects SET share_count = share_count + 1, updated_at = ? WHERE id = ?')
    .bind(now, effectId)
    .run()

  return { token }
})

// D1Database type shim (Cloudflare Workers type — not needed at runtime)
interface D1Database {
  prepare(query: string): D1PreparedStatement
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  run(): Promise<void>
  first(): Promise<Record<string, unknown> | null>
}