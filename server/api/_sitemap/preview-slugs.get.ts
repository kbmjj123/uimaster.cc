/**
 * server/api/_sitemap/preview-slugs.get.ts
 *
 * 内部接口：返回所有 /preview/[slug] 路由列表
 * 供 nuxt.config.ts sitemap.urls() 调用。
 *
 * 数据来源：public/data/styles.json + public/data/products.json
 * slug 格式：[style-slug]-[product-slug]
 *
 * 注意：此接口只在构建/sitemap 生成时调用，不对外暴露业务数据。
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface StyleEntry {
  slug: string
  name: string
  [key: string]: unknown
}

interface ProductEntry {
  slug: string
  name: string
  [key: string]: unknown
}

export default defineEventHandler(async () => {
  try {
    const publicDir = resolve(process.cwd(), 'public/data')

    const styles: StyleEntry[] = JSON.parse(
      readFileSync(resolve(publicDir, 'styles.json'), 'utf-8'),
    )
    const products: ProductEntry[] = JSON.parse(
      readFileSync(resolve(publicDir, 'products.json'), 'utf-8'),
    )

    const slugs: string[] = []
    for (const style of styles) {
      for (const product of products) {
        slugs.push(`${style.slug}-${product.slug}`)
      }
    }

    return slugs
  } catch {
    // 数据文件不存在时返回空数组，不阻塞构建
    return []
  }
})
