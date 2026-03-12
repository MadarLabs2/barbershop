-- תיקון שגיאת "policy already exists" – הרץ ב-SQL Editor
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
