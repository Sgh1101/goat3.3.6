import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  doc, onSnapshot, setDoc, collection, addDoc, deleteDoc, 
  updateDoc, query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { GlobalSettings, Notice, ScheduleItem, ContentRequest, ScheduleType, RequestStatus, NoticeType, PerformanceAssessment, ExamRange } from '../types';
import { format } from 'date-fns';
import { 
  Settings, Bell, Calendar, MessageSquare, Plus, Trash2, 
  Check, Clock, AlertCircle, Save, Loader2, BookOpen, ClipboardList, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

type AdminTab = 'settings' | 'notices' | 'schedules' | 'assessments' | 'ranges' | 'requests';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [settings, setSettings] = useState<GlobalSettings>({ timetableLink: '', kakaoLink: '', schoolWebsiteLink: '', nextExamDate: '', nextExamTitle: '', peDays: [] });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [assessments, setAssessments] = useState<PerformanceAssessment[]>([]);
  const [ranges, setRanges] = useState<ExamRange[]>([]);
  
  const [newNotice, setNewNotice] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<NoticeType>('general');
  const [newSchedule, setNewSchedule] = useState({ title: '', date: '', type: 'exam' as ScheduleType });
  const [bulkExams, setBulkExams] = useState('');
  
  const [newAssessment, setNewAssessment] = useState({ subject: '', title: '', dueDate: '', description: '' });
  const [newRange, setNewRange] = useState({ subject: '', range: '', examTitle: '' });
  const [newExtraLink, setNewExtraLink] = useState({ title: '', url: '' });
  
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as GlobalSettings);
    });
    const unsubNotices = onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
    });
    const unsubSchedules = onSnapshot(query(collection(db, 'schedules'), orderBy('date', 'asc')), (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem)));
    });
    const unsubRequests = onSnapshot(query(collection(db, 'requests'), orderBy('createdAt', 'desc')), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentRequest)));
    });
    const unsubAssessments = onSnapshot(query(collection(db, 'performance_assessments'), orderBy('dueDate', 'asc')), (snap) => {
      setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceAssessment)));
    });
    const unsubRanges = onSnapshot(query(collection(db, 'exam_ranges'), orderBy('createdAt', 'desc')), (snap) => {
      setRanges(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamRange)));
    });

    return () => {
      unsubSettings();
      unsubNotices();
      unsubSchedules();
      unsubRequests();
      unsubAssessments();
      unsubRanges();
    };
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      setSuccessMsg('설정이 저장되었습니다.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotice = async () => {
    if (!newNotice.trim()) return;
    try {
      await addDoc(collection(db, 'notices'), {
        content: newNotice.trim(),
        type: newNoticeType,
        createdAt: serverTimestamp()
      });
      setNewNotice('');
    } catch (e) { console.error(e); }
  };

  const handleBulkAddExams = async () => {
    if (!bulkExams.trim()) return;
    const lines = bulkExams.trim().split('\n');
    setSaving(true);
    try {
      for (const line of lines) {
        const [date, title] = line.split(',').map(s => s.trim());
        if (date && title) {
          await addDoc(collection(db, 'schedules'), {
            title,
            date,
            type: 'exam'
          });
        }
      }
      setBulkExams('');
      setSuccessMsg('시험 일정이 일괄 등록되었습니다.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const togglePeDay = (day: number) => {
    const current = settings.peDays || [];
    const next = current.includes(day) 
      ? current.filter(d => d !== day) 
      : [...current, day].sort();
    setSettings({ ...settings, peDays: next });
  };

  const handleAddExtraLink = () => {
    if (!newExtraLink.title || !newExtraLink.url) return;
    const current = settings.extraLinks || [];
    setSettings({
      ...settings,
      extraLinks: [...current, newExtraLink]
    });
    setNewExtraLink({ title: '', url: '' });
  };

  const handleDeleteExtraLink = (index: number) => {
    const current = settings.extraLinks || [];
    setSettings({
      ...settings,
      extraLinks: current.filter((_, i) => i !== index)
    });
  };

  const handleDeleteNotice = async (id: string) => {
    showConfirm('공지 삭제', '이 공지를 삭제하시겠습니까?', async () => {
      await deleteDoc(doc(db, 'notices', id));
    });
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.date) return;
    try {
      await addDoc(collection(db, 'schedules'), newSchedule);
      setNewSchedule({ title: '', date: '', type: 'exam' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteSchedule = async (id: string) => {
    showConfirm('일정 삭제', '이 일정을 삭제하시겠습니까?', async () => {
      await deleteDoc(doc(db, 'schedules', id));
    });
  };

  const handleUpdateRequestStatus = async (id: string, status: RequestStatus) => {
    await updateDoc(doc(db, 'requests', id), { status });
  };

  const handleDeleteRequest = async (id: string) => {
    showConfirm('요청 삭제', '이 요청을 삭제하시겠습니까?', async () => {
      await deleteDoc(doc(db, 'requests', id));
    });
  };

  const handleAddAssessment = async () => {
    if (!newAssessment.subject || !newAssessment.title || !newAssessment.dueDate) return;
    try {
      await addDoc(collection(db, 'performance_assessments'), {
        ...newAssessment,
        createdAt: serverTimestamp()
      });
      setNewAssessment({ subject: '', title: '', dueDate: '', description: '' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteAssessment = async (id: string) => {
    showConfirm('수행평가 삭제', '이 수행평가 정보를 삭제하시겠습니까?', async () => {
      await deleteDoc(doc(db, 'performance_assessments', id));
    });
  };

  const handleAddRange = async () => {
    if (!newRange.subject || !newRange.range || !newRange.examTitle) return;
    try {
      await addDoc(collection(db, 'exam_ranges'), {
        ...newRange,
        createdAt: serverTimestamp()
      });
      setNewRange({ subject: '', range: '', examTitle: '' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteRange = async (id: string) => {
    showConfirm('시험범위 삭제', '이 시험범위 정보를 삭제하시겠습니까?', async () => {
      await deleteDoc(doc(db, 'exam_ranges', id));
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
      
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg font-bold animate-in slide-in-from-top-4 duration-300">
          {successMsg}
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center">
          <ShieldCheckIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900">관리자 페이지</h2>
      </div>

      {/* Admin Tabs */}
      <div className="flex bg-stone-200/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
        <AdminTabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings className="w-4 h-4" />} label="설정" />
        <AdminTabButton active={activeTab === 'notices'} onClick={() => setActiveTab('notices')} icon={<Bell className="w-4 h-4" />} label="공지" />
        <AdminTabButton active={activeTab === 'schedules'} onClick={() => setActiveTab('schedules')} icon={<Calendar className="w-4 h-4" />} label="일정" />
        <AdminTabButton active={activeTab === 'assessments'} onClick={() => setActiveTab('assessments')} icon={<ClipboardList className="w-4 h-4" />} label="수행" />
        <AdminTabButton active={activeTab === 'ranges'} onClick={() => setActiveTab('ranges')} icon={<BookOpen className="w-4 h-4" />} label="범위" />
        <AdminTabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} icon={<MessageSquare className="w-4 h-4" />} label="요청" />
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 min-h-[400px]">
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-stone-800">전역 설정</h3>
            <div className="space-y-4">
              <InputGroup label="학교 홈페이지 링크" value={settings.schoolWebsiteLink || ''} onChange={v => setSettings({...settings, schoolWebsiteLink: v})} placeholder="https://..." />
              <InputGroup label="시간표 링크" value={settings.timetableLink} onChange={v => setSettings({...settings, timetableLink: v})} placeholder="https://..." />
              <InputGroup label="카톡방 링크" value={settings.kakaoLink} onChange={v => setSettings({...settings, kakaoLink: v})} placeholder="https://..." />
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">체육복 가져오는 요일</label>
                <div className="flex gap-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                    <button
                      key={day}
                      onClick={() => togglePeDay(i)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-bold transition-all",
                        settings.peDays?.includes(i) ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-400"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="시험 이름" value={settings.nextExamTitle || ''} onChange={v => setSettings({...settings, nextExamTitle: v})} placeholder="중간고사" />
                <InputGroup label="시험 날짜" type="date" value={settings.nextExamDate || ''} onChange={v => setSettings({...settings, nextExamDate: v})} />
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-100">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">추가 링크 관리</p>
                <div className="flex gap-2">
                  <input 
                    value={newExtraLink.title} 
                    onChange={e => setNewExtraLink({...newExtraLink, title: e.target.value})}
                    placeholder="링크 제목"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm"
                  />
                  <input 
                    value={newExtraLink.url} 
                    onChange={e => setNewExtraLink({...newExtraLink, url: e.target.value})}
                    placeholder="URL (https://...)"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm"
                  />
                  <button onClick={handleAddExtraLink} className="bg-stone-900 text-white p-2 rounded-xl">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {settings.extraLinks?.map((link, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-stone-700">{link.title}</span>
                        <span className="text-[10px] text-stone-400 truncate max-w-[200px]">{link.url}</span>
                      </div>
                      <button onClick={() => handleDeleteExtraLink(i)} className="text-stone-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                설정 저장하기
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-stone-800">공지 관리</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select 
                  value={newNoticeType}
                  onChange={e => setNewNoticeType(e.target.value as NoticeType)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="general">일반</option>
                  <option value="teacher">선생님</option>
                </select>
                <input 
                  value={newNotice} 
                  onChange={e => setNewNotice(e.target.value)}
                  placeholder="새 공지사항 입력..."
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
                <button onClick={handleAddNotice} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700">
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {notices.map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      n.type === 'teacher' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {n.type === 'teacher' ? '선생님' : '일반'}
                    </span>
                    <p className="text-sm text-stone-700 truncate">{n.content}</p>
                  </div>
                  <button onClick={() => handleDeleteNotice(n.id)} className="text-stone-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-800">일정 관리</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">단일 일정 추가</p>
                <input 
                  value={newSchedule.title} 
                  onChange={e => setNewSchedule({...newSchedule, title: e.target.value})}
                  placeholder="일정 제목 (예: 홍길동 생일)"
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={newSchedule.date} 
                    onChange={e => setNewSchedule({...newSchedule, date: e.target.value})}
                    className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                  />
                  <select 
                    value={newSchedule.type}
                    onChange={e => setNewSchedule({...newSchedule, type: e.target.value as ScheduleType})}
                    className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                  >
                    <option value="exam">시험</option>
                    <option value="event">행사</option>
                    <option value="birthday">생일</option>
                  </select>
                </div>
                <button onClick={handleAddSchedule} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold text-sm">
                  일정 추가
                </button>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">시험 일정 일괄 추가</p>
                <textarea 
                  value={bulkExams}
                  onChange={e => setBulkExams(e.target.value)}
                  placeholder="YYYY-MM-DD, 과목명 (한 줄에 하나씩)"
                  className="w-full h-24 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm resize-none"
                />
                <button 
                  onClick={handleBulkAddExams}
                  disabled={saving || !bulkExams.trim()}
                  className="w-full bg-stone-900 text-white py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                >
                  일괄 등록하기
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {schedules.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      s.type === 'exam' ? "bg-red-400" : s.type === 'event' ? "bg-blue-400" : "bg-pink-400"
                    )} />
                    <p className="text-sm font-bold text-stone-700">{s.title}</p>
                    <span className="text-[10px] text-stone-400">{s.date}</span>
                  </div>
                  <button onClick={() => handleDeleteSchedule(s.id)} className="text-stone-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-stone-800">수행평가 관리</h3>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  value={newAssessment.subject} 
                  onChange={e => setNewAssessment({...newAssessment, subject: e.target.value})}
                  placeholder="과목명"
                  className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
                <input 
                  type="date"
                  value={newAssessment.dueDate} 
                  onChange={e => setNewAssessment({...newAssessment, dueDate: e.target.value})}
                  className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <input 
                value={newAssessment.title} 
                onChange={e => setNewAssessment({...newAssessment, title: e.target.value})}
                placeholder="수행평가 제목"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
              />
              <textarea 
                value={newAssessment.description} 
                onChange={e => setNewAssessment({...newAssessment, description: e.target.value})}
                placeholder="상세 설명 (선택사항)"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm h-20 resize-none"
              />
              <button onClick={handleAddAssessment} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold text-sm">
                수행평가 추가
              </button>
            </div>
            <div className="space-y-2">
              {assessments.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-600">{a.subject}</span>
                      <p className="text-sm font-bold text-stone-700 truncate">{a.title}</p>
                    </div>
                    <p className="text-[10px] text-stone-400">{a.dueDate} 까지</p>
                  </div>
                  <button onClick={() => handleDeleteAssessment(a.id)} className="text-stone-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ranges' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-stone-800">시험범위 관리</h3>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  value={newRange.subject} 
                  onChange={e => setNewRange({...newRange, subject: e.target.value})}
                  placeholder="과목명"
                  className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
                <input 
                  value={newRange.examTitle} 
                  onChange={e => setNewRange({...newRange, examTitle: e.target.value})}
                  placeholder="시험 명칭 (예: 중간고사)"
                  className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <textarea 
                value={newRange.range} 
                onChange={e => setNewRange({...newRange, range: e.target.value})}
                placeholder="시험 범위 내용"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm h-24 resize-none"
              />
              <button onClick={handleAddRange} className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold text-sm">
                시험범위 추가
              </button>
            </div>
            <div className="space-y-2">
              {ranges.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-600">{r.subject}</span>
                      <p className="text-sm font-bold text-stone-700 truncate">{r.examTitle}</p>
                    </div>
                    <p className="text-[10px] text-stone-400 truncate">{r.range}</p>
                  </div>
                  <button onClick={() => handleDeleteRange(r.id)} className="text-stone-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-stone-800">요청 관리</h3>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-center text-stone-400 py-12">요청이 없습니다.</p>
              ) : (
                requests.map(r => (
                  <div key={r.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-400">{r.authorEmail}</p>
                        <p className="text-sm text-stone-800 leading-relaxed">{r.text}</p>
                      </div>
                      <button onClick={() => handleDeleteRequest(r.id)} className="text-stone-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <StatusBtn active={r.status === 'pending'} onClick={() => handleUpdateRequestStatus(r.id, 'pending')} icon={<Clock className="w-3 h-3" />} label="대기" color="bg-stone-200 text-stone-600" />
                      <StatusBtn active={r.status === 'in_progress'} onClick={() => handleUpdateRequestStatus(r.id, 'in_progress')} icon={<AlertCircle className="w-3 h-3" />} label="진행" color="bg-blue-100 text-blue-600" />
                      <StatusBtn active={r.status === 'approved'} onClick={() => handleUpdateRequestStatus(r.id, 'approved')} icon={<Check className="w-3 h-3" />} label="승인" color="bg-emerald-100 text-emerald-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
        active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function InputGroup({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-stone-900/5 focus:border-stone-900 transition-all"
      />
    </div>
  );
}

function StatusBtn({ active, onClick, icon, label, color }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all",
        active ? color : "bg-white text-stone-300 border border-stone-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
