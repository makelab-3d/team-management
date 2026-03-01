import { useState } from 'react'
import { formatDayShort, isToday, isWeekend } from '../../lib/dates'
import { formatTime12, formatHours, computeHours } from '../../lib/hours'

export default function DayRow({ date, entry, onEdit, onDelete, disabled }) {
  const [editing, setEditing] = useState(false)
  const [startTime, setStartTime] = useState(entry?.start_time || '09:00')
  const [endTime, setEndTime] = useState(entry?.end_time || '17:00')
  const [saving, setSaving] = useState(false)

  const todayClass = isToday(date) ? 'is-today' : ''
  const weekendClass = isWeekend(date) ? 'is-weekend' : ''

  async function handleSave() {
    setSaving(true)
    try {
      await onEdit(entry.id, { start_time: startTime, end_time: endTime })
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await onDelete(entry.id)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (editing && entry) {
    const preview = computeHours(startTime, endTime)
    return (
      <div className="edit-form">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{formatDayShort(date)}</div>
        <div className="input-row">
          <div>
            <label className="input-label">Start</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" />
          </div>
          <div>
            <label className="input-label">End</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" />
          </div>
        </div>
        {preview.net > 0 && (
          <div className="hours-preview" style={{ marginTop: 8 }}>
            <strong>{formatHours(preview.net)}</strong> net
          </div>
        )}
        <div className="edit-actions">
          <button className="btn btn-sm btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={saving}>Delete</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving || preview.net <= 0}>
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`day-row ${todayClass} ${weekendClass}`}>
      <div className="day-label">{formatDayShort(date)}</div>
      <div className="day-times">
        {entry ? `${formatTime12(entry.start_time)} - ${formatTime12(entry.end_time)}` : '--'}
      </div>
      <div className="day-hours">
        {entry ? formatHours(entry.net_hours) : '--'}
      </div>
      <div className="day-action">
        {entry && !disabled && (
          <button className="btn btn-sm btn-ghost" onClick={() => {
            setStartTime(entry.start_time)
            setEndTime(entry.end_time)
            setEditing(true)
          }}>Edit</button>
        )}
      </div>
    </div>
  )
}
