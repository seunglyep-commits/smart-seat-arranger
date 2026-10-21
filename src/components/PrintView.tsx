import React, { useState } from 'react';
import { LayoutConfig, Seat, Student } from '../types';
import { Printer, Eye, FileText } from 'lucide-react';

interface PrintViewProps {
  classTitle: string;
  layoutConfig: LayoutConfig;
  seats: Seat[];
  students: Student[];
}

export const PrintView: React.FC<PrintViewProps> = ({
  classTitle,
  layoutConfig,
  seats,
  students,
}) => {
  const [perspective, setPerspective] = useState<'teacher' | 'students'>('students');
  const [includeStudentList, setIncludeStudentList] = useState<boolean>(true);
  const [monochrome, setMonochrome] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('large');

  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  // 오늘 날짜 문자열
  const todayStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 시점(교탁 기준 vs 학생 기준)에 따른 행 정렬
  // 학생 기준: 칠판(교탁)이 상단에 보임
  // 교탁 기준: 교탁이 하단에 위치하고 좌우가 선생님이 교탁에서 바라보는 방향
  let displayRows: Seat[][] = [];
  for (let r = 0; r < layoutConfig.rows; r++) {
    displayRows.push(seats.filter(s => s.row === r));
  }

  if (perspective === 'teacher') {
    // 선생님 시선: 상하 반전 (선생님 앞에 1열이 오도록)
    displayRows = [...displayRows].reverse();
  }

  // 인쇄 실행
  const handlePrint = () => {
    window.print();
  };

  // 번호순/학번순 정렬된 배정 학생 목록
  const sortedStudentsWithSeat = students
    .map(st => {
      const assignedSeat = seats.find(s => s.studentId === st.id);
      return {
        student: st,
        seatId: assignedSeat ? assignedSeat.id + 1 : null,
      };
    })
    .sort((a, b) => a.student.id.localeCompare(b.student.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 인쇄 옵션 컨트롤 바 (화면에만 보이고 인쇄 시 자동 숨김) */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              배치표 인쇄 및 출력 설정
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              A4 용지 규격에 맞춰 깨끗하게 인쇄되거나 PDF로 저장할 수 있습니다.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>지금 인쇄하기 (Ctrl+P)</span>
          </button>
        </div>

        {/* 인쇄 옵션 체크/선택 그룹 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* 시점 선택 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              시점 기준
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setPerspective('students')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium border text-center transition-all ${
                  perspective === 'students'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                칠판 기준 (학생 시선)
              </button>
              <button
                type="button"
                onClick={() => setPerspective('teacher')}
                className={`flex-1 py-1 px-2 rounded-lg font-medium border text-center transition-all ${
                  perspective === 'teacher'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                교탁 기준 (선생님 시선)
              </button>
            </div>
          </div>

          {/* 명단표 포함 여부 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              추가 정보
            </label>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={includeStudentList}
                onChange={(e) => setIncludeStudentList(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-slate-700 font-medium">하단 번호순 좌석표 포함</span>
            </label>
          </div>

          {/* 흑백 / 글자 크기 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
            <label className="block font-semibold text-slate-700 mb-1.5">스타일 옵션</label>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monochrome}
                  onChange={(e) => setMonochrome(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-slate-700 font-medium">흑백 고대비 (잉크 절약)</span>
              </label>

              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'normal' | 'large')}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-700"
              >
                <option value="normal">글자 보통</option>
                <option value="large">글자 크게</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 인쇄 출력물 영역 (A4 종이 규격 렌더링) */}
      <div className="print-area bg-white rounded-2xl border border-slate-300 p-8 shadow-md text-slate-900 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* 인쇄용 헤더 */}
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {classTitle} 자리 배치표
          </h1>
          <div className="flex items-center justify-between text-xs text-slate-600 mt-2 font-medium">
            <span>배치 일자: {todayStr}</span>
            <span>배열 형태: {layoutConfig.name}</span>
            <span>기준: {perspective === 'students' ? '칠판 기준 (학생 시선)' : '교탁 기준 (선생님 시선)'}</span>
          </div>
        </div>

        {/* 칠판/교탁 배너 (학생 시선일 땐 상단, 선생님 시선일 땐 하단) */}
        {perspective === 'students' && (
          <div className="w-full flex justify-center mb-6">
            <div className="w-3/4 max-w-lg bg-slate-800 text-white font-bold py-2 px-6 rounded-lg text-center tracking-widest text-sm shadow-sm border border-slate-900">
              [ 칠 판 / 교 탁 ]
            </div>
          </div>
        )}

        {/* 좌석 배치 격자 */}
        <div className="space-y-3 my-4">
          {displayRows.map((rowSeats, rIdx) => (
            <div key={rIdx} className="flex items-center justify-center gap-2">
              <span className="w-8 text-center text-xs font-bold text-slate-500 shrink-0">
                {perspective === 'teacher' ? layoutConfig.rows - rIdx : rIdx + 1}열
              </span>

              <div className="flex items-center gap-2">
                {rowSeats.map((seat, cIdx) => {
                  const student = seat.studentId ? studentMap.get(seat.studentId) : null;
                  const isAisle = layoutConfig.aisleAfterCols.includes(cIdx);

                  if (!seat.active) {
                    return (
                      <React.Fragment key={seat.id}>
                        <div className="w-24 sm:w-28 h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-xs font-mono">
                          빈자리
                        </div>
                        {isAisle && <div className="w-6 sm:w-8" />}
                      </React.Fragment>
                    );
                  }

                  if (!student) {
                    return (
                      <React.Fragment key={seat.id}>
                        <div className="w-24 sm:w-28 h-20 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                          (공석)
                        </div>
                        {isAisle && <div className="w-6 sm:w-8" />}
                      </React.Fragment>
                    );
                  }

                  const isMale = student.gender === '남';

                  return (
                    <React.Fragment key={seat.id}>
                      <div
                        className={`w-24 sm:w-28 h-20 rounded-lg p-2 flex flex-col justify-between border-2 ${
                          monochrome
                            ? 'border-slate-800 bg-white text-slate-900'
                            : isMale
                            ? 'border-sky-300 bg-sky-50 text-slate-900'
                            : 'border-rose-300 bg-rose-50 text-slate-900'
                        }`}
                      >
                        {/* 상단 학번 & 좌석 번호 */}
                        <div className="flex items-center justify-between text-[11px] font-mono leading-none font-semibold text-slate-600">
                          <span>{student.id}</span>
                          <span className="text-[10px] text-slate-400">{seat.id + 1}번</span>
                        </div>

                        {/* 이름 (또렷하게) */}
                        <div
                          className={`text-center font-black tracking-wide truncate ${
                            fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                          }`}
                        >
                          {student.name}
                        </div>

                        {/* 하단 성별 */}
                        <div className="text-right text-[10px] text-slate-500 font-semibold leading-none">
                          {student.gender}
                        </div>
                      </div>
                      {isAisle && <div className="w-6 sm:w-8" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 칠판/교탁 배너 (선생님 시선일 땐 하단) */}
        {perspective === 'teacher' && (
          <div className="w-full flex justify-center mt-6">
            <div className="w-3/4 max-w-lg bg-slate-800 text-white font-bold py-2 px-6 rounded-lg text-center tracking-widest text-sm shadow-sm border border-slate-900">
              [ 칠 판 / 교 탁 (선생님 시선) ]
            </div>
          </div>
        )}

        {/* 하단 번호순/학번순 좌석 번호표 */}
        {includeStudentList && (
          <div className="mt-8 pt-6 border-t-2 border-slate-300">
            <h3 className="text-xs font-bold text-slate-700 mb-3 tracking-wide text-center">
              [ 학번순 학생 좌석 번호 배정 일람표 ]
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1.5 text-xs">
              {sortedStudentsWithSeat.map(({ student, seatId }) => (
                <div
                  key={student.id}
                  className="p-1.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <span className="font-mono text-slate-500 text-[11px]">{student.id}</span>
                  <strong className="text-slate-800 truncate">{student.name}</strong>
                  <span className="font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                    {seatId ? `${seatId}번` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인쇄물 푸터 */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>스마트 자리바꾸기 프로그램 • 교실 좌석 배치표</span>
          <span>출력 일시: {new Date().toLocaleString('ko-KR')}</span>
        </div>
      </div>
    </div>
  );
};
