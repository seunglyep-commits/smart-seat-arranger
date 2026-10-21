import React from 'react';
import { ArrangementHistoryItem } from '../types';
import { History, Calendar, RotateCcw, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

interface HistoryViewerProps {
  history: ArrangementHistoryItem[];
  onRestoreHistory: (item: ArrangementHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryViewer: React.FC<HistoryViewerProps> = ({
  history,
  onRestoreHistory,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 상단 안내 박스 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">배치 이력 (히스토리)</h2>
              <p className="text-xs text-slate-500">
                총 {history.length}건의 과거 자리 배치가 기록되어 있습니다.
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              전체 이력 비우기
            </button>
          )}
        </div>

        <div className="flex items-start gap-2 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong>알고리즘 연동 안내:</strong> 이곳에 저장된 이전 배치 데이터는 <strong>[이전 짝 피하기]</strong>와 <strong>[이전 같은 자리 피하기]</strong> 기능의 핵심 비교 자료로 자동 활용됩니다.
          </div>
        </div>
      </div>

      {/* 이력 리스트 */}
      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">아직 저장된 배치 이력이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">
            [좌석 배치표]에서 '즉시 배치' 또는 '추첨 애니메이션'을 실행하면 이력이 자동으로 누적됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, idx) => {
            const placedCount = item.seatAssignments.filter(s => s.studentId).length;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      #{history.length - idx}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.dateStr}
                        </span>
                        <span>•</span>
                        <span>{item.layoutConfig.name}</span>
                        <span>•</span>
                        <span>배치 {placedCount}명</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRestoreHistory(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                      title="이 당시의 자리 배치표를 현재 화면으로 불러옵니다"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>이 배치 복원</span>
                    </button>
                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="이 이력 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 짝꿍 요약 칩들 */}
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-1.5">배치 요약 미리보기:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {item.seatAssignments
                      .filter(s => s.studentName)
                      .map((sa) => (
                        <span
                          key={sa.seatId}
                          className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700 shadow-2xs"
                        >
                          <strong>{sa.studentName}</strong>
                          {sa.partnerName && (
                            <span className="text-slate-400 ml-1">
                              (짝: {sa.partnerName})
                            </span>
                          )}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
