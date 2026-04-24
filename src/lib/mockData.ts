import type { Signal, Customer, Product, Task, KPISnapshot } from '../types';

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400 * 1000).toISOString();

export const mockSignals: Signal[] = [
  {
    id: 'sig_001',
    department: 'md',
    severity: 'critical',
    title: '아쿠아슈즈 키즈 140 재고 소진 임박',
    description: '최근 7일간 판매 속도 기준 2.3일 후 품절 예상. 작년 동기 대비 검색량 +312%.',
    metric_value: 47,
    metric_unit: '개',
    metric_delta: 312,
    suggested_action: '공급사 긴급 발주 요청 + 세트 번들(레시가드 + 아쿠아슈즈) 기획',
    related_entity: 'OZ-AQ-140-BLU',
    created_at: hoursAgo(1),
    status: 'new',
    assigned_to: null,
  },
  {
    id: 'sig_002',
    department: 'mkt',
    severity: 'high',
    title: '첫 구매 후 14일 경과 미방문 신규 고객 1,847명',
    description: '지난 주 대비 +23%. 평균 객단가 37,200원. 재구매 전환 골든타임 초과 임박.',
    metric_value: 1847,
    metric_unit: '명',
    metric_delta: 23,
    suggested_action: 'LMS + 앱 푸시 듀얼 캠페인. 아쿠아슈즈/샌들 추천 + 5% 쿠폰',
    related_entity: '신규_14d_미방문',
    created_at: hoursAgo(2),
    status: 'assigned',
    assigned_to: '김마케',
  },
  {
    id: 'sig_003',
    department: 'visual',
    severity: 'high',
    title: '여름 메인배너 CVR 기준치 하회',
    description: '유입 대비 클릭률 1.2% (목표 3%). 특히 모바일 앱 배너에서 이탈 높음.',
    metric_value: 1.2,
    metric_unit: '%',
    metric_delta: -47,
    suggested_action: 'A/B 테스트: 모델컷 vs 실측 중심 배너 교체',
    related_entity: 'banner_summer_main_v2',
    created_at: hoursAgo(4),
    status: 'in_progress',
    assigned_to: '이비주',
  },
  {
    id: 'sig_004',
    department: 'md',
    severity: 'high',
    title: '샌들 카테고리 검색량 급상승',
    description: '3일 연속 일일 검색량 15% 이상 증가. 작년 동기 대비 2주 앞선 시즌 진입.',
    metric_value: 18,
    metric_unit: '%',
    metric_delta: 18,
    suggested_action: '샌들 기획전 예정일 2주 앞당기기 + 메인 노출 조정',
    related_entity: 'category_sandals',
    created_at: hoursAgo(6),
    status: 'new',
    assigned_to: null,
  },
  {
    id: 'sig_005',
    department: 'mkt',
    severity: 'medium',
    title: '웹 가입자 중 앱 미설치 42%',
    description: '최근 30일 신규 가입자 기준. 앱 이용 고객 재구매율이 웹 대비 2.4배.',
    metric_value: 42,
    metric_unit: '%',
    metric_delta: -3,
    suggested_action: '앱 전용 첫구매 5천원 쿠폰 SMS 발송',
    related_entity: 'segment_web_only',
    created_at: hoursAgo(8),
    status: 'new',
    assigned_to: null,
  },
  {
    id: 'sig_006',
    department: 'mkt',
    severity: 'critical',
    title: 'VIP 고객 3명 이탈 징후 감지',
    description: '최근 60일 미구매 + 월 3회 이상 방문 패턴 중단. 평균 LTV 180만원.',
    metric_value: 3,
    metric_unit: '명',
    metric_delta: null,
    suggested_action: 'VIP 전용 프라이빗 15% 쿠폰 + 기획MD 개별 안내',
    related_entity: 'segment_vip_at_risk',
    created_at: hoursAgo(12),
    status: 'assigned',
    assigned_to: '박CS',
  },
  {
    id: 'sig_007',
    department: 'visual',
    severity: 'medium',
    title: '리뷰 키워드 "색상이 달라요" 증가',
    description: '해당 상품 리뷰 중 색상 언급 28건 (지난주 대비 +75%).',
    metric_value: 28,
    metric_unit: '건',
    metric_delta: 75,
    suggested_action: '상세페이지 색상 실측 컷 추가 + 조명 보정',
    related_entity: 'OZ-SS-SET-PINK',
    created_at: hoursAgo(18),
    status: 'new',
    assigned_to: null,
  },
  {
    id: 'sig_008',
    department: 'md',
    severity: 'medium',
    title: '연관구매 지수 상위: 레시가드 + 모자',
    description: '레시가드 구매자 중 34%가 키즈 모자를 30일 내 구매. 번들 기회.',
    metric_value: 34,
    metric_unit: '%',
    metric_delta: null,
    suggested_action: '세트 구성 상품 기획 + 번들 5% 할인',
    related_entity: 'OZ-RG-KIDS',
    created_at: hoursAgo(24),
    status: 'new',
    assigned_to: null,
  },
];

