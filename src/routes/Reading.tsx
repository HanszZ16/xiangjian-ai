import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { findModule } from '../divination/registry'
import type { ChartBase, ModuleImpl } from '../divination/types'
import { useReading } from '../reading/useReading'
import { extractProofs, splitSections } from '../reading/parse'
import { Prose } from '../reading/Prose'
import { Luopan } from '../ui/Luopan'
import { InkReveal } from '../ui/InkReveal'
import { Rule } from '../ui/Rule'
import { Seal } from '../ui/Seal'
import { downloadMarkdown, downloadPng } from '../lib/export'
import { demoReadingFor } from '../reading/demo'

type Handed = { moduleId: string; chart: ChartBase; question: string; localPreview?: boolean }

type Verdict = '准' | '不准' | '记不清'

export function Reading() {
  const nav = useNavigate()
  const handed = useLocation().state as Handed | null
  const mod = findModule(handed?.moduleId)
  const [impl, setImpl] = useState<ModuleImpl | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!handed || !mod) {
      nav('/', { replace: true })
      return
    }
    let live = true
    mod.load().then(
      (m) => live && setImpl(m as ModuleImpl),
      // 动态 import 是会失败的——网络抖动，或者站点刚发过新版本、
      // 而这个页面手里还攥着上一版已被删掉的 chunk 名。
      // 没有这个分支，人就对着一个转圈的盘无限等下去。
      () => live && setLoadFailed(true),
    )
    return () => {
      live = false
    }
  }, [handed, mod, nav])

  if (!handed || !mod) return null

  if (loadFailed) {
    return (
      <div className="flex-1 grid place-items-center px-6">
        <div className="text-center max-w-[22rem]">
          <p className="text-[15px] text-[var(--seal)]">这一门的排盘程序没能载入。</p>
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--fg-faint)]">
            多半是站点刚更新过，你手里这一页还是旧的。刷新一下就好。
          </p>
          <div className="mt-8">
            <Seal onClick={() => location.reload()}>刷 新</Seal>
          </div>
        </div>
      </div>
    )
  }

  // 实作是从 Cast 页过来的，那时已经加载过，浏览器有缓存，这一步几乎不耗时
  if (!impl) {
    return (
      <div className="flex-1 grid place-items-center">
        <Luopan size={200} spinning />
      </div>
    )
  }
  return (
    <Sheet
      mod={mod}
      impl={impl}
      chart={handed.chart}
      question={handed.question}
      localPreview={Boolean(handed.localPreview)}
    />
  )
}

