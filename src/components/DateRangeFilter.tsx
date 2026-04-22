import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export type DateRangePreset = '7d' | '30d' | '90d' | 'mtd' | 'ytd' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from: string; // YYYY-MM-DD
  to: string;
  label: string;
}

export function getDefaultRange(): DateRange {
  return getRangeByPreset('30d');
}

export function getRangeByPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);

  switch (preset) {
    case '7d':
      fromDate.setDate(now.getDate() - 7);
      return { preset, from: fromDate.toISOString().slice(0, 10), to, label: '최근 7일' };
    case '30d':
      fromDate.setDate(now.getDate() - 30);
      return { preset, from: fromDate.toISOString().slice(0, 10), to, label: '최근 30일' };
    case '90d':
      fromDate.setDate(now.getDate() - 90);
      return { preset, from: fromDate.toISOString().slice(0, 10), to, label: '최근 90일' };
    case 'mtd':
      fromDate.setDate(1);
      return { preset, from: fromDate.toISOString().slice(0, 10), to, label: '이번 달' };
    case 'ytd':
      return { preset, from: `${now.getFullYear()}-01-01`, to, label: '올해' };
    default:
      return { preset: 'custom', from: to, to, label: '커스텀' };
  }
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: '7d', label: '최근 7일' },
  { key: '30d', label: '최근 30일' },
  { key: '90d', label: '최근 90일' },
  { key: 'mtd', label: '이번 달' },
  { key: 'ytd', label: '올해' },
  { key: 'custom', label: '기간 직접 지정' },
];

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export default function DateRangeFilter({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      const range: DateRange = {
        preset: 'custom',
        from: customFrom,
        to: customTo,
        label: `${customFrom} ~ ${customTo}`,
      };
      onChange(range);
    } else {
      onChange(getRangeByPreset(preset));
    }
    if (preset !== 'custom') setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-all',
          'bg-white border-paper-300 hover:border-paper-400 text-paper-800',
          open && 'border-signal-500 ring-2 ring-signal-500/20'
        )}
      >
        <Calendar size={14} className="text-paper-600" />
        <span className="font-medium">{value.label}</span>
        <span className="font-mono text-2xs text-paper-500 numeric">
          {value.from} → {value.to}
        </span>
        <ChevronDown size={14} className={cn('text-paper-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 panel-elevated p-2 z-50 animate-fade-in">
          <div className="micro-label px-3 py-2">기간 선택</div>
          <div className="space-y-0.5">
            {PRESETS.map(preset => (
              <button
                key={preset.key}
                onClick={() => handlePreset(preset.key)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  value.preset === preset.key
                    ? 'bg-signal-500/10 text-signal-700 font-medium'
                    : 'text-paper-700 hover:bg-paper-200'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {(value.preset === 'custom' || true) && (
            <div className="mt-2 p-3 border-t border-paper-300">
              <div className="micro-label mb-2">직접 입력</div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-paper-300 rounded-md focus:border-signal-500 outline-none font-mono"
                />
                <span className="text-paper-500 text-xs">→</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-paper-300 rounded-md focus:border-signal-500 outline-none font-mono"
                />
              </div>
              <button
                onClick={() => handlePreset('custom')}
                className="w-full mt-2 py-2 rounded-md bg-signal-500 hover:bg-signal-600 text-white text-xs font-medium transition-colors"
              >
                적용
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
