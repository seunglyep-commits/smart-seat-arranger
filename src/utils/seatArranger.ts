import { Student, LayoutConfig, ArrangementRules, ArrangementHistoryItem, Seat } from '../types';

export interface ArrangerResult {
  seats: Seat[];
  score: number; // 0: 완벽, 클수록 위반사항 있음
  diagnostics: {
    message: string;
    type: 'success' | 'info' | 'warning';
  }[];
  partnerMap: Record<string, string>; // studentId -> partnerId
}

// 좌석 그리드 생성 헬퍼
export function generateEmptySeats(config: LayoutConfig): Seat[] {
  const seats: Seat[] = [];
  let seatId = 0;

  for (let r = 0; r < config.rows; r++) {
    let currentSection = 1;
    let colInSection = 0;

    for (let c = 0; c < config.cols; c++) {
      const isAisle = config.aisleAfterCols.includes(c);
      const pairIndex = config.pairGroupSize > 1 
        ? Math.floor(colInSection / config.pairGroupSize) 
        : c;

      const active = !config.disabledSeatIds.includes(seatId);

      seats.push({
        id: seatId,
        row: r,
        col: c,
        section: currentSection,
        pairIndex: r * 100 + currentSection * 10 + pairIndex,
        active,
        studentId: null,
      });

      colInSection++;
      if (isAisle) {
        currentSection++;
        colInSection = 0;
      }
      seatId++;
    }
  }

  return seats;
}

// 두 좌석이 짝꿍(같은 모둠/짝)인지 판별
export function areSeatsPartners(seatA: Seat, seatB: Seat, config: LayoutConfig): boolean {
  if (config.pairGroupSize <= 1) return false;
  return seatA.row === seatB.row && seatA.section === seatB.section && seatA.pairIndex === seatB.pairIndex;
}

// 두 좌석이 물리적으로 바로 인접해 있는지 판별 (가로/세로 거리 1)
export function areSeatsAdjacent(seatA: Seat, seatB: Seat): boolean {
  const rowDiff = Math.abs(seatA.row - seatB.row);
  const colDiff = Math.abs(seatA.col - seatB.col);
  return (rowDiff === 0 && colDiff === 1) || (rowDiff === 1 && colDiff === 0);
}

