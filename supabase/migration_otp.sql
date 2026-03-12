-- טבלת בקשות קוד OTP (נשלח ללקוח ב-WhatsApp מהמספרה)
CREATE TABLE IF NOT EXISTS otp_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_phone ON otp_requests(phone);
CREATE INDEX IF NOT EXISTS idx_otp_requests_created ON otp_requests(created_at);

ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all otp_requests" ON otp_requests FOR ALL USING (true) WITH CHECK (true);
