-- ==================================================================
-- OZ-Command Center · Supabase Schema
-- ==================================================================
-- Run in Supabase SQL Editor. Designed for the 오즈키즈 CRM app.
-- Integrates with Cafe24 API data (customers, orders, products).
-- ==================================================================

-- ========== 1. CUSTOMERS ==========
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  signup_date DATE NOT NULL,
  first_purchase_date DATE,
  last_purchase_date DATE,
  total_orders INT DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  app_installed BOOLEAN DEFAULT FALSE,
  rfm_segment TEXT CHECK (rfm_segment IN ('champions', 'loyal', 'potential', 'new', 'at_risk', 'hibernating', 'lost')),
  lifecycle_stage TEXT CHECK (lifecycle_stage IN ('signup_d0', 'browsing_d1', 'first_purchase_d2', 'engaged_d7', 'second_purchase_d14', 'retained_d30', 'dormant')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(rfm_segment);
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle ON customers(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customers_signup ON customers(signup_date);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_date);

-- ========== 2. PRODUCTS ==========
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  season TEXT CHECK (season IN ('spring', 'summer', 'fall', 'winter', 'all')),
  price INT NOT NULL,
  stock INT DEFAULT 0,
  sales_velocity NUMERIC(10, 2) DEFAULT 0,
  cvr NUMERIC(5, 2) DEFAULT 0,
  is_aha_item BOOLEAN DEFAULT FALSE,
  views_7d INT DEFAULT 0,
  sales_7d INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_season ON products(season);
CREATE INDEX IF NOT EXISTS idx_products_aha ON products(is_aha_item);

-- ========== 3. SIGNALS ==========
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL CHECK (department IN ('md', 'mkt', 'visual')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  metric_value NUMERIC,
  metric_unit TEXT,
  metric_delta NUMERIC,
  suggested_action TEXT,
  related_entity TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'resolved', 'dismissed')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_signals_department ON signals(department);
CREATE INDEX IF NOT EXISTS idx_signals_severity ON signals(severity);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at DESC);

-- ========== 4. TASKS (Collaboration Board) ==========
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL CHECK (department IN ('md', 'mkt', 'visual')),
  assignee TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'review', 'done')),
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  due_date DATE,
  outcome_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_signal ON tasks(signal_id);

-- ========== 5. ORDERS (for re-purchase tracking) ==========
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  ordered_at TIMESTAMPTZ NOT NULL,
  total_amount BIGINT NOT NULL,
  channel TEXT CHECK (channel IN ('web', 'app', 'coupang', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(ordered_at DESC);

-- ========== 6. RPC FUNCTIONS ==========

-- Current KPI snapshot
CREATE OR REPLACE FUNCTION get_kpi_snapshot()
RETURNS TABLE (
  total_customers BIGINT,
  vip_customers BIGINT,
  active_signals BIGINT,
  resolved_signals_7d BIGINT,
  new_signup_repurchase_rate NUMERIC,
  app_revenue_share NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM customers WHERE rfm_segment = 'champions') AS vip_customers,
    (SELECT COUNT(*) FROM signals WHERE status NOT IN ('resolved', 'dismissed')) AS active_signals,
    (SELECT COUNT(*) FROM signals WHERE status = 'resolved' AND resolved_at > NOW() - INTERVAL '7 days') AS resolved_signals_7d,
    -- 2nd purchase rate: customers with 2+ orders / customers who made 1st purchase in last 30 days
    COALESCE((
      SELECT ROUND(
        100.0 * COUNT(*) FILTER (WHERE total_orders >= 2) / NULLIF(COUNT(*), 0),
        1
      )
      FROM customers
      WHERE first_purchase_date > NOW() - INTERVAL '30 days'
    ), 0) AS new_signup_repurchase_rate,
    -- App revenue share
    COALESCE((
      SELECT ROUND(
        100.0 * SUM(total_amount) FILTER (WHERE channel = 'app') / NULLIF(SUM(total_amount), 0),
        1
      )
      FROM orders
      WHERE ordered_at > NOW() - INTERVAL '30 days'
    ), 0) AS app_revenue_share;
END;
$$;

-- Golden Journey funnel for new signups
CREATE OR REPLACE FUNCTION get_journey_funnel(days_back INT DEFAULT 30)
RETURNS TABLE (
  stage TEXT,
  count BIGINT,
  pct NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  base_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO base_count
  FROM customers
  WHERE signup_date > NOW() - (days_back || ' days')::INTERVAL;

  RETURN QUERY
  SELECT
    'D+0 가입'::TEXT,
    base_count,
    100.0::NUMERIC
  UNION ALL
  SELECT 'D+1 탐색'::TEXT,
    COUNT(*)::BIGINT,
    ROUND(100.0 * COUNT(*) / NULLIF(base_count, 0), 1)
  FROM customers
  WHERE signup_date > NOW() - (days_back || ' days')::INTERVAL
    AND lifecycle_stage IN ('browsing_d1', 'first_purchase_d2', 'engaged_d7', 'second_purchase_d14', 'retained_d30')
  UNION ALL
  SELECT 'D+2 첫구매'::TEXT,
    COUNT(*)::BIGINT,
    ROUND(100.0 * COUNT(*) / NULLIF(base_count, 0), 1)
  FROM customers
  WHERE signup_date > NOW() - (days_back || ' days')::INTERVAL
    AND lifecycle_stage IN ('first_purchase_d2', 'engaged_d7', 'second_purchase_d14', 'retained_d30')
  UNION ALL
  SELECT 'D+14 2차구매'::TEXT,
    COUNT(*)::BIGINT,
    ROUND(100.0 * COUNT(*) / NULLIF(base_count, 0), 1)
  FROM customers
  WHERE signup_date > NOW() - (days_back || ' days')::INTERVAL
    AND total_orders >= 2;
END;
$$;

-- Assign a signal to someone, creating a corresponding task
CREATE OR REPLACE FUNCTION assign_signal(
  p_signal_id UUID,
  p_assignee TEXT,
  p_due_date DATE DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_signal RECORD;
  v_task_id UUID;
BEGIN
  SELECT * INTO v_signal FROM signals WHERE id = p_signal_id;

  -- Update signal status
  UPDATE signals
  SET status = 'assigned', assigned_to = p_assignee, updated_at = NOW()
  WHERE id = p_signal_id;

  -- Create a task
  INSERT INTO tasks (signal_id, title, description, department, assignee, priority, due_date)
  VALUES (
    p_signal_id,
    v_signal.title,
    v_signal.suggested_action,
    v_signal.department,
    p_assignee,
    v_signal.severity,
    p_due_date
  )
  RETURNING id INTO v_task_id;

  RETURN v_task_id;
END;
$$;

-- Resolve a signal with an optional outcome note
CREATE OR REPLACE FUNCTION resolve_signal(
  p_signal_id UUID,
  p_outcome_note TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE signals
  SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
  WHERE id = p_signal_id;

  IF p_outcome_note IS NOT NULL THEN
    UPDATE tasks
    SET status = 'done', outcome_note = p_outcome_note, updated_at = NOW()
    WHERE signal_id = p_signal_id;
  END IF;
END;
$$;

-- ========== 7. ROW LEVEL SECURITY ==========
-- Enable RLS on all tables. Customize policies based on the auth model.

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Permissive starter policies — tighten before production
CREATE POLICY "Authenticated users can read all"
  ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read signals"
  ON signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update signals"
  ON signals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can write tasks"
  ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can read orders"
  ON orders FOR SELECT TO authenticated USING (true);
