/**
 * server/api/_sitemap/effect-scenes.get.ts
 * 从 D1 查询所有 effects 的 scene 去重列表
 */

export default defineEventHandler(async (event) => {
  try {
    const db = event.context.cloudflare?.env?.DB
    if (!db) return []
    const result = await db
      .prepare('SELECT DISTINCT scene FROM html_effects WHERE scene IS NOT NULL ORDER BY scene')
      .all()
    return result.results.map((r: { scene: string }) => r.scene).filter(Boolean)
  } catch {
    return []
  }
})
