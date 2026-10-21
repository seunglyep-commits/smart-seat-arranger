import React, { useState, useEffect, useCallback } from 'react';
import { Student, LayoutConfig, ArrangementRules, Seat, ArrangementHistoryItem } from './types';
import { PRESET_LAYOUTS } from './constants/presets';
import { DEFAULT_RULES, STORAGE_KEYS, decodeRequestedRoster } from './constants/defaultData';
import { arrangeSeats, generateEmptySeats } from './utils/seatArranger';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { SeatGrid } from './components/SeatGrid';
import { LayoutAndRuleSettings } from './components/LayoutAndRuleSettings';
import { StudentManager } from './components/StudentManager';
import { HistoryViewer } from './components/HistoryViewer';
import { PrintView } from './components/PrintView';
import { ShuffleAnimationModal } from './components/ShuffleAnimationModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'seating' | 'layout' | 'students' | 'history' | 'print'>('seating');
  const [classTitle, setClassTitle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CLASS_TITLE) || '1학년 2반';
  });

  // 학생 명단 초기화 (기존 저장 데이터가 없으면 요청하신 26명 명단 기본 제공)
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return decodeRequestedRoster();
  });

  // 좌석 배열 설정
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return PRESET_LAYOUTS['3sections_pairs'];
  });

  // 배치 조건 및 주의 사항 규칙
  const [rules, setRules] = useState<ArrangementRules>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_RULES;
  });

  // 배치 이력
  const [history, setHistory] = useState<ArrangementHistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 현재 좌석 상태
  const [seats, setSeats] = useState<Seat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ARRANGEMENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return generateEmptySeats(PRESET_LAYOUTS['3sections_pairs']);
  });

  const [diagnostics, setDiagnostics] = useState<{ message: string; type: 'success' | 'info' | 'warning' }[]>([]);
  const [partnerMap, setPartnerMap] = useState<Record<string, string>>({});
  const [isShufflingModalOpen, setIsShufflingModalOpen] = useState<boolean>(false);
  const [pendingSeats, setPendingSeats] = useState<Seat[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 로컬 스토리지 자동 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASS_TITLE, classTitle);
  }, [classTitle]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LAYOUT, JSON.stringify(layoutConfig));
  }, [layoutConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ARRANGEMENT, JSON.stringify(seats));
  }, [seats]);

  // 첫 마운트 시 좌석이 비어있다면 자동 1회 배치
  useEffect(() => {
    if (seats.every(s => s.studentId === null) && students.length > 0) {
      const res = arrangeSeats(students, layoutConfig, rules, history);
      setSeats(res.seats);
      setDiagnostics(res.diagnostics);
      setPartnerMap(res.partnerMap);
    }
  }, []);

  // 이력에 새 배치 저장 헬퍼
  const saveToHistory = useCallback((newSeats: Seat[], currentConfig: LayoutConfig, newPartnerMap: Record<string, string>) => {
    const studentMap = new Map<string, Student>();
    students.forEach(s => studentMap.set(s.id, s));

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: ArrangementHistoryItem = {
      id: String(Date.now()),
      timestamp: Date.now(),
      dateStr,
      title: `${history.length + 1}회차 (${dateStr})`,
      layoutConfig: currentConfig,
      seatAssignments: newSeats.map(s => {
        const st = s.studentId ? studentMap.get(s.studentId) : null;
        const pId = s.studentId ? newPartnerMap[s.studentId] : null;
        const partner = pId ? studentMap.get(pId) : null;
        return {
          seatId: s.id,
          studentId: s.studentId,
          studentName: st?.name,
          studentGender: st?.gender,
          row: s.row,
          col: s.col,
          partnerStudentId: pId,
          partnerName: partner?.name,
        };
      }),
    };

    setHistory(prev => [newItem, ...prev]);
  }, [students, history.length]);

  // 즉시 자동 배치 실행
  const handleInstantArrange = useCallback(() => {
    const res = arrangeSeats(students, layoutConfig, rules, history);
    setSeats(res.seats);
    setDiagnostics(res.diagnostics);
    setPartnerMap(res.partnerMap);
    saveToHistory(res.seats, layoutConfig, res.partnerMap);
    soundManager.playFanfare();
    setActiveTab('seating');
  }, [students, layoutConfig, rules, history, saveToHistory]);

  // 추첨 애니메이션 실행
  const handleAnimateArrange = useCallback(() => {
    const res = arrangeSeats(students, layoutConfig, rules, history);
    setPendingSeats(res.seats);
    setDiagnostics(res.diagnostics);
    setPartnerMap(res.partnerMap);
    setIsShufflingModalOpen(true);
  }, [students, layoutConfig, rules, history]);

  // 추첨 애니메이션 모달 닫기 (결과 확정 적용)
  const handleCloseShuffleModal = useCallback(() => {
    setIsShufflingModalOpen(false);
    if (pendingSeats.length > 0) {
      setSeats(pendingSeats);
      saveToHistory(pendingSeats, layoutConfig, partnerMap);
      setPendingSeats([]);
    }
    setActiveTab('seating');
  }, [pendingSeats, layoutConfig, partnerMap, saveToHistory]);

  // 두 좌석 수동 맞바꾸기(스왑)
  const handleSwapSeats = useCallback((seatIdA: number, seatIdB: number) => {
    setSeats(prev => {
      const copy = prev.map(s => ({ ...s }));
      const sA = copy.find(s => s.id === seatIdA);
      const sB = copy.find(s => s.id === seatIdB);
      if (sA && sB) {
        const temp = sA.studentId;
        sA.studentId = sB.studentId;
        sB.studentId = temp;
      }
      return copy;
    });
  }, []);

  // 좌석 활성화/비활성화 토글
  const handleToggleSeatActive = useCallback((seatId: number) => {
    const isCurrentlyDisabled = layoutConfig.disabledSeatIds.includes(seatId);
    let nextDisabled: number[];
    if (isCurrentlyDisabled) {
      nextDisabled = layoutConfig.disabledSeatIds.filter(id => id !== seatId);
    } else {
      nextDisabled = [...layoutConfig.disabledSeatIds, seatId];
    }

    const updatedConfig = {
      ...layoutConfig,
      disabledSeatIds: nextDisabled,
    };
    setLayoutConfig(updatedConfig);

    setSeats(prev =>
      prev.map(s => {
        if (s.id === seatId) {
          return {
            ...s,
            active: isCurrentlyDisabled,
            studentId: isCurrentlyDisabled ? s.studentId : null,
          };
        }
        return s;
      })
    );
  }, [layoutConfig]);

  // 학생 고정석 지정/해제 토글
  const handleToggleStudentFixed = useCallback((studentId: string, seatId: number) => {
    setStudents(prev =>
      prev.map(st => {
        if (st.id === studentId) {
          const isAlreadyFixed = st.fixedSeatId === seatId;
          return {
            ...st,
            fixedSeatId: isAlreadyFixed ? null : seatId,
          };
        }
        return st;
      })
    );
  }, []);

  // 고정석 해제
  const handleRemoveFixedStudent = useCallback((studentId: string) => {
    setStudents(prev =>
      prev.map(st => {
        if (st.id === studentId) {
          return { ...st, fixedSeatId: null };
        }
        return st;
      })
    );
  }, []);

  // 학생 앞자리 배려 토글
  const handleToggleStudentFrontRow = useCallback((studentId: string) => {
    setStudents(prev =>
      prev.map(st => {
        if (st.id === studentId) {
          return { ...st, needsFrontRow: !st.needsFrontRow };
        }
        return st;
      })
    );
  }, []);

  // 과거 이력 복원
  const handleRestoreHistory = useCallback((item: ArrangementHistoryItem) => {
    setLayoutConfig(item.layoutConfig);
    const restoredSeats = generateEmptySeats(item.layoutConfig);
    const restoredPartnerMap: Record<string, string> = {};

    item.seatAssignments.forEach(sa => {
      const target = restoredSeats.find(s => s.id === sa.seatId);
      if (target) {
        target.studentId = sa.studentId;
      }
      if (sa.studentId && sa.partnerStudentId) {
        restoredPartnerMap[sa.studentId] = sa.partnerStudentId;
      }
    });

    setSeats(restoredSeats);
    setPartnerMap(restoredPartnerMap);
    setDiagnostics([
      {
        type: 'info',
        message: `과거 기록 [${item.title}]의 좌석 배치를 복원했습니다.`,
      },
    ]);
    setActiveTab('seating');
    soundManager.playFanfare();
  }, []);

  // 이력 단일 항목 삭제
  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  // 이력 전체 삭제
  const handleClearHistory = useCallback(() => {
    if (window.confirm('저장된 배치 이력을 모두 비우시겠습니까? (이전 짝/자리 피하기 기록도 초기화됩니다)')) {
      setHistory([]);
    }
  }, []);

  // 규칙 전체 초기화
  const handleClearAllRules = useCallback(() => {
    setRules(DEFAULT_RULES);
  }, []);

  const activeSeatCount = layoutConfig.rows * layoutConfig.cols - layoutConfig.disabledSeatIds.length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* 글로벌 헤더 (인쇄 시 숨김) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        classTitle={classTitle}
        setClassTitle={setClassTitle}
        onInstantArrange={handleInstantArrange}
        onAnimateArrange={handleAnimateArrange}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        studentCount={students.length}
        activeSeatCount={activeSeatCount}
      />

      {/* 메인 탭 뷰 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'seating' && (
          <SeatGrid
            layoutConfig={layoutConfig}
            seats={seats}
            students={students}
            rules={rules}
            diagnostics={diagnostics}
            partnerMap={partnerMap}
            onSwapSeats={handleSwapSeats}
            onToggleSeatActive={handleToggleSeatActive}
            onToggleStudentFixed={handleToggleStudentFixed}
            onToggleStudentFrontRow={handleToggleStudentFrontRow}
            onInstantArrange={handleInstantArrange}
            onAnimateArrange={handleAnimateArrange}
          />
        )}

        {activeTab === 'layout' && (
          <LayoutAndRuleSettings
            layoutConfig={layoutConfig}
            setLayoutConfig={setLayoutConfig}
            rules={rules}
            setRules={setRules}
            students={students}
            onRemoveFixedStudent={handleRemoveFixedStudent}
            onClearAllRules={handleClearAllRules}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={students}
            setStudents={setStudents}
          />
        )}

        {activeTab === 'history' && (
          <HistoryViewer
            history={history}
            onRestoreHistory={handleRestoreHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'print' && (
          <PrintView
            classTitle={classTitle}
            layoutConfig={layoutConfig}
            seats={seats}
            students={students}
          />
        )}
      </main>

      {/* 자리 추첨 애니메이션 모달 */}
      <ShuffleAnimationModal
        isOpen={isShufflingModalOpen}
        onClose={handleCloseShuffleModal}
        targetSeats={pendingSeats}
        students={students}
      />

      {/* 하단 푸터 (인쇄 시 숨김) */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>스마트 자리바꾸기 프로그램 • 조건 기반 공정 배치 및 A4 인쇄 지원</span>
          <span className="text-slate-400">데이터는 브라우저 내부(LocalStorage)에 안전하게 보관됩니다.</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
