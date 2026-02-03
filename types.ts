
export type UserRole = 'admin' | 'teacher';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface TeacherDetails {
  id: string;
  phone: string;
  created_at: string;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  address: string;
  phone: string;
  grade: string;
  agreed_amount: number;
  is_completed: boolean;
  created_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  student_id: string;
  lesson_date: string;
  hours: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  teacher_id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface StudentStats extends Student {
  total_lessons: number;
  total_hours: number;
  total_paid: number;
  remaining_balance: number;
}
