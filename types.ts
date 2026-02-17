
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  is_approved: boolean;
  is_available?: boolean;
  subjects?: string;
  created_at?: string;
}

export interface StudentPhone {
  number: string;
  label: string;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  address?: string;
  phones: StudentPhone[] | any; // JSONB support
  grade: string;
  group_name?: string;
  agreed_amount: number;
  is_hourly: boolean;
  price_per_hour: number;
  academic_year: string;
  semester: string;
  created_at?: string;
  // Fields from View
  total_paid?: number;
  total_lessons?: number;
  remaining_balance?: number;
}

export interface Lesson {
  id: string;
  teacher_id: string;
  student_id: string;
  lesson_date: string;
  hours: number;
  notes?: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  teacher_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  students?: {
    name: string;
    academic_year: string;
    semester: string;
  };
}

export interface TutorRequest {
  id: string;
  student_name: string;
  student_phone: string;
  grade: string;
  subject: string;
  modality: 'home' | 'online';
  type: 'course' | 'single';
  status: 'pending' | 'assigned' | 'rejected';
  teacher_id?: string;
  notes?: string;
  created_at: string;
}
