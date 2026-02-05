
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { 
  ShieldCheck, Trash2, Phone, UserCircle, CheckCircle, XCircle, AlertCircle, Eye, Plus, Copy, Check, RefreshCw 
} from 'lucide-react';

const Teachers = ({ onSupervise }: { onSupervise: (teacher: {id: string, name: string} | null) => void }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'codes'>('list');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin') 
        .order('is_approved', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      showFeedback("فشل جلب قائمة المعلمين", 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCodes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*, used_profile:used_by(full_name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setActivationCodes(data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
    fetchCodes();
  }, [fetchTeachers, fetchCodes]);

  const handleGenerateCode = async () => {
    const newCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('activation_codes').insert([{
        code: newCode,
        used_by: null // ensuring it is clean
      }]);
      if (error) throw error;
      showFeedback("تم توليد كود تفعيل جديد بنجاح");
      fetchCodes();
    } catch (err: any) {
      showFeedback("فشل توليد الكود: " + err.message, 'error');
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      showFeedback(currentStatus ? "تم تعليق الحساب" : "تم التفعيل بنجاح");
      fetchTeachers();
    } catch (err: any) {
      showFeedback("حدث خطأ أثناء التحديث", 'error');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-10 text-right">
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />} 
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl">
             <ShieldCheck size={32} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900">إدارة النظام</h1>
             <p className="text-slate-500 font-bold">التحكم في المعلمين وأكواد التفعيل.</p>
           </div>
        </div>
        <button onClick={fetchTeachers} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
          <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 p-1.5 bg-white rounded-[2rem] border border-slate-200 w-fit">
        <button onClick={() => setActiveTab('list')} className={`px-10 py-4 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>المعلمون</button>
        <button onClick={() => setActiveTab('codes')} className={`px-10 py-4 rounded-[1.5rem] font-black text-sm transition-all ${activeTab === 'codes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>أكواد التفعيل</button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teachers.map(t => (
            <div key={t.id} className={`bg-white p-8 rounded-[3rem] border transition-all ${t.is_approved ? 'border-slate-100' : 'border-amber-200 bg-amber-50/20'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${t.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-indigo-100 text-indigo-500'}`}>
                  <UserCircle size={40} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onSupervise({ id: t.id, name: t.full_name })} className="p-3 bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"><Eye size={20} /></button>
                  <button onClick={() => handleToggleApproval(t.id, t.is_approved)} className={`p-3 rounded-xl transition-all ${t.is_approved ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {t.is_approved ? <XCircle size={20} /> : <CheckCircle size={20} />}
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900">{t.full_name}</h3>
              <p className="text-xs text-slate-400 font-bold mt-1">{t.phone}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${t.is_approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {t.is_approved ? 'نشط' : 'معلق'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black">أكواد التفعيل</h3>
              <p className="text-sm text-slate-400 font-bold">ولد أكواد جديدة للمعلمين الجدد.</p>
            </div>
            <button onClick={handleGenerateCode} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center gap-2">
              <Plus size={20} /> توليد كود
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="p-6">الكود</th>
                  <th className="p-6">الحالة</th>
                  <th className="p-6">المستخدم</th>
                  <th className="p-6 text-center">نسخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activationCodes.map(code => (
                  <tr key={code.id}>
                    <td className="p-6 font-black text-lg tracking-widest uppercase">{code.code}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${code.is_used ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                        {code.is_used ? 'مستخدم' : 'نشط'}
                      </span>
                    </td>
                    <td className="p-6 font-bold text-slate-500">{code.used_profile?.full_name || '-'}</td>
                    <td className="p-6 text-center">
                      <button onClick={() => copyToClipboard(code.code)} className={`p-3 rounded-xl transition-all ${copiedCode === code.code ? 'bg-emerald-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        {copiedCode === code.code ? <Check size={18}/> : <Copy size={18}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
