// server/api/share/verify/[token].get.ts
// Returns whether a share token has been unlocked (someone visited the share link).
// GET /api/share/verify/:token
// Response: { unlocked: boolean }

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

  const row = await db
    .prepare('SELECT unlocked_at FROM share_records WHERE share_token = ?')
    .bind(token.trim())
    .first()

  if (!row) {
    // Token doesn't exist — treat as not unlocked (don't leak info)
    return { unlocked: false }
  }

  return { unlocked: row.unlocked_at !== null && row.unlocked_at !== undefined }
})

interface D1Database {
  prepare(query: string): D1PreparedStatement
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first(): Promise<Record<string, unknown> | null>
}