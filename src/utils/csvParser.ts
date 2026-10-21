import { Student, Gender } from '../types';

export function parseStudentCSV(text: string): Student[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  const students: Student[] = [];
  let startIndex = 0;

  // 헤더 검사
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('학번') || firstLine.includes('성명') || firstLine.includes('이름') || firstLine.includes('id') || firstLine.includes('name')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // 쉼표 또는 탭 또는 다중 공백으로 분리
    let parts: string[];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim());
    } else {
      parts = line.split(/\s+/).map(p => p.trim());
    }

    if (parts.length >= 2) {
      const id = parts[0];
      const name = parts[1];
      let gender: Gender = '남';
      let needsFrontRow = false;

      if (parts.length >= 3) {
        const gStr = parts[2].toLowerCase();
        if (gStr.includes('여') || gStr === 'f' || gStr === 'female') {
          gender = '여';
        } else if (gStr.includes('남') || gStr === 'm' || gStr === 'male') {
          gender = '남';
        }
      }

      if (parts.length >= 4) {
        const frontStr = parts[3].toLowerCase();
        if (frontStr.includes('앞') || frontStr.includes('배려') || frontStr === 'true' || frontStr === 'o' || frontStr === 'v') {
          needsFrontRow = true;
        }
      }

      students.push({
        id,
        name,
        gender,
        needsFrontRow,
      });
    }
  }

  return students;
}

export function exportStudentsToCSV(students: Student[]): string {
  const header = '학번,성명,성별,앞자리배려\n';
  const rows = students.map(s => 
    `${s.id},${s.name},${s.gender},${s.needsFrontRow ? 'O' : 'X'}`
  ).join('\n');
  return header + rows;
}