function Sheet({
  mod,
  impl,
  chart,
  question,
  localPreview,
}: {
  mod: NonNullable<ReturnType<typeof findModule>>
  impl: ModuleImpl
  chart: ChartBase
  question: string
  localPreview: boolean
}) {
  const previewText = useMemo(
    () => localPreview ? demoReadingFor(mod.id, chart, mod.sections) : '',
    [localPreview, mod.id, mod.sections, chart],
  )
  const { state, open, follow, stop } = useReading(mod, impl, chart, previewText)
  const started = useRef(false)
  const paper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (localPreview) return
    void open(question)
  }, [open, question, localPreview])

  const sections = useMemo(
    () => splitSections(state.text, mod.sections),
    [state.text, mod.sections],
  )
  const proofs = useMemo(() => extractProofs(state.text), [state.text])

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [ask, setAsk] = useState('')

  // 等待期间的秒数。模型可能思考很久才吐出第一个字，没有这个读数，
  // 界面上就只有一个转着的盘，分不清是在想还是已经挂了。
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (state.phase !== 'thinking') return
    setElapsed(0)
    const t = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [state.phase])

  const busy = state.phase === 'thinking' || state.phase === 'writing'
  const ChartView = impl.ChartView

  const sendVerdicts = () => {
    const lines = proofs
      .filter((p) => verdicts[p.raw])
      .map((p) => `- ${p.year}年「${p.claim}」→ ${verdicts[p.raw]}`)
    if (!lines.length) return
    void follow(
      [
        '我核对了印证那几条：',
        ...lines,
        '',
        '请据此重新掂量格局与用神的取法：对上的说明哪一路取法站得住，对不上的说明哪里判偏了。',
        '然后把受影响的几节改写一遍，不必从头再来。',
      ].join('\n'),
    )
    setVerdicts({})
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 pb-16">
      {/* ── 排盘中：盘在转 ── */}
      <AnimatePresence>
        {state.phase === 'thinking' && (
          <motion.div
            // safe center + 可滚。窗口一矮，普通的 justify-center 会把盘以外的
            // 东西挤出视口两端，而 fixed 又不能滚——文字和「收手」就都够不着了。
            // 盘也跟着视口高度缩，短窗口下不至于把下面的内容顶掉。
            className="fixed inset-0 z-30 flex flex-col items-center [justify-content:safe_center]
                       gap-y-8 overflow-y-auto px-6 py-10 bg-[var(--bg)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.4 } }}
          >
            <Luopan
              size={340}
              spinning
              className="shrink-0 w-[min(340px,72vw,38vh)] h-[min(340px,72vw,38vh)]"
            />
            <p className="text-[13px] tracking-[0.4em] indent-[0.4em] text-[var(--fg-faint)]">
              先生正在看盘
            </p>

            {/* 思考久了盘只是在转，看着像卡死。报一下等了多久，好歹是个活的信号。 */}
            {elapsed >= 5 && (
              <p className="-mt-4 text-[12px] tabular-nums text-[var(--fg-faint)] opacity-60">
                已候 {elapsed} 秒
                {elapsed >= 90 && ' · 思虑得久，也可以收手把问题问得具体些'}
              </p>
            )}

            {state.thinking && (
              <p className="max-w-[24rem] text-center text-[12px] leading-relaxed text-[var(--fg-faint)] opacity-45 line-clamp-3">
                {state.thinking.slice(-140)}
              </p>
            )}

            <button
              onClick={stop}
              className="text-[12px] tracking-[0.25em] text-[var(--fg-faint)] hover:text-[var(--fg-dim)] transition-colors duration-500 cursor-pointer"
            >
              收 手
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={paper} className="reading-sheet w-full max-w-[64rem] px-4 py-7 sm:px-8 sm:py-10">
        {/* ── 命盘 ── */}
        <InkReveal>
          <div className="text-center mb-8">
            <div className="mb-2 text-[11px] tracking-[0.3em] text-[var(--accent)]">
              {mod.category ?? '观象'} · {localPreview ? '本地预览' : '已成盘'}
            </div>
            <h1 className="glyph text-[24px] sm:text-[28px] tracking-[0.3em] indent-[0.3em] text-[var(--fg)]">
              {mod.name}
            </h1>
          </div>
          <div className="chart-surface p-4 sm:p-7">
            <ChartView chart={chart} />
          </div>
        </InkReveal>

        <Rule mark="解" />

        {localPreview && (
          <div className="mx-auto mb-5 max-w-[58rem] border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] px-4 py-3 text-center text-[12px] leading-relaxed text-[var(--fg-faint)]">
            本地预览模式 · 命盘为真实计算，解读为界面示例，全程不读取密钥、不请求模型。
          </div>
        )}

        <div className="mx-auto max-w-[46rem]">

        {/* ── 解读 ── */}
        {state.error && (
          <div className="py-8 text-center">
            <p className="text-[15px] text-[var(--seal)]">{state.error.message}</p>
            {state.error.hint && (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--fg-faint)]">
                {state.error.hint}
              </p>
            )}
            <div className="mt-8 flex gap-4 justify-center">
              <Seal variant="quiet" onClick={() => void open(question)}>
                再 试
              </Seal>
              <Link to="/settings">
                <Seal variant="quiet">去设置</Seal>
              </Link>
            </div>
          </div>
        )}

        {sections.map((s, i) => (
          <section
            key={`${s.title}-${i}`}
            className="reading-section mb-4 px-5 py-6 sm:px-7 sm:py-7"
          >
            {s.title && (
              <div className="mb-5 flex items-center gap-3">
                <span className="text-[10px] tabular-nums text-[var(--fg-faint)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="glyph text-[16px] tracking-[0.28em] text-[var(--accent)]">
                  {s.title}
                </h2>
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>
            )}
            <Prose text={s.body} />

            {/* 印证一节改成可点的条目 */}
            {s.title === '印证' && proofs.length > 0 && (
              <div className="mt-6 space-y-px">
                {proofs.map((p) => (
                  <div
                    key={p.raw}
                    className="py-3.5 border-t border-[var(--line)] last:border-b flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-[13px] text-[var(--fg-faint)] tabular-nums mr-3">
                        {p.year}
                        {p.age && `　${p.age}`}
                      </span>
                      <span className="text-[15px] text-[var(--fg-dim)]">{p.claim}</span>
                    </div>
                    <div className="flex gap-px shrink-0">
                      {(['准', '不准', '记不清'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setVerdicts((s2) => ({
                              ...s2,
                              [p.raw]: s2[p.raw] === v ? undefined! : v,
                            }))
                          }
                          className={`px-3 py-1 text-[12px] transition-all duration-300 cursor-pointer ${
                            verdicts[p.raw] === v
                              ? 'text-[var(--seal)] shadow-[inset_0_0_0_1px_var(--seal)]'
                              : 'text-[var(--fg-faint)] shadow-[inset_0_0_0_1px_var(--line)] hover:text-[var(--fg-dim)]'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(verdicts).length > 0 && !busy && (
                  <div className="pt-6">
                    <Seal onClick={sendVerdicts}>据 此 重 校</Seal>
                  </div>
                )}
              </div>
            )}
          </section>
        ))}

        {state.phase === 'writing' && (
          <span className="inline-block w-2 h-4 bg-[var(--accent)] opacity-60 animate-pulse align-middle" />
        )}

        {/* ── 追问与留存 ── */}
        {state.phase === 'done' && (
          <InkReveal>
            <Rule mark="问" />
            {!localPreview && <div className="flex items-end gap-4">
              <textarea
                rows={1}
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && ask.trim()) {
                    e.preventDefault()
                    void follow(ask.trim())
                    setAsk('')
                  }
                }}
                placeholder="还想问什么，接着说"
                className="flex-1 bg-transparent border-0 border-b border-[var(--line)] py-2 text-[15px]
                           text-[var(--fg)] outline-none resize-none focus:border-[var(--accent)]
                           transition-colors duration-300 placeholder:text-[var(--fg-faint)]"
              />
              <Seal
                variant="quiet"
                disabled={!ask.trim()}
                onClick={() => {
                  void follow(ask.trim())
                  setAsk('')
                }}
              >
                问
              </Seal>
            </div>}

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {localPreview && (
                <Link to={`/cast/${mod.id}`}>
                  <Seal variant="quiet">返回调整</Seal>
                </Link>
              )}
              <Seal variant="quiet" onClick={() => downloadMarkdown(mod.name, chart, state.text)}>
                存为文稿
              </Seal>
              <Seal variant="quiet" onClick={() => void downloadPng(paper.current, mod.name)}>
                存为图卷
              </Seal>
              <Link to="/">
                <Seal variant="quiet">另起一盘</Seal>
              </Link>
            </div>
            <p className="mt-8 text-center text-[12px] text-[var(--fg-faint)] leading-relaxed">
              这一页只活在此刻的浏览器里。刷新或关掉，它就散了。
            </p>
          </InkReveal>
        )}
        </div>
      </div>
    </div>
  )
}
