export type DestinyPattern = 'luopan' | 'bazi' | 'ziwei' | 'tarot'

const SIZE = 768
const CENTER = SIZE / 2
const SHAN = [
  '壬', '子', '癸', '丑', '艮', '寅', '甲', '卯',
  '乙', '辰', '巽', '巳', '丙', '午', '丁', '未',
  '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥',
]

const TRIGRAMS = [
  [1, 1, 1],
  [1, 1, 0],
  [1, 0, 1],
  [1, 0, 0],
  [0, 1, 1],
  [0, 1, 0],
  [0, 0, 1],
  [0, 0, 0],
]

const PALACES = ['命', '兄', '夫', '子', '财', '疾', '迁', '友', '官', '田', '福', '父']

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(CENTER + x1, CENTER + y1)
  ctx.lineTo(CENTER + x2, CENTER + y2)
  ctx.stroke()
}

function circle(ctx: CanvasRenderingContext2D, radius: number, width = 3) {
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.arc(CENTER, CENTER, radius, 0, Math.PI * 2)
  ctx.stroke()
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  weight: 'normal' | 'bold' = 'normal',
) {
  ctx.font = `${weight} ${size}px "Songti SC", "STSong", "SimSun", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value, CENTER + x, CENTER + y)
}

function drawTrigram(ctx: CanvasRenderingContext2D, cx: number, cy: number, lines: number[], angle = 0) {
  ctx.save()
  ctx.translate(CENTER + cx, CENTER + cy)
  ctx.rotate(angle)
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  for (let i = 0; i < lines.length; i += 1) {
    const y = (i - 1) * 12
    if (lines[i]) {
      ctx.beginPath()
      ctx.moveTo(-22, y)
      ctx.lineTo(22, y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(-22, y)
      ctx.lineTo(-5, y)
      ctx.moveTo(5, y)
      ctx.lineTo(22, y)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawLuopan(ctx: CanvasRenderingContext2D) {
  circle(ctx, 324, 3)
  circle(ctx, 288, 2)
  circle(ctx, 226, 2)
  circle(ctx, 152, 2)
  circle(ctx, 72, 2)

  ctx.lineWidth = 2
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2
    line(
      ctx,
      Math.cos(angle) * 288,
      Math.sin(angle) * 288,
      Math.cos(angle) * 324,
      Math.sin(angle) * 324,
    )
    text(ctx, SHAN[i], Math.cos(angle) * 305, Math.sin(angle) * 305, 21)
  }

  for (let i = 0; i < TRIGRAMS.length; i += 1) {
    const angle = (i / TRIGRAMS.length) * Math.PI * 2 - Math.PI / 2
    drawTrigram(ctx, Math.cos(angle) * 190, Math.sin(angle) * 190, TRIGRAMS[i], angle + Math.PI / 2)
  }

  text(ctx, '象', 0, 3, 108, 'bold')
}

function drawBazi(ctx: CanvasRenderingContext2D) {
  circle(ctx, 326, 3)
  circle(ctx, 300, 2)
  const xs = [-210, -70, 70, 210]
  const top = -230
  const bottom = 232

  ctx.lineWidth = 3
  xs.forEach((x) => {
    line(ctx, x - 52, top, x + 52, top)
    line(ctx, x + 52, top, x + 52, bottom)
    line(ctx, x + 52, bottom, x - 52, bottom)
    line(ctx, x - 52, bottom, x - 52, top)
    line(ctx, x - 52, 18, x + 52, 18)
  })

  ;['年', '月', '日', '时'].forEach((label, i) => text(ctx, label, xs[i], -190, 25))
  ;['甲', '乙', '丙', '丁'].forEach((label, i) => text(ctx, label, xs[i], -72, 62, 'bold'))
  ;['子', '丑', '寅', '卯'].forEach((label, i) => text(ctx, label, xs[i], 116, 62, 'bold'))
  text(ctx, '四 柱', 0, 282, 28)
}

function drawZiwei(ctx: CanvasRenderingContext2D) {
  const edge = 312
  const step = edge / 2
  ctx.lineWidth = 3
  for (let i = -2; i <= 2; i += 1) {
    line(ctx, i * step, -edge, i * step, edge)
    line(ctx, -edge, i * step, edge, i * step)
  }

  ctx.clearRect(CENTER - step, CENTER - step, step * 2, step * 2)
  ctx.strokeRect(CENTER - step, CENTER - step, step * 2, step * 2)

  const cells: Array<[number, number]> = [
    [-1.5, -1.5], [-0.5, -1.5], [0.5, -1.5], [1.5, -1.5],
    [1.5, -0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5],
    [-0.5, 1.5], [-1.5, 1.5], [-1.5, 0.5], [-1.5, -0.5],
  ]
  cells.forEach(([x, y], i) => text(ctx, PALACES[i], x * step, y * step, 44, 'bold'))
  text(ctx, '紫 微', 0, -24, 52, 'bold')
  text(ctx, '十 二 宫', 0, 52, 24)
}

function drawTarot(ctx: CanvasRenderingContext2D) {
  const w = 360
  const h = 610
  ctx.lineWidth = 4
  ctx.strokeRect(CENTER - w / 2, CENTER - h / 2, w, h)
  ctx.lineWidth = 2
  ctx.strokeRect(CENTER - w / 2 + 20, CENTER - h / 2 + 20, w - 40, h - 40)
  circle(ctx, 112, 3)
  circle(ctx, 42, 4)

  ctx.lineWidth = 4
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2
    line(
      ctx,
      Math.cos(angle) * 58,
      Math.sin(angle) * 58,
      Math.cos(angle) * 96,
      Math.sin(angle) * 96,
    )
  }

  text(ctx, '☾', 0, -202, 74)
  text(ctx, '✦', -100, -208, 30)
  text(ctx, '✦', 100, -208, 30)
  text(ctx, '塔 罗', 0, 222, 36, 'bold')
}

function hash(index: number, salt: number) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function renderPattern(pattern: DestinyPattern) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return [] as Array<[number, number]>

  ctx.strokeStyle = '#fff'
  ctx.fillStyle = '#fff'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (pattern === 'bazi') drawBazi(ctx)
  else if (pattern === 'ziwei') drawZiwei(ctx)
  else if (pattern === 'tarot') drawTarot(ctx)
  else drawLuopan(ctx)

  const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data
  const points: Array<[number, number]> = []
  for (let y = 0; y < SIZE; y += 2) {
    for (let x = 0; x < SIZE; x += 2) {
      if (pixels[(y * SIZE + x) * 4 + 3] > 48) points.push([x, y])
    }
  }
  return points
}

const CACHE = new Map<DestinyPattern, Array<[number, number]>>()

/** 把命盘图样均匀采样成 GPUComputationRenderer 使用的 RGBA 浮点纹理。 */
export function writePattern(
  pattern: DestinyPattern,
  target: Float32Array,
  halfExtent: number,
) {
  let points = CACHE.get(pattern)
  if (!points) {
    points = renderPattern(pattern)
    CACHE.set(pattern, points)
  }
  if (!points.length) throw new Error(`无法生成粒子图样：${pattern}`)

  const count = target.length / 4
  const salt = pattern === 'luopan' ? 1 : pattern === 'bazi' ? 2 : pattern === 'ziwei' ? 3 : 4
  const pixelWorld = (halfExtent * 2) / SIZE

  for (let i = 0; i < count; i += 1) {
    const rank = (i + 0.5) / count
    const point = points[Math.min(points.length - 1, Math.floor(rank * points.length))]
    const jitterX = (hash(i, salt) - 0.5) * pixelWorld * 3
    const jitterY = (hash(i, salt + 11) - 0.5) * pixelWorld * 3
    const j = i * 4
    target[j] = ((point[0] / SIZE) * 2 - 1) * halfExtent + jitterX
    target[j + 1] = (1 - (point[1] / SIZE) * 2) * halfExtent + jitterY
    target[j + 2] = (hash(i, salt + 23) - 0.5) * 0.18
    target[j + 3] = 1
  }
}
