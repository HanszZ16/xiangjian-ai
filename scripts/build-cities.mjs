/*
 * 生成 src/data/cities.json —— 出生地经纬度与时区表。
 *
 * 数据源：GeoNames cities15000（CC BY 4.0，见 src/data/CREDITS.md）。
 * 跑一次、把产物提交进仓库；运行时零网络。
 *
 *   node scripts/build-cities.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SRC = 'https://download.geonames.org/export/dump/cities15000.zip'

/* GeoNames 的 admin1 用数字代码，映射成中文省级名 */
const CN_PROVINCE = {
  '01': '安徽省', '02': '浙江省', '03': '江西省', '04': '江苏省', '05': '吉林省',
  '06': '青海省', '07': '福建省', '08': '黑龙江省', '09': '河南省', 10: '河北省',
  11: '湖南省', 12: '湖北省', 13: '新疆维吾尔自治区', 14: '西藏自治区', 15: '甘肃省',
  16: '广西壮族自治区', 18: '贵州省', 19: '辽宁省', 20: '内蒙古自治区', 21: '宁夏回族自治区',
  22: '北京市', 23: '上海市', 24: '山西省', 25: '山东省', 26: '陕西省',
  28: '天津市', 29: '云南省', 30: '广东省', 31: '海南省', 32: '四川省',
  33: '重庆市',
}
const REGION_NAME = { HK: '香港', MO: '澳门', TW: '台湾' }
/* 海外用中文国名，Node 自带的 ICU 就能给出 */
const COUNTRY = new Intl.DisplayNames(['zh-Hans'], { type: 'region' })

const dir = mkdtempSync(join(tmpdir(), 'cities-'))
console.log('下载', SRC)
execFileSync('curl', ['-sfL', SRC, '-o', join(dir, 'c.zip')])
execFileSync('unzip', ['-oq', join(dir, 'c.zip'), '-d', dir])
const rows = readFileSync(join(dir, 'cities15000.txt'), 'utf8').split('\n')

const CJK = /^[一-鿿·]{2,}$/
const out = []

for (const line of rows) {
  if (!line) continue
  const f = line.split('\t')
  const [, name, , alt, lat, lon, , code, cc, , admin1] = f
  const pop = Number(f[14])
  const tz = f[17]
  if (!tz) continue

  const isCN = cc === 'CN' || cc === 'HK' || cc === 'MO' || cc === 'TW'
  const isCapital = code === 'PPLC'
  // 中国留到地级市量级，海外只留大城市与首都
  if (isCN ? pop < 120_000 : !(isCapital || pop >= 1_000_000)) continue

  const zh = alt.split(',').find((n) => CJK.test(n))
  const label = isCN ? zh || name : zh ? `${zh}` : name

  let region
  if (cc === 'CN') region = CN_PROVINCE[admin1] ?? ''
  else if (REGION_NAME[cc]) region = REGION_NAME[cc]
  else region = COUNTRY.of(cc) ?? cc

  // 1949 年后中国全境行北京时间，墙上的钟就是 Asia/Shanghai；
  // tzdata 里的 Asia/Urumqi 只有部分人在用，直接采用会把时柱整体推错两小时。
  const zone = cc === 'CN' ? 'Asia/Shanghai' : tz

  out.push({
    n: label,
    // 拉丁名，用于拼音/英文搜索
    a: f[2],
    r: region,
    c: cc,
    lat: Math.round(Number(lat) * 1e4) / 1e4,
    lon: Math.round(Number(lon) * 1e4) / 1e4,
    tz: zone,
    p: pop,
  })
}

out.sort((x, y) => y.p - x.p)
// 同名同省的去重，保留人口最多的那个
const seen = new Set()
const dedup = out.filter((c) => {
  const k = `${c.c}|${c.r}|${c.n}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})

const json = JSON.stringify(dedup.map(({ p: _p, ...rest }) => rest))
writeFileSync('src/data/cities.json', json)
console.log(`写出 ${dedup.length} 座城市，${(json.length / 1024).toFixed(0)} KB`)
console.log('其中中国大陆', dedup.filter((c) => c.c === 'CN').length)
