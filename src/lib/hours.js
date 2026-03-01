/** Parse HH:MM time string to total minutes since midnight */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/** Compute hours from start/end time strings (HH:MM format) */
export function computeHours(startTime, endTime) {
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  if (endMin <= startMin) return { gross: 0, breakMin: 0, net: 0 }

  const gross = (endMin - startMin) / 60
  const breakMin = gross > 6 ? 60 : 0
  const net = gross - breakMin / 60

  return {
    gross: Math.round(gross * 100) / 100,
    breakMin,
    net: Math.round(net * 100) / 100,
  }
}

/** Format decimal hours as "7.5h" */
export function formatHours(hours) {
  if (!hours && hours !== 0) return '--'
  return `${Number(hours).toFixed(1)}h`
}

/** Format HH:MM (24h) as "9:00 AM" */
export function formatTime12(timeStr) {
  if (!timeStr) return '--'
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
