import { Link } from 'react-router'

/** 开源地址。仓库建好后填这里，About 页上那句「你可以自己核对」才立得住。 */
const REPO: string = ''
import { InkReveal } from '../ui/InkReveal'
import { Rule } from '../ui/Rule'

function Code({ children }: { children: React.ReactNode }) {
  return <code className="text-[13px] text-[var(--fg)] mx-0.5">{children}</code>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-[2.1] text-[15px] text-[var(--fg-dim)] indent-8">{children}</p>
}

function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="glyph text-[15px] tracking-[0.35em] indent-[0.35em] text-[var(--accent)] mt-11 mb-5">
      {children}
    </h2>
  )
}

export function About() {
  return (
    <div className="flex-1 flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-[34rem]">
        <InkReveal>
          <h1 className="glyph text-[24px] tracking-[0.35em] indent-[0.35em] text-center mb-10">
            关于
          </h1>

          <P>
            象见不是一个替你决定什么的地方。它做两件事：把你出生那一刻的天地格局按历法
            如实排出来，再请一位读过书的先生就着这张盘说说话。前一件是算术，后一件是解释。
          </P>

          <H>数据去哪儿了</H>
          <P>
            哪儿也没去。这个站没有后端、没有数据库、没有埋点，也没有引任何第三方脚本或字体。
            生日、出生地、你问的话，全部在你自己的浏览器里排成盘；只有在开始解读的那一刻，
            盘面和问题才会随请求发往<b className="font-normal text-[var(--fg)]">你自己配置的那个模型端点</b>
            ——设置页上写着它的地址，打开浏览器的网络面板就能核对，整个流程里没有第二个域名。
          </P>
          <P>
            密钥存在浏览器的本地存储里（也可以选择关掉标签页就忘），命盘与解读只活在内存中，
            刷新即散。设置页底部有一个「焚毁」，一按就把本站在这台机器上留下的一切抹掉。
          </P>

          <H>运营者能看到什么</H>
          <P>
            <b className="font-normal text-[var(--fg)]">能看到的</b>：你打开过这个页面。
            也就是服务器访问日志里的一行——IP、时间、请求了哪个文件。仅此而已。
          </P>
          <P>
            <b className="font-normal text-[var(--fg)]">看不到的</b>：你的密钥、生日、出生地、
            问的话、算出来的盘、先生的回答。这些从不经过这台服务器。
            解读的请求是你的浏览器<b className="font-normal text-[var(--fg)]">直接</b>发给模型供应商的，
            服务器在这条路上没有位置——它只负责把网页发给你。
            全站的出站代码就一个文件夹：<Code>src/llm/</Code>。
          </P>
          <P>
            <b className="font-normal text-[var(--fg)]">但你需要信任一件事</b>：
            页面上的代码是运营者发的，他有能力改它。纯前端的应用都是这样，
            技术上兜不住——任何声称「我看不到你的数据」的前端站点，都隐含着这条前提。
            所以这个项目开源：你可以自己核对代码，也可以自己部署一份，
            那样连这条前提都不需要了。
          </P>
          <P>
            另外，如果你在设置里填了自己的中转地址，那么<b className="font-normal text-[var(--fg)]">
            那个中转方</b>能看到你的密钥和你问的每一句话。这跟本站无关，
            但值得你在填之前想一下。
          </P>

          <H>为什么不让模型自己排盘</H>
          <P>
            因为它排不准。干支、节气交界、起运岁数、真太阳时，这些是历法计算，差一个字
            整盘就换了。所以排盘一律由本地代码算，模型拿到的是已经排好的盘，它的职责只是解释。
            排盘引擎有一套单元测试，其中的黄金用例取自另一个独立实现，两边算出来一样才算数。
          </P>
          <P>
            出生时刻还做了真太阳时校正——按出生地经度与均时差把钟表时间还原成太阳真正的位置。
            中国在 1986 到 1991 年间行过夏令时，那几年出生的人钟表比标准时快一小时，
            这一层也一并算了进去。
          </P>

          <H>它有多准</H>
          <P>
            排盘是确定的，解读不是。命理是一套已经用了千余年的象征系统，它擅长描述处境与倾向，
            不擅长预报事件。解读里有一节叫「印证」，会挑几个过去的年份说说当时应有之事，
            你可以逐条核对——对得上的，说明那一路取法站得住；对不上的，点一下告诉先生，
            他会据此重新掂量格局与用神。这是这个站唯一诚实的自我检验方式。
          </P>
          <P>
            不管说得多准，都不要拿它替代医生、律师，或你自己的判断。
          </P>

          <H>渊源</H>
          <P>
            知识库来自几个把传统术数整理成结构化参考的开源项目，逐一列在仓库的
            <Code>src/knowledge/CREDITS.md</Code>
            里，包括各自的授权与本项目的取用范围。历法计算用 tyme4ts，紫微排盘用 iztro，
            城市经纬度来自 GeoNames。
          </P>
          <P>
            这个站本身也是开源的{REPO ? '，' : '。'}
            {REPO && (
              <a
                href={REPO}
                rel="noreferrer noopener"
                className="text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                {REPO.replace(/^https?:\/\//, '')}
              </a>
            )}
            {REPO ? '。' : ''}
            想自己跑一份：克隆下来 <Code>npm i</Code>、<Code>npm run dev</Code> 就行，
            不需要服务器，也不需要把密钥交给任何人。
          </P>

          <Rule />
          <div className="text-center">
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
