import { useMemo, useState } from 'react';
import { Kanban, Plus, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { mockTasks } from '../lib/mockData';
import { DEPARTMENT_COLORS, DEPARTMENT_LABELS, SEVERITY_LABELS } from '../types';
import type { Task } from '../types';
import { timeAgo, cn } from '../lib/utils';
import DateRangeFilter, { getDefaultRange, type DateRange } from '../components/DateRangeFilter';

const COLUMNS: { key: Task['status']; label: string; subLabel: string; color: string }[] = [
  { key: 'todo', label: 'Todo', subLabel: '대기', color: '#8A8A7E' },
  { key: 'doing', label: 'Doing', subLabel: '진행 중', color: '#FFB000' },
  { key: 'review', label: 'Review', subLabel: '검토', color: '#5878E8' },
  { key: 'done', label: 'Done', subLabel: '완료', color: '#00A87D' },
];

export default function BoardPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [range, setRange] = useState<DateRange>(getDefaultRange());

  const rangeFiltered = useMemo(() => {
    const fromTs = new Date(range.from).getTime();
    const toTs = new Date(range.to).getTime() + 86400000;
    return tasks.filter(t => {
      const ts = new Date(t.created_at).getTime();
      return ts >= fromTs && ts <= toTs;
    });
  }, [tasks, range]);

  const columnized = useMemo(() => {
    const map: Record<Task['status'], Task[]> = { todo: [], doing: [], review: [], done: [] };
    rangeFiltered.forEach(t => map[t.status].push(t));
    return map;
  }, [rangeFiltered]);

  const successStories = useMemo(
    () => rangeFiltered.filter(t => t.outcome_note).slice(0, 5),
    [rangeFiltered]
  );

  const moveTask = (id: string, to: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: to } : t));
  };

  return (
    <div className="grid-bg min-h-full">
      <section className="px-8 pt-8 pb-6 border-b border-paper-300">
        <div className="flex items-start justify-between gap-6 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Kanban size={14} className="text-signal-600" />
              <span className="micro-label">COLLABORATION BOARD</span>
            </div>
            <h1 className="text-3xl font-bold text-paper-900 mb-2 tracking-tight">
              통합 <span className="text-signal-600">협업 보드</span>
            </h1>
            <p className="text-paper-600 text-sm max-w-2xl">
              시그널에서 시작된 업무를 부서별로 배정하고 처리 상태를 공유합니다.
              완료된 업무의 성과 노트는 팀 전체의 자산이 됩니다.
            </p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
      </section>

      <section className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-semibold text-paper-900 tracking-wide">{col.label}</span>
                  <span className="text-2xs font-mono text-paper-500">{col.subLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-paper-600 numeric font-semibold">
                    {columnized[col.key].length}
                  </span>
                  <button className="p-1 text-paper-500 hover:text-signal-600 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 min-h-[200px] p-2 rounded-md border border-dashed border-paper-300 bg-paper-100/60">
                {columnized[col.key].length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[150px] text-2xs font-mono text-paper-500">
                    EMPTY
                  </div>
                ) : (
                  columnized[col.key].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMove={(to) => moveTask(task.id, to)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 pb-12">
        <div className="flex items-baseline gap-3 mb-4">
          <BookOpen size={14} className="text-signal-600" />
          <span className="micro-label">SHARED NOTES · 성공 사례 기록</span>
        </div>
        <h2 className="text-2xl font-bold text-paper-900 mb-5">
          팀 전체가 <span className="text-signal-600">학습하는</span> 성과 노트
        </h2>

        {successStories.length === 0 ? (
          <div className="panel py-16 flex flex-col items-center justify-center">
            <BookOpen size={24} className="text-paper-400 mb-3" />
            <p className="text-paper-600 text-sm">이 기간에 기록된 성과 노트가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {successStories.map(t => (
              <div key={t.id} className="panel-elevated p-5 border-l-4 border-l-success relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-success" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} className="text-success" />
                    <span className="font-mono text-2xs uppercase tracking-wider text-success font-bold">
                      RESOLVED
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <div
                        className="px-2 py-0.5 rounded-md text-2xs font-mono uppercase tracking-wider border font-semibold"
                        style={{
                          borderColor: `${DEPARTMENT_COLORS[t.department]}30`,
                          color: DEPARTMENT_COLORS[t.department],
                          background: `${DEPARTMENT_COLORS[t.department]}10`,
                        }}
                      >
                        {DEPARTMENT_LABELS[t.department]}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-paper-900 mb-2">{t.title}</h3>
                  <p className="text-sm text-paper-600 mb-4 leading-relaxed">{t.description}</p>

                  <div className="bg-success/5 border border-success/20 rounded-md p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1 h-1 rounded-full bg-success animate-pulse-signal" />
                      <span className="font-mono text-2xs uppercase tracking-wider text-success font-bold">
                        성과 측정
                      </span>
                    </div>
                    <p className="text-sm text-paper-900 leading-relaxed font-medium">{t.outcome_note}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4 text-2xs font-mono text-paper-500">
                    <span>@{t.assignee}</span>
                    <span>{timeAgo(t.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskCard({ task, onMove }: { task: Task; onMove: (to: Task['status']) => void }) {
  const deptColor = DEPARTMENT_COLORS[task.department];
  const priorityColor = {
    critical: '#E63946',
    high: '#FFB000',
    medium: '#5878E8',
    low: '#8A8A7E',
  }[task.priority];

  return (
    <div className="panel p-3 cursor-grab active:cursor-grabbing hover:border-paper-400 hover:shadow-sm transition-all group bg-white">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm text-paper-900 leading-tight font-semibold">{task.title}</h4>
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
          style={{ background: priorityColor }}
          title={SEVERITY_LABELS[task.priority]}
        />
      </div>

      {task.description && (
        <p className="text-2xs text-paper-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="px-1.5 py-0.5 rounded text-2xs font-mono uppercase tracking-wider font-semibold"
            style={{ color: deptColor, background: `${deptColor}10`, border: `1px solid ${deptColor}30` }}
          >
            {DEPARTMENT_LABELS[task.department]}
          </div>
        </div>
        <div className="flex items-center gap-1 text-paper-500">
          <Clock size={10} />
          <span className="font-mono text-2xs">{timeAgo(task.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-paper-200 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-md to-signal-500 flex items-center justify-center text-2xs font-bold text-white">
            {task.assignee[0]}
          </div>
          <span className="font-mono text-2xs text-paper-600">{task.assignee}</span>
        </div>
        <div className="flex gap-0.5">
          {COLUMNS.filter(c => c.key !== task.status).map(c => (
            <button
              key={c.key}
              onClick={() => onMove(c.key)}
              className="w-4 h-4 rounded border border-paper-300 hover:border-signal-500 transition-colors"
              style={{ background: `${c.color}20` }}
              title={`Move to ${c.label}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
