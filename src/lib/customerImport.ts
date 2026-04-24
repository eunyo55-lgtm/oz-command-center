import type { Customer, RFMSegment, LifecycleStage } from '../types';

// 카페24 엑셀 컬럼명 매핑 (다양한 변형 지원)
const COLUMN_MAP: Record<keyof CafeRawRow, string[]> = {
  grade: ['회원등급', '등급'],
  id: ['아이디', '회원아이디', 'ID'],
  name: ['이름', '성명', '회원명'],
  email: ['이메일', '이메일주소', 'E-mail'],
  phone: ['전화번호', '휴대폰', '연락처', '휴대폰번호'],
  totalSpent: ['총구매금액', '총 구매금액'],
  actualPayment: ['실결제금액', '실 결제금액'],
  lastOrderDate: ['최종주문일', '최근주문일'],
  totalOrders: ['총 실주문건수', '총실주문건수', '누적주문건수', '총주문건수'],
  membershipType: ['회원구분'],
  signupDate: ['회원 가입일', '회원가입일', '가입일'],
  withdrawn: ['탈퇴여부'],
  dormantDate: ['휴면처리일'],
  appInstalled: ['모바일앱 이용여부', '앱이용여부', '모바일앱'],
};

interface CafeRawRow {
  grade: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  actualPayment: number;
  lastOrderDate: string;
  totalOrders: number;
  membershipType: string;
  signupDate: string;
  withdrawn: string;
  dormantDate: string;
  appInstalled: string;
}

// 엑셀 행에서 필요한 필드 추출 (컬럼명 auto-detect)
export function extractRow(row: Record<string, any>): Partial<CafeRawRow> {
  const result: Partial<CafeRawRow> = {};
  for (const [key, variants] of Object.entries(COLUMN_MAP)) {
    for (const variant of variants) {
      if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
        (result as any)[key] = row[variant];
        break;
      }
    }
  }
  return result;
}

