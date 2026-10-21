import { LayoutConfig, LayoutPreset } from '../types';

export const PRESET_LAYOUTS: Record<LayoutPreset, LayoutConfig> = {
  '3sections_pairs': {
    preset: '3sections_pairs',
    name: '3분단 짝지어 앉기 (2-2-2)',
    rows: 5,
    cols: 6,
    pairGroupSize: 2,
    aisleAfterCols: [1, 3], // 2열, 4열 뒤 복도
    disabledSeatIds: [24, 29, 25, 28], // 기본 30석 중 26석 맞춤 (맨 뒷자리 양끝 비활성화)
    teacherDeskPos: 'top',
  },
  '5x5_single': {
    preset: '5x5_single',
    name: '5행 5열 한줄로 앉기 (시험/독서실형)',
    rows: 6,
    cols: 5, // 6행 5열 = 30석 (26명 수용)
    pairGroupSize: 1,
    aisleAfterCols: [], // 단독 책상 배열
    disabledSeatIds: [25, 26, 27, 29], // 4석 비움 -> 26석 맞춤
    teacherDeskPos: 'top',
  },
  '4sections_pairs': {
    preset: '4sections_pairs',
    name: '4분단 짝지어 앉기 (2-2-2-2)',
    rows: 4,
    cols: 8, // 32석
    pairGroupSize: 2,
    aisleAfterCols: [1, 3, 5],
    disabledSeatIds: [24, 25, 30, 31, 26, 29],
    teacherDeskPos: 'top',
  },
  'custom': {
    preset: 'custom',
    name: '사용자 지정 배열',
    rows: 5,
    cols: 6,
    pairGroupSize: 2,
    aisleAfterCols: [1, 3],
    disabledSeatIds: [],
    teacherDeskPos: 'top',
  },
};
