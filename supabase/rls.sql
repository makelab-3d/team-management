-- ============================================================
-- Makelab Time Tracking — Row Level Security
-- Run AFTER schema.sql
-- ============================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_summaries ENABLE ROW LEVEL SECURITY;

-- EMPLOYEES: read own profile
CREATE POLICY "employees_read_own" ON employees
  FOR SELECT USING (auth_id = auth.uid());

-- PAY PERIODS: everyone can read (need to see current period)
CREATE POLICY "pay_periods_read_all" ON pay_periods
  FOR SELECT USING (true);

-- TIME ENTRIES: employees read/write own only
CREATE POLICY "time_entries_read_own" ON time_entries
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "time_entries_insert_own" ON time_entries
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "time_entries_update_own" ON time_entries
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
  );

CREATE POLICY "time_entries_delete_own" ON time_entries
  FOR DELETE USING (
    employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
  );

-- TIMESHEET SUMMARIES: employees read own
CREATE POLICY "summaries_read_own" ON timesheet_summaries
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE auth_id = auth.uid())
  );

-- NOTE: Admin operations (approve, sync, lock) use Netlify Functions
-- with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely.
