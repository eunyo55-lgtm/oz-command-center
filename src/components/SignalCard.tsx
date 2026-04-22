import { ArrowUpRight, ArrowDownRight, UserPlus, Check, X } from 'lucide-react';
import type { Signal } from '../types';
import { DEPARTMENT_LABELS, DEPARTMENT_COLORS, SEVERITY_LABELS } from '../types';
import { timeAgo, formatNumber, cn } from '../lib/utils';

interface Props {
  signal: Signal;
  onAssign?: (id: string) => void;
  onResolve?: (id: string) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

const severityStyles: Record<Signal['severity'], { border: string; label: string }> = {
  critical: { border: 'border-l-alert', label: 'bg-alert/10 text-alert border border-alert/20' },
  high: { border: 'border-l-signal-500', label: 'bg-signal-500/10 text-signal-700 border border-signal-500/20' },
  medium: { border: 'border-l-visual', label: 'bg-visual/10 text-visual border border-visual/20' },
  low: { border: 'border-l-paper-400', label: 'bg-paper-200 text-paper-600 border border-paper-300' },
};

export default function SignalCard({ signal, onAssign, onResolve, onDismiss, compact }: Props) {
  const sev = severityStyles[signal.severity];
  const deptColor = DEPARTMENT_COLORS[signal.department];

  return (
    <div className={cn(
      'panel-elevated group relative overflow-hidden border-l-4 hover:border-l-[5px] transition-all animate-slide-up',
      sev.border
    )}>
      {signal.severity === 'critical' && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-alert to-transparent opacity-60 animate-shimmer bg-[length:200%_100%]" />
      )}

      <div className={cn('p-5', compact && 'p-4')}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
              style={{ borderColor: `${deptColor}30`, background: `${deptColor}10` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: deptColor }} />
              <span className="text-2xs font-mono uppercase tracking-wider font-medium" style={{ color: deptColor }}>
                {DEPARTMENT_LABELS[signal.department]}
              </span>
            </div>

            <div className={cn('px-2 py-1 rounded-md text-2xs font-mono uppercase tracking-wider font-medium', sev.label)}>
              {SEVERITY_LABELS[signal.severity]}
            </div>

            <span className="text-2xs font-mono text-paper-500 tracking-wider">
              {signal.id.toUpperCase()}
            </span>
          </div>

          <span className="text-2xs font-mono text-paper-500 shrink-0">
            {timeAgo(signal.created_at)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-paper-900 leading-tight mb-2">
          {signal.title}
        </h3>

        <p className="text-sm text-paper-600 leading-relaxed mb-4">
          {signal.description}
        </p>

        {signal.metric_value !== null && (
          <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-paper-200">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-paper-900 numeric tracking-tight">
                {formatNumber(signal.metric_value)}
              </span>
              {signal.metric_unit && (
                <span className="text-sm text-paper-500 font-mono">{signal.metric_unit}</span>
              )}
            </div>
            {signal.metric_delta !== null && (
              <div className={cn(
                'flex items-center gap-0.5 font-mono text-xs font-semibold',
                signal.metric_delta >= 0 ? 'text-success' : 'text-alert'
              )}>
                {signal.metric_delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="numeric">
                  {signal.metric_delta > 0 ? '+' : ''}{signal.metric_delta}%
                </span>
              </div>
            )}
            {signal.related_entity && (
              <span className="ml-auto text-2xs font-mono text-paper-500 border border-paper-300 rounded px-2 py-0.5 bg-paper-100">
                {signal.related_entity}
              </span>
            )}
          </div>
        )}

        <div className="bg-paper-100 border border-paper-200 rounded-md p-3 mb-4">
          <div className="micro-label mb-1.5">권장 액션</div>
          <p className="text-sm text-paper-800 leading-relaxed">{signal.suggested_action}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          {signal.assigned_to ? (
            <div className="flex items-center gap-2 text-xs text-paper-600">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-md to-signal-500 flex items-center justify-center text-2xs font-bold text-white">
                {signal.assigned_to[0]}
              </div>
              <span className="font-mono">{signal.assigned_to}</span>
              <span className="text-2xs uppercase tracking-wider text-paper-500">· {signal.status}</span>
            </div>
          ) : (
            <button
              onClick={() => onAssign?.(signal.id)}
              className="flex items-center gap-1.5 text-xs text-signal-600 hover:text-signal-700 font-mono uppercase tracking-wider transition-colors font-semibold"
            >
              <UserPlus size={12} />
              담당 배정
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => onResolve?.(signal.id)}
              className="p-1.5 text-paper-500 hover:text-success hover:bg-success/10 rounded-md transition-colors"
              title="해결됨"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => onDismiss?.(signal.id)}
              className="p-1.5 text-paper-500 hover:text-alert hover:bg-alert/10 rounded-md transition-colors"
              title="무시"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
