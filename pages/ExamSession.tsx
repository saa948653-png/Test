
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Flag, AlertTriangle, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_EXAMS } from '../services/mockData';
import { UserAnswer, ExamAttempt } from '../types';

export default function ExamSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exam = MOCK_EXAMS.find(e => e.id === id);
  
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [timeLeft, setTimeLeft] = useState(exam ? exam.durationMinutes * 60 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportedQuestions, setReportedQuestions] = useState<Set<string>>(new Set());

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSubmit = useCallback(() => {
    if (!exam) return;
    setIsSubmitting(true);
    
    const userAnswers: UserAnswer[] = exam.questions.map(q => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? null,
      isCorrect: answers[q.id] === q.correctOption,
      timeSpentSeconds: 0 
    }));

    const score = userAnswers.reduce((acc, curr) => acc + (curr.isCorrect ? 1 : 0), 0);
    
    const attempt: ExamAttempt = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'u1',
      examId: exam.id,
      score,
      maxScore: exam.totalMarks,
      answers: userAnswers,
      completedAt: new Date().toISOString(),
      status: 'COMPLETED'
    };

    const existing = JSON.parse(localStorage.getItem('studyflow_attempts') || '[]');
    localStorage.setItem('studyflow_attempts', JSON.stringify([...existing, attempt]));

    setTimeout(() => {
      navigate(`/result/${attempt.id}`);
    }, 1500);
  }, [exam, answers, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const scrollToQuestion = (id: string) => {
    questionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const toggleReport = (id: string) => {
    setReportedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!exam) return <div className="p-12 text-center text-slate-500">Exam not found</div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center text-white font-bold">
            {exam.title[0]}
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-md">{exam.title}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {answeredCount} of {exam.questions.length} Answered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-colors ${timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
            <Clock size={18} />
            <span className="font-mono text-lg sm:text-xl font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => { if(confirm('Submit your exam now?')) handleSubmit(); }}
            disabled={isSubmitting}
            className="px-4 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200"
          >
            <span className="hidden sm:inline">{isSubmitting ? 'Submitting...' : 'Finish Exam'}</span>
            <Send size={18} />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-100 w-full sticky top-[73px] z-40">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        {/* Main Exam List area */}
        <div className="flex-1 space-y-8 pb-20">
          {exam.questions.map((q, idx) => (
            <div 
              key={q.id}
              ref={el => questionRefs.current[q.id] = el}
              className={`
                bg-white p-6 sm:p-8 rounded-[32px] border-2 transition-all duration-300
                ${answers[q.id] !== undefined ? 'border-indigo-100 shadow-xl shadow-indigo-500/5' : 'border-white shadow-lg shadow-slate-200/50'}
              `}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm">
                    {idx + 1}
                  </span>
                  <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {q.topic}
                  </span>
                </div>
                <button 
                  onClick={() => toggleReport(q.id)}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${reportedQuestions.has(q.id) ? 'bg-rose-50 text-rose-500' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                >
                  <AlertCircle size={14} />
                  {reportedQuestions.has(q.id) ? 'Reported' : 'Report Error'}
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 leading-relaxed mb-8">
                {q.content}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((option, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                    className={`
                      flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all group
                      ${answers[q.id] === oIdx 
                        ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-50' 
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors shrink-0
                      ${answers[q.id] === oIdx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                    `}>
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    <span className={`text-base sm:text-lg font-medium ${answers[q.id] === oIdx ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {option}
                    </span>
                    {answers[q.id] === oIdx && <CheckCircle2 size={20} className="ml-auto text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom Call to Action */}
          <div className="bg-indigo-900 rounded-[40px] p-8 sm:p-12 text-white text-center shadow-2xl shadow-indigo-900/20">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to submit?</h3>
            <p className="text-indigo-200 mb-8 max-w-md mx-auto">Double check your answers using the sidebar palette. Once submitted, you can view detailed analytics.</p>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-12 py-5 bg-white text-indigo-900 rounded-2xl font-black text-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 mx-auto shadow-xl"
            >
              {isSubmitting ? 'Processing...' : 'Complete Exam'}
              <Send size={24} />
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <aside className="w-full lg:w-80 h-fit lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50">
            <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-[10px] flex items-center justify-between">
              Question Navigator
              <span className="text-slate-400 font-normal">{answeredCount}/{exam.questions.length}</span>
            </h3>
            
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-4 gap-3">
              {exam.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.id)}
                  className={`
                    w-full aspect-square rounded-xl flex items-center justify-center font-black text-xs transition-all
                    ${answers[q.id] !== undefined ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
                    ${reportedQuestions.has(q.id) ? 'ring-2 ring-rose-500 ring-offset-2' : ''}
                  `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="w-3 h-3 bg-emerald-500 rounded shadow-sm shadow-emerald-200"></div> 
                Answered
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="w-3 h-3 bg-slate-200 rounded"></div> 
                Unanswered
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="w-3 h-3 border-2 border-rose-500 rounded"></div> 
                Reported
              </div>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <AlertTriangle size={16} />
              </div>
              <p className="text-[10px] font-semibold text-indigo-700 leading-tight">
                Review your answers before the timer runs out!
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
