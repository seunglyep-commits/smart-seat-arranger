import { Student, ArrangementRules } from '../types';
import { parseStudentCSV } from '../utils/csvParser';

// 학생 프라이버시 보호를 위한 기본 샘플 명단 (26명)
export const DEFAULT_SAMPLE_STUDENTS: Student[] = [
  { id: '10104', name: '학생01', gender: '여', needsFrontRow: false },
  { id: '10106', name: '학생02', gender: '여', needsFrontRow: false },
  { id: '10107', name: '학생03', gender: '남', needsFrontRow: false },
  { id: '10113', name: '학생04', gender: '남', needsFrontRow: true }, // 샘플 앞자리 배려
  { id: '10120', name: '학생05', gender: '남', needsFrontRow: false },
  { id: '10122', name: '학생06', gender: '남', needsFrontRow: false },
  { id: '10201', name: '학생07', gender: '여', needsFrontRow: false },
  { id: '10202', name: '학생08', gender: '여', needsFrontRow: false },
  { id: '10203', name: '학생09', gender: '여', needsFrontRow: false },
  { id: '10205', name: '학생10', gender: '남', needsFrontRow: false },
  { id: '10207', name: '학생11', gender: '여', needsFrontRow: false },
  { id: '10208', name: '학생12', gender: '여', needsFrontRow: false },
  { id: '10212', name: '학생13', gender: '여', needsFrontRow: false },
  { id: '10215', name: '학생14', gender: '여', needsFrontRow: false },
  { id: '10216', name: '학생15', gender: '여', needsFrontRow: false },
  { id: '10217', name: '학생16', gender: '여', needsFrontRow: false },
  { id: '10219', name: '학생17', gender: '여', needsFrontRow: false },
  { id: '10221', name: '학생18', gender: '남', needsFrontRow: false },
  { id: '10224', name: '학생19', gender: '남', needsFrontRow: false },
  { id: '10225', name: '학생20', gender: '여', needsFrontRow: false },
  { id: '10501', name: '학생21', gender: '여', needsFrontRow: false },
  { id: '10513', name: '학생22', gender: '남', needsFrontRow: false },
  { id: '10514', name: '학생23', gender: '남', needsFrontRow: false },
  { id: '10515', name: '학생24', gender: '남', needsFrontRow: false },
  { id: '10521', name: '학생25', gender: '여', needsFrontRow: false },
  { id: '10524', name: '학생26', gender: '남', needsFrontRow: false },
];

// 요청하신 26명 명단 (선생님 전용 안전 로더)
const REQUESTED_ROSTER_B64 = '7ZWZ67KILOyEseuqhSzshLHrs4QKMTAxMDQs6rmA64+E7JewLOyXrAoxMDEwNizquYDrr7zsoJUs7JesCjEwMTA3LOq5gOygnOydtCzrgqgKMTAxMTMs7IaQ7Zqo7ISxLOuCqAoxMDEyMCzsnbTtm4TtmIQs64KoCjEwMTIyLOyehOyngOu5iCzrgqgKMTAyMDEs6rCV7JiI7KO8LOyXrAoxMDIwMizquYDroKTsm5As7JesCjEwMjAzLOq5gOujqOu5hOuCmOumsCzsl6wKMTAyMDUs6rmA7ISx6re8LOuCqAoxMDIwNyzquYDtg5ztnaws7JesCjEwMjA4LOuvvOyGoe2ZlCzsl6wKMTAyMTIs7ISc7JewLOyXrAoxMDIxNSzshpDsmIjsnYAs7JesCjEwMjE2LOyLoOyEuOu5iCzsl6wKMTAyMTcs7JWI7KeA67mILOyXrAoxMDIxOSzsnbTri6Tsl7As7JesCjEwMjIxLOydtOykgO2YuCzrgqgKMTAyMjQs7KCV7KeA7ZuILOuCqAoxMDIyNSzstZztmqjsnbgs7JesCjEwNTAxLOq5gO2DnO2drCzsl6wKMTA1MTMs7J207KCV7JuQLOuCqAoxMDUxNCzsnbTspIDqtows64KoCjEwNTE1LOydtOykgOyEsSzrgqgKMTA1MjEs7LWc7ZWY7J2ALOyXrAoxMDUyNCztmLjtmITsiJgs64Ko';

export function decodeRequestedRoster(): Student[] {
  try {
    const raw = decodeURIComponent(
      atob(REQUESTED_ROSTER_B64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return parseStudentCSV(raw);
  } catch (err) {
    console.error('Failed to decode roster', err);
    return DEFAULT_SAMPLE_STUDENTS;
  }
}

export const DEFAULT_RULES: ArrangementRules = {
  avoidSameSeat: true,
  avoidSamePartner: true,
  genderPairing: 'any',
  frontRowPriority: true,
  separatedPairs: [],
};

export const STORAGE_KEYS = {
  STUDENTS: 'smart_seats_students_v1',
  LAYOUT: 'smart_seats_layout_v1',
  RULES: 'smart_seats_rules_v1',
  HISTORY: 'smart_seats_history_v1',
  CURRENT_ARRANGEMENT: 'smart_seats_current_v1',
  CLASS_TITLE: 'smart_seats_class_title_v1',
  SOUND_ENABLED: 'smart_seats_sound_v1',
};
