import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/dates'

export function usePayPeriod() {
  const [currentPeriod, setCurrentPeriod] = useState(null)
  const [allPeriods, setAllPeriods] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPeriods = useCallback(async () => {
    if (!supabase) { setLoading(false); return }

    const { data, error } = await supabase
      .from('pay_periods')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching pay periods:', error)
      setLoading(false)
      return
    }

    setAllPeriods(data || [])

    // Find the current open period (today falls within it)
    const today = formatDate(new Date())
    const current = (data || []).find(p =>
      p.status === 'open' && p.start_date <= today && p.end_date >= today
    )
    // If no open period contains today, find the most recent open one
    setCurrentPeriod(current || (data || []).find(p => p.status === 'open') || null)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  return { currentPeriod, allPeriods, loading, refresh: fetchPeriods }
}
