# 象见

观象见微。一个不留痕迹的 AI 术数站：**排盘在本地算，解读交给你自己的模型。**

目前有五门：八字命理、紫微斗数、姻缘合参、阳宅八宅、塔罗牌。

---

## 三条设计原则

**一、数据不落盘。** 没有后端、没有数据库、没有埋点、没有第三方脚本或字体。
生日、出生地、你问的话，全部在浏览器里排成盘；只有开始解读的那一刻，盘面与问题
才会发往**你自己配置的模型端点**——设置页上写着它的地址，打开网络面板就能核对，
整个流程里没有第二个域名。命盘与解读只活在内存里，刷新即散。设置页底部有「焚毁」。

**二、不让模型排盘。** 干支、节气交界、起运岁数、真太阳时都是历法计算，
差一个字整盘就换了。排盘一律由本地代码算（`tyme4ts` / `iztro`），模型只拿到
已经排好的结构化命盘去解释。排盘引擎有单元测试，其中的黄金用例取自另一个
独立实现，两边算出来一样才作数。

**三、用户不写提示词。** 只填算命需要的那几项。角色、方法论、护栏、
古籍参考资料都在代码里，用户看不见也不用管。

---

## 跑起来

```bash
npm install
npm run dev        # http://localhost:5173
```

首次进入先去「设置」填一个模型端点，二选一：

- **Anthropic** —— 填 `sk-ant-…`，浏览器用官方 SDK 直连 `api.anthropic.com`，
  模型默认 `claude-opus-5`，带流式与 adaptive thinking（思考流直接喂给「先生沉思」）。
- **OpenAI 兼容接口** —— 填任何讲 `/chat/completions` 那套的地址，
  包括本机的 Ollama、LM Studio 与各类中转网关。

> 本机 Ollama 要先放行跨域，否则浏览器发不出去：`OLLAMA_ORIGINS=* ollama serve`

其他命令：

```bash
npm test           # 排盘引擎与提示装配的单测
npm run build      # 静态产物，丢哪儿都能托管
npm run build:cities   # 重新生成城市经纬度表（需要联网，平时不用跑）
```

开发服务器下，每个起盘表单还会显示「本地预览结果 · 不请求模型」。它使用真实的本地排盘
和内置示例解读来检查完整结果页，不读取密钥，也不会发出模型请求；生产构建自动隐藏。

---

## 目录

```
src/
├── divination/         ★ 术数模块插槽
│   ├── types.ts        DivinationModule（元信息，首屏就要）
│   │                   ModuleImpl（排盘与画盘，按需加载）
│   ├── registry.ts
│   ├── modules.ts      装配点：import 一下就挂上了
│   └── bazi|ziwei|yinyuan|fengshui|tarot/
│         module.ts     元信息 + 声明式表单 + load()
│         impl.ts       角色提示 + compute + ChartView
│         compute.ts    纯函数、确定性、零网络
│         ChartView.tsx 命盘可视化
├── llm/                ★ 全站唯一的出站口
│   ├── index.ts        providerFor()，两个实现都按需加载
│   ├── anthropic.ts · openaiCompatible.ts
│   └── credentials.ts  本地存储 + 一键焚毁
├── prompt/             共用护栏 + 提示装配
├── knowledge/          古籍与术语参考（见 CREDITS.md）
├── lib/solarTime.ts    真太阳时换算
├── data/cities.json    出生地经纬度与时区
├── reading/            流式解读、切章、印证条目
├── ui/                 Luopan（罗盘）· Seal · InkReveal · Field
└── routes/             Home · Cast · Reading · Settings · About
```

### 加一门新术数

写一个目录，实现 `DivinationModule` 与 `ModuleImpl`，在 `modules.ts` 里 import 一行。
首页、表单、路由、流式解读、导出全都自动接上，不必改 UI 代码。
六爻、奇门等门类也可以照这个形状加。

---

## 两处值得一提的实现

**真太阳时。** 命理取时柱看的是太阳真正的位置，不是钟表读数。
换算式子写成 `真太阳时 = UTC + 经度/15 小时 + 均时差`，这样经度差与夏令时
都已含在 UTC 里，不必分开处理。时区偏移直接问浏览器的 `Intl`——
它带着完整的历史时区库，中国 1986–1991 那几年的夏令时不必自己维护
（1990 年 5 月出生的人，钟表上的午时其实已经是巳时了）。

**印证。** 解读末尾会挑三到五个过去的年份，各推一件当时应有之事。
前端把它们渲染成可点「准 / 不准 / 记不清」的条目；点完发回给先生，
他据此重新掂量格局与用神，改写受影响的几节。这是这个站唯一诚实的自我检验方式，
也让交互落在用户真会做的动作上，而不是让他写提示词。

---

## 部署

`npm run build` 会生成纯静态的 `dist/`，可部署到任意支持 SPA 路由回退的静态托管服务。
生产域名、主机地址、SSH 别名、Web 根目录和证书配置属于运营环境信息，不放在本仓库中。

要点：

- **单独的子域名，不要挂在已有站点的路径下。** localStorage 按 origin 隔离而不是按路径，
  同域名下别的应用（以及它任何一处 XSS）能直接读到这里存的 API 密钥。
- 强制 HTTPS + HSTS。页面走明文的话，中间人改掉 JS 就等于接管了一切。
- 配置 SPA 路由回退，使 `/cast/*` 等地址返回 `index.html`。
- 为静态资源设置长期缓存，但 `index.html` 不应长期缓存。
- 配置 CSP、HSTS、`nosniff` 与严格的 Referrer Policy。

## 安全

密钥就放在浏览器存储里，同源的任何一段 JS 都读得到。所以这个项目对自己有几条硬约束，
写成了测试由 `npm test` 守着（见 `src/security.test.ts`），改坏了会红：

- 源码里不得出现 `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `document.write` 之类，
  模型输出只走 React 文本节点渲染
- `index.html` 不得引用任何站外资源（没有第三方脚本，没有网络字体）
- 源码里不得出现 `console.*`，免得密钥或生辰进日志
- 发起网络请求的代码只能待在 `src/llm/` 里
- 任何数据都不得进 URL
- 运行时依赖必须在白名单内——**加依赖要改测试，这个门槛是故意设的**

最后一条尤其针对 markdown 渲染库：多数默认允许 raw HTML，一引进来上面几条就全废了。
现在的 `src/reading/Prose.tsx` 够用。

**已知的取舍：**

- CSP 的 `connect-src` 是宽松的 `https:`，因为要允许用户填自己的中转地址。
  代价是万一出了 XSS，它拦不住密钥被发去任意 https 主机。
  改成固定供应商列表后可以收紧。
- 密钥默认存 `localStorage`（长期留存）。改 `DEFAULT_PREFS.remember` 为 `false`
  即可默认改成会话级。
- 纯前端架构里，**运营者始终有能力改页面的 JS**，从而拿到访客的密钥。
  技术上无解，只能靠开源 + 明说。About 页对访客坦白了这一点。

---

## 授权与出处

知识库来自几个把传统术数整理成结构化参考的开源项目，逐一列在
[`src/knowledge/CREDITS.md`](src/knowledge/CREDITS.md)，含各自的授权与本项目的取用范围。
历法计算用 [tyme4ts](https://github.com/6tail/tyme4ts)，紫微排盘用
[iztro](https://github.com/SylarLong/iztro)，城市经纬度来自
[GeoNames](https://www.geonames.org/)（CC BY 4.0）。

命理分析仅供参考。不要拿它替代医生、律师，或你自己的判断。
