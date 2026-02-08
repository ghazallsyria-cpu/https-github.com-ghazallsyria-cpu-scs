
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  gender?: 'male' | 'female';
  is_approved: boolean;
  created_at: string;
}

export interface StudentPhone {
  number: string;
  label: string;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  address: string;
  phones: StudentPhone[];
  school_name?: string;
  grade: string;
  group_name?: string; // مجلد المجموعة
  agreed_amount: number;
  is_hourly: boolean;
  price_per_hour: number;
  is_completed: boolean;
  academic_year: string;
  semester: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  student_id: string;
  lesson_date: string;
  hours: number;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  teacher_id: string;
  student_id: string;
  day_of_week: string;
  start_time: string;
  duration_hours: number;
}
