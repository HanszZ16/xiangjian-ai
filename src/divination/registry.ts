import type { DivinationModule } from './types'

/** 新增门类只需在这里挂上，首页与路由自动生成。 */
const modules: DivinationModule[] = []

export function register(m: DivinationModule) {
  modules.push(m)
  return m
}

export function allModules(): readonly DivinationModule[] {
  return modules
}

export function findModule(id: string | undefined): DivinationModule | undefined {
  return modules.find((m) => m.id === id)
}