// Customers — realistic Korean names
export const mockCustomers: Customer[] = [
  { id: 'c001', customer_code: 'OZ-24-001847', name: '김지은', email: 'j***@naver.com', phone: '010-****-3821', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(730), first_purchase_date: daysAgo(728), last_purchase_date: daysAgo(12), total_orders: 23, total_spent: 1840000, app_installed: true, rfm_segment: 'champions', lifecycle_stage: 'retained_d30', days_since_signup: 730, tags: ['VIP', '앱사용자', '리뷰어'] },
  { id: 'c002', customer_code: 'OZ-25-028341', name: '박서연', email: 's***@gmail.com', phone: '010-****-7102', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(14), first_purchase_date: daysAgo(13), last_purchase_date: daysAgo(13), total_orders: 1, total_spent: 37200, app_installed: false, rfm_segment: 'new', lifecycle_stage: 'second_purchase_d14', days_since_signup: 14, tags: ['첫구매_완료', '앱미설치'] },
  { id: 'c003', customer_code: 'OZ-23-019402', name: '이민정', email: 'm***@daum.net', phone: '010-****-5518', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(420), first_purchase_date: daysAgo(418), last_purchase_date: daysAgo(75), total_orders: 8, total_spent: 640000, app_installed: true, rfm_segment: 'at_risk', lifecycle_stage: 'dormant', days_since_signup: 420, tags: ['이탈위험', '앱사용자'] },
  { id: 'c004', customer_code: 'OZ-24-091203', name: '최유진', email: 'y***@naver.com', phone: '010-****-2947', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(180), first_purchase_date: daysAgo(178), last_purchase_date: daysAgo(25), total_orders: 5, total_spent: 389000, app_installed: true, rfm_segment: 'loyal', lifecycle_stage: 'retained_d30', days_since_signup: 180, tags: ['앱사용자'] },
  { id: 'c005', customer_code: 'OZ-25-028402', name: '정하영', email: 'h***@gmail.com', phone: '010-****-6234', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(7), first_purchase_date: daysAgo(5), last_purchase_date: daysAgo(5), total_orders: 1, total_spent: 52000, app_installed: true, rfm_segment: 'new', lifecycle_stage: 'engaged_d7', days_since_signup: 7, tags: ['첫구매_완료', '앱사용자'] },
  { id: 'c006', customer_code: 'OZ-24-045621', name: '한소영', email: 's***@kakao.com', phone: '010-****-8801', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(90), first_purchase_date: daysAgo(88), last_purchase_date: daysAgo(45), total_orders: 3, total_spent: 178000, app_installed: false, rfm_segment: 'potential', lifecycle_stage: 'retained_d30', days_since_signup: 90, tags: ['앱미설치'] },
  { id: 'c007', customer_code: 'OZ-22-003847', name: '윤지민', email: 'j***@naver.com', phone: '010-****-4412', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(1100), first_purchase_date: daysAgo(1098), last_purchase_date: daysAgo(3), total_orders: 41, total_spent: 3210000, app_installed: true, rfm_segment: 'champions', lifecycle_stage: 'retained_d30', days_since_signup: 1100, tags: ['VIP', '앱사용자', '리뷰어', '인플루언서'] },
  { id: 'c008', customer_code: 'OZ-25-028501', name: '강예린', email: 'y***@gmail.com', phone: '010-****-9934', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(2), first_purchase_date: null, last_purchase_date: null, total_orders: 0, total_spent: 0, app_installed: false, rfm_segment: 'new', lifecycle_stage: 'browsing_d1', days_since_signup: 2, tags: ['미구매'] },
  { id: 'c009', customer_code: 'OZ-23-018203', name: '조미래', email: 'm***@daum.net', phone: '010-****-1023', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(540), first_purchase_date: daysAgo(538), last_purchase_date: daysAgo(180), total_orders: 4, total_spent: 245000, app_installed: false, rfm_segment: 'hibernating', lifecycle_stage: 'dormant', days_since_signup: 540, tags: ['휴면'] },
  { id: 'c010', customer_code: 'OZ-24-076102', name: '임채원', email: 'c***@naver.com', phone: '010-****-5672', grade: '일반', withdrawn: false, withdrawn_date: null, signup_date: daysAgo(60), first_purchase_date: daysAgo(58), last_purchase_date: daysAgo(8), total_orders: 3, total_spent: 156000, app_installed: true, rfm_segment: 'loyal', lifecycle_stage: 'retained_d30', days_since_signup: 60, tags: ['앱사용자'] },
];

