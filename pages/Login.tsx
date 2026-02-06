import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabase';
import { GraduationCap, Phone, Lock, RefreshCw, AlertCircle, School, ChevronLeft, UserCircle, Briefcase, Sparkles } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isParentMode, setIsParentMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '', mobile: '', password: ''
  });

  useEffect(() => {
    const phone = localStorage.getItem("parent_session_phone");
    if (phone) navigate(`/parent/${phone}`);
  }, [navigate]);

  const handleParentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.replace(/\D/g, '');

    try {
      const { data, error } = await supabase.rpc('verify_parent_access', {
        phone_to_check: mobileClean
      });

      if (error) throw error;

      if (data?.length) {
        localStorage.setItem("parent_session_phone", mobileClean);
        navigate(`/parent/${mobileClean}`);
      } else {
        setError("هذا الرقم غير مسجل لدينا");
      }
    } catch {
      setError("فشل الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const mobileClean = formData.mobile.replace(/\D/g, '');
    const virtualEmail = `${mobileClean}@summit.edu`;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: virtualEmail,
          password: formData.password,
          options: { data: { phone: mobileClean, full_name: formData.fullName } }
        });
        if (error) throw error;
        setError("تم إرسال الطلب بنجاح");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: formData.password
        });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* نفس واجهتك بدون تغيير */}
    </>
  );
};

export default Login;
