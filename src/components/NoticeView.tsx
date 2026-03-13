import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Notice, NoticeType } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Bell, Info, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

export default function NoticeView({ user }: { user: User | null }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NoticeType>('general');
  const [newNotice, setNewNotice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    id: string;
  }>({ isOpen: false, id: '' });

  const isAdmin = user?.email === 'slgdj1228@gmail.com';

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.trim()) return;
    try {
      await addDoc(collection(db, 'notices'), {
        content: newNotice.trim(),
        type: activeTab,
        createdAt: serverTimestamp()
      });
      setNewNotice('');
      setIsAdding(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteNotice = async (id: string) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (confirmConfig.id) {
      await deleteDoc(doc(db, 'notices', confirmConfig.id));
    }
  };

  const filteredNotices = notices.filter(n => n.type === activeTab);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title="공지 삭제"
        message="이 공지를 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmConfig({ isOpen: false, id: '' })}
      />
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-stone-800">공지사항</h2>
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
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'general' ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500"
          )}
        >
          일반 공지
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'teacher' ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"
          )}
        >
          선생님 공지
        </button>
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleAddNotice} className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
          <textarea
            value={newNotice}
            onChange={(e) => setNewNotice(e.target.value)}
            placeholder={`${activeTab === 'teacher' ? '선생님' : '일반'} 공지 내용을 입력하세요.`}
            className="w-full h-24 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button type="submit" className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm">
            공지 등록
          </button>
        </form>
      )}

      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-200">
          <Info className="w-12 h-12 text-stone-200 mx-auto mb-4" />
          <p className="text-stone-400 font-medium">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        filteredNotices.map((notice) => (
          <div key={notice.id} className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 relative overflow-hidden group">
            <div className={cn(
              "absolute top-0 left-0 w-1 h-full transition-opacity",
              activeTab === 'teacher' ? "bg-amber-500" : "bg-emerald-500"
            )} />
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                activeTab === 'teacher' ? "bg-amber-50" : "bg-emerald-50"
              )}>
                {activeTab === 'teacher' ? <UserIcon className="w-5 h-5 text-amber-600" /> : <Bell className="w-5 h-5 text-emerald-600" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-stone-800 leading-relaxed whitespace-pre-wrap text-sm">
                  {notice.content}
                </p>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {notice.createdAt?.toDate ? format(notice.createdAt.toDate(), 'yyyy. MM. dd HH:mm', { locale: ko }) : '방금 전'}
                  </p>
                  {isAdmin && (
                    <button onClick={() => handleDeleteNotice(notice.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