// 날짜 파싱 (YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD 등 모두 지원)
function parseDate(value: any): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  // 숫자 (엑셀 시리얼 날짜)
  if (typeof value === 'number') {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  // 문자열 날짜
  const cleaned = str.replace(/[./]/g, '-');
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

// 숫자 파싱 (콤마 제거)
function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/[,원\s]/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

// RFM 세그먼트 자동 분류
export function classifyRFM(
  totalSpent: number,
  totalOrders: number,
  daysSinceLastPurchase: number | null,
  daysSinceSignup: number
): RFMSegment {
  // 신규 (가입 30일 이내, 구매 0~1회)
  if (daysSinceSignup <= 30 && totalOrders <= 1) return 'new';

  // 이탈 (365일 이상 미구매)
  if (daysSinceLastPurchase !== null && daysSinceLastPurchase > 365) return 'lost';

  // 휴면 (180~365일 미구매)
  if (daysSinceLastPurchase !== null && daysSinceLastPurchase > 180) return 'hibernating';

  // VIP/챔피언 (구매 10회 이상 또는 100만원 이상)
  if (totalOrders >= 10 || totalSpent >= 1000000) return 'champions';

  // 이탈 위험 (60~180일 미구매, 이전엔 활발했음)
  if (daysSinceLastPurchase !== null && daysSinceLastPurchase > 60 && totalOrders >= 2) {
    return 'at_risk';
  }

  // 충성 (3회 이상 구매)
  if (totalOrders >= 3) return 'loyal';

  // 잠재 (1~2회 구매)
  if (totalOrders >= 1) return 'potential';

  return 'new';
}

// 라이프사이클 단계 자동 분류
export function classifyLifecycle(
  daysSinceSignup: number,
  totalOrders: number,
  daysSinceLastPurchase: number | null
): LifecycleStage {
  if (daysSinceLastPurchase !== null && daysSinceLastPurchase > 180) return 'dormant';
  if (daysSinceSignup === 0) return 'signup_d0';
  if (daysSinceSignup === 1 && totalOrders === 0) return 'browsing_d1';
  if (totalOrders === 1 && daysSinceSignup <= 2) return 'first_purchase_d2';
  if (totalOrders >= 2 && daysSinceSignup >= 14) return 'second_purchase_d14';
  if (daysSinceSignup >= 7 && daysSinceSignup < 14) return 'engaged_d7';
  if (daysSinceSignup >= 30) return 'retained_d30';
  return 'browsing_d1';
}

// 일수 계산
function daysBetween(from: string | null, to: Date = new Date()): number | null {
  if (!from) return null;
  const fromDate = new Date(from);
  if (isNaN(fromDate.getTime())) return null;
  return Math.floor((to.getTime() - fromDate.getTime()) / (86400 * 1000));
}

// 한 줄을 Customer 객체로 변환
export function transformRow(row: Record<string, any>): Customer | null {
  const raw = extractRow(row);

  if (!raw.id || !raw.name) return null; // 필수값 없으면 skip

  const signupDateStr = parseDate(raw.signupDate);
  if (!signupDateStr) return null; // 가입일 필수

  const lastPurchaseDateStr = parseDate(raw.lastOrderDate);
  const totalSpent = parseNumber(raw.totalSpent);
  const totalOrders = parseNumber(raw.totalOrders);

  const daysSinceSignup = daysBetween(signupDateStr) ?? 0;
  const daysSinceLastPurchase = daysBetween(lastPurchaseDateStr);

  const rfm = classifyRFM(totalSpent, totalOrders, daysSinceLastPurchase, daysSinceSignup);
  const lifecycle = classifyLifecycle(daysSinceSignup, totalOrders, daysSinceLastPurchase);

  // 태그 자동 생성
  const tags: string[] = [];
  if (rfm === 'champions') tags.push('VIP');
  if (totalOrders === 0) tags.push('미구매');
  else if (totalOrders === 1) tags.push('첫구매_완료');
  if (raw.membershipType?.includes('휴면')) tags.push('휴면');
  if (daysSinceLastPurchase !== null && daysSinceLastPurchase > 60 && daysSinceLastPurchase <= 180) {
    tags.push('이탈위험');
  }

  // 이메일 마스킹 (개인정보 보호)
  const maskedEmail = raw.email
    ? raw.email.replace(/^(.{1})(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 3))}${c}`)
    : '';

  // 전화번호 마스킹
  const maskedPhone = raw.phone
    ? String(raw.phone).replace(/(\d{2,3})-?(\d{3,4})-?(\d{4})/, '$1-****-$3')
    : '';

  // T/F 값을 boolean으로 변환
  const parseTF = (value: any): boolean => {
    const str = String(value || '').trim().toUpperCase();
    return str === 'T' || str === 'TRUE' || str === 'Y' || str === 'YES' || str === '1' || str === 'O';
  };

  const isAppInstalled = parseTF(raw.appInstalled);
  const isWithdrawn = parseTF(raw.withdrawn);
  const withdrawnDateStr = parseDate(raw.dormantDate);

  return {
    id: '', // Supabase가 UUID 자동 생성. 업로드 시 제외됨
    customer_code: raw.id,
    name: raw.name,
    email: maskedEmail,
    phone: maskedPhone,
    grade: raw.grade || '일반',
    signup_date: signupDateStr,
    first_purchase_date: null,
    last_purchase_date: lastPurchaseDateStr,
    total_orders: totalOrders,
    total_spent: totalSpent,
    app_installed: isAppInstalled,
    withdrawn: isWithdrawn,
    withdrawn_date: withdrawnDateStr,
    rfm_segment: rfm,
    lifecycle_stage: lifecycle,
    days_since_signup: daysSinceSignup,
    tags,
  };
}

// 업로드 검증 결과
export interface ImportValidation {
  total: number;
  valid: number;
  invalid: number;
  detectedColumns: string[];
  missingColumns: string[];
  preview: Customer[];
}

export function validateImport(rows: Record<string, any>[]): ImportValidation {
  if (rows.length === 0) {
    return { total: 0, valid: 0, invalid: 0, detectedColumns: [], missingColumns: Object.keys(COLUMN_MAP), preview: [] };
  }

  const firstRow = rows[0];
  const fileColumns = Object.keys(firstRow);
  const detectedColumns: string[] = [];
  const missingColumns: string[] = [];

  for (const [key, variants] of Object.entries(COLUMN_MAP)) {
    const matched = variants.find(v => fileColumns.includes(v));
    if (matched) {
      detectedColumns.push(`${key} ← ${matched}`);
    } else {
      missingColumns.push(key);
    }
  }

  let valid = 0;
  let invalid = 0;
  const preview: Customer[] = [];

  for (const row of rows) {
    const transformed = transformRow(row);
    if (transformed) {
      valid++;
      if (preview.length < 5) preview.push(transformed);
    } else {
      invalid++;
    }
  }

  return {
    total: rows.length,
    valid,
    invalid,
    detectedColumns,
    missingColumns,
    preview,
  };
}
