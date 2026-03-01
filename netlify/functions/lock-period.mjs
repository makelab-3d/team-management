import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Scheduled function: runs daily at midnight ET (0 5 * * * UTC)
// Locks any open pay periods whose end_date has passed
export default async function handler() {
  const today = new Date().toISOString().split('T')[0]

  // Find open periods that have ended
  const { data: periods, error } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('status', 'open')
    .lt('end_date', today)

  if (error) {
    console.error('Error fetching periods:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let locked = 0
  for (const period of periods || []) {
    // Lock the period
    await supabase
      .from('pay_periods')
      .update({ status: 'locked', locked_at: new Date().toISOString() })
      .eq('id', period.id)

    // Count employees who submitted entries
    const { count } = await supabase
      .from('time_entries')
      .select('employee_id', { count: 'exact', head: true })
      .eq('pay_period_id', period.id)

    // Notify via Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `:lock: *Pay period ${period.start_date} to ${period.end_date} has been locked*\nTimesheets from ${count || 0} employee(s) are ready for review.\n<${process.env.URL || 'https://time.makelab.com'}/#/admin|Review now>`,
          }),
        })
      } catch (err) {
        console.error('Slack notification failed:', err)
      }
    }

    locked++
  }

  return new Response(JSON.stringify({ ok: true, locked }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
