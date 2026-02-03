
export interface Student {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string;
  grade: string;
  agreed_payment: number;
}

export interface Lesson {
  id: string;
  student_id: string;
  lesson_date: string; // تم التغيير من date
  hours: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string; // تم التغيير من date
  notes?: string;
  created_at: string;
}

export interface StudentStats extends Student {
  total_lessons: number;
  total_hours: number;
  total_paid: number;
  remaining_balance: number;
}
