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

  // Verify period is approved
  const { data: period } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('id', pay_period_id)
    .single()

  if (!period || period.status !== 'approved') {
    return new Response(JSON.stringify({ error: 'Period must be approved before syncing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch approved summaries
  const { data: summaries } = await supabase
    .from('timesheet_summaries')
    .select('*, employees(full_name, pay_type, method)')
    .eq('pay_period_id', pay_period_id)
    .eq('status', 'approved')

  if (!summaries?.length) {
    return new Response(JSON.stringify({ error: 'No approved timesheets to sync' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let synced = 0
  for (const summary of summaries) {
    // Insert into founder_payroll
    const payrollRecord = {
      full_name: summary.employees?.full_name,
      pay_period_start: period.start_date,
      pay_period_end: period.end_date,
      hours: summary.total_hours,
      rate_used: summary.rate_used,
      gross_amount: summary.gross_amount,
      net_amount: summary.gross_amount, // For 1099, gross = net
      status: 'planned',
      pay_type: summary.employees?.pay_type || 'W2',
      method: summary.employees?.method || 'direct_deposit',
      notes: `Auto-synced from Time Tracker`,
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('founder_payroll')
      .insert(payrollRecord)
      .select()

    if (insertErr) {
      console.error(`Failed to insert payroll for ${summary.employees?.full_name}:`, insertErr)
      continue
    }

    // Update summary with the payroll record ID
    await supabase
      .from('timesheet_summaries')
      .update({
        status: 'synced',
        payroll_record_id: inserted[0].id,
        synced_at: new Date().toISOString(),
      })
      .eq('id', summary.id)

    synced++
  }

  // Update period status
  await supabase
    .from('pay_periods')
    .update({ status: 'synced' })
    .eq('id', pay_period_id)

  // Send Slack notification
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `:white_check_mark: *Payroll synced* for period ${period.start_date} to ${period.end_date}\n${synced} employee records added to Mission Control.`,
        }),
      })
    } catch (err) {
      console.error('Slack notification failed:', err)
    }
  }

  return new Response(JSON.stringify({ ok: true, synced }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
