import { useMemo, useState } from 'react';
import {
  Users, Search, Smartphone, ShoppingBag, Calendar, TrendingUp, X, Upload,
  UserPlus, Moon, UserX, ArrowUpRight, ArrowDownRight,
  Crown, Award, Medal, Heart, Filter,
} from 'lucide-react';
import { RFM_LABELS, RFM_COLORS, RFM_CRITERIA, LIFECYCLE_LABELS } from '../types';
import type { Customer, RFMSegment } from '../types';
import { formatKRW, formatNumber, cn } from '../lib/utils';
import DateRangeFilter, { getDefaultRange, type DateRange } from '../components/DateRangeFilter';
import CustomerUploadModal from '../components/CustomerUploadModal';
import ConnectionStatus from '../components/ConnectionStatus';
import { useCustomers, clearCustomersCache } from '../hooks/useData';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

type DateField = 'signup_date' | 'last_purchase_date';
type AppFilter = 'all' | 'installed' | 'not_installed';

const GRADE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  VIP:    { color: '#F59E0B', icon: <Crown size={16} />,  label: 'VIP' },
  GOLD:   { color: '#EAB308', icon: <Award size={16} />,  label: 'GOLD' },
  SILVER: { color: '#94A3B8', icon: <Medal size={16} />,  label: 'SILVER' },
  FAMILY: { color: '#EC4899', icon: <Heart size={16} />,  label: 'FAMILY' },
};

// 세그먼트 비즈니스 설명 (카드에 표시)
const SEGMENT_DESCRIPTIONS: Record<RFMSegment, string> = {
  champions:   '브랜드의 핵심 고객, 프리미엄 대우 필요',
  loyal:       '안정적인 반복 구매, 리텐션 타겟',
  potential:   '구매 경험 있음, 재구매 유도 대상',
  new:         '최근 가입한 신규 회원, 웰컴 케어 필요',
  at_risk:     '이탈 직전 고객, 재관심 유도 시급',
  hibernating: '오랫동안 비활성, 재활성화 캠페인 대상',
  lost:        '사실상 이탈, 특별 복귀 전략 필요',
};

