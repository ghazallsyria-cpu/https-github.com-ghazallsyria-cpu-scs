import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { ShieldCheck, Mail, Calendar, Trash2 } from 'lucide-react';

const Teachers = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
    setTeachers(data || []);
    setLoading(false);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">إدارة المعلمين</h1>
          <p className="text-slate-500 font-bold">قائمة المعلمين المسجلين في النظام.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative group">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1">{t.full_name}</h3>
            <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4">معلم معتمد</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                <Calendar size={16} /> انضم: {new Date(t.created_at || Date.now()).toLocaleDateString('ar-EG')}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 break-all">
                ID: {t.id}
              </div>
            </div>
          </div>
        ))}
        {teachers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem]">
            لا يوجد معلمون مسجلون بعد.
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;