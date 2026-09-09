import { describe, expect, it } from 'vitest'
import '../divination/modules'
import { allModules } from '../divination/registry'
import { demoReadingFor } from './demo'

describe('本地结果预览', () => {
  it('五个门类都能在零网络下生成完整章节', () => {
    for (const mod of allModules()) {
      const text = demoReadingFor(mod.id, { warnings: [], digest: '本地测试盘' }, mod.sections)
      for (const section of mod.sections) expect(text).toContain(`## ${section}`)
      expect(text.length).toBeGreaterThan(200)
    }
  })
})
