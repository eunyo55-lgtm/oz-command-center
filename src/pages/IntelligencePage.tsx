import { useState } from 'react';
import { TrendingUp, Flame, Sparkles, Zap } from 'lucide-react';
import { mockCategoryHeatmap, mockTrendData, mockProducts } from '../lib/mockData';
import { formatNumber, cn } from '../lib/utils';
import DateRangeFilter, { getDefaultRange, type DateRange } from '../components/DateRangeFilter';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';

export default function IntelligencePage() {
  const [range, setRange] = useState<DateRange>(getDefaultRange());

  const maxHeat = Math.max(...mockCategoryHeatmap.flatMap(r => [r.w1, r.w2, r.w3, r.w4, r.w5, r.w6]));
  const ahaItems = mockProducts.filter(p => p.is_aha_item).sort((a, b) => b.sales_velocity - a.sales_velocity);

  return (
    <div className="grid-bg min-h-full">
      <section className="px-8 pt-8 pb-6 border-b border-paper-300">
        <div className="flex items-start justify-between gap-6 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={14} className="text-signal-600" />
              <span className="micro-label">SEASONAL INTELLIGENCE</span>
            </div>
            <h1 className="text-3xl font-bold text-paper-900 mb-2 tracking-tight">
              시즌 <span className="text-signal-600">킬러 아이템</span> 분석
            </h1>
            <p className="text-paper-600 text-sm max-w-2xl">
              카테고리 히트맵과 전년 동기 데이터를 기반으로 유행 시점을 1~2주 먼저 예측합니다.
            </p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
      </section>

      {/* Category Heatmap */}
      <section className="px-8 py-8 border-b border-paper-300">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-alert" />
              <span className="micro-label">CATEGORY HEATMAP</span>
            </div>
            <h2 className="text-2xl font-bold text-paper-900">카테고리 판매 속도 히트맵</h2>
            <p className="text-xs text-paper-600 mt-1">
              {range.label} · 주차별 판매 속도 (일일 평균 판매 단위)
            </p>
          </div>
          <div className="flex items-center gap-3 text-2xs font-mono">
            <span className="text-paper-500">낮음</span>
            <div className="flex h-3 w-48 rounded-md overflow-hidden border border-paper-300">
              {[0.15, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => (
                <div key={i} className="flex-1" style={{ background: `rgba(255, 176, 0, ${intensity})` }} />
              ))}
            </div>
            <span className="text-signal-700 font-semibold">높음</span>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-300 bg-paper-100">
                <th className="text-left p-4 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">카테고리</th>
                {['W-5', 'W-4', 'W-3', 'W-2', 'W-1', '현재'].map(w => (
                  <th key={w} className="p-2 font-mono text-2xs text-paper-600 uppercase tracking-wider text-center min-w-[72px] font-semibold">
                    {w}
                  </th>
                ))}
                <th className="p-4 font-mono text-2xs text-paper-600 uppercase tracking-wider text-right font-semibold">성장률</th>
              </tr>
            </thead>
            <tbody>
              {mockCategoryHeatmap.map((row) => {
                const growth = row.w6 > 0 && row.w1 > 0 ? ((row.w6 - row.w1) / row.w1) * 100 : 0;
                return (
                  <tr key={row.category} className="border-b border-paper-200 hover:bg-paper-100 transition-colors">
                    <td className="p-4 text-paper-900 font-semibold">{row.category}</td>
                    {(['w1', 'w2', 'w3', 'w4', 'w5', 'w6'] as const).map(wk => {
                      const val = row[wk];
                      const intensity = val / maxHeat;
                      return (
                        <td key={wk} className="p-1">
                          <div
                            className="relative mx-auto h-10 rounded-md flex items-center justify-center transition-all hover:ring-2 hover:ring-signal-500 cursor-pointer group"
                            style={{
                              background: `rgba(255, 176, 0, ${intensity * 0.85 + 0.08})`,
                            }}
                          >
                            <span className={cn(
                              'font-mono text-xs numeric transition-colors font-semibold',
                              intensity > 0.5 ? 'text-paper-900' : 'text-paper-700'
                            )}>
                              {val}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-4 text-right">
                      <span className={cn(
                        'font-mono text-sm numeric font-bold',
                        growth > 200 ? 'text-alert' : growth > 100 ? 'text-signal-700' : 'text-success'
                      )}>
                        +{growth.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trend Forecaster */}
      <section className="px-8 py-8 border-b border-paper-300">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-signal-600" />
              <span className="micro-label">TREND FORECASTER</span>
            </div>
            <h2 className="text-2xl font-bold text-paper-900">전년 동기 대비 트렌드 예측</h2>
            <p className="text-xs text-paper-600 mt-1">올해 판매 추이와 AI 예측 · 작년 동기 비교</p>
          </div>

          <div className="flex items-center gap-4 text-2xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-signal-500" />
              <span className="text-paper-600 uppercase tracking-wider font-semibold">2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 border-t border-dashed border-visual" />
              <span className="text-paper-600 uppercase tracking-wider font-semibold">2025</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ background: 'repeating-linear-gradient(90deg, #00A87D 0, #00A87D 3px, transparent 3px, transparent 5px)' }} />
              <span className="text-paper-600 uppercase tracking-wider font-semibold">예측</span>
            </div>
          </div>
        </div>

        <div className="panel-elevated p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#EBEBE3" />
                <XAxis dataKey="week" stroke="#B8B8AC" fontSize={10} tick={{ fill: '#8A8A7E' }} />
                <YAxis stroke="#B8B8AC" fontSize={10} tick={{ fill: '#8A8A7E' }} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #D8D8CE',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  labelStyle={{ color: '#E89A00', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="lastYear" stroke="#5878E8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="2025" />
                <Line type="monotone" dataKey="thisYear" stroke="#FFB000" strokeWidth={2.5} dot={{ fill: '#FFB000', r: 3 }} name="2026" />
                <Line type="monotone" dataKey="forecast" stroke="#00A87D" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="예측" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-paper-200">
            <ForecastStat label="예상 피크 시점" value="W-10" delta="작년 대비 2주 빠름" positive />
            <ForecastStat label="예상 판매량" value="+14%" delta="전년 동기 대비" positive />
            <ForecastStat label="추천 발주 타이밍" value="W-8" delta="지금 준비 시작" positive />
          </div>
        </div>
      </section>

      {/* Aha Items */}
      <section className="px-8 py-8">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-signal-600" />
              <span className="micro-label">AHA ITEMS</span>
            </div>
            <h2 className="text-2xl font-bold text-paper-900">재구매 유발 입덕 상품</h2>
            <p className="text-xs text-paper-600 mt-1">신규 고객의 2차 구매를 가장 많이 일으키는 상품</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ahaItems.map((p) => (
            <div key={p.id} className="panel-elevated p-5 group hover:border-signal-500/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-signal-500/10 border border-signal-500/30">
                  <Sparkles size={10} className="text-signal-600" />
                  <span className="font-mono text-2xs uppercase tracking-wider text-signal-700 font-semibold">
                    Aha Item
                  </span>
                </div>
                <span className="font-mono text-2xs text-paper-500">{p.sku}</span>
              </div>

              <h3 className="text-lg font-bold text-paper-900 mb-1">{p.name}</h3>
              <div className="text-2xs font-mono text-paper-500 mb-4 uppercase tracking-wider">{p.category}</div>

              <div className="grid grid-cols-3 gap-2 pb-4 mb-4 border-b border-paper-200">
                <div>
                  <div className="micro-label mb-0.5">판매속도</div>
                  <div className="text-lg font-bold text-paper-900 numeric">
                    {p.sales_velocity.toFixed(1)}
                    <span className="text-2xs text-paper-500 ml-1 font-normal">/일</span>
                  </div>
                </div>
                <div>
                  <div className="micro-label mb-0.5">CVR</div>
                  <div className="text-lg font-bold text-success numeric">
                    {p.cvr.toFixed(1)}
                    <span className="text-2xs text-paper-500 ml-1 font-normal">%</span>
                  </div>
                </div>
                <div>
                  <div className="micro-label mb-0.5">재고</div>
                  <div className="text-lg font-bold text-paper-900 numeric">
                    {p.stock}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="micro-label mb-0.5">가격</div>
                  <div className="font-mono text-sm text-paper-900 numeric font-semibold">
                    ₩{formatNumber(p.price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="micro-label mb-0.5">7일 판매</div>
                  <div className="font-mono text-sm text-signal-700 numeric font-bold">
                    {p.sales_7d}개
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ForecastStat({ label, value, delta, positive }: { label: string; value: string; delta: string; positive: boolean }) {
  return (
    <div>
      <div className="micro-label mb-1">{label}</div>
      <div className="text-2xl font-bold text-signal-600 numeric mb-1">{value}</div>
      <div className={cn('text-2xs font-mono font-semibold', positive ? 'text-success' : 'text-alert')}>
        {delta}
      </div>
    </div>
  );
}
