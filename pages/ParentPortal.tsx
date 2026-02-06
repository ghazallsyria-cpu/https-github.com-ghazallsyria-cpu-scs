import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { School, BookOpen, Wallet, RefreshCw } from 'lucide-react';

const ParentPortal = ({ parentPhone }: { parentPhone: string }) => {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('student_summary_view').select('*').contains('phones', [{number: parentPhone}]).maybeSingle();
    setStudent(data);
    setLoading(false);
  }, [parentPhone]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  if (loading) return <RefreshCw className="animate-spin mx-auto mt-20" />;

  return (
    <div className="space-y-12">
      <div className="bg-emerald-600 p-16 rounded-[4rem] text-white">
         <h1 className="text-5xl font-black">أهلاً بك</h1>
         <p className="text-xl mt-4">متابعة الطالب: {student?.name || '---'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-10 rounded-[3rem] border text-center">
            <p className="text-slate-400 font-black mb-2">الحصص</p>
            <p className="text-4xl font-black">{student?.total_lessons || 0}</p>
         </div>
         <div className="bg-white p-10 rounded-[3rem] border text-center">
            <p className="text-slate-400 font-black mb-2">المسدد</p>
            <p className="text-4xl font-black text-emerald-600">${student?.total_paid || 0}</p>
         </div>
         <div className="bg-white p-10 rounded-[3rem] border text-center">
            <p className="text-slate-400 font-black mb-2">المتبقي</p>
            <p className="text-4xl font-black text-rose-500">${student?.remaining_balance || 0}</p>
         </div>
      </div>
    </div>
  );
};

export default ParentPortal;