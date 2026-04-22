# OZ-Command Center

> 오즈키즈 데이터 기반 성장 전략 플랫폼
> 26만 명의 고객 데이터를 자산화하고 영업(MD) · 마케팅 · 비주얼팀이 유기적으로 협업하는 통합 인텔리전스 앱

![Stack](https://img.shields.io/badge/React-18-61DAFB) ![Stack](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E) ![Stack](https://img.shields.io/badge/Vite-5-646CFF) ![Stack](https://img.shields.io/badge/Tailwind-3-06B6D4)

## 기획 핵심

데이터 시그널을 통한 선제적 대응 및 부서 간 협업 최적화.

- **신규 회원의 2차 구매 전환율 20% 향상**
- **앱 이용 고객 비중 확대를 통한 리텐션 강화**
- **시즌별 킬러 아이템 발굴 및 객단가(AOV) 증대**

## 주요 모듈

| 모듈 | 설명 | 경로 |
|-----|------|-----|
| **Command** | KPI 스냅샷 · 긴급 시그널 · Golden Journey 퍼널 · RFM 분포 | `/` |
| **Signals** | 부서별 시그널 카드 · 담당자 배정 · 상태 추적 | `/signals` |
| **Customers** | 26만 고객 DB · RFM 세그먼트 필터 · 상세 드로워 | `/customers` |
| **Intelligence** | 카테고리 히트맵 · 트렌드 예측 · Aha Item 분석 | `/intelligence` |
| **Board** | 칸반 협업 보드 · 성공 사례 노트 | `/board` |
| **Products** | 판매속도 · CVR · 재고 현황 | `/products` |

## 로컬 실행

```bash
npm install
cp .env.example .env   # Supabase 키를 넣으세요 (없어도 목업 데이터로 동작)
npm run dev
```

## Supabase 설정

1. [supabase.com](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/20260421000000_init.sql` 전체 실행
3. Settings → API에서 Project URL과 anon key를 `.env`에 복사
4. 카페24 Open API에서 고객/주문/상품 데이터를 정기 수집해 각 테이블에 적재

### RPC 함수 사용 예시

```typescript
// KPI 스냅샷
const { data } = await supabase.rpc('get_kpi_snapshot');

// Golden Journey 퍼널
const { data: funnel } = await supabase.rpc('get_journey_funnel', { days_back: 30 });

// 시그널 배정 (자동으로 Task 생성)
await supabase.rpc('assign_signal', {
  p_signal_id: 'sig_001',
  p_assignee: '김마케',
  p_due_date: '2026-04-28'
});

// 시그널 해결 (outcome note 포함)
await supabase.rpc('resolve_signal', {
  p_signal_id: 'sig_001',
  p_outcome_note: '구매 전환율 5% 상승'
});
```

## Vercel 배포

```bash
npm run build
vercel --prod
```

환경변수는 Vercel 대시보드 → Settings → Environment Variables에서 설정하세요.

## 데이터 파이프라인

```
[Cafe24 API]  →  [데이터 수집 Edge Function]  →  [Supabase]  →  [OZ-Command Center]
  ↓
  회원 · 주문 · 상품 마스터
  
[AI 분석 엔진]  →  [signals 테이블]
  RFM 모델 · 패턴 분석 · 시즌 예측
```

## 디자인 시스템

- **타이포그래피**: Instrument Serif (display) · Instrument Sans (body) · Space Mono / JetBrains Mono (data)
- **팔레트**: Obsidian ink + OZ signal amber + 부서 컬러 (MD emerald · 마케팅 coral · 비주얼 periwinkle)
- **무드**: editorial data-intelligence · terminal-inspired · "command center"

## 향후 로드맵

- [ ] Cafe24 Open API 수집 Edge Function 작성
- [ ] 시그널 자동 생성 Cron Job (재고 임박, 검색량 급상승 등)
- [ ] 푸시/LMS 캠페인 발송 통합
- [ ] 시그널 해결 → 성과 측정 자동화
- [ ] RFM 모델 재학습 파이프라인

---

*Built with 💡 for 오즈키즈 team · v1.0 · 2026-04-21*
