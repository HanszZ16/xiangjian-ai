/**
 * 真太阳时换算。
 *
 * 命理取时柱用的是太阳真正走到的位置，不是钟表读数。两者差在两处：
 *   一、经度差——钟表走的是时区中央经线的时间，出生地偏东偏西都要补；
 *   二、均时差——地球轨道是椭圆、黄赤有交角，真太阳每天走得快慢不一。
 *
 * 时区偏移直接问浏览器的 ICU（`Intl`），它带着完整的历史时区库，
 * 中国 1986–1991 那几年的夏令时、1949 年前的五时区，都不必自己维护。
 */

export type Place = {
  /** 城市名 */
  n: string
  /** 拉丁名 */
  a: string
  /** 省 / 国 */
  r: string
  /** ISO 国别码 */
  c: string
  lat: number
  lon: number
  /** IANA 时区 */
  tz: string
}

export type WallClock = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export type SolarCorrection = {
  /** 校正后的真太阳时 */
  trueSolar: WallClock
  /** 经度时差，分钟；东偏为正 */
  longitudeMinutes: number
  /** 均时差，分钟 */
  equationMinutes: number
  /** 合计位移，分钟 */
  totalMinutes: number
  /** 出生当时该地相对 UTC 的偏移，分钟 */
  utcOffsetMinutes: number
  /** 出生当时是否处在夏令时 */
  dst: boolean
}

/** 某个 UTC 瞬间在 tz 里的偏移（分钟，东为正） */
function offsetAt(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))

  const get = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)!.value)

  // hour 在午夜会被格式化成 24，归零
  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  )
  return Math.round((asIfUtc - utcMs) / 60000)
}

/** 把某时区的墙上时间还原成 UTC 毫秒 */
export function wallToUtc(w: WallClock, tz: string): number {
  const naive = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, 0)
  // 先用朴素猜测取偏移，再用修正后的瞬间复核一次，跨 DST 边界时收敛
  let utc = naive - offsetAt(naive, tz) * 60000
  utc = naive - offsetAt(utc, tz) * 60000
  return utc
}

/** 该地该日的标准（非夏令时）偏移，用于判断当时是否在行夏令时 */
function standardOffset(utcMs: number, tz: string): number {
  const d = new Date(utcMs)
  const jan = Date.UTC(d.getUTCFullYear(), 0, 1)
  const jul = Date.UTC(d.getUTCFullYear(), 6, 1)
  return Math.min(offsetAt(jan, tz), offsetAt(jul, tz))
}

/**
 * 均时差，分钟。NOAA 太阳位置算法的常用近似，全年误差在十几秒内。
 * @param utcMs 该瞬间的 UTC 毫秒
 */
export function equationOfTime(utcMs: number): number {
  const d = new Date(utcMs)
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const dayOfYear = Math.floor((utcMs - start) / 86400000) + 1
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60

  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24)
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  )
}

function fromUtcMs(ms: number): WallClock {
  const d = new Date(ms)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  }
}

/**
 * 把钟表时间换算成真太阳时。
 *
 *   真太阳时 = UTC + 经度/15 小时 + 均时差
 *
 * 这样写就不必分别处理"标准经线"和夏令时——两者都已经含在 UTC 里了。
 */
export function toTrueSolarTime(clock: WallClock, place: Place): SolarCorrection {
  const utcMs = wallToUtc(clock, place.tz)
  const utcOffsetMinutes = offsetAt(utcMs, place.tz)

  const longitudeMinutes = place.lon * 4 - utcOffsetMinutes
  const equationMinutes = equationOfTime(utcMs)
  const totalMinutes = longitudeMinutes + equationMinutes

  // 直接把 UTC 推到真太阳时，再当成 UTC 读出来，就是当地的真太阳钟面
  const trueMs = utcMs + Math.round((place.lon * 4 + equationMinutes) * 60000)

  return {
    trueSolar: fromUtcMs(trueMs),
    longitudeMinutes,
    equationMinutes,
    totalMinutes,
    utcOffsetMinutes,
    dst: utcOffsetMinutes !== standardOffset(utcMs, place.tz),
  }
}
