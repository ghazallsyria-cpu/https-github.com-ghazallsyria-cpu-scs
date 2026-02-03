
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Student, Lesson, StudentStats } from '../types';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  BookOpen, 
  Clock, 
  X, 
  MoreVertical,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';

const Students: React.FC = () => {
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [studentForm, setStudentForm] = useState({
    name: '',
    address: '',
    phone_number: '',
    grade_class: '',
    agreed_payment_amount: ''
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
          total_hours: studentLessons.reduce((sum, l) => sum + (l.hours || 0), 0),
          total_paid: studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          remaining_balance: student.agreed_payment_amount - studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
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
        ...studentForm,
        agreed_payment_amount: parseFloat(studentForm.agreed_payment_amount)
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setStudentForm({ name: '', address: '', phone_number: '', grade_class: '', agreed_payment_amount: '' });
      fetchStudents();
    } catch (err) {
      alert('Error adding student');
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
      alert('Error adding lesson');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade_class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Students Management</h1>
          <p className="text-slate-500 mt-1">Manage your students and record their lessons.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          <Plus size={20} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or grade..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-64" />
          ))
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div key={student.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {student.name.charAt(0)}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setSelectedStudent(student);
                      setIsLessonModalOpen(true);
                    }}
                    className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    title="Add Lesson"
                  >
                    <Plus size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{student.name}</h3>
              <p className="text-indigo-600 font-medium text-sm mb-4">{student.grade_class}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-slate-500 text-sm">
                  <MapPin size={16} className="mr-2 shrink-0" />
                  <span className="truncate">{student.address}</span>
                </div>
                <div className="flex items-center text-slate-500 text-sm">
                  <Phone size={16} className="mr-2 shrink-0" />
                  <span>{student.phone_number}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Lessons</p>
                  <div className="flex items-center justify-center space-x-1">
                    <BookOpen size={14} className="text-slate-400" />
                    <span className="text-slate-900 font-bold">{student.total_lessons}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Hours</p>
                  <div className="flex items-center justify-center space-x-1">
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-slate-900 font-bold">{student.total_hours}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No students found</h3>
            <p className="text-slate-500">Try adjusting your search or add a new student.</p>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">New Student</h2>
            <p className="text-slate-500 mb-6">Enter student details to register them.</p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={studentForm.name}
                  onChange={e => setStudentForm({...studentForm, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grade / Class</label>
                  <input 
                    required
                    type="text" 
                    placeholder="10th Grade"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={studentForm.grade_class}
                    onChange={e => setStudentForm({...studentForm, grade_class: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Agreed Payment</label>
                  <input 
                    required
                    type="number" 
                    placeholder="1000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={studentForm.agreed_payment_amount}
                    onChange={e => setStudentForm({...studentForm, agreed_payment_amount: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  placeholder="+1 234 567 890"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={studentForm.phone_number}
                  onChange={e => setStudentForm({...studentForm, phone_number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                <textarea 
                  required
                  placeholder="123 Street, City..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                  value={studentForm.address}
                  onChange={e => setStudentForm({...studentForm, address: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Create Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLessonModalOpen(false)} />
          <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsLessonModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Record Lesson</h2>
            <p className="text-slate-500 mb-6">Logging for {selectedStudent?.name}</p>

            <form onSubmit={handleAddLesson} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={lessonForm.date}
                    onChange={e => setLessonForm({...lessonForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Hours</label>
                  <input 
                    required
                    type="number" 
                    step="0.5"
                    placeholder="1.5"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={lessonForm.hours}
                    onChange={e => setLessonForm({...lessonForm, hours: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Optional Notes</label>
                <textarea 
                  placeholder="Completed Chapter 4: Fractions..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                  value={lessonForm.notes}
                  onChange={e => setLessonForm({...lessonForm, notes: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Log Lesson
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
