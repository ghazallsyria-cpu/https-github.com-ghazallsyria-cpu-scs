
export type UserRole = 'admin' | 'teacher' | 'parent';

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
  label: 'الطالب' | 'الأب' | 'الأم';
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  address: string;
  phones: StudentPhone[];
  school_name?: string;
  grade: string;
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
  created_at: string;
}

export interface Payment {
  id: string;
  teacher_id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'كاش' | 'كي نت' | 'ومض';
  payment_number: string;
  is_final: boolean;
  notes?: string;
  created_at: string;
}

export interface ParentRequest {
  id: string;
  student_id: string;
  parent_phone: string;
  type: 'apology' | 'payment_intent' | 'note';
  content: string;
  amount?: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}
