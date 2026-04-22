import { Search, Bell, Command } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = time.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

  return (
    <header className="h-16 border-b border-paper-300 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-500 group-focus-within:text-signal-500 transition-colors" />
          <input
            type="text"
            placeholder="고객, 상품, 시그널 검색..."
            className="w-full bg-paper-100 border border-paper-300 focus:border-signal-500 focus:bg-white outline-none rounded-md pl-9 pr-16 py-2 text-sm placeholder-paper-500 transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-2xs font-mono text-paper-500 border border-paper-300 rounded px-1.5 py-0.5 bg-white">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 border-l border-paper-300 pl-6">
          <div className="text-right">
            <div className="font-mono text-2xs text-paper-500 tracking-widest">{dateStr}</div>
            <div className="text-sm font-semibold text-paper-900 numeric tracking-wider">{timeStr} <span className="text-paper-500 text-2xs font-normal">KST</span></div>
          </div>
        </div>

        <button className="relative p-2 text-paper-600 hover:text-paper-900 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-alert animate-pulse-signal" />
        </button>

        <div className="flex items-center gap-3 border-l border-paper-300 pl-6">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-md to-signal-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            N
          </div>
          <div className="text-left">
            <div className="text-sm text-paper-900 font-medium">Nicole</div>
            <div className="text-2xs font-mono text-paper-500 uppercase tracking-wider">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
