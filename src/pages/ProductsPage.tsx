import { useMemo, useState } from 'react';
import { Package, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { mockProducts } from '../lib/mockData';
import { formatNumber, cn } from '../lib/utils';

type SortKey = 'velocity' | 'cvr' | 'stock' | 'sales_7d';

export default function ProductsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('velocity');

  const sorted = useMemo(() => {
    return [...mockProducts].sort((a, b) => {
      switch (sortKey) {
        case 'velocity': return b.sales_velocity - a.sales_velocity;
        case 'cvr': return b.cvr - a.cvr;
        case 'stock': return a.stock - b.stock;
        case 'sales_7d': return b.sales_7d - a.sales_7d;
      }
    });
  }, [sortKey]);

  const lowStock = mockProducts.filter(p => p.stock < 100).length;
  const ahaCount = mockProducts.filter(p => p.is_aha_item).length;

  return (
    <div className="grid-bg min-h-full">
      <section className="px-8 pt-8 pb-6 border-b border-paper-300">
        <div className="flex items-center gap-3 mb-3">
          <Package size={14} className="text-signal-600" />
          <span className="micro-label">PRODUCT CATALOG</span>
        </div>
        <h1 className="text-3xl font-bold text-paper-900 mb-2 tracking-tight">
          상품 <span className="text-signal-600">퍼포먼스</span>
        </h1>
        <p className="text-paper-600 text-sm max-w-2xl">
          판매 속도, 전환율, 재고 현황을 한 화면에서 추적합니다.
        </p>
      </section>

      <section className="px-8 py-6 border-b border-paper-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Package size={14} />}
            label="총 상품"
            value={mockProducts.length}
            unit="개"
            color="#5878E8"
          />
          <SummaryCard
            icon={<AlertTriangle size={14} />}
            label="재고 부족"
            value={lowStock}
            unit="개"
            color="#E63946"
            subLabel="< 100개"
          />
          <SummaryCard
            icon={<Sparkles size={14} />}
            label="Aha Items"
            value={ahaCount}
            unit="개"
            color="#FFB000"
          />
          <SummaryCard
            icon={<TrendingUp size={14} />}
            label="평균 CVR"
            value={mockProducts.reduce((s, p) => s + p.cvr, 0) / mockProducts.length}
            unit="%"
            color="#00A87D"
            decimals={1}
          />
        </div>
      </section>

      <section className="px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="micro-label">정렬:</span>
            {([
              { k: 'velocity', l: '판매속도' },
              { k: 'cvr', l: 'CVR' },
              { k: 'stock', l: '재고 적은순' },
              { k: 'sales_7d', l: '7일 판매' },
            ] as { k: SortKey; l: string }[]).map(opt => (
              <button
                key={opt.k}
                onClick={() => setSortKey(opt.k)}
                className={cn(
                  'px-3 py-1.5 rounded-md border font-mono text-2xs uppercase tracking-wider transition-all font-medium',
                  sortKey === opt.k
                    ? 'border-signal-500 bg-signal-500/10 text-signal-700'
                    : 'border-paper-300 text-paper-600 hover:border-paper-400 hover:text-paper-900 bg-white'
                )}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-paper-300 bg-paper-100">
                <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">SKU</th>
                <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">상품명</th>
                <th className="text-left p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">카테고리</th>
                <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">가격</th>
                <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">재고</th>
                <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">속도/일</th>
                <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">CVR</th>
                <th className="text-right p-3 font-mono text-2xs text-paper-600 uppercase tracking-wider font-semibold">7일 판매</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => {
                const daysLeft = p.stock / p.sales_velocity;
                const stockStatus = daysLeft < 5 ? 'critical' : daysLeft < 10 ? 'warning' : 'ok';
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      'border-b border-paper-200 hover:bg-signal-500/5 transition-colors',
                      idx % 2 === 0 ? 'bg-white' : 'bg-paper-100/50'
                    )}
                  >
                    <td className="p-3 font-mono text-2xs text-paper-600">{p.sku}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {p.is_aha_item && (
                          <Sparkles size={12} className="text-signal-600 shrink-0" />
                        )}
                        <span className="text-paper-900 font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-2xs font-mono text-paper-600 border border-paper-300 rounded px-1.5 py-0.5 bg-paper-100">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-paper-900 numeric font-semibold">
                      ₩{formatNumber(p.price)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {stockStatus !== 'ok' && (
                          <AlertTriangle
                            size={11}
                            className={stockStatus === 'critical' ? 'text-alert' : 'text-signal-600'}
                          />
                        )}
                        <span className={cn(
                          'font-mono numeric font-semibold',
                          stockStatus === 'critical' ? 'text-alert' :
                          stockStatus === 'warning' ? 'text-signal-700' : 'text-paper-900'
                        )}>
                          {p.stock}
                        </span>
                      </div>
                      <div className="text-2xs font-mono text-paper-500 numeric mt-0.5">
                        ~{daysLeft.toFixed(0)}일
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-paper-900 numeric font-semibold">
                      {p.sales_velocity.toFixed(1)}
                    </td>
                    <td className="p-3 text-right">
                      <span className={cn(
                        'font-mono numeric font-semibold',
                        p.cvr >= 4 ? 'text-success' : p.cvr >= 3 ? 'text-paper-900' : 'text-paper-500'
                      )}>
                        {p.cvr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono numeric text-signal-700 font-bold">
                      {p.sales_7d}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon, label, value, unit, color, subLabel, decimals = 0,
}: {
  icon: React.ReactNode; label: string; value: number; unit: string;
  color: string; subLabel?: string; decimals?: number;
}) {
  return (
    <div className="panel-elevated p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-15" style={{ background: color }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2" style={{ color }}>
          {icon}
          <span className="font-mono text-2xs uppercase tracking-widest font-semibold">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-paper-900 numeric">
            {value.toLocaleString('ko-KR', { maximumFractionDigits: decimals })}
          </span>
          <span className="text-xs text-paper-500 font-mono">{unit}</span>
        </div>
        {subLabel && (
          <div className="text-2xs text-paper-500 mt-0.5 font-mono">{subLabel}</div>
        )}
      </div>
    </div>
  );
}
