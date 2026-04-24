import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Users,
  TrendingUp,
  Kanban,
  Package,
  Settings,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Command', subLabel: '커맨드 센터', icon: LayoutDashboard, end: true },
  { to: '/signals', label: 'Signals', subLabel: '시그널 카드', icon: Radio },
  { to: '/customers', label: 'Customers', subLabel: '고객 관리', icon: Users },
  { to: '/intelligence', label: 'Intelligence', subLabel: '시즌 분석', icon: TrendingUp },
  { to: '/board', label: 'Board', subLabel: '협업 보드', icon: Kanban },
  { to: '/products', label: 'Products', subLabel: '상품', icon: Package },
];

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-paper-300 bg-white flex flex-col">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-paper-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-signal-400 to-signal-600 flex items-center justify-center shadow-sm">
              <span className="font-bold text-white text-lg">OZ</span>
            </div>
            <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-success animate-pulse-signal" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-paper-900">
              COMMAND<span className="text-signal-500">.</span>CENTER
            </div>
            <div className="text-2xs font-mono text-paper-500 mt-0.5 tracking-widest">
              v1.0 · 오즈키즈
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-0.5">
        <div className="micro-label px-3 mb-3">NAVIGATION</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-md transition-all',
                isActive
                  ? 'bg-signal-500/10 text-signal-700'
                  : 'text-paper-600 hover:text-paper-900 hover:bg-paper-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={16} strokeWidth={1.75} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium tracking-wide">
                    {item.label}
                  </div>
                  <div className={cn(
                    'text-2xs',
                    isActive ? 'text-signal-600/80' : 'text-paper-500'
                  )}>
                    {item.subLabel}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-signal-500 animate-pulse-signal" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div className="border-t border-paper-300 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="micro-label">SYSTEM</span>
          <div className="flex items-center gap-1.5">
            <span className="signal-dot text-success" />
            <span className="text-2xs font-mono text-success font-semibold">LIVE</span>
          </div>
        </div>
        <div className="text-2xs font-mono text-paper-500 tracking-wider">
          Cafe24 API · 연동중
        </div>
        <div className="text-2xs font-mono text-paper-400 tracking-wider mt-1">
          Last sync: 14:22 KST
        </div>
        <button className="mt-3 flex items-center gap-2 text-2xs font-mono text-paper-500 hover:text-paper-900 transition-colors">
          <Settings size={12} />
          설정
        </button>
      </div>
    </aside>
  );
}
