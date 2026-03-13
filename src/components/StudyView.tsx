import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { PerformanceAssessment, ExamRange } from '../types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BookOpen, ClipboardList, Info, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StudyView() {
  const [assessments, setAssessments] = useState<PerformanceAssessment[]>([]);
  const [ranges, setRanges] = useState<ExamRange[]>([]);
  const [activeTab, setActiveTab] = useState<'assessment' | 'range'>('assessment');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAssessments = onSnapshot(
      query(collection(db, 'performance_assessments'), orderBy('dueDate', 'asc')),
      (snap) => {
        setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceAssessment)));
      }
    );

    const unsubRanges = onSnapshot(
      query(collection(db, 'exam_ranges'), orderBy('createdAt', 'desc')),
      (snap) => {
        setRanges(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamRange)));
      }
    );

    setLoading(false);
    return () => {
      unsubAssessments();
      unsubRanges();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">학습 정보</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-stone-200/50 rounded-2xl">
        <button
          onClick={() => setActiveTab('assessment')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'assessment' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-50"
          )}
        >
          수행평가
        </button>
        <button
          onClick={() => setActiveTab('range')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'range' ? "bg-white text-blue-600 shadow-sm" : "text-stone-50"
          )}
        >
          시험범위
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'assessment' ? (
          assessments.length === 0 ? (
            <EmptyState icon={<ClipboardList className="w-12 h-12" />} message="등록된 수행평가가 없습니다." />
          ) : (
            assessments.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-emerald-600">{item.subject}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-800 truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span className="text-xs font-bold text-stone-400">
                      {format(parseISO(item.dueDate), 'MM월 dd일 (eeee)', { locale: ko })} 까지
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed bg-stone-50 p-3 rounded-xl">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          ranges.length === 0 ? (
            <EmptyState icon={<BookOpen className="w-12 h-12" />} message="등록된 시험범위가 없습니다." />
          ) : (
            ranges.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {item.subject}
                    </div>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{item.examTitle}</span>
                  </div>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {item.range}
                  </p>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200">
      <div className="text-stone-200 mx-auto mb-4 flex justify-center">
        {icon}
      </div>
      <p className="text-stone-400 font-medium">{message}</p>
    </div>
  );
}
