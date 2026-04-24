// Department types
export type Department = 'md' | 'mkt' | 'visual';

export const DEPARTMENT_LABELS: Record<Department, string> = {
  md: '영업 / MD',
  mkt: '마케팅',
  visual: '비주얼',
};

export const DEPARTMENT_COLORS: Record<Department, string> = {
  md: '#00D9A3',
  mkt: '#FF5E7E',
  visual: '#7B9EFF',
};

// Signal severity
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: '긴급',
  high: '높음',
  medium: '보통',
  low: '참고',
};

// Signal card — the core unit of OZ-Command Center
export interface Signal {
  id: string;
  department: Department;
  severity: Severity;
  title: string;
  description: string;
  metric_value: number | null;
  metric_unit: string | null;
  metric_delta: number | null; // % change
  suggested_action: string;
  related_entity: string | null; // product name, customer segment, etc.
  created_at: string;
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'dismissed';
  assigned_to: string | null;
}

// Customer (오즈키즈 회원)
export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  signup_date: string;
  first_purchase_date: string | null;
  last_purchase_date: string | null;
  total_orders: number;
  total_spent: number;
  app_installed: boolean;
  withdrawn: boolean;
  withdrawn_date: string | null;
  rfm_segment: RFMSegment;
  lifecycle_stage: LifecycleStage;
  days_since_signup: number;
  tags: string[];
}

export type RFMSegment =
  | 'champions'       // VIP
  | 'loyal'           // 충성
  | 'potential'       // 잠재
  | 'new'             // 신규
  | 'at_risk'         // 이탈 위험
  | 'hibernating'     // 휴면
  | 'lost';           // 이탈

export const RFM_LABELS: Record<RFMSegment, string> = {
champions: '최우수 고객',
  loyal: '재구매 고객',
  potential: '첫구매 고객',
  new: '신규',
  at_risk: '이탈 위험',
  hibernating: '휴면',
  lost: '이탈',
};

// RFM 세그먼트 기준 설명 (툴팁용)
export const RFM_CRITERIA: Record<RFMSegment, string> = {
  champions: '구매 10회 이상 또는 누적 구매 100만원 이상',
  loyal: '구매 3~9회',
  potential: '구매 1~2회',
  new: '가입 30일 이내, 구매 0~1회',
  at_risk: '60~180일 미구매 + 구매 2회 이상',
  hibernating: '180~365일 미구매',
  lost: '365일 이상 미구매',
};

export const RFM_COLORS: Record<RFMSegment, string> = {
  champions: '#F59E0B',
  loyal: '#10B981',
  potential: '#3B82F6',
  new: '#EAB308',
  at_risk: '#EF4444',
  hibernating: '#94A3B8',
  lost: '#64748B',
};

// Golden Journey lifecycle
export type LifecycleStage =
  | 'signup_d0'
  | 'browsing_d1'
  | 'first_purchase_d2'
  | 'engaged_d7'
  | 'second_purchase_d14'
  | 'retained_d30'
  | 'dormant';

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  signup_d0: '가입 당일',
  browsing_d1: '1일차 둘러보기',
  first_purchase_d2: '2일차 첫 구매',
  engaged_d7: '7일차 관여',
  second_purchase_d14: '14일차 2차 구매',
  retained_d30: '30일차 리텐션',
  dormant: '휴면',
};

// Product (category heatmap target)
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  price: number;
  stock: number;
  sales_velocity: number; // units/day
  cvr: number; // conversion rate
  is_aha_item: boolean;
  views_7d: number;
  sales_7d: number;
}

// Task on collaboration board
export interface Task {
  id: string;
  signal_id: string | null;
  title: string;
  description: string;
  department: Department;
  assignee: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: Severity;
  created_at: string;
  due_date: string | null;
  outcome_note: string | null; // success story captured on completion
}

// KPI snapshot
export interface KPISnapshot {
  new_signup_repurchase_rate: number;
  target_repurchase_rate: number;
  app_revenue_share: number;
  target_app_revenue_share: number;
  active_signals: number;
  resolved_signals_7d: number;
  total_customers: number;
  vip_customers: number;
}
