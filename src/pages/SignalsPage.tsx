import { useMemo, useState } from 'react';
import { Radio, Filter } from 'lucide-react';
import { mockSignals } from '../lib/mockData';
import type { Department, Severity } from '../types';
import { DEPARTMENT_LABELS, SEVERITY_LABELS } from '../types';
import SignalCard from '../components/SignalCard';
import DateRangeFilter, { getDefaultRange, type DateRange } from '../components/DateRangeFilter';
import { cn } from '../lib/utils';

type DeptFilter = Department | 'all';
type SevFilter = Severity | 'all';

export default function SignalsPage() {
  const [dept, setDept] = useState<DeptFilter>('all');
  const [sev, setSev] = useState<SevFilter>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [range, setRange] = useState<DateRange>(getDefaultRange());

  const filtered = useMemo(() => {
    const fromTs = new Date(range.from).getTime();
    const toTs = new Date(range.to).getTime() + 86400000; // include end-of-day
    return mockSignals.filter(s => {
      if (dept !== 'all' && s.department !== dept) return false;
      if (sev !== 'all' && s.severity !== sev) return false;
      if (!showResolved && (s.status === 'resolved' || s.status === 'dismissed')) return false;
      const ts = new Date(s.created_at).getTime();
      if (ts < fromTs || ts > toTs) return false;
      return true;
    });
  }, [dept, sev, showResolved, range]);

  const counts = useMemo(() => {
    const all = mockSignals.filter(s => s.status !== 'resolved' && s.status !== 'dismissed');
    return {
      all: all.length,
      md: all.filter(s => s.department === 'md').length,
      mkt: all.filter(s => s.department === 'mkt').length,
      visual: all.filter(s => s.department === 'visual').length,
      critical: all.filter(s => s.severity === 'critical').length,
      high: all.filter(s => s.severity === 'high').length,
      medium: all.filter(s => s.severity === 'medium').length,
      low: all.filter(s => s.severity === 'low').length,
    };
  }, []);

  return (
    <div className="grid-bg min-h-full">
      <section className="px-8 pt-8 pb-6 border-b border-paper-300">
        <div className="flex items-start justify-between gap-6 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Radio size={14} className="text-signal-600" />
              <span className="micro-label">SIGNAL FEED</span>
              <span className="signal-dot text-success" />
              <span className="text-2xs font-mono text-success tracking-wider font-semibold">REAL-TIME</span>
            </div>
            <h1 className="text-3xl font-bold text-paper-900 mb-2 tracking-tight">
              <span className="text-signal-600">시그널</span> 카드
            </h1>
            <p className="text-paper-600 text-sm max-w-2xl">
              데이터가 스스로 감지한 할 일. 부서별로 필터링하고 담당자에게 즉시 배정하세요.
            </p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
      </section>

      <section className="px-8 py-6 border-b border-paper-300 space-y-4 bg-white">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={12} className="text-paper-600" />
          <span className="micro-label">FILTERS</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xs font-mono text-paper-600 uppercase tracking-wider w-16 font-semibold">부서</span>
          <FilterChip active={dept === 'all'} onClick={() => setDept('all')} count={counts.all}>전체</FilterChip>
          <FilterChip active={dept === 'md'} onClick={() => setDept('md')} count={counts.md} color="#00A87D">{DEPARTMENT_LABELS.md}</FilterChip>
          <FilterChip active={dept === 'mkt'} onClick={() => setDept('mkt')} count={counts.mkt} color="#E8456A">{DEPARTMENT_LABELS.mkt}</FilterChip>
          <FilterChip active={dept === 'visual'} onClick={() => setDept('visual')} count={counts.visual} color="#5878E8">{DEPARTMENT_LABELS.visual}</FilterChip>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xs font-mono text-paper-600 uppercase tracking-wider w-16 font-semibold">긴급도</span>
          <FilterChip active={sev === 'all'} onClick={() => setSev('all')}>전체</FilterChip>
          <FilterChip active={sev === 'critical'} onClick={() => setSev('critical')} count={counts.critical} color="#E63946">{SEVERITY_LABELS.critical}</FilterChip>
          <FilterChip active={sev === 'high'} onClick={() => setSev('high')} count={counts.high} color="#FFB000">{SEVERITY_LABELS.high}</FilterChip>
          <FilterChip active={sev === 'medium'} onClick={() => setSev('medium')} count={counts.medium} color="#5878E8">{SEVERITY_LABELS.medium}</FilterChip>
          <FilterChip active={sev === 'low'} onClick={() => setSev('low')} count={counts.low}>{SEVERITY_LABELS.low}</FilterChip>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-paper-600 hover:text-paper-900 transition-colors">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="accent-signal-500"
            />
            <span className="font-mono uppercase tracking-wider">해결된 시그널 포함</span>
          </label>
        </div>
      </section>

      <section className="px-8 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <span className="font-mono text-xs text-paper-600 uppercase tracking-widest">
            {filtered.length}건의 시그널
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="panel py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-paper-300 flex items-center justify-center mb-3">
              <Radio size={18} className="text-paper-500" />
            </div>
            <p className="text-paper-600 text-sm">해당 조건의 시그널이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active, onClick, children, count, color,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; count?: number; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-2xs uppercase tracking-wider transition-all font-medium',
        active
          ? 'border-signal-500 bg-signal-500/10 text-signal-700'
          : 'border-paper-300 text-paper-600 hover:border-paper-400 hover:text-paper-900 bg-white'
      )}
      style={active && color ? { borderColor: color, color, background: `${color}15` } : undefined}
    >
      {color && !active && (
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      )}
      <span>{children}</span>
      {count !== undefined && (
        <span className="numeric text-paper-500">{count}</span>
      )}
    </button>
  );
}
