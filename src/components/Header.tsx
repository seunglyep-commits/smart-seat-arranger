import React from 'react';
import { LayoutGrid, Settings, Users, History, Printer, Volume2, VolumeX, Sparkles, Shuffle } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  activeTab: 'seating' | 'layout' | 'students' | 'history' | 'print';
  setActiveTab: (tab: 'seating' | 'layout' | 'students' | 'history' | 'print') => void;
  classTitle: string;
  setClassTitle: (title: string) => void;
  onInstantArrange: () => void;
  onAnimateArrange: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  studentCount: number;
  activeSeatCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  classTitle,
  setClassTitle,
  onInstantArrange,
  onAnimateArrange,
  soundEnabled,
  setSoundEnabled,
  studentCount,
  activeSeatCount,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 상단 타이틀 & 퀵 액션 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  className="font-bold text-lg text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-0.5 focus:outline-none transition-all"
                  title="학급명을 클릭하여 변경할 수 있습니다"
                />
                <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-200">
                  학생 {studentCount}명 / 좌석 {activeSeatCount}석
                </span>
              </div>
              <p className="text-xs text-slate-500">
                조건 기반 스마트 자리 바꾸기 & 인쇄 프로그램
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border text-sm transition-colors ${
                soundEnabled
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
              }`}
              title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onInstantArrange}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
              title="조건을 즉시 계산하여 배치합니다"
            >
              <Shuffle className="w-4 h-4 text-slate-600" />
              <span>즉시 배치</span>
            </button>

            <button
              onClick={onAnimateArrange}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-lg text-sm font-medium transition-all shadow-md active:scale-95"
              title="학생들과 함께 보는 자리 추첨 애니메이션"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>추첨 애니메이션</span>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('seating')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'seating'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>좌석 배치표</span>
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'layout'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>배열 및 조건 설정</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>학생 명단 ({studentCount}명)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>배치 이력</span>
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'print'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>인쇄 및 출력</span>
          </button>
        </div>
      </div>
    </header>
  );
};
