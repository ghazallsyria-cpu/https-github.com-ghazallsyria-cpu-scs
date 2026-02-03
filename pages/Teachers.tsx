
import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../supabase';
import { Profile } from '../types';
import { UserPlus, Shield, Mail, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const Teachers = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [teacherDetails, setTeacherDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [status, setStatus] = useState<any>({ type: '', msg: '' });

  useEffect(() => { fetchTeachers(); }, []);

  async function fetchTeachers() {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'teacher');
    const { data: details } = await supabase.from('teachers').select('*');
    if (profiles) setTeachers(profiles);
    if (details) setTeacherDetails(details);
    setLoading(false);
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'جاري معالجة الطلب...' });
    
    try {
      // 1. إنشاء المستخدم في Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { full_name: formData.name }
      });

      if (authError) throw authError;

      // 2. تحديث البروفايل (الجلسة الحالية قد لا تملك صلاحية التعديل المباشر بناءً على RLS، نستخدم Admin إذا لزم الأمر)
      const { error: profError } = await supabase.from('profiles').update({
        full_name: formData.name,
        role: 'teacher'
      }).eq('id', authData.user.id);

      // 3. إضافة رقم الهاتف لجدول المعلمين
      const { error: teachError } = await supabase.from('teachers').insert([{
        id: authData.user.id,
        phone: formData.phone
      }]);

      setStatus({ type: 'success', msg: 'تم إنشاء حساب المدرس بنجاح!' });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchTeachers();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">إدارة المدرسين</h1>
          <p className="text-slate-500 font-bold">إضافة وتتبع أداء المدرسين المسجلين في النظام.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
          <UserPlus size={20} /> مدرس جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-bold">جاري تحميل البيانات...</p>
          </div>
        ) : teachers.length > 0 ? (
          teachers.map(teacher => {
            const details = teacherDetails.find(d => d.id === teacher.id);
            return (
              <div key={teacher.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[4rem] group-hover:scale-125 transition-all"></div>
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-inner">
                  {teacher.full_name?.charAt(0)}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{teacher.full_name}</h3>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                    <Mail size={16} className="text-slate-300" /> <span>{teacher.id.substring(0,8)}...</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                    <Phone size={16} className="text-slate-300" /> <span>{details?.phone || 'غير مسجل'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full w-fit text-xs font-black">
                  <Shield size={14} /> مدرس نشط
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <p className="font-bold text-slate-400">لا يوجد مدرسون حالياً. ابدأ بإضافة أول مدرس.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl relative animate-in zoom-in duration-200 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-slate-900 text-right border-r-4 border-indigo-600 pr-3">إنشاء حساب مدرس جديد</h2>
            
            {status.msg && (
              <div className={`p-4 rounded-2xl mb-6 font-bold text-sm flex items-center gap-3 ${status.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {status.type === 'error' ? <AlertCircle size={18} /> : status.type === 'success' ? <CheckCircle size={18}/> : <Loader2 size={18} className="animate-spin" />}
                {status.msg}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="space-y-1 text-right">
                <label className="text-xs font-black text-slate-400 mr-2">الاسم الكامل</label>
                <input required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1 text-right">
                <label className="text-xs font-black text-slate-400 mr-2">البريد الإلكتروني</label>
                <input required type="email" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-1 text-right">
                <label className="text-xs font-black text-slate-400 mr-2">كلمة المرور</label>
                <input required type="password" minLength={6} className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-1 text-right">
                <label className="text-xs font-black text-slate-400 mr-2">رقم الهاتف</label>
                <input required type="tel" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors">إلغاء</button>
                <button type="submit" disabled={status.type === 'loading'} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">تأكيد الإضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
