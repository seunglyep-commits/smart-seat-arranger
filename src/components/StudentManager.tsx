import React, { useState } from 'react';
import { Student, Gender } from '../types';
import { Users, UserPlus, Upload, Download, Trash2, Eye, FileText, Check, AlertCircle } from 'lucide-react';
import { decodeRequestedRoster } from '../constants/defaultData';
import { parseStudentCSV, exportStudentsToCSV } from '../utils/csvParser';

interface StudentManagerProps {
  students: Student[];
  setStudents: (students: Student[]) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  setStudents,
}) => {
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [newId, setNewId] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newGender, setNewGender] = useState<Gender>('남');
  const [newNeedsFront, setNewNeedsFront] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 성비 통계
  const maleCount = students.filter(s => s.gender === '남').length;
  const femaleCount = students.filter(s => s.gender === '여').length;
  const frontCount = students.filter(s => s.needsFrontRow).length;

  // 1초 완성: 질문에서 요청하신 26명 명단 불러오기
  const handleLoadRequestedRoster = () => {
    const requested = decodeRequestedRoster();
    setStudents(requested);
    setNotice(`질문에서 제공해주신 26명 학생 명단(남 11명, 여 15명)이 성공적으로 적용되었습니다! 🎉`);
    setTimeout(() => setNotice(null), 4000);
  };

  // 학생 1명 추가
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const id = newId.trim() || String(10100 + students.length + 1);
    const newStudent: Student = {
      id,
      name: newName.trim(),
      gender: newGender,
      needsFrontRow: newNeedsFront,
    };

    setStudents([...students, newStudent]);
    setNewId('');
    setNewName('');
    setNewNeedsFront(false);
  };

  // 학생 삭제
  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  // 학생 속성 변경
  const handleUpdateStudent = (id: string, field: keyof Student, value: unknown) => {
    setStudents(
      students.map(s => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  // CSV 붙여넣기 적용
  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseStudentCSV(pasteText);
    if (parsed.length > 0) {
      setStudents(parsed);
      setShowPasteModal(false);
      setPasteText('');
      setNotice(`${parsed.length}명의 학생 명단을 새로 등록했습니다.`);
      setTimeout(() => setNotice(null), 3000);
    } else {
      alert('유효한 학생 데이터(학번, 성명, 성별 등)를 찾을 수 없습니다.');
    }
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const csvContent = exportStudentsToCSV(students);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `학급명단_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 전체 비우기
  const handleClearAll = () => {
    if (window.confirm('정말 모든 학생 명단을 비우시겠습니까?')) {
      setStudents([]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 알림 배너 */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* 상단 툴바 & 명단 통계 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">학급 학생 명단 관리</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>총 <strong className="text-slate-800">{students.length}명</strong></span>
                <span>•</span>
                <span className="text-sky-600 font-medium">남학생 {maleCount}명</span>
                <span>•</span>
                <span className="text-rose-600 font-medium">여학생 {femaleCount}명</span>
                {frontCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">앞자리 배려 {frontCount}명</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 주요 액션 버튼 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLoadRequestedRoster}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
              title="질문에 첨부해주신 26명 학생 명단을 즉시 불러옵니다"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>제공 명단(26명) 불러오기</span>
            </button>

            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>엑셀/명단 붙여넣기</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 저장</span>
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>비우기</span>
            </button>
          </div>
        </div>

        {/* 새 학생 추가 폼 */}
        <form onSubmit={handleAddStudent} className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <input
            type="text"
            placeholder="학번 (예: 10104)"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <input
            type="text"
            placeholder="학생 성명"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-32 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold"
          />
          <select
            value={newGender}
            onChange={(e) => setNewGender(e.target.value as Gender)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="남">남 (男)</option>
            <option value="여">여 (女)</option>
          </select>

          <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={newNeedsFront}
              onChange={(e) => setNewNeedsFront(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <span className="font-medium text-slate-700 flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-600" />
              앞자리 배려
            </span>
          </label>

          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors shadow-sm ml-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>학생 등록</span>
          </button>
        </form>
      </div>

      {/* 학생 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-14 text-center">번호</th>
                <th className="py-3 px-4 w-28">학번</th>
                <th className="py-3 px-4">성명</th>
                <th className="py-3 px-4 w-24 text-center">성별</th>
                <th className="py-3 px-4 w-32 text-center">앞자리 배려</th>
                <th className="py-3 px-4 w-28 text-center">고정석</th>
                <th className="py-3 px-4 w-16 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    등록된 학생이 없습니다. 상단의 <strong>[제공 명단 불러오기]</strong> 버튼을 눌러보세요!
                  </td>
                </tr>
              ) : (
                students.map((st, index) => {
                  const isMale = st.gender === '남';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                        <input
                          type="text"
                          value={st.id}
                          onChange={(e) => handleUpdateStudent(st.id, 'id', e.target.value)}
                          className="w-20 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-0.5 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <input
                          type="text"
                          value={st.name}
                          onChange={(e) => handleUpdateStudent(st.id, 'name', e.target.value)}
                          className="w-28 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded px-1.5 py-0.5 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleUpdateStudent(st.id, 'gender', isMale ? '여' : '남')}
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition-colors ${
                            isMale
                              ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {st.gender}
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={st.needsFrontRow}
                          onChange={(e) => handleUpdateStudent(st.id, 'needsFrontRow', e.target.checked)}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          title="체크 시 칠판 앞 1~2열에 우선 배정됩니다"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {st.fixedSeatId !== null && st.fixedSeatId !== undefined && st.fixedSeatId >= 0 ? (
                          <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            {st.fixedSeatId + 1}번석
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleRemoveStudent(st.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                          title="학생 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 엑셀/CSV 직접 붙여넣기 모달 */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                엑셀 또는 텍스트 명단 붙여넣기
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              엑셀이나 나이스(NEIS)에서 복사한 학생 데이터를 아래에 그대로 붙여넣으세요.
              <br />
              형식: <code>학번, 성명, 성별(남/여), 앞자리배려(O/X)</code> (쉼표, 탭, 띄어쓰기 모두 자동 인식)
            </p>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="예시:&#10;10104,김도연,여&#10;10106,김민정,여&#10;10107,김제이,남"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApplyPaste}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                명단 적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
