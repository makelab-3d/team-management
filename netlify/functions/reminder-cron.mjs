import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Scheduled function: runs daily at 9 AM ET (0 14 * * * UTC)
// Reminds employees who haven't logged hours for an open period ending soon
export default async function handler() {
  if (!process.env.SLACK_BOT_TOKEN) {
    return new Response(JSON.stringify({ skipped: 'SLACK_BOT_TOKEN not configured' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const today = new Date()
  const twoDaysFromNow = new Date(today)
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  const twoDaysStr = twoDaysFromNow.toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  // Find open periods ending within 2 days
  const { data: periods } = await supabase
    .from('pay_periods')
    .select('*')
    .eq('status', 'open')
    .gte('end_date', todayStr)
    .lte('end_date', twoDaysStr)

  if (!periods?.length) {
    return new Response(JSON.stringify({ ok: true, reminders: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let remindersSent = 0

  for (const period of periods) {
    // Get all active employees
    const { data: employees } = await supabase
      .from('employees')
      .select('id, full_name, slack_user_id')
      .eq('is_active', true)

    // Get employees who have submitted entries
    const { data: entries } = await supabase
      .from('time_entries')
      .select('employee_id')
      .eq('pay_period_id', period.id)

    const submittedIds = new Set((entries || []).map(e => e.employee_id))

    // Find employees with no entries or fewer than expected
    const needsReminder = (employees || []).filter(emp =>
      emp.slack_user_id && !submittedIds.has(emp.id)
    )

    for (const emp of needsReminder) {
      try {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: emp.slack_user_id,
            text: `:wave: Hey ${emp.full_name}! The pay period ending ${period.end_date} closes soon. Please log your hours: <${process.env.URL || 'https://time.makelab.com'}|Open Time Tracker>`,
          }),
        })
        remindersSent++
      } catch (err) {
        console.error(`Failed to remind ${emp.full_name}:`, err)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, reminders: remindersSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
