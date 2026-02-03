import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../supabase';

const Teachers = () => {
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      setTeachers(data || []);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">إدارة المعلمين</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teachers.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black">{t.full_name}</h3>
            <p className="text-slate-500 font-bold">{t.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teachers;