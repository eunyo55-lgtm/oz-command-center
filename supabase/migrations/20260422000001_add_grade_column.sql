-- 고객 등급 컬럼 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '일반';

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;
