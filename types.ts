
export type UserRole = 'admin' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

export interface Student {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string;
  grade: string;
  agreed_payment: number;
  teacher_id: string;
}

export interface Lesson {
  id: string;
  student_id: string;
  teacher_id: string;
  lesson_date: string;
  hours: number;
  notes?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  teacher_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
}

export interface StudentStats extends Student {
  total_lessons: number;
  total_hours: number;
  total_paid: number;
  remaining_balance: number;
}
