/**
 * server/api/_sitemap/compare-slugs.get.ts
 * 返回所有 /compare/[style1]-vs-[style2] 组合（热门前 N 种风格两两组合）
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface StyleEntry { slug: string; [key: string]: unknown }

export default defineEventHandler(async () => {
  try {
    const styles: StyleEntry[] = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/data/styles.json'), 'utf-8'),
    )

    const slugs: string[] = []
    // 限制为前 20 种热门风格，避免组合爆炸（20×19/2 = 190 条）
    const topStyles = styles.slice(0, 20)
    for (let i = 0; i < topStyles.length; i++) {
      for (let j = i + 1; j < topStyles.length; j++) {
        slugs.push(`${topStyles[i].slug}-vs-${topStyles[j].slug}`)
      }
    }
    return slugs
  } catch {
    return []
  }
})
