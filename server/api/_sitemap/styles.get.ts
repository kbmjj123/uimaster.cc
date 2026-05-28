/**
 * server/api/_sitemap/styles.get.ts
 * 返回所有风格 slug 列表，供 sitemap 生成 /styles/[style] 路由
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  try {
    const styles = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/data/styles.json'), 'utf-8'),
    )
    return styles.map((s: { slug: string }) => s.slug)
  } catch {
    return []
  }
})
