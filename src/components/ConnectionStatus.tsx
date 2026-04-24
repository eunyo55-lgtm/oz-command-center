import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface Props {
  source: 'supabase' | 'mock';
  error?: string | null;
}

export default function ConnectionStatus({ source, error }: Props) {
  if (source === 'supabase' && !error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-success/10 border border-success/20 text-2xs font-mono">
        <CheckCircle2 size={12} className="text-success" />
        <span className="text-success font-semibold uppercase tracking-wider">Live Data</span>
        <span className="text-paper-600">Supabase 연결됨</span>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-signal-500/10 border border-signal-500/20 text-2xs font-mono">
        <Database size={12} className="text-signal-700" />
        <span className="text-signal-700 font-semibold uppercase tracking-wider">Demo Mode</span>
        <span className="text-paper-600">.env 파일에 Supabase 키를 설정하세요</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-alert/10 border border-alert/20 text-2xs font-mono">
      <AlertCircle size={12} className="text-alert" />
      <span className="text-alert font-semibold uppercase tracking-wider">Fallback</span>
      <span className="text-paper-600">{error || 'DB가 비어있어 목업 데이터 표시 중'}</span>
    </div>
  );
}
