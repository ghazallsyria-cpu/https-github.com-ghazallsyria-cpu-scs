
export interface Student {
  id: string;
  created_at: string;
  name: string;
  address: string;
  phone: string; // Updated from phone_number
  grade: string; // Updated from grade_class
  agreed_payment: number; // Updated from agreed_payment_amount
}

export interface Lesson {
  id: string;
  student_id: string;
  date: string;
  hours: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface StudentStats extends Student {
  total_lessons: number;
  total_hours: number;
  total_paid: number;
  remaining_balance: number;
}
