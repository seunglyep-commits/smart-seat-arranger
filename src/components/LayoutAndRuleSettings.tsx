import React, { useState } from 'react';
import { LayoutConfig, LayoutPreset, ArrangementRules, Student } from '../types';
import { PRESET_LAYOUTS } from '../constants/presets';
import { Settings, ShieldCheck, Users, Check, Plus, Trash2, Pin, HelpCircle } from 'lucide-react';

interface LayoutAndRuleSettingsProps {
  layoutConfig: LayoutConfig;
  setLayoutConfig: (config: LayoutConfig) => void;
  rules: ArrangementRules;
  setRules: (rules: ArrangementRules) => void;
  students: Student[];
  onRemoveFixedStudent: (studentId: string) => void;
  onClearAllRules: () => void;
}

export const LayoutAndRuleSettings: React.FC<LayoutAndRuleSettingsProps> = ({
  layoutConfig,
  setLayoutConfig,
  rules,
  setRules,
  students,
  onRemoveFixedStudent,
}) => {
  const [sepStudentA, setSepStudentA] = useState<string>('');
  const [sepStudentB, setSepStudentB] = useState<string>('');

  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  // 프리셋 선택 핸들러
  const handleSelectPreset = (presetKey: LayoutPreset) => {
    const base = PRESET_LAYOUTS[presetKey];
    setLayoutConfig({
      ...base,
      // 현재 학생 수가 26명이면 책상 개수에 맞추어 비활성화 자동 조정
      disabledSeatIds: [...base.disabledSeatIds],
    });
  };

  // 분리 학생 쌍 추가
  const handleAddSeparation = () => {
    if (!sepStudentA || !sepStudentB || sepStudentA === sepStudentB) return;
    // 중복 검사
    const exists = rules.separatedPairs.some(
      ([a, b]) => (a === sepStudentA && b === sepStudentB) || (a === sepStudentB && b === sepStudentA)
    );
    if (exists) return;

    setRules({
      ...rules,
      separatedPairs: [...rules.separatedPairs, [sepStudentA, sepStudentB]],
    });
    setSepStudentA('');
    setSepStudentB('');
  };

  // 분리 학생 쌍 삭제
  const handleRemoveSeparation = (idx: number) => {
    const nextPairs = [...rules.separatedPairs];
    nextPairs.splice(idx, 1);
    setRules({
      ...rules,
      separatedPairs: nextPairs,
    });
  };

  // 학생 수와 좌석 수 계산
  const totalDesks = layoutConfig.rows * layoutConfig.cols;
  const activeDesks = totalDesks - layoutConfig.disabledSeatIds.length;
  const fixedStudents = students.filter(s => s.fixedSeatId !== null && s.fixedSeatId !== undefined && s.fixedSeatId >= 0);
  const frontRowStudents = students.filter(s => s.needsFrontRow);

  // 남은 좌석 학생 수에 맞게 자동 정리
  const handleAutoFitDesks = () => {
    const diff = activeDesks - students.length;
    if (diff <= 0) return;

    // 맨 뒷줄 끝자리부터 차례대로 비활성화
    const newDisabled = new Set(layoutConfig.disabledSeatIds);
    for (let r = layoutConfig.rows - 1; r >= 0; r--) {
      // 좌우 끝자리부터
      for (let c of [0, layoutConfig.cols - 1, 1, layoutConfig.cols - 2]) {
        const seatId = r * layoutConfig.cols + c;
        if (!newDisabled.has(seatId)) {
          newDisabled.add(seatId);
          if (newDisabled.size === totalDesks - students.length) break;
        }
      }
      if (newDisabled.size === totalDesks - students.length) break;
    }

    setLayoutConfig({
      ...layoutConfig,
      disabledSeatIds: Array.from(newDisabled),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 상단 안내 박스 */}
      <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          배열 형태 및 배치 주의 사항(조건) 설정
        </h2>
        <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
          3분단 짝지어 앉기, 5행 5열 일렬 배치 등 원하는 배열을 선택하고, 이전 짝·이전 자리 피하기 등의 규칙을 설정하여 공정하고 편리한 교실 자리를 만듭니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카드 1: 교실 배열 설정 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              1. 자리 배열 형태 선택
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              학생 {students.length}명 / 활성 {activeDesks}석
            </span>
          </div>

          {/* 프리셋 선택 버튼 그룹 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSelectPreset('3sections_pairs')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                layoutConfig.preset === '3sections_pairs'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {layoutConfig.preset === '3sections_pairs' && (
                <Check className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
              )}
              <div className="font-bold text-sm">3분단 짝지어 앉기</div>
              <div className="text-xs text-slate-500 mt-1">6열(2-2-2) 분단 짝꿍 배열</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1.5">추천 표준 배열</div>
            </button>

            <button
              onClick={() => handleSelectPreset('5x5_single')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                layoutConfig.preset === '5x5_single'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {layoutConfig.preset === '5x5_single' && (
                <Check className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
              )}
              <div className="font-bold text-sm">5열 일렬 한줄로 앉기</div>
              <div className="text-xs text-slate-500 mt-1">5열 1인 1석 (독서실/시험형)</div>
              <div className="text-[11px] text-slate-400 mt-1.5">독립형 개인 책상</div>
            </button>

            <button
              onClick={() => handleSelectPreset('4sections_pairs')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                layoutConfig.preset === '4sections_pairs'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {layoutConfig.preset === '4sections_pairs' && (
                <Check className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
              )}
              <div className="font-bold text-sm">4분단 짝지어 앉기</div>
              <div className="text-xs text-slate-500 mt-1">8열(2-2-2-2) 넓은 교실형</div>
              <div className="text-[11px] text-slate-400 mt-1.5">총 32석 수용</div>
            </button>

            <button
              onClick={() => handleSelectPreset('custom')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                layoutConfig.preset === 'custom'
                  ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {layoutConfig.preset === 'custom' && (
                <Check className="w-4 h-4 text-indigo-600 absolute top-3 right-3" />
              )}
              <div className="font-bold text-sm">자유 맞춤 설정</div>
              <div className="text-xs text-slate-500 mt-1">행·열·복도 직접 조절</div>
              <div className="text-[11px] text-slate-400 mt-1.5">모든 교실 형태 대응</div>
            </button>
          </div>

          {/* 세부 크기 설정 */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">세로 행 수 (Rows)</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={layoutConfig.rows}
                  onChange={(e) =>
                    setLayoutConfig({
                      ...layoutConfig,
                      rows: Math.max(2, Math.min(10, parseInt(e.target.value) || 2)),
                      preset: 'custom',
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">가로 열 수 (Cols)</label>
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={layoutConfig.cols}
                  onChange={(e) =>
                    setLayoutConfig({
                      ...layoutConfig,
                      cols: Math.max(2, Math.min(12, parseInt(e.target.value) || 2)),
                      preset: 'custom',
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">짝꿍 형태</label>
                <select
                  value={layoutConfig.pairGroupSize}
                  onChange={(e) =>
                    setLayoutConfig({
                      ...layoutConfig,
                      pairGroupSize: parseInt(e.target.value) || 1,
                      preset: 'custom',
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1인 1석 (단독 책상)</option>
                  <option value={2}>2인 1조 (짝꿍)</option>
                  <option value={3}>3인 모둠</option>
                  <option value={4}>4인 모둠</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">교탁/칠판 위치</label>
                <select
                  value={layoutConfig.teacherDeskPos}
                  onChange={(e) =>
                    setLayoutConfig({
                      ...layoutConfig,
                      teacherDeskPos: e.target.value as 'top' | 'bottom',
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="top">상단 (학생 기준 앞쪽)</option>
                  <option value="bottom">하단 (교탁 뒤 시선)</option>
                </select>
              </div>
            </div>

            {/* 좌석 과다 시 자동 맞춤 버튼 */}
            {activeDesks > students.length && (
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <span className="text-slate-600">
                  활성 좌석이 학생보다 {activeDesks - students.length}석 많습니다.
                </span>
                <button
                  onClick={handleAutoFitDesks}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
                >
                  {students.length}석으로 자동 맞춤
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 카드 2: 주의 사항 및 배치 규칙 (제약 조건) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              2. 배치 시 주의 사항 및 조건 설정
            </h3>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              공정 배치 알고리즘
            </span>
          </div>

          <div className="space-y-3.5">
            {/* 조건 1: 이전 같은 자리 피하기 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  이전 같은 자리 피하기
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-medium">
                    필수 권장
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  직전 회차에서 앉았던 동일 좌석을 피해 다른 위치로 순환 배치합니다.
                </div>
              </div>
              <input
                type="checkbox"
                checked={rules.avoidSameSeat}
                onChange={(e) => setRules({ ...rules, avoidSameSeat: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* 조건 2: 이전 짝 피하기 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  이전 짝 피하기
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-medium">
                    필수 권장
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  과거 배치 이력에서 한 번 짝이었던 친구와 다시 짝이 되지 않도록 합니다.
                </div>
              </div>
              <input
                type="checkbox"
                checked={rules.avoidSamePartner}
                onChange={(e) => setRules({ ...rules, avoidSamePartner: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* 조건 3: 짝꿍 성별 규칙 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-semibold text-xs text-slate-900">짝꿍 성별 배정 규칙</div>
              <div className="text-[11px] text-slate-500">
                짝꿍 구성 시 남녀 비율과 짝 형태를 제어합니다.
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setRules({ ...rules, genderPairing: 'any' })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                    rules.genderPairing === 'any'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  성별 무관 (자유)
                </button>
                <button
                  type="button"
                  onClick={() => setRules({ ...rules, genderPairing: 'different' })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                    rules.genderPairing === 'different'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  남녀 짝 우선
                </button>
                <button
                  type="button"
                  onClick={() => setRules({ ...rules, genderPairing: 'same' })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition-all ${
                    rules.genderPairing === 'same'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  동성 짝 우선
                </button>
              </div>
            </div>

            {/* 조건 4: 앞자리 배려 학생 1~2열 우선 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/60 transition-colors">
              <div>
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                  앞자리 배려 학생 1~2열 우선
                  {frontRowStudents.length > 0 && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-medium">
                      대상 {frontRowStudents.length}명
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  시력·청력·집중 배려가 필요한 학생을 칠판과 가까운 1~2열에 우선 배치합니다.
                </div>
              </div>
              <input
                type="checkbox"
                checked={rules.frontRowPriority}
                onChange={(e) => setRules({ ...rules, frontRowPriority: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* 조건 5: 특정 학생 분리 배치 (떨어뜨리기) */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-xs text-slate-900 flex items-center gap-1">
                  <span>특정 학생 떨어뜨리기 (분리 배치)</span>
                  <span title="서로 짝이 되거나 바로 인접하지 않도록 분리합니다" className="cursor-help text-slate-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {rules.separatedPairs.length}쌍 등록됨
                </span>
              </div>

              {/* 추가 입력 폼 */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={sepStudentA}
                  onChange={(e) => setSepStudentA(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">학생 A 선택</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>

                <span className="text-slate-400 text-xs">≠</span>

                <select
                  value={sepStudentB}
                  onChange={(e) => setSepStudentB(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">학생 B 선택</option>
                  {students
                    .filter(s => s.id !== sepStudentA)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddSeparation}
                  disabled={!sepStudentA || !sepStudentB}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  추가
                </button>
              </div>

              {/* 등록된 목록 */}
              {rules.separatedPairs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {rules.separatedPairs.map(([idA, idB], idx) => {
                    const stA = studentMap.get(idA);
                    const stB = studentMap.get(idB);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                      >
                        <span className="text-slate-800">
                          <strong className="text-rose-700">{stA?.name || idA}</strong> 과(와){' '}
                          <strong className="text-rose-700">{stB?.name || idB}</strong> 서로 분리
                        </span>
                        <button
                          onClick={() => handleRemoveSeparation(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="분리 규칙 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 고정석 현황 */}
            {fixedStudents.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="font-semibold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-600" />
                    현재 지정된 고정석 ({fixedStudents.length}명)
                  </span>
                  <span className="text-[11px] text-amber-700">추첨 시 현재 좌석 유지</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {fixedStudents.map(st => (
                    <span
                      key={st.id}
                      className="inline-flex items-center gap-1 bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded-md"
                    >
                      <span>{st.name} (좌석 {((st.fixedSeatId ?? 0) + 1)}번)</span>
                      <button
                        onClick={() => onRemoveFixedStudent(st.id)}
                        className="hover:text-rose-600 ml-1 text-slate-400"
                        title="고정석 해제"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
