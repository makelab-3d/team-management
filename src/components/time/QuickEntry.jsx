import { useState } from 'react'
import { computeHours, formatHours } from '../../lib/hours'
import { today } from '../../lib/dates'

export default function QuickEntry({ periodDays, entries, onAdd, disabled }) {
  const [date, setDate] = useState(today())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const { gross, breakMin, net } = computeHours(startTime, endTime)
  const alreadyLogged = entries.some(e => e.work_date === date)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await onAdd({
        work_date: date,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
      })
      setNotes('')
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to log hours')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card quick-entry">
      <div className="card-title">Log Hours</div>
      <form onSubmit={handleSubmit}>
        <div className="mb-12">
          <label className="input-label">Date</label>
          <select
            value={date}
            onChange={e => setDate(e.target.value)}
            className="input"
            disabled={disabled}
          >
            {periodDays.map(d => {
              const logged = entries.some(e => e.work_date === d)
              const dayDate = new Date(d + 'T00:00:00')
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              const label = `${dayNames[dayDate.getDay()]} ${dayDate.getMonth() + 1}/${dayDate.getDate()}`
              return (
                <option key={d} value={d}>
                  {label}{logged ? ' (logged)' : ''}{d === today() ? ' — Today' : ''}
                </option>
              )
            })}
          </select>
        </div>

        <div className="input-row mb-12">
          <div>
            <label className="input-label">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="input"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="input-label">End</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="input"
              disabled={disabled}
            />
          </div>
        </div>

        {net > 0 && (
          <div className="hours-preview">
            <strong>{formatHours(net)}</strong> net
            {breakMin > 0 && (
              <div className="lunch-note">
                {formatHours(gross)} worked — {breakMin} min lunch deducted
              </div>
            )}
          </div>
        )}

        <div className="mb-12">
          <label className="input-label">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What did you work on?"
            className="input"
            disabled={disabled}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={disabled || submitting || net <= 0 || alreadyLogged}
        >
          {submitting ? 'Saving...' : alreadyLogged ? 'Already Logged' : 'Log Hours'}
        </button>
      </form>
    </div>
  )
}
