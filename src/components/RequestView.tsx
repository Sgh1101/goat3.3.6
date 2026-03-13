import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, deleteDoc, doc } from 'firebase/firestore';
import { ContentRequest, RequestStatus } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Send, Clock, CheckCircle2, AlertCircle, User, MessageSquarePlus, Trash2 } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { cn } from '../lib/utils';
import ConfirmDialog from './ConfirmDialog';

export default function RequestView({ user }: { user: FirebaseUser | null }) {
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [newRequest, setNewRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    id: string;
  }>({ isOpen: false, id: '' });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'requests'), 
      where('authorEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentRequest));
      setRequests(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRequest.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'requests'), {
        text: newRequest.trim(),
        status: 'pending',
        authorEmail: user.email,
        createdAt: serverTimestamp()
      });
      setNewRequest('');
    } catch (error) {
      console.error("Request failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (confirmConfig.id) {
      try {
        await deleteDoc(doc(db, 'requests', confirmConfig.id));
      } catch (e) { console.error(e); }
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-stone-400" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return '승인대기';
      case 'in_progress': return '진행중';
      case 'approved': return '승인됨';
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'bg-stone-100 text-stone-600';
      case 'in_progress': return 'bg-blue-50 text-blue-600';
      case 'approved': return 'bg-emerald-50 text-emerald-600';
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-stone-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <User className="w-16 h-16 text-stone-100 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-800 mb-2">로그인이 필요합니다</h2>
        <p className="text-stone-400 mb-6">내용 추가 요청을 하려면 로그인을 해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen}
        title="요청 삭제"
        message="이 요청을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmConfig({ isOpen: false, id: '' })}
      />
      {/* Request Form */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-stone-800">내용 추가 요청</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newRequest}
            onChange={(e) => setNewRequest(e.target.value)}
            placeholder="추가하고 싶은 공지나 일정을 적어주세요."
            className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-stone-800 placeholder:text-stone-400"
            required
          />
          <button
            type="submit"
            disabled={submitting || !newRequest.trim()}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                요청 보내기
              </>
            )}
          </button>
        </form>
      </div>

      {/* My Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-stone-800 px-2">내 요청 현황</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-stone-100/50 rounded-3xl p-10 text-center border border-dashed border-stone-200">
            <p className="text-stone-400 font-medium text-sm">아직 요청한 내용이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                <div className="flex justify-between items-start mb-3">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    getStatusColor(req.status)
                  )}>
                    {getStatusIcon(req.status)}
                    {getStatusLabel(req.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {req.createdAt?.toDate ? format(req.createdAt.toDate(), 'MM/dd HH:mm', { locale: ko }) : '방금 전'}
                    </span>
                    <button onClick={() => handleDelete(req.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-stone-700 text-sm leading-relaxed">
                  {req.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
