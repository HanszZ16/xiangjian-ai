import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { InkReveal } from '../ui/InkReveal'
import { Seal } from '../ui/Seal'
import { checkEndpoint } from '../llm/endpoint'
import {
  DEFAULTS,
  burnEverything,
  loadCredentials,
  loadPrefs,
  saveCredentials,
  savePrefs,
  type Credentials,
  type ProviderId,
} from '../llm'

const field =
  'w-full bg-transparent border-0 border-b border-[var(--line)] px-0 py-3 text-[16px] ' +
  'text-[var(--fg)] outline-none focus:border-[var(--accent)] transition-colors duration-300 ' +
  'placeholder:text-[var(--fg-faint)]'

export function Settings() {
  const [cred, setCred] = useState<Credentials>(
    () => loadCredentials() ?? { provider: 'anthropic', apiKey: '', baseUrl: '', model: '' },
  )
  const [prefs, setPrefs] = useState(loadPrefs)
  const [saved, setSaved] = useState(false)
  const [burning, setBurning] = useState(false)
  /** 已经确认过的出站主机名。地址一改，这个就对不上了，要重新确认 */
  const [confirmedHost, setConfirmedHost] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.mode = prefs.paper ? 'paper' : 'ink'
  }, [prefs.paper])

  const d = DEFAULTS[cred.provider]
  const check = checkEndpoint(cred.baseUrl, cred.provider)

  // 默认地址和本机地址不必确认；填了别家（比如中转）就要用户亲口认一次
  const needsConfirm = check.ok && !check.isDefault && !check.isLocal
  const confirmed = !needsConfirm || confirmedHost === check.host
  const canSave = check.ok && confirmed

  const set = <K extends keyof Credentials>(k: K, v: Credentials[K]) => {
    setCred((c) => ({ ...c, [k]: v }))
    setSaved(false)
  }

  const pickProvider = (p: ProviderId) => {
    setCred((c) => ({ ...c, provider: p, baseUrl: '', model: '' }))
    setSaved(false)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-5 sm:px-8 py-10 sm:py-14">
      <div className="w-full max-w-[46rem]">
        <InkReveal>
          <header className="mb-9 sm:mb-12">
            <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--accent)]">象见 · 设定</p>
            <h1 className="glyph text-[32px] sm:text-[36px] tracking-[0.24em]">设置</h1>
            <p className="mt-4 max-w-[34rem] text-[14px] leading-[1.9] text-[var(--fg-dim)]">
              接通模型，余事自定。密钥与偏好只留在这个浏览器里，
              解读时由浏览器直接发往你设定的地址。
            </p>
          </header>
        </InkReveal>

        <InkReveal delay={0.12}>
          <form
            className="form-surface px-5 py-7 sm:px-9 sm:py-9"
            onSubmit={(event) => {
              event.preventDefault()
              if (!canSave || !check.ok) return
              saveCredentials({ ...cred, baseUrl: check.isDefault ? '' : check.url }, prefs.remember)
              savePrefs(prefs)
              setSaved(true)
            }}
          >
            <section aria-labelledby="endpoint-heading">
              <div className="mb-7 flex items-baseline gap-3">
                <span aria-hidden="true" className="text-[11px] text-[var(--accent)]">壹</span>
                <h2 id="endpoint-heading" className="text-[16px] tracking-[0.18em]">模型来路</h2>
              </div>

              <fieldset className="mb-8">
                <legend className="mb-3 text-[12px] tracking-[0.18em] text-[var(--fg-dim)]">
                  接口类型
                </legend>
                <div className="grid grid-cols-2 border border-[var(--line)]">
                  {(Object.keys(DEFAULTS) as ProviderId[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={cred.provider === p}
                      onClick={() => pickProvider(p)}
                      className={`min-h-12 px-2 py-3 text-[13px] sm:text-[14px] transition-colors duration-300 cursor-pointer ${
                        cred.provider === p
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[inset_0_-1px_0_var(--accent)]'
                          : 'text-[var(--fg-dim)] hover:bg-[var(--accent)]/5 hover:text-[var(--fg)]'
                      }`}
                    >
                      {DEFAULTS[p].label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-7">
                <div>
                  <label htmlFor="model-api-key" className="block text-[12px] tracking-[0.18em] text-[var(--fg-dim)]">
                    密钥
                  </label>
                  <input
                    id="model-api-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    className={field}
                    placeholder={cred.provider === 'anthropic' ? 'sk-ant-…' : '本机模型通常留空即可'}
                    value={cred.apiKey}
                    onChange={(e) => set('apiKey', e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="model-endpoint" className="block text-[12px] tracking-[0.18em] text-[var(--fg-dim)]">
                    端点地址
                  </label>
                  <input
                    id="model-endpoint"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="endpoint-destination"
                    aria-invalid={!check.ok}
                    className={field}
                    placeholder={d.baseUrl}
                    value={cred.baseUrl}
                    onChange={(e) => set('baseUrl', e.target.value)}
                  />
                  {cred.provider === 'openai' && (
                    <div className="mt-3 text-[12px] leading-[1.9] text-[var(--fg-faint)]">
                      <p>支持 OpenAI 协议：官方接口、中转网关，或本机模型。</p>
                      <details className="mt-2">
                        <summary className="w-fit cursor-pointer text-[var(--fg-dim)] hover:text-[var(--accent)]">
                          本机 Ollama 连接说明
                        </summary>
                        <div className="mt-3 space-y-2 border-l border-[var(--line)] pl-4">
                          <p>本机 Ollama 要先放行跨域，否则浏览器发不出去：</p>
                          <code className="block break-all text-[var(--fg-dim)]">OLLAMA_ORIGINS=* ollama serve</code>
                          <p>
                            从公网上的页面连本机模型多半会被浏览器的本地网络策略拦下，
                            这条路请在自己机器上跑本项目时用。
                          </p>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="model-name" className="block text-[12px] tracking-[0.18em] text-[var(--fg-dim)]">
                    模型名称
                  </label>
                  <input
                    id="model-name"
                    autoComplete="off"
                    spellCheck={false}
                    className={field}
                    placeholder={d.model}
                    value={cred.model}
                    onChange={(e) => set('model', e.target.value)}
                  />
                </div>
              </div>

              <div id="endpoint-destination" className="mt-8 border-l-2 border-[var(--accent)]/50 pl-4 sm:pl-5" aria-live="polite">
                <div className="mb-2 text-[11px] tracking-[0.18em] text-[var(--fg-dim)]">
                  密钥与解读请求将发往
                </div>
                {check.ok ? (
                  <>
                    <div className="break-all text-[14px] sm:text-[15px]">
                      <span className="text-[var(--fg-dim)]">{check.prefix}</span>
                      <span className="text-[var(--accent)]">{check.host}</span>
                      <span className="text-[var(--fg-dim)]">{check.suffix}</span>
                    </div>
                    <p className="mt-2 text-[12px] leading-[1.9] text-[var(--fg-faint)]">
                      本站没有后端。这是全站唯一的出站地址，可在浏览器网络面板核对；
                      解读流程中没有第二个域名。
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-[14px] text-[var(--seal)]">{check.message}</div>
                    {check.hint && <p className="mt-2 text-[12px] text-[var(--fg-faint)]">{check.hint}</p>}
                  </>
                )}
              </div>

              {needsConfirm && check.ok && (
                <label className="mt-6 flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--seal)] cursor-pointer"
                    checked={confirmed}
                    onChange={(e) => setConfirmedHost(e.target.checked ? check.host : null)}
                  />
                  <span className="text-[13px] leading-[1.9] text-[var(--fg-dim)]">
                    我知道密钥会交给 <span className="break-all text-[var(--accent)]">{check.host}</span>
                    <span className="mt-1 block text-[12px] text-[var(--fg-faint)]">
                      这不是模型厂商的官方地址。中转方能看到你的密钥和你问的每一句话，
                      确认你信得过它。
                    </span>
                  </span>
                </label>
              )}
            </section>

            <section aria-labelledby="preferences-heading" className="mt-9 border-t border-[var(--line)] pt-7">
              <div className="mb-6 flex items-baseline gap-3">
                <span aria-hidden="true" className="text-[11px] text-[var(--accent)]">贰</span>
                <h2 id="preferences-heading" className="text-[16px] tracking-[0.18em]">使用偏好</h2>
              </div>
              <div className="space-y-5">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--accent)] cursor-pointer"
                    checked={prefs.remember}
                    onChange={(e) => {
                      setPrefs((p) => ({ ...p, remember: e.target.checked }))
                      setSaved(false)
                    }}
                  />
                  <span className="text-[14px] leading-[1.9] text-[var(--fg-dim)]">
                    记住密钥
                    <span className="mt-0.5 block text-[12px] text-[var(--fg-faint)]">
                      保存在这个浏览器里；不勾选则关掉标签页即忘。
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--accent)] cursor-pointer"
                    checked={prefs.paper}
                    onChange={(e) => {
                      const p = { ...prefs, paper: e.target.checked }
                      setPrefs(p)
                      savePrefs(p)
                    }}
                  />
                  <span className="text-[14px] leading-[1.9] text-[var(--fg-dim)]">
                    纸面模式
                    <span className="mt-0.5 block text-[12px] text-[var(--fg-faint)]">换作宣纸底色，即时生效。</span>
                  </span>
                </label>
              </div>
            </section>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Seal type="submit" className="w-full sm:w-auto sm:min-w-40" disabled={!canSave}>
                {saved ? '已 记 下' : '记 下'}
              </Seal>
              <p role="status" className="text-[12px] leading-relaxed text-[var(--fg-faint)]">
                {!canSave ? (check.ok ? '请先确认密钥将交给的地址。' : '端点地址还不能用。') : saved ? '设置已保存在这个浏览器里。' : '保存后，下一次解读将使用此配置。'}
              </p>
            </div>

            <section aria-labelledby="burn-heading" className="mt-9 border-t border-[var(--line)] pt-7">
              <div className="mb-4 flex items-baseline gap-3">
                <span aria-hidden="true" className="text-[11px] text-[var(--accent)]">叁</span>
                <h2 id="burn-heading" className="text-[16px] tracking-[0.18em]">焚毁留痕</h2>
              </div>
              <p className="mb-5 text-[12px] leading-[1.9] text-[var(--fg-faint)]">
                抹掉本站在本机留下的密钥与偏好，一样不留。
                命盘和解读本就只在内存里，不必清。
              </p>
              {burning ? (
                <div className="flex flex-wrap gap-3">
                  <Seal
                    type="button"
                    onClick={() => {
                      burnEverything()
                      location.href = '/'
                    }}
                  >
                    确 认 焚 毁
                  </Seal>
                  <Seal type="button" variant="quiet" onClick={() => setBurning(false)}>算了</Seal>
                </div>
              ) : (
                <Seal type="button" variant="quiet" onClick={() => setBurning(true)}>焚 毁</Seal>
              )}
            </section>
          </form>
        </InkReveal>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex py-2 text-[12px] tracking-[0.18em] text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors duration-300"
          >
            ← 返回门类
          </Link>
        </div>
      </div>
    </div>
  )
}
