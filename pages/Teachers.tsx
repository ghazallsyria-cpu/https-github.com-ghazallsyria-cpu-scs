
import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../supabase';
import { Profile } from '../types';
import { UserPlus, Shield, Mail, User, Loader2, AlertCircle } from 'lucide-react';

const Teachers = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState<any>({ type: '', msg: '' });

  useEffect(() => { fetchTeachers(); }, []);

  async function fetchTeachers() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
    if (data) setTeachers(data);
    setLoading(false);
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'جاري إنشاء الحساب...' });
    
    try {
      // 1. إنشاء المستخدم في Auth (باستخدام Service Role)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // 2. تحديث البروفايل
      const { error: profError } = await supabase.from('profiles').update({
        full_name: formData.name,
        role: 'teacher'
      }).eq('id', authData.user.id);

      if (profError) throw profError;

      setStatus({ type: 'success', msg: 'تم إنشاء حساب المعلم بنجاح!' });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '' });
      fetchTeachers();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">إدارة المعلمين</h1>
          <p className="text-slate-500 font-bold">أضف حسابات جديدة وراقب أداء الفريق.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
          <UserPlus size={20} /> إضافة معلم
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-bold">جاري تحميل المعلمين...</p>
          </div>
        ) : teachers.length > 0 ? (
          teachers.map(teacher => (
            <div key={teacher.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center font-black text-2xl mb-6">
                {teacher.full_name?.charAt(0)}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{teacher.full_name}</h3>
              <div className="flex items-center gap-2 text-slate-500 font-bold mb-4">
                <Mail size={16} /> <span className="text-sm">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-fit text-xs font-black">
                <Shield size={14} /> معلم نشط
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="font-bold text-slate-500">لا يوجد معلمون مسجلون حالياً.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl relative animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6 text-slate-900 text-right">إضافة حساب معلم جديد</h2>
            
            {status.msg && (
              <div className={`p-4 rounded-2xl mb-4 font-bold text-sm flex items-center gap-2 ${status.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {status.type === 'error' ? <AlertCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                {status.msg}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="text-right">
                <label className="text-sm font-bold text-slate-600 mr-1">اسم المعلم</label>
                <input required className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="text-sm font-bold text-slate-600 mr-1">البريد الإلكتروني</label>
                <input required type="email" className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="text-right">
                <label className="text-sm font-bold text-slate-600 mr-1">كلمة المرور المؤقتة</label>
                <input required type="password" minLength={6} className="w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold">إلغاء</button>
                <button type="submit" disabled={status.type === 'loading'} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">حفظ المعلم</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
