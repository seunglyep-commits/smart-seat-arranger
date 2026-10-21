import React, { useState } from 'react';
import { Student, LayoutConfig, Seat, ArrangementRules } from '../types';
import { Pin, Eye, UserX, ArrowLeftRight, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SeatGridProps {
  layoutConfig: LayoutConfig;
  seats: Seat[];
  students: Student[];
  rules: ArrangementRules;
  diagnostics: { message: string; type: 'success' | 'info' | 'warning' }[];
  partnerMap: Record<string, string>;
  onSwapSeats: (seatIdA: number, seatIdB: number) => void;
  onToggleSeatActive: (seatId: number) => void;
  onToggleStudentFixed: (studentId: string, seatId: number) => void;
  onToggleStudentFrontRow: (studentId: string) => void;
  onInstantArrange: () => void;
  onAnimateArrange: () => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  layoutConfig,
  seats,
  students,
  diagnostics,
  partnerMap,
  onSwapSeats,
  onToggleSeatActive,
  onToggleStudentFixed,
  onToggleStudentFrontRow,
  onInstantArrange,
  onAnimateArrange,
}) => {
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<number | null>(null);

  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  // 좌석 클릭 처리
  const handleSeatClick = (seat: Seat) => {
    // 비활성화된 좌석 클릭 시: 활성화 전환
    if (!seat.active) {
      onToggleSeatActive(seat.id);
      return;
    }

    // 자리 교환(스왑) 모드 처리
    if (selectedSeatId === null) {
      if (seat.studentId !== null) {
        setSelectedSeatId(seat.id);
        soundManager.playTick();
      } else {
        // 빈 활성 좌석을 클릭한 경우 비활성화할지 여부
        onToggleSeatActive(seat.id);
      }
    } else {
      if (selectedSeatId === seat.id) {
        // 선택 취소
        setSelectedSeatId(null);
      } else {
        // 스왑 실행
        onSwapSeats(selectedSeatId, seat.id);
        soundManager.playSwap();
        setSelectedSeatId(null);
      }
    }
  };

  const selectedSeat = selectedSeatId !== null ? seats.find(s => s.id === selectedSeatId) : null;
  const selectedStudent = selectedSeat?.studentId ? studentMap.get(selectedSeat.studentId) : null;

  // 행별로 그룹화
  const rows: Seat[][] = [];
  for (let r = 0; r < layoutConfig.rows; r++) {
    rows.push(seats.filter(s => s.row === r));
  }

  // 칠판/교탁 컴포넌트
  const TeacherDeskBoard = () => (
    <div className="w-full flex justify-center my-4">
      <div className="w-4/5 max-w-xl bg-slate-800 text-white rounded-xl shadow-md py-2.5 px-6 flex items-center justify-between border-2 border-slate-700">
        <span className="text-xs font-semibold tracking-wider text-slate-300">창문 / 복도</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-bold text-sm tracking-widest text-emerald-300">칠 판 · 교 탁</span>
        </div>
        <span className="text-xs font-semibold tracking-wider text-slate-300">출입문 / 복도</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 상단 진단 및 알림 배너 */}
      {diagnostics.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              배치 분석 결과 및 안내
            </h3>
            <span className="text-xs text-slate-500">
              클릭하여 자리 교환 또는 고정석 설정 가능
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {diagnostics.map((diag, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                  diag.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : diag.type === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}
              >
                {diag.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                {diag.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                {diag.type === 'info' && <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{diag.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자리 교환 활성화 배너 */}
      {selectedStudent && (
        <div className="bg-indigo-600 text-white rounded-xl p-3 px-5 shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-5 h-5" />
            <div>
              <span className="font-bold">{selectedStudent.name}</span> ({selectedStudent.id}) 학생의 자리를 이동할 대상을 클릭하세요.
            </div>
          </div>
          <button
            onClick={() => setSelectedSeatId(null)}
            className="text-xs bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            선택 취소
          </button>
        </div>
      )}

      {/* 교실 좌석 그리드 컨테이너 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-x-auto">
        {/* 교탁이 상단일 때 */}
        {layoutConfig.teacherDeskPos === 'top' && <TeacherDeskBoard />}

        {/* 좌석 격자 */}
        <div className="min-w-[650px] space-y-3 my-2">
          {rows.map((rowSeats, rIdx) => (
            <div key={rIdx} className="flex items-center justify-center gap-2">
              <span className="w-7 text-center text-xs font-semibold text-slate-400 shrink-0">
                {rIdx + 1}열
              </span>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {rowSeats.map((seat, cIdx) => {
                  const student = seat.studentId ? studentMap.get(seat.studentId) : null;
                  const isAisle = layoutConfig.aisleAfterCols.includes(cIdx);
                  const isSelected = selectedSeatId === seat.id;
                  const isHovered = hoveredSeatId === seat.id;
                  const partnerId = student ? partnerMap[student.id] : null;
                  const partner = partnerId ? studentMap.get(partnerId) : null;
                  const isFixed = student?.fixedSeatId === seat.id;

                  // 비활성화 좌석 렌더링
                  if (!seat.active) {
                    return (
                      <React.Fragment key={seat.id}>
                        <div
                          onClick={() => handleSeatClick(seat)}
                          className="w-24 sm:w-28 h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all hover:border-slate-400 group"
                          title="클릭하면 책상이 활성화됩니다"
                        >
                          <span className="text-xs font-medium group-hover:text-slate-600">빈자리</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-indigo-600">+ 활성화</span>
                        </div>
                        {isAisle && <div className="w-5 sm:w-8" />}
                      </React.Fragment>
                    );
                  }

                  // 학생이 없는 빈 활성 좌석
                  if (!student) {
                    return (
                      <React.Fragment key={seat.id}>
                        <div
                          onClick={() => handleSeatClick(seat)}
                          className={`w-24 sm:w-28 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                          }`}
                          title="클릭하여 학생을 이동하거나 책상을 끌 수 있습니다"
                        >
                          <span className="text-xs font-medium">공석</span>
                          <span className="text-[10px] text-slate-400">({seat.id + 1}번)</span>
                        </div>
                        {isAisle && <div className="w-5 sm:w-8" />}
                      </React.Fragment>
                    );
                  }

                  // 학생 배치된 좌석
                  const isMale = student.gender === '남';

                  return (
                    <React.Fragment key={seat.id}>
                      <div
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeatId(seat.id)}
                        onMouseLeave={() => setHoveredSeatId(null)}
                        className={`w-24 sm:w-28 h-20 rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 relative select-none shadow-sm ${
                          isSelected
                            ? 'ring-4 ring-indigo-500 scale-105 z-20 shadow-lg'
                            : isHovered
                            ? 'scale-[1.02] shadow-md z-10'
                            : ''
                        } ${
                          isMale
                            ? 'bg-gradient-to-b from-sky-50 to-blue-50/60 border border-sky-300 hover:border-sky-400 text-sky-950'
                            : 'bg-gradient-to-b from-rose-50 to-pink-50/60 border border-rose-300 hover:border-rose-400 text-rose-950'
                        }`}
                      >
                        {/* 상단: 학번 및 뱃지 */}
                        <div className="flex items-center justify-between text-[11px] leading-none">
                          <span className="font-mono text-slate-500 font-semibold">{student.id}</span>
                          <div className="flex items-center gap-1">
                            {isFixed && (
                              <span title="고정석 (추첨 시 자리 유지)" className="text-amber-600 bg-amber-100 p-0.5 rounded">
                                <Pin className="w-2.5 h-2.5" />
                              </span>
                            )}
                            {student.needsFrontRow && (
                              <span title="앞자리 배려 학생" className="text-emerald-700 bg-emerald-100 p-0.5 rounded">
                                <Eye className="w-2.5 h-2.5" />
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${
                                isMale ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {student.gender}
                            </span>
                          </div>
                        </div>

                        {/* 중앙: 성명 (크고 또렷하게) */}
                        <div className="text-center font-bold text-sm sm:text-base tracking-wide text-slate-900 truncate">
                          {student.name}
                        </div>

                        {/* 하단: 좌석 번호 & 짝꿍 힌트 */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 leading-none">
                          <span>{seat.id + 1}번</span>
                          {partner && (
                            <span className="truncate max-w-[45px] text-slate-500" title={`짝꿍: ${partner.name}`}>
                              짝:{partner.name}
                            </span>
                          )}
                        </div>

                        {/* 호버 시 퀵 액션 팝오버 버튼 */}
                        {isHovered && (
                          <div
                            className="absolute -top-3 right-1 bg-white border border-slate-300 rounded-md shadow-md flex items-center p-0.5 gap-0.5 z-30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onToggleStudentFixed(student.id, seat.id)}
                              className={`p-1 rounded hover:bg-slate-100 text-xs ${isFixed ? 'text-amber-600' : 'text-slate-400'}`}
                              title={isFixed ? '고정석 해제' : '현재 좌석으로 고정'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onToggleStudentFrontRow(student.id)}
                              className={`p-1 rounded hover:bg-slate-100 text-xs ${student.needsFrontRow ? 'text-emerald-600' : 'text-slate-400'}`}
                              title={student.needsFrontRow ? '앞자리 배려 해제' : '앞자리 배려 설정'}
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onToggleSeatActive(seat.id)}
                              className="p-1 rounded hover:bg-slate-100 text-xs text-rose-500"
                              title="이 책상 비우기/비활성화"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isAisle && <div className="w-5 sm:w-8" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 교탁이 하단일 때 */}
        {layoutConfig.teacherDeskPos === 'bottom' && <TeacherDeskBoard />}
      </div>

      {/* 하단 빠른 버튼 안내 바 */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-200 border border-sky-400 inline-block"></span>
            남학생
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-200 border border-rose-400 inline-block"></span>
            여학생
          </span>
          <span className="flex items-center gap-1.5">
            <Pin className="w-3 h-3 text-amber-600" />
            고정석
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-emerald-600" />
            앞자리 배려
          </span>
          <span>💡 좌석을 클릭한 뒤 다른 좌석을 누르면 자리가 맞바뀝니다.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onInstantArrange}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-medium text-slate-700 shadow-sm transition-all"
          >
            다시 배치하기
          </button>
          <button
            onClick={onAnimateArrange}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-medium text-white shadow-sm transition-all"
          >
            🎲 추첨 모드
          </button>
        </div>
      </div>
    </div>
  );
};
