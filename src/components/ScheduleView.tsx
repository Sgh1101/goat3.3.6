import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ScheduleItem, ScheduleType, GlobalSettings } from '../types';
import { format, parseISO, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, GraduationCap, PartyPopper, Cake, ChevronRight, Plus, Trash2, Shirt } from 'lucide-react';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

export default function ScheduleView({ user }: { user: User | null }) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [activeTab, setActiveTab] = useState<ScheduleType>('exam');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ title: '', date: '', type: 'exam' as ScheduleType });

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    id: string;
  }>({ isOpen: false, id: '' });

  const isAdmin = user?.email === 'slgdj1228@gmail.com';

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as GlobalSettings);
    });

    const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
    const unsubSchedules = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
      setSchedules(list);
      setLoading(false);
    });
    return () => {
      unsubSettings();
      unsubSchedules();
    };
  }, []);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.title || !newSchedule.date) return;
    try {
      await addDoc(collection(db, 'schedules'), newSchedule);
      setNewSchedule({ title: '', date: '', type: 'exam' });
      setIsAdding(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteSchedule = async (id: string) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (confirmConfig.id) {
      await deleteDoc(doc(db, 'schedules', confirmConfig.id));
    }
  };

  const filteredSchedules = schedules.filter(s => s.type === activeTab);

  const getIcon = (type: ScheduleType) => {
    switch (type) {
      case 'exam': return <GraduationCap className="w-5 h-5" />;
      case 'event': return <PartyPopper className="w-5 h-5" />;
      case 'birthday': return <Cake className="w-5 h-5" />;
    }
  };

  const getTabLabel = (type: ScheduleType) => {
    switch (type) {
      case 'exam': return '시험';
      case 'event': return '행사';
      case 'birthday': return '생일';
    }
  };

  const isPeDay = (dateStr: string) => {
    const day = getDay(parseISO(dateStr));
    return settings?.peDays?.includes(day);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title="일정 삭제"
        message="이 일정을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmConfig({ isOpen: false, id: '' })}
      />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800">학교 일정</h2>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 bg-emerald-600 text-white rounded-full shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-stone-200/50 rounded-2xl">
        {(['exam', 'event', 'birthday'] as ScheduleType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleAddSchedule} className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
          <input 
            value={newSchedule.title} 
            onChange={e => setNewSchedule({...newSchedule, title: e.target.value})}
            placeholder="일정 제목"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm"
          />
          <div className="flex gap-2">
            <input 
              type="date"
              value={newSchedule.date} 
              onChange={e => setNewSchedule({...newSchedule, date: e.target.value})}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm"
            />
            <select 
              value={newSchedule.type}
              onChange={e => setNewSchedule({...newSchedule, type: e.target.value as ScheduleType})}
              className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="exam">시험</option>
              <option value="event">행사</option>
              <option value="birthday">생일</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm">
            일정 등록
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200">
              <Calendar className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 font-medium">등록된 일정이 없습니다.</p>
            </div>
          ) : (
            filteredSchedules.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    activeTab === 'exam' ? "bg-red-50 text-red-500" :
                    activeTab === 'event' ? "bg-blue-50 text-blue-500" :
                    "bg-pink-50 text-pink-500"
                  )}>
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-800">{item.title}</h3>
                      {isPeDay(item.date) && (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                          <Shirt className="w-3 h-3" />
                          체육복
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      {format(parseISO(item.date), 'MM월 dd일 (eeee)', { locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button onClick={() => handleDeleteSchedule(item.id)} className="text-stone-300 hover:text-red-500 p-2 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
