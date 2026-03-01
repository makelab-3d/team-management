import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatPeriodRange, getPeriodDays, formatDayShort } from '../lib/dates'
import { formatHours, formatTime12 } from '../lib/hours'

export default function AdminApproval() {
  const { employee } = useAuth()
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [employeeData, setEmployeeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState(null)

  // Fetch periods that need attention (locked or approved)
  const fetchPeriods = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('pay_periods')
      .select('*')
      .in('status', ['locked', 'approved', 'open'])
      .order('start_date', { ascending: false })
      .limit(10)

    setPeriods(data || [])
    if (data?.length && !selectedPeriod) {
      setSelectedPeriod(data[0])
    }
    setLoading(false)
  }, [selectedPeriod])

  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  // Fetch all employee entries for selected period
  const fetchEmployeeData = useCallback(async () => {
    if (!supabase || !selectedPeriod) return

    // Use Netlify function for admin data (bypasses RLS)
    try {
      const res = await fetch('/.netlify/functions/admin-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_period_id: selectedPeriod.id }),
      })
      const data = await res.json()
      setEmployeeData(data.employees || [])
    } catch (err) {
      console.error('Error fetching admin data:', err)
    }
  }, [selectedPeriod])

  useEffect(() => { fetchEmployeeData() }, [fetchEmployeeData])

  async function handleApprove() {
    setMessage(null)
    try {
      const res = await fetch('/.netlify/functions/approve-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_period_id: selectedPeriod.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Approval failed')
      setMessage({ type: 'success', text: 'Period approved successfully' })
      fetchPeriods()
      fetchEmployeeData()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  async function handleSync() {
    setMessage(null)
    setSyncing(true)
    try {
      const res = await fetch('/.netlify/functions/sync-to-payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_period_id: selectedPeriod.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setMessage({ type: 'success', text: `Synced ${data.synced} records to payroll` })
      fetchPeriods()
      fetchEmployeeData()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="text-center mt-16"><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
  }

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Approve Timesheets</h2>

      {/* Period selector */}
      <div className="card mb-12">
        <label className="input-label">Pay Period</label>
        <select
          className="input"
          value={selectedPeriod?.id || ''}
          onChange={e => setSelectedPeriod(periods.find(p => p.id === e.target.value))}
        >
          {periods.map(p => (
            <option key={p.id} value={p.id}>
              {formatPeriodRange(p.start_date, p.end_date)} ({p.status})
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`toast ${message.type}`} style={{ marginBottom: 12 }}>
          {message.text}
        </div>
      )}

      {/* Employee timesheets */}
      {employeeData.length === 0 ? (
        <div className="card text-center">
          <p className="text-muted">No timesheets submitted for this period.</p>
        </div>
      ) : (
        employeeData.map(emp => (
          <div key={emp.employee_id} className="card admin-employee-card">
            <div className="admin-employee-header">
              <span className="admin-employee-name">{emp.full_name}</span>
              <span className="admin-employee-hours">{formatHours(emp.total_hours)} | ${emp.gross_amount}</span>
            </div>
            {emp.entries.map(e => (
              <div key={e.id} className="day-row">
                <div className="day-label">{formatDayShort(e.work_date)}</div>
                <div className="day-times">{formatTime12(e.start_time)} - {formatTime12(e.end_time)}</div>
                <div className="day-hours">{formatHours(e.net_hours)}</div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Actions */}
      {selectedPeriod && (
        <div className="admin-actions mt-16">
          {selectedPeriod.status === 'locked' && (
            <button className="btn btn-primary btn-full" onClick={handleApprove}>
              Approve All Timesheets
            </button>
          )}
          {selectedPeriod.status === 'approved' && (
            <button className="btn btn-primary btn-full" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync to Payroll'}
            </button>
          )}
          {selectedPeriod.status === 'synced' && (
            <div className="text-center text-muted">This period has been synced to payroll.</div>
          )}
        </div>
      )}
    </>
  )
}
