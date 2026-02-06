import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Radio, Send } from 'lucide-react';

const Messaging = () => {
  const [msg, setMsg] = useState('');

  const send = async () => {
    alert("تم الإرسال (وظيفة تجريبية)");
    setMsg('');
  };

  return (
    <div className="bg-slate-900 p-20 rounded-[5rem] text-white">
       <h1 className="text-5xl font-black mb-10 flex items-center justify-center gap-4"><Radio /> مركز البث</h1>
       <textarea className="w-full bg-white/10 p-10 rounded-[3rem] h-60 text-white outline-none" placeholder="نص الرسالة..." value={msg} onChange={e => setMsg(e.target.value)} />
       <button onClick={send} className="bg-indigo-600 px-16 py-6 rounded-[2.5rem] mt-10 font-black">إرسال للجميع</button>
    </div>
  );
};

export default Messaging;