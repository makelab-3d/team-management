import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTimeEntries(employeeId, payPeriodId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!supabase || !employeeId || !payPeriodId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('pay_period_id', payPeriodId)
      .order('work_date', { ascending: true })

    if (error) {
      console.error('Error fetching time entries:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [employeeId, payPeriodId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const addEntry = useCallback(async (entry) => {
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        employee_id: employeeId,
        pay_period_id: payPeriodId,
        ...entry,
      })
      .select()

    if (error) throw error
    setEntries(prev =>
      [...prev, data[0]].sort((a, b) => a.work_date.localeCompare(b.work_date))
    )
    return data[0]
  }, [employeeId, payPeriodId])

  const updateEntry = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('time_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) throw error
    setEntries(prev => prev.map(e => e.id === id ? data[0] : e))
    return data[0]
  }, [])

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id)

    if (error) throw error
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const totalHours = entries.reduce((sum, e) => sum + Number(e.net_hours || 0), 0)

  return { entries, loading, addEntry, updateEntry, deleteEntry, totalHours, refresh: fetchEntries }
}
