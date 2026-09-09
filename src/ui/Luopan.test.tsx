import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Luopan } from './Luopan'

describe('Luopan animation', () => {
  it('uses CSS rotation instead of browser-specific SMIL controls', () => {
    const html = renderToStaticMarkup(<Luopan spinning />)
    expect(html).not.toContain('animateTransform')
    expect(html).toContain('animation-name:luopan-spin')
    expect(html).toContain('animation-play-state:running')
  })

  it('pauses every ring without resetting the SVG timeline', () => {
    const html = renderToStaticMarkup(<Luopan spinning={false} />)
    expect(html.match(/animation-play-state:paused/g)).toHaveLength(4)
  })

  /* viewBox 是 `-220 -220 440 440`，起点不在 0。一旦轴心改回 view-box，
     Chrome 会把 center 解到用户坐标 (220, 220)，四圈字便绕着右下角越甩越远。 */
  it('spins each ring about its own centre, not the view box', () => {
    const html = renderToStaticMarkup(<Luopan spinning />)
    expect(html.match(/transform-box:fill-box/g)).toHaveLength(4)
    expect(html).not.toContain('transform-box:view-box')
  })

  it('gives each instance its own gradient id', () => {
    const html = renderToStaticMarkup(
      <>
        <Luopan />
        <Luopan />
      </>,
    )
    const ids = [...html.matchAll(/<radialGradient id="([^"]+)"/g)].map((match) => match[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})
