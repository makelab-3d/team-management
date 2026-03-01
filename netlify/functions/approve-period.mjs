import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { pay_period_id } = await req.json()
  if (!pay_period_id) {
    return new Response(JSON.stringify({ error: 'pay_period_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify period is locked
  const { data: period, error: pErr } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('id', pay_period_id)
    .single()

  if (pErr || !period) {
    return new Response(JSON.stringify({ error: 'Period not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (period.status !== 'locked') {
    return new Response(JSON.stringify({ error: `Period is ${period.status}, must be locked to approve` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Create/update timesheet summaries for all employees
  const { data: entries } = await supabase
    .from('time_entries')
    .select('employee_id, net_hours, employees(rate)')
    .eq('pay_period_id', pay_period_id)

  const byEmployee = {}
  for (const e of entries || []) {
    if (!byEmployee[e.employee_id]) {
      byEmployee[e.employee_id] = { totalHours: 0, rate: Number(e.employees?.rate || 0), days: 0 }
    }
    byEmployee[e.employee_id].totalHours += Number(e.net_hours || 0)
    byEmployee[e.employee_id].days++
  }

  for (const [empId, data] of Object.entries(byEmployee)) {
    const totalHours = Math.round(data.totalHours * 100) / 100
    const grossAmount = Math.round(totalHours * data.rate * 100) / 100

    await supabase
      .from('timesheet_summaries')
      .upsert({
        employee_id: empId,
        pay_period_id,
        total_hours: totalHours,
        total_days: data.days,
        rate_used: data.rate,
        gross_amount: grossAmount,
        status: 'approved',
        approved_at: new Date().toISOString(),
      }, { onConflict: 'employee_id,pay_period_id' })
  }

  // Update period status
  await supabase
    .from('pay_periods')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', pay_period_id)

  return new Response(JSON.stringify({ ok: true, approved: Object.keys(byEmployee).length }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
