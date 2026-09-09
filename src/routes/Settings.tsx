import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { InkReveal } from '../ui/InkReveal'
import { Rule } from '../ui/Rule'
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
  'w-full bg-transparent border-0 border-b border-[var(--line)] px-0 py-2 text-[15px] ' +
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
    <div className="flex-1 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-[30rem]">
        <InkReveal>
          <h1 className="glyph text-[24px] tracking-[0.35em] indent-[0.35em] text-center mb-3">
            设置
          </h1>
          <p className="text-center text-[13px] text-[var(--fg-faint)] leading-relaxed mb-12">
            这个站没有后端。密钥与偏好只写进这台机器的浏览器，
            <br />
            解读时直接从你的浏览器发往下面这个地址，中间没有别人。
          </p>
        </InkReveal>

        <InkReveal delay={0.15}>
          <div className="mb-4 text-[12px] tracking-[0.3em] text-[var(--fg-dim)]">模型来路</div>
          <div className="flex gap-px mb-9">
            {(Object.keys(DEFAULTS) as ProviderId[]).map((p) => (
              <button
                key={p}
                onClick={() => pickProvider(p)}
                className={`flex-1 py-2.5 text-[14px] tracking-[0.2em] transition-all duration-400 cursor-pointer ${
                  cred.provider === p
                    ? 'text-[var(--accent)] shadow-[inset_0_-1px_0_var(--accent)]'
                    : 'text-[var(--fg-faint)] shadow-[inset_0_-1px_0_var(--line)] hover:text-[var(--fg-dim)]'
                }`}
              >
                {DEFAULTS[p].label}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            <div>
              <div className="text-[12px] tracking-[0.3em] text-[var(--fg-dim)] mb-1.5">密钥</div>
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                className={field}
                placeholder={
                  cred.provider === 'anthropic' ? 'sk-ant-…' : '本机模型通常留空即可'
                }
                value={cred.apiKey}
                onChange={(e) => set('apiKey', e.target.value)}
              />
            </div>

            <div>
              <div className="text-[12px] tracking-[0.3em] text-[var(--fg-dim)] mb-1.5">
                端点地址
              </div>
              <input
                className={field}
                placeholder={d.baseUrl}
                value={cred.baseUrl}
                onChange={(e) => set('baseUrl', e.target.value)}
              />
              {cred.provider === 'openai' && (
                <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--fg-faint)]">
                  填任何讲 OpenAI 那套协议的地址：官方接口、中转网关，或本机模型。
                  <br />
                  本机 Ollama 要先放行跨域，否则浏览器发不出去：
                  <br />
                  <code className="text-[var(--fg-dim)]">OLLAMA_ORIGINS=* ollama serve</code>
                  <br />
                  <span className="opacity-75">
                    另：从公网上的页面连本机模型多半会被浏览器的本地网络策略拦下，
                    这条路请在自己机器上跑本项目时用。
                  </span>
                </p>
              )}
            </div>

            <div>
              <div className="text-[12px] tracking-[0.3em] text-[var(--fg-dim)] mb-1.5">模型</div>
              <input
                className={field}
                placeholder={d.model}
                value={cred.model}
                onChange={(e) => set('model', e.target.value)}
              />
            </div>
          </div>
        </InkReveal>

        <InkReveal delay={0.3}>
          <div className="mt-10 py-4 border-y border-[var(--line)]">
            <div className="text-[11px] tracking-[0.3em] text-[var(--fg-faint)] mb-1.5">
              密钥将发往
            </div>

            {check.ok ? (
              <>
                <div className="text-[15px] break-all">
                  <span className="text-[var(--fg-faint)]">{check.prefix}</span>
                  <span className="text-[var(--accent)]">{check.host}</span>
                  <span className="text-[var(--fg-faint)]">{check.suffix}</span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--fg-faint)] leading-relaxed">
                  这是全站唯一的出站地址。打开浏览器的网络面板可以核对：
                  整个流程里再没有第二个域名。
                </p>
              </>
            ) : (
              <>
                <div className="text-[15px] text-[var(--seal)]">{check.message}</div>
                {check.hint && (
                  <p className="mt-2 text-[12px] text-[var(--fg-faint)]">{check.hint}</p>
                )}
              </>
            )}
          </div>

          {needsConfirm && check.ok && (
            <label className="mt-6 flex items-start gap-3 cursor-pointer select-none">
              <span
                className={`w-3 h-3 mt-1.5 border shrink-0 transition-colors duration-300 ${
                  confirmed ? 'bg-[var(--seal)] border-[var(--seal)]' : 'border-[var(--seal)]'
                }`}
              />
              <input
                type="checkbox"
                className="sr-only"
                checked={confirmed}
                onChange={(e) => setConfirmedHost(e.target.checked ? check.host : null)}
              />
              <span className="text-[13px] leading-relaxed text-[var(--fg-dim)]">
                我知道密钥会交给{' '}
                <span className="text-[var(--accent)]">{check.host}</span>
                <span className="block text-[12px] text-[var(--fg-faint)]">
                  这不是模型厂商的官方地址。中转方能看到你的密钥和你问的每一句话，
                  确认你信得过它。
                </span>
              </span>
            </label>
          )}

          <label className="mt-8 flex items-start gap-3 cursor-pointer select-none">
            <span
              className={`w-3 h-3 mt-1.5 border shrink-0 transition-colors duration-300 ${
                prefs.remember ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--line)]'
              }`}
            />
            <input
              type="checkbox"
              className="sr-only"
              checked={prefs.remember}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, remember: e.target.checked }))
                setSaved(false)
              }}
            />
            <span className="text-[13px] leading-relaxed text-[var(--fg-dim)]">
              记住密钥
              <span className="block text-[12px] text-[var(--fg-faint)]">
                不勾就只存到这个标签页关掉为止。
              </span>
            </span>
          </label>

          <label className="mt-5 flex items-start gap-3 cursor-pointer select-none">
            <span
              className={`w-3 h-3 mt-1.5 border shrink-0 transition-colors duration-300 ${
                prefs.paper ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--line)]'
              }`}
            />
            <input
              type="checkbox"
              className="sr-only"
              checked={prefs.paper}
              onChange={(e) => {
                const p = { ...prefs, paper: e.target.checked }
                setPrefs(p)
                savePrefs(p)
              }}
            />
            <span className="text-[13px] leading-relaxed text-[var(--fg-dim)]">纸面模式</span>
          </label>

          <div className="mt-10">
            <Seal
              className="w-full"
              disabled={!canSave}
              onClick={() => {
                if (!check.ok) return
                saveCredentials({ ...cred, baseUrl: check.isDefault ? '' : check.url }, prefs.remember)
                savePrefs(prefs)
                setSaved(true)
              }}
            >
              {saved ? '已 记 下' : '记 下'}
            </Seal>
            {!canSave && (
              <p className="mt-3 text-[12px] text-[var(--fg-faint)] text-center">
                {check.ok ? '先确认上面那一条' : '端点地址还不能用'}
              </p>
            )}
          </div>
        </InkReveal>

        <InkReveal delay={0.45}>
          <Rule mark="焚" />
          <p className="text-[13px] leading-relaxed text-[var(--fg-faint)] mb-5">
            把这个站在本机留下的一切抹掉：密钥、偏好，一样不留。
            命盘和解读本就只在内存里，不必清。
          </p>
          {burning ? (
            <div className="flex gap-4">
              <Seal
                onClick={() => {
                  burnEverything()
                  location.href = '/'
                }}
              >
                确 认 焚 毁
              </Seal>
              <Seal variant="quiet" onClick={() => setBurning(false)}>
                算了
              </Seal>
            </div>
          ) : (
            <Seal variant="quiet" onClick={() => setBurning(true)}>
              焚 毁
            </Seal>
          )}

          <div className="mt-14 text-center">
            <Link
              to="/"
              className="text-[12px] tracking-[0.2em] text-[var(--fg-faint)] hover:text-[var(--fg-dim)] transition-colors duration-500"
            >
              返回
            </Link>
          </div>
        </InkReveal>
      </div>
    </div>
  )
}
