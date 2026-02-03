
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase.ts';
import { Calendar, Clock, BookOpen, Search, Trash2, User, CheckCircle, AlertCircle, Edit3, X } from 'lucide-react';

const Lessons = ({ role, uid }: { role: any, uid: string }) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [editForm, setEditForm] = useState({ lesson_date: '', hours: '', notes: '' });
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const isAdmin = role === 'admin';

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

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
    if (error) showFeedback("فشل الحذف: " + error.message, 'error');
    else {
      showFeedback("تم حذف سجل الحصة بنجاح");
      fetchLessons();
    }
  };

  const openEditModal = (lesson: any) => {
    setSelectedLesson(lesson);
    setEditForm({
      lesson_date: lesson.lesson_date,
      hours: lesson.hours.toString(),
      notes: lesson.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;
    try {
      const { error } = await supabase.from('lessons').update({
        lesson_date: editForm.lesson_date,
        hours: parseFloat(editForm.hours),
        notes: editForm.notes
      }).eq('id', selectedLesson.id);

      if (error) throw error;
      showFeedback("تم تحديث الحصة بنجاح");
      setIsEditModalOpen(false);
      fetchLessons();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const filteredLessons = lessons.filter(l => 
    l.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all animate-in slide-in-from-top-full ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">سجل الدروس</h1>
          <p className="text-slate-500 font-bold">{isAdmin ? 'وضع الإدارة: مراجعة وتعديل كافة الحصص.' : 'تاريخ جميع حصصك التعليمية.'}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن طالب أو ملاحظة..." 
            className="w-full pr-12 pl-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-bold"
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
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => openEditModal(l)}
                        className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(l.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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

      {/* نافذة تعديل الحصة */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleUpdateLesson} className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><X /></button>
            <h2 className="text-xl font-black mb-6 text-slate-900">تعديل حصة: {selectedLesson?.students?.name}</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">تاريخ الحصة</label>
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.lesson_date} onChange={e => setEditForm({...editForm, lesson_date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">عدد الساعات</label>
                <input required type="number" step="0.5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.hours} onChange={e => setEditForm({...editForm, hours: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">الملاحظات</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold h-32 outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">تحديث البيانات</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lessons;
