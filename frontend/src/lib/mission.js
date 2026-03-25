const MISSION_START_KEY = 'mission_start_date' // yyyy-mm-dd

export function getMissionStartDate() {
  try {
    const raw = window?.localStorage?.getItem(MISSION_START_KEY)
    if (!raw) return null
    const d = new Date(`${raw}T00:00:00Z`)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export function setMissionStartDate(yyyyMmDd) {
  const v = String(yyyyMmDd || '').trim()
  if (!v) {
    window?.localStorage?.removeItem(MISSION_START_KEY)
    return
  }
  // very light validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('Mission start date must be YYYY-MM-DD')
  window?.localStorage?.setItem(MISSION_START_KEY, v)
}

function toDate(value) {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function weekIndexFor(dateLike, missionStartDate = getMissionStartDate()) {
  const d = toDate(dateLike)
  const start = toDate(missionStartDate)
  if (!d || !start) return null

  // Compute whole weeks between start-of-day UTC dates.
  const utcDay = (x) => Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate())
  const diffDays = Math.floor((utcDay(d) - utcDay(start)) / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

export function weekLabelFor(dateLike, missionStartDate) {
  const idx = weekIndexFor(dateLike, missionStartDate)
  if (!idx || idx < 1) return 'Week ?'
  return `Week ${idx}`
}

export function groupByWeek(items, dateSelector, missionStartDate) {
  const groups = new Map()
  for (const item of items || []) {
    const d = dateSelector(item)
    const label = weekLabelFor(d, missionStartDate)
    const arr = groups.get(label) || []
    arr.push(item)
    groups.set(label, arr)
  }
  return Array.from(groups.entries())
}

export function inferMissionStartDate(items, dateSelector) {
  let best = null
  for (const item of items || []) {
    const d = toDate(dateSelector(item))
    if (!d) continue
    if (!best || d.getTime() < best.getTime()) best = d
  }
  if (!best) return null
  // Normalize to UTC midnight for stable week math.
  return new Date(Date.UTC(best.getUTCFullYear(), best.getUTCMonth(), best.getUTCDate()))
}

// --- datetime-local helpers ---

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function isoToDatetimeLocalValue(iso) {
  const d = toDate(iso)
  if (!d) return ''
  // datetime-local is interpreted in local time
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const min = pad2(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export function datetimeLocalValueToIso(value) {
  const v = String(value || '').trim()
  if (!v) return null
  // new Date('YYYY-MM-DDTHH:mm') is local time in browsers
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}
