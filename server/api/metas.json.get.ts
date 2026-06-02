import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { DemoMeta } from '~/types/design-system'

export default defineEventHandler(async () => {
  try {
    const metaDir = resolve(process.cwd(), 'public/meta')
    const files = readdirSync(metaDir).filter(f => f.endsWith('.json'))

    const metas: DemoMeta[] = files.map(f => {
      const content = readFileSync(resolve(metaDir, f), 'utf-8')
      return JSON.parse(content)
    })

    return metas
  } catch {
    return []
  }
})
