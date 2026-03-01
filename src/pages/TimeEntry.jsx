import { useAuth } from '../context/AuthContext'
import { usePayPeriod } from '../hooks/usePayPeriod'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { getPeriodDays, formatPeriodRange } from '../lib/dates'
import QuickEntry from '../components/time/QuickEntry'
import TimesheetGrid from '../components/time/TimesheetGrid'

export default function TimeEntry() {
  const { employee } = useAuth()
  const { currentPeriod, loading: periodLoading } = usePayPeriod()
  const {
    entries, loading: entriesLoading, totalHours,
    addEntry, updateEntry, deleteEntry
  } = useTimeEntries(employee?.id, currentPeriod?.id)

  if (periodLoading || entriesLoading) {
    return <div className="text-center mt-16"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
  }

  if (!currentPeriod) {
    return (
      <div className="card text-center">
        <p>No active pay period found.</p>
        <p className="text-muted mt-8">Contact your admin to set up pay periods.</p>
      </div>
    )
  }

  const periodDays = getPeriodDays(currentPeriod.start_date, currentPeriod.end_date)
  const isLocked = currentPeriod.status !== 'open'

  return (
    <>
      <div className="period-header">
        <span className="period-range">{formatPeriodRange(currentPeriod.start_date, currentPeriod.end_date)}</span>
        <span className={`period-status ${currentPeriod.status}`}>{currentPeriod.status}</span>
      </div>

      {isLocked ? (
        <div className="card mb-12">
          <p className="text-center text-muted">
            This pay period is <strong>{currentPeriod.status}</strong>. You can no longer edit your hours.
          </p>
        </div>
      ) : (
        <QuickEntry
          periodDays={periodDays}
          entries={entries}
          onAdd={addEntry}
          disabled={isLocked}
        />
      )}

      <div className="mt-12">
        <TimesheetGrid
          periodDays={periodDays}
          entries={entries}
          totalHours={totalHours}
          onEdit={updateEntry}
          onDelete={deleteEntry}
          disabled={isLocked}
        />
      </div>
    </>
  )
}
