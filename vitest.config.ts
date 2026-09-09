import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Luopan.test.tsx 从首版起就没被匹配到，静静躺了一路。
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
