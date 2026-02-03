
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Student, StudentStats } from '../types';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  BookOpen, 
  Clock, 
  X, 
  Users
} from 'lucide-react';

const Students: React.FC = () => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [studentForm, setStudentForm] = useState({
    name: '',
    address: '',
    phone: '',
    grade: '',
    agreed_payment: ''
  });

  const [lessonForm, setLessonForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    notes: ''
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');

      if (studentsError) throw studentsError;

      const { data: lessonsData } = await supabase.from('lessons').select('*');
      const { data: paymentsData } = await supabase.from('payments').select('*');

      const enrichedStudents = (studentsData || []).map(student => {
        const studentLessons = (lessonsData || []).filter(l => l.student_id === student.id);
        const studentPayments = (paymentsData || []).filter(p => p.student_id === student.id);
        
        return {
          ...student,
          total_lessons: studentLessons.length,
          total_hours: studentLessons.reduce((sum, l) => sum + (Number(l.hours) || 0), 0),
          total_paid: studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
          remaining_balance: (Number(student.agreed_payment) || 0) - studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        };
      });

      setStudents(enrichedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('students').insert([{
        name: studentForm.name,
        address: studentForm.address,
        phone: studentForm.phone,
        grade: studentForm.grade,
        agreed_payment: parseFloat(studentForm.agreed_payment)
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setStudentForm({ name: '', address: '', phone: '', grade: '', agreed_payment: '' });
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Failed to add student. Please make sure the table "students" exists with correct columns.');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const { error } = await supabase.from('lessons').insert([{
        student_id: selectedStudent.id,
        date: lessonForm.date,
        hours: parseFloat(lessonForm.hours),
        notes: lessonForm.notes
      }]);
      if (error) throw error;
      setIsLessonModalOpen(false);
      setLessonForm({ date: new Date().toISOString().split('T')[0], hours: '', notes: '' });
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Error adding lesson. Did you create the "lessons" table?');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700">
          <Plus size={18} /> New Student
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search students..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-10 text-slate-500">Loading students...</p>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div key={student.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                  {student.name.charAt(0)}
                </div>
                <button onClick={() => { setSelectedStudent(student); setIsLessonModalOpen(true); }} className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg">
                  <Plus size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
              <p className="text-sm text-indigo-600 font-medium mb-3">{student.grade || 'No Grade'}</p>
              
              <div className="space-y-2 mb-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><MapPin size={14} /> <span className="truncate">{student.address}</span></div>
                <div className="flex items-center gap-2"><Phone size={14} /> <span>{student.phone}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase">Lessons</p>
                  <div className="flex justify-center items-center gap-1 font-bold text-slate-900"><BookOpen size={12}/> {student.total_lessons}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase">Hours</p>
                  <div className="flex justify-center items-center gap-1 font-bold text-slate-900"><Clock size={12}/> {student.total_hours}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Users className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500">No students found.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative">
            <h2 className="text-xl font-bold mb-4">Add Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input required placeholder="Name" className="w-full p-2.5 border rounded-xl" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Grade" className="w-full p-2.5 border rounded-xl" value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: e.target.value})} />
                <input required type="number" placeholder="Payment" className="w-full p-2.5 border rounded-xl" value={studentForm.agreed_payment} onChange={e => setStudentForm({...studentForm, agreed_payment: e.target.value})} />
              </div>
              <input required placeholder="Phone" className="w-full p-2.5 border rounded-xl" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} />
              <textarea required placeholder="Address" className="w-full p-2.5 border rounded-xl" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative">
            <h2 className="text-xl font-bold mb-4">Add Lesson for {selectedStudent?.name}</h2>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" className="w-full p-2.5 border rounded-xl" value={lessonForm.date} onChange={e => setLessonForm({...lessonForm, date: e.target.value})} />
                <input required type="number" step="0.5" placeholder="Hours" className="w-full p-2.5 border rounded-xl" value={lessonForm.hours} onChange={e => setLessonForm({...lessonForm, hours: e.target.value})} />
              </div>
              <textarea placeholder="Notes (optional)" className="w-full p-2.5 border rounded-xl" value={lessonForm.notes} onChange={e => setLessonForm({...lessonForm, notes: e.target.value})} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold">Add Lesson</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
