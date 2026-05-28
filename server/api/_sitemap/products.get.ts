/**
 * server/api/_sitemap/products.get.ts
 * 返回所有产品类型 slug 列表，供 sitemap 生成 /products/[product] 路由
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineEventHandler(async () => {
  try {
    const products = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/data/products.json'), 'utf-8'),
    )
    return products.map((p: { slug: string }) => p.slug)
  } catch {
    return []
  }
})
