import DayRow from './DayRow'
import { formatHours } from '../../lib/hours'

export default function TimesheetGrid({ periodDays, entries, totalHours, onEdit, onDelete, disabled }) {
  const entryMap = {}
  entries.forEach(e => { entryMap[e.work_date] = e })

  return (
    <div className="card">
      <div className="card-title">This Period</div>
      <div className="timesheet-grid">
        {periodDays.map(date => (
          <DayRow
            key={date}
            date={date}
            entry={entryMap[date] || null}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="period-summary">
        <span className="period-total-label">Period Total</span>
        <span className="period-total-hours">{formatHours(totalHours)}</span>
      </div>
    </div>
  )
}