export const mockProducts: Product[] = [
  { id: 'p001', sku: 'OZ-AQ-140-BLU', name: '키즈 아쿠아슈즈 140 블루', category: '아쿠아슈즈', season: 'summer', price: 24900, stock: 47, sales_velocity: 20.3, cvr: 4.8, is_aha_item: true, views_7d: 12400, sales_7d: 142 },
  { id: 'p002', sku: 'OZ-SS-SET-PINK', name: '여아 래시가드 세트 핑크', category: '래시가드', season: 'summer', price: 39000, stock: 234, sales_velocity: 12.1, cvr: 3.2, is_aha_item: true, views_7d: 8700, sales_7d: 85 },
  { id: 'p003', sku: 'OZ-SD-KIDS-BRN', name: '키즈 스트랩 샌들 브라운', category: '샌들', season: 'summer', price: 32000, stock: 189, sales_velocity: 8.7, cvr: 2.9, is_aha_item: false, views_7d: 6300, sales_7d: 61 },
  { id: 'p004', sku: 'OZ-HT-BUCKET', name: '키즈 버킷햇 UV차단', category: '모자', season: 'summer', price: 18900, stock: 412, sales_velocity: 15.4, cvr: 5.1, is_aha_item: true, views_7d: 9800, sales_7d: 108 },
  { id: 'p005', sku: 'OZ-RG-KIDS', name: '키즈 레시가드 UPF50+', category: '래시가드', season: 'summer', price: 29000, stock: 156, sales_velocity: 11.2, cvr: 3.8, is_aha_item: false, views_7d: 7200, sales_7d: 78 },
  { id: 'p006', sku: 'OZ-SW-GIRL-130', name: '여아 원피스 수영복 130', category: '수영복', season: 'summer', price: 34000, stock: 89, sales_velocity: 9.5, cvr: 4.1, is_aha_item: false, views_7d: 5400, sales_7d: 67 },
];

