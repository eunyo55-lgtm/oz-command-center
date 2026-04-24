import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { validateImport, type ImportValidation } from '../lib/customerImport';
import type { Customer } from '../types';
import { cn, formatNumber, formatKRW } from '../lib/utils';
import { RFM_LABELS, RFM_COLORS } from '../types';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done' | 'error';

export default function CustomerUploadModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [validation, setValidation] = useState<ImportValidation | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      setErrorMsg('');
      const isExcel = file.name.match(/\.(xlsx|xls)$/i);

      let rows: Record<string, any>[] = [];

      if (isExcel) {
        // Excel file
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      } else {
        // CSV file
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        rows = result.data as Record<string, any>[];
      }

      if (rows.length === 0) {
        setErrorMsg('파일에 데이터가 없습니다.');
        setStep('error');
        return;
      }

      const v = validateImport(rows);
      setValidation(v);

      // 전체 변환된 데이터 저장 (업로드용)
      const { transformRow } = await import('../lib/customerImport');
      const transformed = rows.map(transformRow).filter((c): c is Customer => c !== null);
      setCustomers(transformed);

      setStep('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '파일을 읽는 중 오류가 발생했습니다.');
      setStep('error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!supabase) {
      setErrorMsg('Supabase가 연결되지 않았습니다. .env 파일을 확인하세요.');
      setStep('error');
      return;
    }

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);

    // 배치로 나눠서 업로드 (한번에 100개씩)
    const BATCH_SIZE = 100;
    const total = customers.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);

      // id 필드 제거 (Supabase가 UUID 자동 생성)
      const cleanBatch = batch.map(({ id, ...rest }) => rest);

      // Supabase upsert (customer_code 기준)
      const { error } = await supabase
        .from('customers')
        .upsert(cleanBatch, { onConflict: 'customer_code' });

      if (error) {
        console.error('Import error:', error);
        setErrorMsg(`업로드 실패: ${error.message}`);
        setStep('error');
        return;
      }

      const newCount = Math.min(i + BATCH_SIZE, total);
      setImportedCount(newCount);
      setImportProgress((newCount / total) * 100);
    }

    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-900/40 backdrop-blur-sm animate-fade-in">
      <div className="panel-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-paper-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Upload size={14} className="text-signal-600" />
              <span className="micro-label">CUSTOMER IMPORT</span>
            </div>
            <h2 className="text-xl font-bold text-paper-900">고객 데이터 업로드</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-paper-500 hover:text-paper-900 hover:bg-paper-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'upload' && (
            <>
              <div className="mb-4 p-4 bg-signal-500/5 border border-signal-500/20 rounded-md">
                <div className="micro-label text-signal-700 mb-2">📋 업로드 전 확인</div>
                <ul className="text-xs text-paper-700 space-y-1">
                  <li>• 카페24 <strong>"회원 정보 조회"</strong>에서 다운받은 엑셀 파일</li>
                  <li>• 지원 형식: <strong>.xlsx, .xls, .csv</strong></li>
                  <li>• 한 번에 최대 <strong>10,000건</strong> 권장</li>
                  <li>• 중복된 아이디는 <strong>덮어쓰기</strong>됩니다</li>
                </ul>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all',
                  dragging
                    ? 'border-signal-500 bg-signal-500/10'
                    : 'border-paper-300 hover:border-signal-500 hover:bg-paper-100'
                )}
              >
                <FileSpreadsheet
                  size={48}
                  className={cn('mx-auto mb-4 transition-colors', dragging ? 'text-signal-500' : 'text-paper-400')}
                />
                <p className="text-sm text-paper-800 font-medium mb-1">
                  파일을 여기로 드래그하거나 클릭하세요
                </p>
                <p className="text-xs text-paper-500">
                  .xlsx, .xls, .csv 파일 지원
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          )}

          {step === 'preview' && validation && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCard label="총 행 수" value={validation.total} color="#5878E8" />
                <StatCard label="✓ 유효" value={validation.valid} color="#00A87D" />
                <StatCard label="⚠ 스킵" value={validation.invalid} color="#E8456A" />
              </div>

              {/* 컬럼 매핑 결과 */}
              <div className="mb-5">
                <div className="micro-label mb-2">감지된 컬럼</div>
                <div className="panel p-3 bg-paper-100">
                  <div className="text-xs text-paper-700 space-y-1 font-mono">
                    {validation.detectedColumns.map((col, i) => (
                      <div key={i}>
                        <span className="text-success">✓</span> {col}
                      </div>
                    ))}
                    {validation.missingColumns.length > 0 && (
                      <>
                        {validation.missingColumns.map((col, i) => (
                          <div key={`m-${i}`}>
                            <span className="text-paper-400">—</span> {col} (없음, 기본값 사용)
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 미리보기 */}
              <div className="mb-5">
                <div className="micro-label mb-2">미리보기 (처음 5건)</div>
                <div className="panel overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-paper-100 border-b border-paper-200">
                        <th className="text-left p-2 font-mono text-2xs text-paper-600">이름</th>
                        <th className="text-left p-2 font-mono text-2xs text-paper-600">세그먼트</th>
                        <th className="text-right p-2 font-mono text-2xs text-paper-600">주문</th>
                        <th className="text-right p-2 font-mono text-2xs text-paper-600">누적구매</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.preview.map((c) => (
                        <tr key={c.id} className="border-b border-paper-200">
                          <td className="p-2 text-paper-900">{c.name}</td>
                          <td className="p-2">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-mono"
                              style={{
                                background: `${RFM_COLORS[c.rfm_segment]}15`,
                                color: RFM_COLORS[c.rfm_segment],
                              }}
                            >
                              <div className="w-1 h-1 rounded-full" style={{ background: RFM_COLORS[c.rfm_segment] }} />
                              {RFM_LABELS[c.rfm_segment]}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono numeric">{c.total_orders}</td>
                          <td className="p-2 text-right font-mono numeric">{formatKRW(c.total_spent, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!isSupabaseConfigured && (
                <div className="mb-4 p-3 bg-alert/10 border border-alert/20 rounded-md flex items-start gap-2">
                  <AlertCircle size={14} className="text-alert shrink-0 mt-0.5" />
                  <p className="text-xs text-alert">
                    Supabase가 연결되지 않았습니다. .env 파일을 확인하세요.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'importing' && (
            <div className="py-10 text-center">
              <Loader2 size={40} className="mx-auto text-signal-500 animate-spin mb-4" />
              <p className="text-sm text-paper-800 font-medium mb-2">
                Supabase에 업로드 중...
              </p>
              <p className="text-2xs font-mono text-paper-500 mb-4">
                {formatNumber(importedCount)} / {formatNumber(customers.length)}
              </p>
              <div className="max-w-xs mx-auto h-1.5 bg-paper-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-signal-500 transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="py-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-bold text-paper-900 mb-2">업로드 완료!</h3>
              <p className="text-sm text-paper-600">
                <span className="font-bold text-success">{formatNumber(importedCount)}명</span>의 고객 데이터가 저장되었습니다.
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="py-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-alert/10 flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-alert" />
              </div>
              <h3 className="text-lg font-bold text-paper-900 mb-2">오류 발생</h3>
              <p className="text-sm text-paper-600 mb-4">{errorMsg}</p>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-paper-200 hover:bg-paper-300 rounded-md text-sm font-medium text-paper-800"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-paper-200 bg-paper-100">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-sm font-medium text-paper-700 hover:bg-paper-200 rounded-md transition-colors"
            >
              다시 선택
            </button>
            <button
              onClick={handleImport}
              disabled={!isSupabaseConfigured || validation?.valid === 0}
              className="px-4 py-2 bg-signal-500 hover:bg-signal-600 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Supabase에 업로드 ({formatNumber(validation?.valid || 0)}건)
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-paper-200 bg-paper-100">
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="px-4 py-2 bg-signal-500 hover:bg-signal-600 text-white text-sm font-semibold rounded-md transition-colors"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="panel p-3 text-center">
      <div className="micro-label mb-1">{label}</div>
      <div className="text-xl font-bold numeric" style={{ color }}>
        {formatNumber(value)}
      </div>
    </div>
  );
}
