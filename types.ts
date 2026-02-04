
export type UserRole = 'admin' | 'teacher';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  gender?: 'male' | 'female';
  is_approved: boolean;
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
  is_hourly: boolean;
  price_per_hour: number;
  is_completed: boolean;
  academic_year: string;
  semester: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  teacher_id: string;
  student_id: string;
  day_of_week: string;
  start_time: string;
  duration_hours: number;
  notes?: string;
  created_at: string;
}

export interface StudentStats extends Student {
  total_lessons: number;
  total_hours: number;
  total_paid: number;
  expected_income: number;
  remaining_balance: number;
}
