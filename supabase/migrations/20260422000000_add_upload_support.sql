-- ===========================================
-- CSV 업로드 기능을 위한 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요
-- ===========================================

-- 1. days_since_signup 컬럼 추가 (없으면)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS days_since_signup INT DEFAULT 0;

-- 2. customer_code unique 제약 조건 (upsert를 위해 필요)
--    이미 있을 수 있지만 혹시 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_customer_code_key'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);
  END IF;
END $$;

-- 3. insert/update 권한 정책 추가 (CSV 업로드용)
--    이미 있을 수 있으므로 DROP 후 CREATE
DROP POLICY IF EXISTS "Allow all to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow all to update customers" ON customers;

CREATE POLICY "Allow all to insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all to update customers" ON customers FOR UPDATE USING (true);

-- 4. 확인
SELECT
  'customers' AS table_name,
  count(*) AS total_rows
FROM customers;
