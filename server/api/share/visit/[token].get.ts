// server/api/share/visit/[token].get.ts
// Called when someone clicks a share link.
// Marks the token as unlocked (sets unlocked_at) and increments visitor_count.
// Then redirects the visitor to the effect's detail page.
//
// GET /api/share/visit/:token?ref=share

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'token is required' })
  }

  const db = (event.context as { cloudflare?: { env?: { DB?: D1Database } } })
    ?.cloudflare?.env?.DB

  if (!db) {
    throw createError({ statusCode: 503, statusMessage: 'Database not available' })
  }

  // Fetch the record (need effect_id for redirect and unlocked_at for idempotency)
  const row = await db
    .prepare('SELECT effect_id, unlocked_at, visitor_count FROM share_records WHERE share_token = ?')
    .bind(token.trim())
    .first()

  if (!row) {
    // Invalid or expired token — redirect to effects gallery
    return sendRedirect(event, '/effects', 302)
  }

  const now = new Date().toISOString()

  // Atomic update: always increment visitor_count; only set unlocked_at once
  if (row.unlocked_at === null || row.unlocked_at === undefined) {
    // First real visit — unlock
    await db
      .prepare(`
        UPDATE share_records
        SET unlocked_at = ?, visitor_count = visitor_count + 1
        WHERE share_token = ?
      `)
      .bind(now, token.trim())
      .run()

    // Also increment share_unlock_count on the effect
    await db
      .prepare(`
        UPDATE html_effects
        SET share_unlock_count = share_unlock_count + 1, updated_at = ?
        WHERE id = ?
      `)
      .bind(now, row.effect_id)
      .run()
  } else {
    // Already unlocked — just count the additional visit
    await db
      .prepare('UPDATE share_records SET visitor_count = visitor_count + 1 WHERE share_token = ?')
      .bind(token.trim())
      .run()
  }

  // Redirect visitor to the effect detail page
  const effectId = String(row.effect_id)
  return sendRedirect(event, `/effects/${effectId}`, 302)
})

interface D1Database {
  prepare(query: string): D1PreparedStatement
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  run(): Promise<void>
  first(): Promise<Record<string, unknown> | null>
}