export const mockTasks: Task[] = [
  { id: 't001', signal_id: 'sig_002', title: '14일 미방문 신규고객 LMS 캠페인', description: '1,847명 대상 아쿠아슈즈 추천 + 5% 쿠폰', department: 'mkt', assignee: '김마케', status: 'doing', priority: 'high', created_at: hoursAgo(2), due_date: daysAgo(-2), outcome_note: null },
  { id: 't002', signal_id: 'sig_003', title: '여름 메인배너 A/B 테스트', description: '모델컷 vs 실측 중심 배너 제작', department: 'visual', assignee: '이비주', status: 'doing', priority: 'high', created_at: hoursAgo(4), due_date: daysAgo(-1), outcome_note: null },
  { id: 't003', signal_id: 'sig_006', title: 'VIP 이탈 위험군 3명 개별 케어', description: 'VIP 프라이빗 15% 쿠폰 + 기획MD 개별 안내', department: 'mkt', assignee: '박CS', status: 'doing', priority: 'critical', created_at: hoursAgo(12), due_date: daysAgo(-1), outcome_note: null },
  { id: 't004', signal_id: null, title: '아쿠아슈즈 상세페이지 모델컷 교체', description: '지난 시즌 피드백 반영', department: 'visual', assignee: '이비주', status: 'done', priority: 'medium', created_at: daysAgo(7), due_date: daysAgo(3), outcome_note: '구매 전환율 3.1% → 4.8% 상승 (+54%)' },
  { id: 't005', signal_id: null, title: '래시가드 세트 번들 기획', description: '래시가드 + 모자 번들 5% 할인', department: 'md', assignee: '정MD', status: 'review', priority: 'medium', created_at: daysAgo(3), due_date: daysAgo(-2), outcome_note: null },
  { id: 't006', signal_id: null, title: '앱 설치 유도 푸시 템플릿 작성', description: '첫구매 5천원 쿠폰 SMS', department: 'mkt', assignee: '김마케', status: 'todo', priority: 'medium', created_at: daysAgo(1), due_date: daysAgo(-5), outcome_note: null },
];

export const mockKPI: KPISnapshot = {
  new_signup_repurchase_rate: 18.3,
  target_repurchase_rate: 22.0,
  app_revenue_share: 47,
  target_app_revenue_share: 60,
  active_signals: 8,
  resolved_signals_7d: 23,
  total_customers: 263482,
  vip_customers: 3184,
};

// Golden Journey funnel data
export const mockJourneyFunnel = [
  { stage: 'D+0 가입', count: 2847, pct: 100 },
  { stage: 'D+1 탐색', count: 2142, pct: 75 },
  { stage: 'D+2 첫구매', count: 1284, pct: 45 },
  { stage: 'D+7 관여', count: 912, pct: 32 },
  { stage: 'D+14 2차구매', count: 521, pct: 18 },
  { stage: 'D+30 리텐션', count: 384, pct: 13 },
];

// Category heatmap — sales velocity by week
export const mockCategoryHeatmap = [
  { category: '아쿠아슈즈', w1: 8, w2: 14, w3: 22, w4: 35, w5: 48, w6: 62 },
  { category: '래시가드', w1: 6, w2: 11, w3: 18, w4: 28, w5: 41, w6: 55 },
  { category: '수영복', w1: 5, w2: 9, w3: 15, w4: 24, w5: 37, w6: 51 },
  { category: '샌들', w1: 4, w2: 7, w3: 12, w4: 19, w5: 31, w6: 44 },
  { category: '모자', w1: 7, w2: 10, w3: 15, w4: 22, w5: 32, w6: 45 },
  { category: '우비', w1: 3, w2: 5, w3: 8, w4: 12, w5: 18, w6: 25 },
];

// Trend forecaster — weekly sales vs last year
export const mockTrendData = Array.from({ length: 14 }, (_, i) => {
  const week = i + 1;
  const thisYear = Math.round(80 + Math.sin(i * 0.5) * 40 + i * 8 + Math.random() * 15);
  const lastYear = Math.round(70 + Math.sin(i * 0.5 - 0.8) * 35 + i * 6 + Math.random() * 12);
  return { week: `W${week}`, thisYear, lastYear, forecast: Math.round(thisYear * 1.15) };
});

// RFM distribution
export const mockRFMDistribution = [
  { segment: 'VIP', count: 3184, value: 3184 },
  { segment: '충성 고객', count: 18420, value: 18420 },
  { segment: '잠재 고객', count: 42100, value: 42100 },
  { segment: '신규', count: 28340, value: 28340 },
  { segment: '이탈 위험', count: 15200, value: 15200 },
  { segment: '휴면', count: 98200, value: 98200 },
  { segment: '이탈', count: 58038, value: 58038 },
];
