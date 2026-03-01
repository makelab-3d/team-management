import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePayPeriod } from '../hooks/usePayPeriod'
import { supabase } from '../lib/supabase'
import { formatPeriodRange, getPeriodDays, formatDayShort } from '../lib/dates'
import { formatHours, formatTime12 } from '../lib/hours'

export default function History() {
  const { employee } = useAuth()
  const { allPeriods, loading: periodsLoading } = usePayPeriod()
  const [expandedId, setExpandedId] = useState(null)
  const [expandedEntries, setExpandedEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  // Fetch summaries for all past periods
  const [summaries, setSummaries] = useState({})
  const fetchSummaries = useCallback(async () => {
    if (!supabase || !employee) return
    const { data } = await supabase
      .from('time_entries')
      .select('pay_period_id, net_hours')
      .eq('employee_id', employee.id)

    const map = {}
    ;(data || []).forEach(e => {
      if (!map[e.pay_period_id]) map[e.pay_period_id] = 0
      map[e.pay_period_id] += Number(e.net_hours || 0)
    })
    setSummaries(map)
  }, [employee])

  useEffect(() => { fetchSummaries() }, [fetchSummaries])

  async function toggleExpand(periodId) {
    if (expandedId === periodId) {
      setExpandedId(null)
      return
    }
    setExpandedId(periodId)
    setLoadingEntries(true)
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('pay_period_id', periodId)
      .order('work_date', { ascending: true })
    setExpandedEntries(data || [])
    setLoadingEntries(false)
  }

  if (periodsLoading) {
    return <div className="text-center mt-16"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
  }

  // Show all periods (not just past ones) so employee can see status
  const periods = allPeriods.filter(p => p.status !== 'open' || summaries[p.id])

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Pay Period History</h2>
      {periods.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">No past pay periods yet.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="history-list">
            {periods.map(p => (
              <li key={p.id}>
                <div className="history-item" onClick={() => toggleExpand(p.id)}>
                  <div>
                    <div className="history-range">{formatPeriodRange(p.start_date, p.end_date)}</div>
                  </div>
                  <div className="history-meta">
                    <span className="history-hours">{formatHours(summaries[p.id] || 0)}</span>
                    <span className={`period-status ${p.status}`}>{p.status}</span>
                  </div>
                </div>
                {expandedId === p.id && (
                  <div style={{ padding: '8px 0 16px' }}>
                    {loadingEntries ? (
                      <p className="text-muted text-center">Loading...</p>
                    ) : expandedEntries.length === 0 ? (
                      <p className="text-muted text-center">No entries logged</p>
                    ) : (
                      expandedEntries.map(e => (
                        <div key={e.id} className="day-row">
                          <div className="day-label">{formatDayShort(e.work_date)}</div>
                          <div className="day-times">{formatTime12(e.start_time)} - {formatTime12(e.end_time)}</div>
                          <div className="day-hours">{formatHours(e.net_hours)}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
