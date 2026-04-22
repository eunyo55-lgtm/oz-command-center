import { useMemo, useState } from 'react';
import { Radio, TrendingUp, Users, Smartphone, Sparkles, ArrowUpRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  mockSignals, mockKPI, mockJourneyFunnel, mockRFMDistribution, mockTrendData
} from '../lib/mockData';
import { DEPARTMENT_COLORS, RFM_COLORS } from '../types';
import { formatNumber, cn } from '../lib/utils';
import SignalCard from '../components/SignalCard';
import DateRangeFilter, { getDefaultRange, type DateRange } from '../components/DateRangeFilter';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, CartesianGrid
} from 'recharts';

export default function CommandPage() {
  const [range, setRange] = useState<DateRange>(getDefaultRange());

  const criticalSignals = useMemo(
    () => mockSignals.filter(s => s.severity === 'critical' || s.severity === 'high').slice(0, 3),
    []
  );

  const signalsByDept = useMemo(() => {
    const counts = { md: 0, mkt: 0, visual: 0 };
    mockSignals.filter(s => s.status !== 'resolved' && s.status !== 'dismissed').forEach(s => {
      counts[s.department]++;
    });
    return counts;
  }, []);

  return (
    <div className="grid-bg min-h-full">
      {/* Hero section */}
      <section className="px-8 pt-8 pb-6 border-b border-paper-300">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="signal-dot text-success" />
                <span className="font-mono text-2xs uppercase tracking-[0.25em] text-success font-semibold">
                  LIVE · 실시간 동기화 중
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-paper-900 leading-tight mb-2 tracking-tight">
              오늘, <span className="text-signal-600">데이터가</span> 말하는 것
            </h1>
            <p className="text-paper-600 text-sm max-w-xl">
              카페24 API · 쿠팡 Hub · 이지어드민에서 수집된 {formatNumber(263482)}명의 고객 데이터와
              실시간 시그널을 통합 분석합니다.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <div className="text-right">
              <div className="micro-label mb-1">ACTIVE SIGNALS</div>
              <div className="text-4xl font-bold text-signal-600 numeric tracking-tight">
                {mockKPI.active_signals}
              </div>
            </div>
            <div className="h-12 w-px bg-paper-300" />
            <div className="text-right">
              <div className="micro-label mb-1">RESOLVED · 7D</div>
              <div className="text-4xl font-bold text-success numeric tracking-tight">
                {mockKPI.resolved_signals_7d}
              </div>
            </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="micro-label">분석 기간</span>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<TrendingUp size={14} />}
            label="2차 구매율"
            subLabel="신규 회원"
            value={mockKPI.new_signup_repurchase_rate}
            target={mockKPI.target_repurchase_rate}
            unit="%"
            accentColor="#FFB000"
          />
          <KPICard
            icon={<Smartphone size={14} />}
            label="앱 매출 비중"
            subLabel="전체 매출 대비"
            value={mockKPI.app_revenue_share}
            target={mockKPI.target_app_revenue_share}
            unit="%"
            accentColor="#5878E8"
          />
          <KPICard
            icon={<Users size={14} />}
            label="총 고객"
            subLabel="누적 회원"
            value={mockKPI.total_customers / 10000}
            target={null}
            unit="만명"
            accentColor="#00A87D"
          />
          <KPICard
            icon={<Sparkles size={14} />}
            label="VIP 고객"
            subLabel="챔피언 세그먼트"
            value={mockKPI.vip_customers}
            target={null}
            unit="명"
            accentColor="#E8456A"
          />
        </div>
      </section>

      <div className="px-8 py-8 grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-7">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-paper-900 mb-1">긴급 시그널</h2>
              <p className="micro-label">
                우선순위 기준 상위 {criticalSignals.length}건 · 즉각 대응 필요
              </p>
            </div>
            <Link to="/signals" className="text-xs font-mono text-signal-600 hover:text-signal-700 uppercase tracking-wider font-semibold flex items-center gap-1">
              전체 보기 <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {criticalSignals.map(signal => (
              <SignalCard key={signal.id} signal={signal} compact />
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-6">
          <DeptPanel signalsByDept={signalsByDept} />
          <JourneyFunnel />
          <TrendPreview />
        </div>
      </div>

      {/* RFM section */}
      <section className="px-8 pb-12">
        <div className="panel p-6">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="micro-label mb-1">RFM ANALYSIS</div>
              <h2 className="text-2xl font-bold text-paper-900">고객 세그먼트 분포</h2>
            </div>
            <span className="text-2xs font-mono text-paper-500">
              Recency · Frequency · Monetary
            </span>
          </div>

          <div className="space-y-2">
            {mockRFMDistribution.map((seg, idx) => {
              const total = mockRFMDistribution.reduce((s, x) => s + x.count, 0);
              const pct = (seg.count / total) * 100;
              const color = Object.values(RFM_COLORS)[idx] || '#8A8A7E';
              return (
                <div key={seg.segment} className="group">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="flex items-center gap-2 w-28 shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-sm text-paper-800 font-medium">{seg.segment}</span>
                    </div>
                    <div className="flex-1 h-6 bg-paper-100 rounded-md overflow-hidden relative border border-paper-200">
                      <div
                        className="h-full transition-all group-hover:brightness-110"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}60 0%, ${color} 100%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="font-mono text-xs numeric text-paper-900 font-semibold">
                          {formatNumber(seg.count)}명
                        </span>
                      </div>
                    </div>
                    <span className="w-14 text-right font-mono text-xs text-paper-600 numeric">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function KPICard({
  icon, label, subLabel, value, target, unit, accentColor,
}: {
  icon: React.ReactNode; label: string; subLabel: string; value: number;
  target: number | null; unit: string; accentColor: string;
}) {
  const progress = target ? Math.min((value / target) * 100, 100) : null;
  return (
    <div className="panel-elevated p-4 relative overflow-hidden group hover:border-paper-400 transition-colors">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: accentColor }} />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3" style={{ color: accentColor }}>
          {icon}
          <span className="font-mono text-2xs uppercase tracking-widest font-semibold">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-3xl font-bold text-paper-900 numeric tracking-tight">
            {value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-xs text-paper-500 font-mono">{unit}</span>
        </div>
        <div className="text-2xs text-paper-500 mb-2">{subLabel}</div>
        {progress !== null && (
          <>
            <div className="h-1 bg-paper-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, background: accentColor }}
              />
            </div>
            <div className="mt-1.5 text-2xs font-mono text-paper-500">
              목표 {target}{unit} · <span style={{ color: accentColor }} className="font-semibold">{progress.toFixed(0)}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeptPanel({ signalsByDept }: { signalsByDept: Record<string, number> }) {
  const depts = [
    { key: 'md', label: '영업 · MD', color: DEPARTMENT_COLORS.md, count: signalsByDept.md },
    { key: 'mkt', label: '마케팅', color: DEPARTMENT_COLORS.mkt, count: signalsByDept.mkt },
    { key: 'visual', label: '비주얼', color: DEPARTMENT_COLORS.visual, count: signalsByDept.visual },
  ];
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={14} className="text-signal-600" />
        <span className="micro-label">부서별 시그널</span>
      </div>
      <div className="space-y-4">
        {depts.map(d => (
          <div key={d.key} className="group cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse-signal" style={{ background: d.color }} />
                <span className="text-sm text-paper-800 font-medium">{d.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold numeric" style={{ color: d.color }}>{d.count}</span>
                <span className="text-2xs font-mono text-paper-500">건</span>
              </div>
            </div>
            <div className="h-1 bg-paper-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${d.count * 15}%`, background: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyFunnel() {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 mb-1">
        <Activity size={14} className="text-signal-600" />
        <span className="micro-label">GOLDEN JOURNEY</span>
      </div>
      <div className="text-sm text-paper-800 font-semibold mb-4">신규 가입 → 재구매 전환 퍼널</div>

      <div className="space-y-1.5">
        {mockJourneyFunnel.map((stage, idx) => {
          const dropoff = idx > 0 ? mockJourneyFunnel[idx - 1].count - stage.count : 0;
          return (
            <div key={stage.stage}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="font-mono text-2xs text-paper-600 uppercase tracking-wider">
                  {stage.stage}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-paper-900 numeric font-semibold">
                    {formatNumber(stage.count)}
                  </span>
                  <span className="text-2xs font-mono text-paper-500 numeric w-10 text-right">
                    {stage.pct}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-paper-100 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${stage.pct}%`,
                    background: `linear-gradient(90deg, #FFB000 0%, #FFD866 100%)`,
                  }}
                />
              </div>
              {dropoff > 0 && idx > 0 && idx < mockJourneyFunnel.length - 1 && (
                <div className="text-2xs font-mono text-alert/80 mt-0.5 pl-1">
                  ↓ -{formatNumber(dropoff)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendPreview() {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-signal-600" />
          <span className="micro-label">TREND FORECASTER</span>
        </div>
        <span className="text-2xs font-mono text-paper-500">14주 예측</span>
      </div>
      <div className="text-sm text-paper-800 font-semibold mb-3">여름 시즌 판매 추이</div>

      <div className="h-32 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockTrendData}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB000" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#FFB000" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5878E8" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#5878E8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" fontSize={9} stroke="#B8B8AC" tick={{ fill: '#8A8A7E' }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #D8D8CE', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              labelStyle={{ color: '#E89A00', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="lastYear" stroke="#5878E8" strokeWidth={1} fill="url(#g2)" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="thisYear" stroke="#FFB000" strokeWidth={2.5} fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2 text-2xs font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-signal-500" />
          <span className="text-paper-600">2026</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 border-t border-dashed border-visual" />
          <span className="text-paper-600">2025</span>
        </div>
        <div className="ml-auto text-success font-semibold">↑ +14% 동기 대비</div>
      </div>
    </div>
  );
}
