import deliveries from './deliveries.json';

export type StudentGroup = '9A' | '9C';
export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  group: StudentGroup;
  artwork: number;
  published: boolean;
  projectPath: string;
};

// Only delivered projects reach the browser; the full roster stays in scripts/.
export const students = deliveries as Student[];

export function findStudent(id: string): Student | undefined {
  return students.find((student) => student.id === id);
}

export function searchKey(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}
