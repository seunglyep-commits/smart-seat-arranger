import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Seat, Student } from '../types';
import { Sparkles, Check, FastForward, Trophy } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ShuffleAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSeats: Seat[];
  students: Student[];
}

export const ShuffleAnimationModal: React.FC<ShuffleAnimationModalProps> = ({
  isOpen,
  onClose,
  targetSeats,
  students,
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [currentSlotName, setCurrentSlotName] = useState<string>('자리 추첨 중...');
  const intervalRef = useRef<number | null>(null);

  const activeSeats = targetSeats.filter(s => s.active && s.studentId);
  const totalCount = activeSeats.length;

  useEffect(() => {
    if (!isOpen) {
      setRevealedCount(0);
      setIsFinished(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let currentRevealed = 0;
    const intervalTime = Math.max(30, Math.floor(1800 / (totalCount || 1)));

    intervalRef.current = window.setInterval(() => {
      // 랜덤 학생 이름 롤링
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      if (randomStudent) {
        setCurrentSlotName(randomStudent.name);
      }
      soundManager.playTick();

      currentRevealed++;
      setRevealedCount(currentRevealed);

      if (currentRevealed >= totalCount) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsFinished(true);
        soundManager.playFanfare();

        // 화려한 컨페티 폭죽 효과
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          setTimeout(() => {
            confetti({
              particleCount: 60,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 60,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            });
          }, 250);
        } catch {
          // ignore
        }
      }
    }, intervalTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, totalCount, students]);

  if (!isOpen) return null;

  const handleSkip = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRevealedCount(totalCount);
    setIsFinished(true);
    soundManager.playFanfare();
  };

  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((revealedCount / totalCount) * 100)) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 text-center relative overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* 상단 장식 빛 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {!isFinished ? (
          <div className="space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-2 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                두근두근 자리 추첨 중! 🎲
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                자리 규칙과 이전 짝/위치 조건을 계산하여 공정하게 배치하고 있습니다
              </p>
            </div>

            {/* 슬롯머신 텍스트 */}
            <div className="bg-slate-900 text-white rounded-2xl py-6 px-4 shadow-inner border-4 border-indigo-400">
              <div className="text-3xl font-black tracking-widest text-emerald-400 font-mono animate-pulse">
                {currentSlotName}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                배치 진행률: {revealedCount} / {totalCount}명 ({progressPercent}%)
              </div>
            </div>

            {/* 프로그레스 바 */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-sky-500 h-full transition-all duration-100 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FastForward className="w-4 h-4" />
                <span>바로 결과 보기 (건너뛰기)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto shadow-inner border-4 border-emerald-200 animate-pulse">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                새로운 자리 배치가 완료되었습니다! 🎉
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                모든 학생({totalCount}명)의 좌석 배치가 안전하게 확정되었습니다.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs text-left leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600" />
                확인된 배치 규칙
              </div>
              <p>• 이전 짝 및 이전 같은 자리 중복 배제 완료</p>
              <p>• 앞자리 배려 학생 및 고정석 우선 반영 완료</p>
              <p>• 교실 TV에서 확인하거나 배치표를 바로 인쇄할 수 있습니다.</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-base shadow-lg transition-all active:scale-95"
            >
              자리 배치표 확인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
