export type Gender = '남' | '여';

export interface Student {
  id: string; // 학번 (예: 10104)
  name: string; // 성명 (예: 김도연)
  gender: Gender; // '남' | '여'
  needsFrontRow: boolean; // 앞자리(1~2열) 배려 필요 여부
  fixedSeatId?: number | null; // 특정 좌석에 고정 지정된 경우 좌석 ID
  note?: string; // 특이사항/메모
}

export type LayoutPreset = '3sections_pairs' | '5x5_single' | '4sections_pairs' | 'custom';

export interface LayoutConfig {
  preset: LayoutPreset;
  name: string;
  rows: number;
  cols: number;
  pairGroupSize: number; // 2: 2인 짝, 1: 단독 책상
  aisleAfterCols: number[]; // 복도가 들어가는 열 인덱스 (0-based)
  disabledSeatIds: number[]; // 빈자리 / 복도 / 결번 책상 ID 목록
  teacherDeskPos: 'top' | 'bottom'; // 교탁 위치 (상단: 칠판 앞 / 하단)
}

export interface Seat {
  id: number; // 좌석 고유 ID (0 ~ rows*cols - 1)
  row: number; // 0-based 행
  col: number; // 0-based 열
  section: number; // 분단 번호 (1, 2, 3...)
  pairIndex: number; // 같은 짝끼리 공유하는 인덱스
  active: boolean; // 책상 활성화 여부
  studentId: string | null; // 배정된 학생 학번
}

export interface ArrangementRules {
  avoidSameSeat: boolean; // 이전 같은 자리 피하기
  avoidSamePartner: boolean; // 이전 짝 피하기
  genderPairing: 'any' | 'different' | 'same'; // 무작위 | 남녀 짝 | 동성 짝
  frontRowPriority: boolean; // 앞자리 배려 학생 1~2열 우선
  separatedPairs: [string, string][]; // 분리 배치 대상 학번 쌍 [학번1, 학번2]
}

export interface ArrangementHistoryItem {
  id: string;
  timestamp: number;
  dateStr: string;
  title: string;
  layoutConfig: LayoutConfig;
  seatAssignments: {
    seatId: number;
    studentId: string | null;
    studentName?: string;
    studentGender?: Gender;
    row: number;
    col: number;
    partnerStudentId?: string | null;
    partnerName?: string;
  }[];
}