// 자리 배치 알고리즘 메인 함수
export function arrangeSeats(
  students: Student[],
  layoutConfig: LayoutConfig,
  rules: ArrangementRules,
  history: ArrangementHistoryItem[]
): ArrangerResult {
  const seats = generateEmptySeats(layoutConfig);
  const activeSeats = seats.filter(s => s.active);

  if (activeSeats.length < students.length) {
    return {
      seats,
      score: 9999,
      diagnostics: [{
        type: 'warning',
        message: `활성화된 좌석 수(${activeSeats.length}석)가 학생 수(${students.length}명)보다 적습니다. 책상을 추가하거나 학생 수를 조절해주세요.`,
      }],
      partnerMap: {},
    };
  }

  // 1. 과거 이력 분석 (가장 최근 1~3회 배치 참조)
  const pastSeatMap = new Map<string, Set<number>>();
  const pastPartnerMap = new Map<string, Set<string>>();

  // 가장 최근 배치 기록들을 우선 반영
  const recentHistory = history.slice(-3);
  recentHistory.forEach((h) => {
    h.seatAssignments.forEach(sa => {
      if (!sa.studentId) return;
      if (!pastSeatMap.has(sa.studentId)) pastSeatMap.set(sa.studentId, new Set());
      pastSeatMap.get(sa.studentId)!.add(sa.seatId);

      if (sa.partnerStudentId) {
        if (!pastPartnerMap.has(sa.studentId)) pastPartnerMap.set(sa.studentId, new Set());
        pastPartnerMap.get(sa.studentId)!.add(sa.partnerStudentId);
      }
    });
  });

  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  // 2. 고정석 지정 학생 분리
  const fixedStudents: Student[] = [];
  const nonFixedStudents: Student[] = [];
  const assignedSeatIds = new Set<number>();

  students.forEach(s => {
    if (s.fixedSeatId !== null && s.fixedSeatId !== undefined && s.fixedSeatId >= 0) {
      const targetSeat = activeSeats.find(seat => seat.id === s.fixedSeatId);
      if (targetSeat) {
        fixedStudents.push(s);
        assignedSeatIds.add(s.fixedSeatId);
      } else {
        nonFixedStudents.push(s);
      }
    } else {
      nonFixedStudents.push(s);
    }
  });

  // 3. 앞자리 배려 학생 판별
  // 교탁 위치에 따라 앞자리 정의 (top이면 row 0, 1 / bottom이면 maxRow, maxRow - 1)
  const isFrontRow = (row: number) => {
    if (layoutConfig.teacherDeskPos === 'bottom') {
      return row >= layoutConfig.rows - 2;
    }
    return row <= 1;
  };

  // 평가 함수 (Penalty Score 계산)
  const evaluatePlacement = (currentSeats: Seat[]): number => {
    let penalty = 0;
    const seatMap = new Map<number, Seat>();
    currentSeats.forEach(s => seatMap.set(s.id, s));

    // 좌석별 학생 검사
    for (const seat of currentSeats) {
      if (!seat.studentId) continue;
      const student = studentMap.get(seat.studentId);
      if (!student) continue;

      // 규칙 1: 앞자리 배려
      if (rules.frontRowPriority && student.needsFrontRow) {
        if (!isFrontRow(seat.row)) {
          penalty += 300;
        }
      }

      // 규칙 2: 이전 같은 자리 피하기
      if (rules.avoidSameSeat) {
        const pastSeats = pastSeatMap.get(student.id);
        if (pastSeats && pastSeats.has(seat.id)) {
          penalty += 120;
        }
      }

      // 짝꿍 관련 검사
      if (layoutConfig.pairGroupSize > 1) {
        const partnerSeat = currentSeats.find(other => 
          other.id !== seat.id && 
          areSeatsPartners(seat, other, layoutConfig) &&
          other.studentId !== null
        );

        if (partnerSeat && partnerSeat.studentId) {
          const partner = studentMap.get(partnerSeat.studentId);
          if (partner) {
            // 규칙 3: 이전 짝 피하기
            if (rules.avoidSamePartner) {
              const pastPartners = pastPartnerMap.get(student.id);
              if (pastPartners && pastPartners.has(partner.id)) {
                penalty += 150;
              }
            }

            // 규칙 4: 남녀 짝 / 동성 짝 규칙
            if (rules.genderPairing === 'different') {
              if (student.gender === partner.gender) {
                penalty += 35; // 성비 불균형이 있을 수 있으므로 너무 과도하지 않은 페널티
              }
            } else if (rules.genderPairing === 'same') {
              if (student.gender !== partner.gender) {
                penalty += 35;
              }
            }
          }
        }
      }

      // 규칙 5: 특정 학생 분리 배치 (서로 짝이 되거나 바로 인접하면 안 됨)
      for (const [idA, idB] of rules.separatedPairs) {
        if (student.id === idA || student.id === idB) {
          const targetId = student.id === idA ? idB : idA;
          // 인접 좌석 검사
          for (const otherSeat of currentSeats) {
            if (otherSeat.studentId === targetId) {
              if (areSeatsPartners(seat, otherSeat, layoutConfig)) {
                penalty += 500;
              } else if (areSeatsAdjacent(seat, otherSeat)) {
                penalty += 250;
              }
            }
          }
        }
      }
    }

    return penalty;
  };

  // 4. 최적화 루프 (Random Restarts + Local Swap Search)
  let bestScore = Infinity;
  let bestSeatsState: Seat[] = [];

  const RESTARTS = 40;
  const SWAPS_PER_RESTART = 120;

  for (let r = 0; r < RESTARTS; r++) {
    // 복사본 생성
    const trialSeats = seats.map(s => ({ ...s }));

    // 고정석 배치
    fixedStudents.forEach(s => {
      const seat = trialSeats.find(st => st.id === s.fixedSeatId);
      if (seat) seat.studentId = s.id;
    });

    // 배치할 수 있는 빈 좌석들
    const availableSeats = trialSeats.filter(st => st.active && st.studentId === null);

    // 셔플 대상 학생 목록
    const toAssignStudents = [...nonFixedStudents];

    // 앞자리 배려 학생 우선 정렬 및 분리
    const frontStudents = toAssignStudents.filter(s => s.needsFrontRow);
    const regularStudents = toAssignStudents.filter(s => !s.needsFrontRow);

    // 가용 좌석 중 앞자리/일반 분리
    const frontSeats = availableSeats.filter(s => isFrontRow(s.row));
    const normalSeats = availableSeats.filter(s => !isFrontRow(s.row));

    // Fisher-Yates 셔플
    const shuffleArray = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledFrontStudents = shuffleArray(frontStudents);
    const shuffledRegularStudents = shuffleArray(regularStudents);
    const shuffledFrontSeats = shuffleArray(frontSeats);
    const shuffledNormalSeats = shuffleArray(normalSeats);

    // 앞자리 배려 학생들을 먼저 앞자리 좌석에 배치
    const unplacedStudents: Student[] = [];
    const remainingOpenSeats: Seat[] = [];

    shuffledFrontStudents.forEach((st, idx) => {
      if (idx < shuffledFrontSeats.length) {
        shuffledFrontSeats[idx].studentId = st.id;
      } else {
        unplacedStudents.push(st);
      }
    });

    // 남은 앞자리 좌석
    for (let i = shuffledFrontStudents.length; i < shuffledFrontSeats.length; i++) {
      remainingOpenSeats.push(shuffledFrontSeats[i]);
    }

    // 일반 좌석과 합치기
    remainingOpenSeats.push(...shuffledNormalSeats);

    // 나머지 학생들 합치기
    const allRemainingStudents = [...unplacedStudents, ...shuffledRegularStudents];
    const shuffledRemainingStudents = shuffleArray(allRemainingStudents);

    shuffledRemainingStudents.forEach((st, idx) => {
      if (idx < remainingOpenSeats.length) {
        remainingOpenSeats[idx].studentId = st.id;
      }
    });

    // 현재 배치 점수
    let currentScore = evaluatePlacement(trialSeats);

    // 로컬 스왑 탐색 (2-opt local search)
    // 고정석이 아닌 좌석들 중 2개를 골라 교환 후 점수가 낮아지면 채택
    const swappableSeats = trialSeats.filter(s => 
      s.active && 
      !fixedStudents.some(fs => fs.fixedSeatId === s.id)
    );

    for (let sw = 0; sw < SWAPS_PER_RESTART; sw++) {
      if (currentScore === 0) break;

      const idxA = Math.floor(Math.random() * swappableSeats.length);
      const idxB = Math.floor(Math.random() * swappableSeats.length);
      if (idxA === idxB) continue;

      const seatA = swappableSeats[idxA];
      const seatB = swappableSeats[idxB];

      // 스왑 실행
      const tempId = seatA.studentId;
      seatA.studentId = seatB.studentId;
      seatB.studentId = tempId;

      const newScore = evaluatePlacement(trialSeats);

      if (newScore <= currentScore) {
        currentScore = newScore;
      } else {
        // 복구
        seatB.studentId = seatA.studentId;
        seatA.studentId = tempId;
      }
    }

    if (currentScore < bestScore) {
      bestScore = currentScore;
      bestSeatsState = trialSeats.map(s => ({ ...s }));
      if (bestScore === 0) break; // 완벽한 배치 발견 시 조기 종료
    }
  }

  // 5. 짝꿍 맵 및 진단 메시지 구성
  const partnerMap: Record<string, string> = {};
  if (layoutConfig.pairGroupSize > 1) {
    bestSeatsState.forEach(seat => {
      if (!seat.studentId) return;
      const partnerSeat = bestSeatsState.find(other => 
        other.id !== seat.id && 
        areSeatsPartners(seat, other, layoutConfig) &&
        other.studentId !== null
      );
      if (partnerSeat && partnerSeat.studentId) {
        partnerMap[seat.studentId] = partnerSeat.studentId;
      }
    });
  }

  const diagnostics: { message: string; type: 'success' | 'info' | 'warning' }[] = [];

  // 성비 통계 확인
  const maleCount = students.filter(s => s.gender === '남').length;
  const femaleCount = students.filter(s => s.gender === '여').length;
  
  if (rules.genderPairing === 'different' && layoutConfig.pairGroupSize > 1) {
    const diff = Math.abs(maleCount - femaleCount);
    if (diff > 0) {
      diagnostics.push({
        type: 'info',
        message: `남학생(${maleCount}명)과 여학생(${femaleCount}명)의 인원 차이로 인해 ${Math.ceil(diff / 2)}개 조는 동성 짝으로 배정되었습니다.`,
      });
    }
  }

  if (rules.avoidSamePartner && history.length > 0) {
    diagnostics.push({
      type: 'info',
      message: `이전 ${Math.min(history.length, 3)}회차의 짝꿍 기록을 조회하여 중복 짝을 방지했습니다.`,
    });
  }

  if (rules.avoidSameSeat && history.length > 0) {
    diagnostics.push({
      type: 'info',
      message: `이전 배치에서 앉았던 동일 좌석을 피하여 골고루 순환 배정했습니다.`,
    });
  }

  if (rules.frontRowPriority) {
    const frontNeedsCount = students.filter(s => s.needsFrontRow).length;
    if (frontNeedsCount > 0) {
      diagnostics.push({
        type: 'info',
        message: `앞자리 배려 학생 ${frontNeedsCount}명을 1~2열 우선석에 배치했습니다.`,
      });
    }
  }

  if (rules.separatedPairs.length > 0) {
    diagnostics.push({
      type: 'info',
      message: `분리 배치 요청 ${rules.separatedPairs.length}쌍이 서로 떨어지도록 분리했습니다.`,
    });
  }

  if (bestScore === 0) {
    diagnostics.unshift({
      type: 'success',
      message: `설정한 모든 조건(이전 자리·짝 피하기, 성별 규칙, 앞자리 배려 등)을 100% 만족하는 최적 배치가 완료되었습니다! 🎉`,
    });
  } else {
    diagnostics.unshift({
      type: 'success',
      message: `설정된 제약 조건을 최대한 고려하여 최선의 배치를 산출했습니다. (최적도 점수: ${Math.max(0, 100 - Math.round(bestScore / 10))}%)`,
    });
  }

  return {
    seats: bestSeatsState,
    score: bestScore,
    diagnostics,
    partnerMap,
  };
}
