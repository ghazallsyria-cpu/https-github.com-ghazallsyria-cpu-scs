import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { ShieldCheck, RefreshCw, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const Teachers = ({ onSupervise }: { onSupervise: (teacher: any) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').neq('role', 'admin');
    setTeachers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const toggleApproval = async (id: string, status: boolean) => {
    await supabase.from('profiles').update({ is_approved: !status }).eq('id', id);
    fetchTeachers();
  };

  return (
    <div className="space-y-10">
      <div className="bg-white p-10 rounded-[4rem] border flex justify-between items-center">
         <h1 className="text-4xl font-black">المعلمون</h1>
         <button onClick={fetchTeachers}><RefreshCw className={loading ? 'animate-spin' : ''} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {teachers.map(t => (
           <div key={t.id} className="bg-white p-8 rounded-[3rem] border flex flex-col items-center">
              <h3 className="text-2xl font-black mb-4">{t.full_name}</h3>
              <button onClick={() => toggleApproval(t.id, t.is_approved)} className={`px-8 py-3 rounded-full font-black ${t.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                {t.is_approved ? 'مفعل' : 'موقوف'}
              </button>
           </div>
         ))}
      </div>
    </div>
  );
};

export default Teachers;