-- 탈퇴 관련 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. withdrawn 컬럼 (boolean, 기본 false)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS withdrawn BOOLEAN DEFAULT FALSE;

-- 2. withdrawn_date 컬럼 (탈퇴 처리일)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS withdrawn_date DATE;

-- 3. 확인
SELECT 
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE withdrawn = TRUE) AS withdrawn_count
FROM customers;
