import { useMemo, useState } from 'react';
import { Users, Search, Smartphone, ShoppingBag, Calendar, TrendingUp, X } from 'lucide-react';
import { mockCustomers } from '../lib/mockData';
import { RFM_LABELS, RFM_COLORS, LIFECYCLE_LABELS } from '../types';
import type { Customer, RFMSegment } from '../types';
import { formatKRW, cn } from '../lib/utils';
import DateRangeFilter, { getDefaultRange, type DateRange } from '../components/DateRangeFilter';

type DateField = 'signup_date' | 'last_purchase_date';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<RFMSegment | 'all'>('all');
  const [appOnly, setAppOnly] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [range, setRange] = useState<DateRange>(getDefaultRange());
  const [dateField, setDateField] = useState<DateField>('signup_date');

  const filtered = useMemo(() => {
    const fromTs = new Date(range.from).getTime();
    const toTs = new Date(range.to).getTime() + 86400000;

    return mockCustomers.filter(c => {
      if (segment !== 'all' && c.rfm_segment !== segment) return false;
      if (appOnly && !c.app_installed) return false;
      if (search && !`${c.name} ${c.customer_code} ${c.email}`.toLowerCase().includes(search.toLowerCase())) return false;

      const target = dateField === 'signup_date' ? c.signup_date : c.last_purchase_date;
      if (!target) return dateField === 'last_purchase_date' ? false : true;
      const ts = new Date(target).getTime();
      if (ts < fromTs || ts > toTs) return false;

      return true;
    });
  }, [search, segment, appOnly, range, dateField]);

  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockCustomers.length };
    mockCustomers.forEach(c => {
      counts[c.rfm_segment] = (counts[c.rfm_segment] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="grid-bg min-h-full flex">
      <div className="flex-1 min-w-0">
        <section className="px-8 pt-8 pb-6 border-b border-paper-300">
          <div className="flex items-start justify-between gap-6 mb-3">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Users size={14} className="text-signal-600" />
                <span className="micro-label">CUSTOMER DATABASE</span>
              </div>
              <h1 className="text-3xl font-bold text-paper-900 mb-2 tracking-tight">
                <span className="text-signal-600">26만 명</span>의 고객 데이터
              </h1>
              <p className="text-paper-600 text-sm max-w-2xl">
                RFM 세그먼트와 라이프사이클 단계별로 고객을 분석하고 타겟팅합니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={dateField}
                onChange={e => setDateField(e.target.value as DateField)}
                className="text-sm px-3 py-2 border border-paper-300 rounded-md bg-white focus:border-signal-500 outline-none"
              >
                <option value="signup_date">가입일 기준</option>
                <option value="last_purchase_date">최근 구매일 기준</option>
              </select>
              <DateRangeFilter value={range} onChange={setRange} />
            </div>
          </div>
        </section>

        <section className="px-8 py-6 border-b border-paper-300 space-y-4 bg-white">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="이름, 고객코드, 이메일 검색..."
              className="w-full bg-paper-100 border border-paper-300 focus:border-signal-500 focus:bg-white outline-none rounded-md pl-9 pr-4 py-2 text-sm placeholder-paper-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSegment('all')}
              className={cn(
                'px-3 py-1.5 rounded-md border font-mono text-2xs uppercase tracking-wider transition-all font-medium',
                segment === 'all'
                  ? 'border-signal-500 bg-signal-500/10 text-signal-700'
                  : 'border-paper-300 text-paper-600 hover:border-paper-400 hover:text-paper-900 bg-white'
              )}
            >
              전체 <span className="numeric ml-1">{segmentCounts.all}</span>
            </button>
            {(Object.keys(RFM_LABELS) as RFMSegment[]).map(seg => (
              <button
                key={seg}
                onClick={() => setSegment(seg)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-2xs uppercase tracking-wider transition-all font-medium',
                  segment === seg
                    ? ''
                    : 'border-paper-300 text-paper-600 hover:border-paper-400 hover:text-paper-900 bg-white'
                )}
                style={segment === seg
                  ? { borderColor: RFM_COLORS[seg], background: `${RFM_COLORS[seg]}15`, color: RFM_COLORS[seg] }
                  : undefined
                }
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: RFM_COLORS[seg] }} />
                {RFM_LABELS[seg]}
                <span className="numeric text-paper-500">{segmentCounts[seg] || 0}</span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-paper-600 hover:text-paper-900 transition-colors w-fit">
            <input
              type="checkbox"
              checked={appOnly}
              onChange={e => setAppOnly(e.target.checked)}
              className="accent-signal-500"
            />
            <Smartphone size={12} />
            <span className="font-mono uppercase tracking-wider">앱 설치 고객만</span>
          </label>
        </section>

        <section className="px-8 py-6">
          <div className="font-mono text-xs text-paper-600 uppercase tracking-widest mb-4">
            {filtered.length}명
          </div>

          <div className="panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100">
                  <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">고객코드</th>
                  <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">이름</th>
                  <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">세그먼트</th>
                  <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">주문</th>
                  <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">누적 구매</th>
                  <th className="text-center p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">앱</th>
                  <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">태그</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={cn(
                      'border-b border-paper-200 hover:bg-signal-500/5 cursor-pointer transition-colors',
                      idx % 2 === 0 ? 'bg-white' : 'bg-paper-100/50'
                    )}
                  >
                    <td className="p-3 font-mono text-2xs text-paper-600">{c.customer_code}</td>
                    <td className="p-3 text-paper-900 font-medium">{c.name}</td>
                    <td className="p-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-mono uppercase tracking-wider border font-semibold"
                        style={{
                          borderColor: `${RFM_COLORS[c.rfm_segment]}30`,
                          background: `${RFM_COLORS[c.rfm_segment]}10`,
                          color: RFM_COLORS[c.rfm_segment],
                        }}
                      >
                        <div className="w-1 h-1 rounded-full" style={{ background: RFM_COLORS[c.rfm_segment] }} />
                        {RFM_LABELS[c.rfm_segment]}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono numeric text-paper-700">{c.total_orders}회</td>
                    <td className="p-3 text-right font-mono numeric text-paper-900 font-semibold">{formatKRW(c.total_spent, true)}</td>
                    <td className="p-3 text-center">
                      {c.app_installed ? (
                        <div className="inline-flex items-center gap-1 text-success">
                          <Smartphone size={12} />
                        </div>
                      ) : (
                        <span className="text-paper-400 text-2xs">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-2xs font-mono text-paper-600 border border-paper-300 rounded px-1.5 py-0.5 bg-paper-100">
                            {t}
                          </span>
                        ))}
                        {c.tags.length > 2 && (
                          <span className="text-2xs font-mono text-paper-500">+{c.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected && (
        <div className="w-96 border-l border-paper-300 bg-white shrink-0 animate-slide-up">
          <div className="sticky top-0 bg-white border-b border-paper-300 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-mono text-2xs text-paper-500 mb-1">{selected.customer_code}</div>
                <h3 className="text-2xl font-bold text-paper-900">{selected.name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 text-paper-500 hover:text-paper-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-mono uppercase tracking-wider border font-semibold"
              style={{
                borderColor: `${RFM_COLORS[selected.rfm_segment]}30`,
                background: `${RFM_COLORS[selected.rfm_segment]}10`,
                color: RFM_COLORS[selected.rfm_segment],
              }}
            >
              <div className="w-1 h-1 rounded-full" style={{ background: RFM_COLORS[selected.rfm_segment] }} />
              {RFM_LABELS[selected.rfm_segment]}
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <DetailStat icon={<ShoppingBag size={12} />} label="총 주문" value={`${selected.total_orders}회`} />
              <DetailStat icon={<TrendingUp size={12} />} label="누적 구매액" value={formatKRW(selected.total_spent, true)} />
              <DetailStat icon={<Calendar size={12} />} label="가입" value={`D+${selected.days_since_signup}`} />
              <DetailStat icon={<Smartphone size={12} />} label="앱" value={selected.app_installed ? '설치' : '미설치'} />
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

            <div className="hairline" />

            <div>
              <div className="micro-label mb-2">태그</div>
              <div className="flex gap-1.5 flex-wrap">
                {selected.tags.map(t => (
                  <span key={t} className="text-2xs font-mono text-signal-700 border border-signal-500/30 bg-signal-500/10 rounded px-2 py-1 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button className="w-full bg-signal-500 hover:bg-signal-600 text-white font-semibold text-sm py-3 rounded-md transition-colors">
                캠페인 발송
              </button>
              <button className="w-full border border-paper-300 hover:border-signal-500 bg-white text-paper-800 font-semibold text-sm py-3 rounded-md transition-colors">
                구매 이력 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-1.5 text-paper-500 mb-1">
        {icon}
        <span className="font-mono text-2xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold text-paper-900 numeric">{value}</div>
    </div>
  );
}
