-- Extend report_type to include 'scenario'
-- Extend reason to include 'copyright'

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_report_type_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_report_type_check
  CHECK (report_type IN ('post', 'comment', 'user', 'session_message', 'scenario'));

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reason_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_reason_check
  CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'cheating', 'copyright', 'other'));
