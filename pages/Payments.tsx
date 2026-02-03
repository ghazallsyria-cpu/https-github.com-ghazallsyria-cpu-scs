
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Added role to the props definition to fix the type error in App.tsx
const Payments = ({ role, uid }: { role: any, uid: string }) => {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchPayments = async () => {
      // Prepare queries based on user role
      let qStds = supabase.from('students').select('*');
      let qPays = supabase.from('payments').select('*');
      
      if (role === 'teacher') {
        qStds = qStds.eq('teacher_id', uid);
        qPays = qPays.eq('teacher_id', uid);
      }
      
      // Execute both queries in parallel
      const [{ data: stds }, { data: pays }] = await Promise.all([qStds, qPays]);
      
      const enriched = (stds || []).map(s => {
        const totalPaid = (pays || []).filter(p => p.student_id === s.id).reduce((acc, p) => acc + p.amount, 0);
        return { ...s, totalPaid, balance: s.agreed_amount - totalPaid };
      });
      setStudents(enriched);
    };
    fetchPayments();
  }, [uid, role]); // Added role to dependency array

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">المالية</h1>
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-500">
            <tr>
              <th className="p-4">اسم الطالب</th>
              <th className="p-4">المبلغ الكلي</th>
              <th className="p-4">المسدد</th>
              <th className="p-4">المتبقي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {students.map(s => (
              <tr key={s.id}>
                <td className="p-4 font-bold">{s.name}</td>
                <td className="p-4 font-bold">${s.agreed_amount}</td>
                <td className="p-4 font-bold text-emerald-600">${s.totalPaid}</td>
                <td className="p-4 font-black text-rose-600">${s.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
