import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { Calendar, Clock, BookOpen, Search, Filter, Trash2, Edit, User } from 'lucide-react';

const Lessons = ({ role, uid }: { role: any, uid: string }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = role === 'admin';

  const fetchLessons = async () => {
    setLoading(true);
    let query = supabase.from('lessons').select('*, students(name), profiles:teacher_id(full_name)').order('lesson_date', { ascending: false });
    
    if (!isAdmin) {
      query = query.eq('teacher_id', uid);
    }
    
    const { data } = await query;
    setLessons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLessons(); }, [uid, role, isAdmin]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchLessons();
  };

  const filteredLessons = lessons.filter(l => 
    l.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">سجل الدروس</h1>
          <p className="text-slate-500 font-bold">{isAdmin ? 'أنت تراجع جميع الحصص التعليمية المسجلة من قبل كافة المعلمين.' : 'عرض تاريخ جميع حصصك التعليمية.'}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن طالب أو ملاحظة..." 
            className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs">
                <th className="p-6 font-black uppercase tracking-widest">الطالب</th>
                {isAdmin && <th className="p-6 font-black uppercase tracking-widest">المعلم</th>}
                <th className="p-6 font-black uppercase tracking-widest">التاريخ</th>
                <th className="p-6 font-black uppercase tracking-widest text-center">الساعات</th>
                <th className="p-6 font-black uppercase tracking-widest">الملاحظات</th>
                <th className="p-6 font-black uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLessons.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-slate-900">{l.students?.name}</p>
                  </td>
                  {isAdmin && (
                    <td className="p-6">
                      <div className="flex items-center gap-1 text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit">
                        <User size={12} /> {l.profiles?.full_name}
                      </div>
                    </td>
                  )}
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                      <Calendar size={14} className="text-indigo-500" />
                      {new Date(l.lesson_date).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black text-sm">
                      {l.hours} ساعة
                    </span>
                  </td>
                  <td className="p-6 text-sm text-slate-500 max-w-xs truncate font-medium">
                    {l.notes || <span className="text-slate-300 italic">بدون ملاحظات</span>}
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => handleDelete(l.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLessons.length === 0 && !loading && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-20 text-center font-bold text-slate-400 bg-slate-50/20">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-10" />
                    لا توجد حصص مسجلة مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Lessons;