import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Lock, Save, RefreshCw } from 'lucide-react';

const Settings = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const updatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.updateUser({ password });
    setPassword('');
    setLoading(false);
    alert("تم التحديث");
  };

  return (
    <div className="max-w-xl mx-auto py-20">
       <form onSubmit={updatePass} className="bg-white p-14 rounded-[4rem] border shadow-2xl space-y-8">
          <h2 className="text-3xl font-black">تغيير كلمة المرور</h2>
          <input type="password" placeholder="كلمة المرور الجديدة" className="w-full p-6 bg-slate-50 rounded-3xl" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black">{loading ? 'جاري الحفظ...' : 'حفظ'}</button>
       </form>
    </div>
  );
};

export default Settings;