const normalizeGrade = (g: string): string => {
  const upper = (g || '').trim().toUpperCase();
  if (upper.includes('VIP')) return 'VIP';
  if (upper.includes('GOLD')) return 'GOLD';
  if (upper.includes('SILVER')) return 'SILVER';
  if (upper.includes('FAMILY')) return 'FAMILY';
  return upper || '기타';
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [segmentFilters, setSegmentFilters] = useState<Set<RFMSegment>>(new Set());
  const [gradeFilters, setGradeFilters] = useState<Set<string>>(new Set());
  const [appFilter, setAppFilter] = useState<AppFilter>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [range, setRange] = useState<DateRange>(getDefaultRange());
  const [dateField, setDateField] = useState<DateField>('signup_date');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { data: allCustomersRaw, source, error, loading } = useCustomers();

  const allCustomers = useMemo(() => {
    return allCustomersRaw.filter(c => !c.withdrawn);
  }, [allCustomersRaw]);

  const withdrawnCount = useMemo(() => {
    return allCustomersRaw.filter(c => c.withdrawn).length;
  }, [allCustomersRaw]);

  const hasAppData = useMemo(() => allCustomers.some(c => c.app_installed), [allCustomers]);

  const kpi = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400 * 1000).toISOString().slice(0, 10);
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400 * 1000).toISOString().slice(0, 10);

    const total = allCustomers.length;
    const hibernating = allCustomers.filter(c => c.rfm_segment === 'hibernating').length;

    const signupDates = allCustomers
      .map(c => c.signup_date)
      .filter(d => d && d <= today)
      .sort()
      .reverse();

    const mostRecentDate = signupDates[0] || yesterday;
    const newYesterday = allCustomers.filter(c => c.signup_date === mostRecentDate).length;

    const mostRecentIdx = signupDates.findIndex(d => d !== mostRecentDate);
    const previousDate = mostRecentIdx > 0 ? signupDates[mostRecentIdx] : twoDaysAgo;
    const newPrevious = allCustomers.filter(c => c.signup_date === previousDate).length;

    const newDelta = newPrevious > 0 ? ((newYesterday - newPrevious) / newPrevious) * 100 : 0;

    return {
      newYesterday, newDelta, mostRecentDate,
      total, hibernating,
      hibernatingPct: total > 0 ? (hibernating / total) * 100 : 0,
    };
  }, [allCustomers]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCustomers.forEach(c => {
      const key = normalizeGrade(c.grade);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [allCustomers]);

  const gradeDistribution = useMemo(() => {
    const total = allCustomers.length;
    const sorted = Object.keys(gradeCounts).sort((a, b) => (gradeCounts[b] || 0) - (gradeCounts[a] || 0));
    return sorted.map(grade => ({
      grade,
      count: gradeCounts[grade] || 0,
      pct: total > 0 ? ((gradeCounts[grade] || 0) / total) * 100 : 0,
      color: GRADE_CONFIG[grade]?.color || '#A3A3A3',
    }));
  }, [allCustomers, gradeCounts]);

  const segmentDist = useMemo(() => {
    const counts: Record<string, number> = {};
    allCustomers.forEach(c => {
      counts[c.rfm_segment] = (counts[c.rfm_segment] || 0) + 1;
    });
    const order: RFMSegment[] = ['champions', 'loyal', 'potential', 'new', 'at_risk', 'hibernating', 'lost'];
    return order.map(seg => ({
      name: RFM_LABELS[seg],
      key: seg,
      value: counts[seg] || 0,
      color: RFM_COLORS[seg],
      pct: allCustomers.length > 0 ? ((counts[seg] || 0) / allCustomers.length) * 100 : 0,
      criteria: RFM_CRITERIA[seg],
      description: SEGMENT_DESCRIPTIONS[seg],
    }));
  }, [allCustomers]);

  const signupTrend = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = allCustomers.filter(c => c.signup_date === dateStr).length;
      days.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
    }
    return days;
  }, [allCustomers]);

  const toggleSegment = (seg: RFMSegment) => {
    const newSet = new Set(segmentFilters);
    if (newSet.has(seg)) newSet.delete(seg);
    else newSet.add(seg);
    setSegmentFilters(newSet);
  };

  const toggleGrade = (grade: string) => {
    const newSet = new Set(gradeFilters);
    if (newSet.has(grade)) newSet.delete(grade);
    else newSet.add(grade);
    setGradeFilters(newSet);
  };

  const clearAllFilters = () => {
    setSegmentFilters(new Set());
    setGradeFilters(new Set());
    setAppFilter('all');
    setSearch('');
  };

  const hasActiveFilters = segmentFilters.size > 0 || gradeFilters.size > 0 || appFilter !== 'all' || search.length > 0;

  const filtered = useMemo(() => {
    const fromTs = new Date(range.from).getTime();
    const toTs = new Date(range.to).getTime() + 86400000;

    return allCustomers.filter(c => {
      if (segmentFilters.size > 0 && !segmentFilters.has(c.rfm_segment)) return false;
      if (gradeFilters.size > 0 && !gradeFilters.has(normalizeGrade(c.grade))) return false;
      if (appFilter === 'installed' && !c.app_installed) return false;
      if (appFilter === 'not_installed' && c.app_installed) return false;
      if (search && !`${c.name} ${c.customer_code} ${c.email}`.toLowerCase().includes(search.toLowerCase())) return false;

      const target = dateField === 'signup_date' ? c.signup_date : c.last_purchase_date;
      if (!target) return dateField === 'last_purchase_date' ? false : true;
      const ts = new Date(target).getTime();
      if (ts < fromTs || ts > toTs) return false;

      return true;
    });
  }, [search, segmentFilters, gradeFilters, appFilter, range, dateField, allCustomers]);

  return (
    <div className="grid-bg min-h-full">
      <section className="px-8 pt-8 pb-6 border-b border-paper-200">
        <div className="flex items-start justify-between gap-6 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Users size={14} className="text-paper-500" />
              <span className="micro-label">CUSTOMER INSIGHT</span>
            </div>
            <h1 className="text-3xl font-bold text-paper-900 mb-2 tracking-tight">고객 인사이트</h1>
            <p className="text-paper-600 text-sm max-w-2xl">
              RFM 세그먼트, 라이프사이클, 회원 등급을 기반으로 고객을 분석합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ConnectionStatus source={source} error={error} />
            <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-signal-500 hover:bg-signal-600 text-white text-sm font-semibold rounded-md transition-colors shadow-sm whitespace-nowrap">
              <Upload size={14} />
              CSV 업로드
            </button>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-paper-500">
            <div className="w-3 h-3 border-2 border-signal-500 border-t-transparent rounded-full animate-spin" />
            <span>전체 고객 데이터 로딩 중...</span>
          </div>
        )}
      </section>

      {/* 1. 일별 신규가입 (최상단!) */}
      <section className="px-8 py-6 border-b border-paper-200">
        <div className="panel p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="micro-label mb-1">SIGNUP TREND</div>
              <h3 className="text-base font-bold text-paper-900">일별 신규가입 (최근 30일)</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div><span className="text-paper-500">총: </span><span className="font-mono font-bold text-paper-900 numeric">{formatNumber(signupTrend.reduce((s, d) => s + d.count, 0))}명</span></div>
              <div><span className="text-paper-500">평균: </span><span className="font-mono font-bold text-paper-900 numeric">{(signupTrend.reduce((s, d) => s + d.count, 0) / 30).toFixed(1)}명/일</span></div>
              <div><span className="text-paper-500">최고: </span><span className="font-mono font-bold text-paper-900 numeric">{Math.max(...signupTrend.map(d => d.count))}명</span></div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupTrend}>
                <defs>
                  <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#F5F5F5" />
                <XAxis dataKey="date" fontSize={10} stroke="#A3A3A3" tick={{ fill: '#737373' }} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="#A3A3A3" tick={{ fill: '#737373' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} labelStyle={{ color: '#F97316', fontWeight: 600 }} formatter={(value: any) => [`${value}명`, '신규가입']} />
                <Area type="monotone" dataKey="count" stroke="#F97316" strokeWidth={2} fill="url(#signupGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 2. KPI 4개 */}
      <section className="px-8 py-6 border-b border-paper-200">
        <div className="micro-label mb-3">MEMBER STATUS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<UserPlus size={16} />} label="전일 신규회원" value={kpi.newYesterday} unit="명" delta={kpi.newDelta} subLabel={kpi.mostRecentDate} accent="#3B82F6" />
          <KpiCard icon={<Users size={16} />} label="누적 회원수" value={kpi.total} unit="명" subLabel="현재 활성 회원" accent="#10B981" />
          <KpiCard icon={<Moon size={16} />} label="휴면 회원" value={kpi.hibernating} unit="명" pct={kpi.hibernatingPct} subLabel="180~365일 미구매" accent="#A3A3A3" negative />
          <KpiCard icon={<UserX size={16} />} label="탈퇴 회원" value={withdrawnCount} unit="명" subLabel="누적 탈퇴 회원" accent="#EF4444" negative />
        </div>
      </section>

      {/* 3. 등급 KPI */}
      <section className="px-8 py-6 border-b border-paper-200">
        <div className="micro-label mb-3">MEMBERSHIP GRADE</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {(['VIP', 'GOLD', 'SILVER', 'FAMILY'] as const).map(grade => {
            const config = GRADE_CONFIG[grade];
            const count = gradeCounts[grade] || 0;
            const pct = kpi.total > 0 ? (count / kpi.total) * 100 : 0;
            const isSelected = gradeFilters.has(grade);
            return (
              <button key={grade} onClick={() => toggleGrade(grade)} className="panel p-4 relative overflow-hidden hover:shadow-md transition-all group text-left cursor-pointer" style={isSelected ? { boxShadow: `0 0 0 2px ${config.color}` } : undefined}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: config.color }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2" style={{ color: config.color }}>
                    {config.icon}
                    <span className="text-xs uppercase tracking-wider font-bold">{config.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-bold text-paper-900 numeric tracking-tight">{formatNumber(count)}</span>
                    <span className="text-xs text-paper-500">명</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-mono font-bold" style={{ color: config.color }}>{pct.toFixed(1)}%</span>
                    <span className="text-2xs text-paper-500">전체 대비</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

<div className="panel p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h4 className="text-sm font-bold text-paper-900">등급 비중</h4>
            <span className="text-2xs font-mono text-paper-500">총 {formatNumber(kpi.total)}명</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {gradeDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: any, _name: any, props: any) => [`${formatNumber(value)}명 (${props.payload.pct.toFixed(1)}%)`, props.payload.grade]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-lg font-bold text-paper-900 numeric">
                  {formatNumber(kpi.total)}
                </div>
                <div className="text-2xs text-paper-500 font-mono">총 고객</div>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {gradeDistribution.map(g => (
                <div key={g.grade} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                    <span className="text-paper-800 font-medium truncate">{g.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono numeric text-paper-900 font-semibold">
                      {formatNumber(g.count)}
                    </span>
                    <span className="font-mono numeric text-paper-500 w-12 text-right">
                      {g.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. 세그먼트 카드 (설명글 포함) */}
      <section className="px-8 py-6 border-b border-paper-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="micro-label">SEGMENT DISTRIBUTION</div>
          <span className="text-2xs text-paper-500">· 클릭으로 필터 · 호버로 기준 확인</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {segmentDist.map(seg => {
            const isSelected = segmentFilters.has(seg.key);
            return (
              <button key={seg.key} onClick={() => toggleSegment(seg.key)} title={`${seg.criteria}`} className="panel p-4 relative overflow-hidden hover:shadow-md transition-all group text-left cursor-pointer" style={isSelected ? { boxShadow: `0 0 0 2px ${seg.color}` } : undefined}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: seg.color }} />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-xs text-paper-700 uppercase tracking-wider font-bold truncate">{seg.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-xl font-bold text-paper-900 numeric tracking-tight">{formatNumber(seg.value)}</span>
                    <span className="text-2xs text-paper-500">명</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xs font-mono font-bold" style={{ color: seg.color }}>{seg.pct.toFixed(1)}%</span>
                  </div>
                  <p className="text-2xs text-paper-600 leading-snug">{seg.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. 필터 */}
      <section className="px-8 py-6 border-b border-paper-200 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={14} className="text-paper-600" />
          <span className="micro-label">FILTERS</span>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-2xs text-signal-600 hover:text-signal-700 underline ml-auto font-semibold">
              모든 필터 초기화
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, ID, 이메일 검색..." className="w-full bg-paper-100 border border-paper-200 focus:border-signal-500 focus:bg-white outline-none rounded-md pl-9 pr-4 py-2 text-sm placeholder-paper-500 transition-colors" />
          </div>
          <select value={dateField} onChange={e => setDateField(e.target.value as DateField)} className="text-sm px-3 py-2 border border-paper-200 rounded-md bg-white focus:border-signal-500 outline-none whitespace-nowrap">
            <option value="signup_date">가입일 기준</option>
            <option value="last_purchase_date">최근 구매일 기준</option>
          </select>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>

        <div>
          <div className="text-2xs text-paper-600 uppercase tracking-wider font-semibold mb-2">등급</div>
          <div className="flex flex-wrap gap-2">
            {(['VIP', 'GOLD', 'SILVER', 'FAMILY'] as const).map(grade => {
              const config = GRADE_CONFIG[grade];
              const count = gradeCounts[grade] || 0;
              const isSelected = gradeFilters.has(grade);
              return (
                <button key={grade} onClick={() => toggleGrade(grade)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-2xs uppercase tracking-wider transition-all font-semibold', !isSelected && 'border-paper-300 text-paper-700 hover:border-paper-400 bg-white')} style={isSelected ? { borderColor: config.color, background: `${config.color}15`, color: config.color } : undefined}>
                  {config.icon}
                  {grade}
                  <span className="numeric text-paper-500">{formatNumber(count)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-2xs text-paper-600 uppercase tracking-wider font-semibold mb-2">세그먼트</div>
          <div className="flex flex-wrap gap-2">
            {segmentDist.map(seg => {
              const isSelected = segmentFilters.has(seg.key);
              return (
                <button key={seg.key} onClick={() => toggleSegment(seg.key)} title={seg.criteria} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md border text-2xs uppercase tracking-wider transition-all font-semibold', !isSelected && 'border-paper-300 text-paper-700 hover:border-paper-400 bg-white')} style={isSelected ? { borderColor: seg.color, background: `${seg.color}15`, color: seg.color } : undefined}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
                  {seg.name}
                  <span className="numeric text-paper-500">{formatNumber(seg.value)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {hasAppData && (
          <div>
            <div className="text-2xs text-paper-600 uppercase tracking-wider font-semibold mb-2">앱 설치</div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'installed', 'not_installed'] as const).map(v => (
                <button key={v} onClick={() => setAppFilter(v)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-2xs uppercase tracking-wider transition-all font-semibold', appFilter === v ? 'border-signal-500 bg-signal-500/10 text-signal-700' : 'border-paper-300 text-paper-700 hover:border-paper-400 bg-white')}>
                  {v === 'all' && '전체'}
                  {v === 'installed' && <><Smartphone size={12} /> 설치</>}
                  {v === 'not_installed' && '미설치'}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 6. 테이블 */}
      <section className="px-8 py-6">
        <div className="text-xs text-paper-600 uppercase tracking-widest mb-4 font-semibold">
          {formatNumber(filtered.length)}명
          {hasActiveFilters && <span className="text-paper-500 ml-2 normal-case tracking-normal font-normal">· 필터 적용됨</span>}
        </div>
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-200 bg-paper-100">
                  <th className="text-left p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">ID</th>
                  <th className="text-left p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">이름</th>
                  <th className="text-left p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">등급</th>
                  {hasAppData && <th className="text-center p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">앱설치</th>}
                  <th className="text-left p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">세그먼트</th>
                  <th className="text-left p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">태그</th>
                  <th className="text-right p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">주문수</th>
                  <th className="text-right p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">주문금액</th>
                  <th className="text-right p-3 text-2xs text-paper-600 uppercase tracking-wider font-semibold">평균구매액</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((c, idx) => {
                  const avgOrder = c.total_orders > 0 ? c.total_spent / c.total_orders : 0;
                  const normalizedGrade = normalizeGrade(c.grade);
                  const gradeColor = GRADE_CONFIG[normalizedGrade]?.color;
                  return (
                    <tr key={c.customer_code || idx} onClick={() => setSelected(c)} className={cn('border-b border-paper-200 hover:bg-signal-50 cursor-pointer transition-colors', idx % 2 === 0 ? 'bg-white' : 'bg-paper-50')}>
                      <td className="p-3 font-mono text-2xs text-paper-600">{c.customer_code}</td>
                      <td className="p-3 text-paper-900 font-medium">{c.name}</td>
                      <td className="p-3">
                        <span className="text-2xs font-mono rounded px-1.5 py-0.5 font-semibold" style={gradeColor ? { border: `1px solid ${gradeColor}30`, background: `${gradeColor}10`, color: gradeColor } : { border: '1px solid #D4D4D4', background: '#F5F5F5', color: '#525252' }}>
                          {c.grade || '일반'}
                        </span>
                      </td>
                      {hasAppData && (
                        <td className="p-3 text-center">
                          {c.app_installed ? <Smartphone size={12} className="inline text-success" /> : <span className="text-paper-400 text-2xs">-</span>}
                        </td>
                      )}
                      <td className="p-3">
                        <span title={RFM_CRITERIA[c.rfm_segment]} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs uppercase tracking-wider border font-semibold cursor-help" style={{ borderColor: `${RFM_COLORS[c.rfm_segment]}30`, background: `${RFM_COLORS[c.rfm_segment]}10`, color: RFM_COLORS[c.rfm_segment] }}>
                          <div className="w-1 h-1 rounded-full" style={{ background: RFM_COLORS[c.rfm_segment] }} />
                          {RFM_LABELS[c.rfm_segment]}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {c.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-2xs font-mono text-paper-600 border border-paper-300 rounded px-1.5 py-0.5 bg-paper-100">{t}</span>
                          ))}
                          {c.tags.length > 2 && <span className="text-2xs font-mono text-paper-500">+{c.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono numeric text-paper-700">{c.total_orders}회</td>
                      <td className="p-3 text-right font-mono numeric text-paper-900 font-semibold">{formatKRW(c.total_spent, true)}</td>
                      <td className="p-3 text-right font-mono numeric text-paper-700">{avgOrder > 0 ? formatKRW(avgOrder, true) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 200 && (
            <div className="p-3 text-center text-xs text-paper-500 border-t border-paper-200">
              상위 200명만 표시 중 · 전체 {formatNumber(filtered.length)}명
            </div>
          )}
        </div>
      </section>

      {/* ★ 중앙 팝업 (기존 오른쪽 드로어 대신) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="panel-elevated bg-white w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-white border-b border-paper-200 p-6 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-mono text-2xs text-paper-500 mb-1">{selected.customer_code}</div>
                  <h3 className="text-2xl font-bold text-paper-900">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 text-paper-500 hover:text-paper-900 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs uppercase tracking-wider border font-semibold" style={{ borderColor: `${RFM_COLORS[selected.rfm_segment]}30`, background: `${RFM_COLORS[selected.rfm_segment]}10`, color: RFM_COLORS[selected.rfm_segment] }}>
                  <div className="w-1 h-1 rounded-full" style={{ background: RFM_COLORS[selected.rfm_segment] }} />
                  {RFM_LABELS[selected.rfm_segment]}
                </span>
                <span className="text-2xs font-mono text-paper-600 border border-paper-300 rounded px-1.5 py-0.5 bg-paper-100">{selected.grade || '일반'}</span>
              </div>
              <p className="text-2xs text-paper-500 mt-2">{RFM_CRITERIA[selected.rfm_segment]}</p>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <DetailStat icon={<ShoppingBag size={12} />} label="총 주문" value={`${selected.total_orders}회`} />
                <DetailStat icon={<TrendingUp size={12} />} label="누적 구매액" value={formatKRW(selected.total_spent, true)} />
                <DetailStat icon={<Calendar size={12} />} label="가입" value={`D+${selected.days_since_signup}`} />
                {hasAppData && <DetailStat icon={<Smartphone size={12} />} label="앱" value={selected.app_installed ? '설치' : '미설치'} />}
              </div>
              <div className="hairline" />
              <div>
                <div className="micro-label mb-2">라이프사이클</div>
                <div className="text-paper-900 text-sm font-medium">{LIFECYCLE_LABELS[selected.lifecycle_stage]}</div>
              </div>
              <div className="space-y-2">
                <div className="micro-label mb-2">연락처</div>
                <div className="flex justify-between text-xs">
                  <span className="text-paper-500 font-mono">EMAIL</span>
                  <span className="text-paper-800 font-mono">{selected.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-paper-500 font-mono">PHONE</span>
                  <span className="text-paper-800 font-mono">{selected.phone}</span>
                </div>
              </div>
              {selected.tags.length > 0 && (
                <>
                  <div className="hairline" />
                  <div>
                    <div className="micro-label mb-2">태그</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {selected.tags.map(t => (
                        <span key={t} className="text-2xs font-mono text-signal-700 border border-signal-500/30 bg-signal-500/10 rounded px-2 py-1 font-medium">#{t}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <CustomerUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            clearCustomersCache();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, unit, delta, pct, subLabel, accent, negative }: { icon: React.ReactNode; label: string; value: number; unit: string; delta?: number; pct?: number; subLabel: string; accent: string; negative?: boolean }) {
  return (
    <div className="panel p-4 relative overflow-hidden hover:shadow-md transition-all group">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: accent }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2" style={{ color: accent }}>
          {icon}
          <span className="text-xs uppercase tracking-wider font-semibold">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl font-bold text-paper-900 numeric tracking-tight">{formatNumber(value)}</span>
          <span className="text-xs text-paper-500">{unit}</span>
        </div>
        <div className="flex items-center gap-2">
          {delta !== undefined && delta !== null && delta !== 0 && (
            <span className={cn('flex items-center gap-0.5 text-2xs font-mono font-bold', (negative ? delta > 0 : delta >= 0) ? 'text-success' : 'text-alert')}>
              {delta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
            </span>
          )}
          {pct !== undefined && <span className="text-2xs font-mono font-bold" style={{ color: accent }}>{pct.toFixed(1)}%</span>}
          <span className="text-2xs text-paper-500">{subLabel}</span>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-1.5 text-paper-500 mb-1">
        {icon}
        <span className="text-2xs uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-lg font-bold text-paper-900 numeric">{value}</div>
    </div>
  );
}
