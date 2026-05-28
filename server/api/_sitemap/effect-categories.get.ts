/**
 * server/api/_sitemap/effect-categories.get.ts
 * 从 D1 查询所有 effects 的 category 去重列表
 */

export default defineEventHandler(async (event) => {
  try {
    const db = event.context.cloudflare?.env?.DB
    if (!db) return []
    const result = await db
      .prepare('SELECT DISTINCT category FROM html_effects WHERE category IS NOT NULL ORDER BY category')
      .all()
    return result.results.map((r: { category: string }) => r.category).filter(Boolean)
  } catch {
    return []
  }
})
