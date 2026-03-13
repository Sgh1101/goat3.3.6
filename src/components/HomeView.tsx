import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { GlobalSettings, Notice, ExtraLink } from '../types';
import { ExternalLink, Clock, CalendarDays, Bell } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User } from 'firebase/auth';

export default function HomeView({ user }: { user: User | null }) {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as GlobalSettings);
      }
    });

    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(1));
    const unsubNotice = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setLatestNotice({ id: snap.docs[0].id, ...snap.docs[0].data() } as Notice);
      }
    });

    return () => {
      unsubSettings();
      unsubNotice();
    };
  }, []);

  const getDDay = () => {
    if (!settings?.nextExamDate) return null;
    try {
      const examDate = parseISO(settings.nextExamDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = differenceInDays(examDate, today);
      return diff;
    } catch (e) {
      return null;
    }
  };

  const dDay = getDDay();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* D-Day Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 z-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">가까운 시험</span>
          </div>
          <h2 className="text-xl font-bold text-stone-800 mb-4">
            {settings?.nextExamTitle || '시험 일정이 없습니다'}
          </h2>
          
          {dDay !== null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-emerald-600">D-{dDay === 0 ? 'Day' : dDay}</span>
              <span className="text-stone-400 font-medium">남았습니다</span>
            </div>
          ) : (
            <p className="text-stone-400">관리자가 시험 일정을 등록하면 여기에 표시됩니다.</p>
          )}
        </div>
      </div>

      {/* Latest Notice Card */}
      {latestNotice && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">LATEST NOTICE</span>
              <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                {latestNotice.type === 'teacher' ? '선생님 공지' : '일반 공지'}
              </span>
            </div>
            <p className="text-sm font-bold text-stone-800 truncate">{latestNotice.content}</p>
          </div>
        </div>
      )}

      {/* Links Grid */}
      <div className="grid grid-cols-2 gap-4">
        <LinkCard 
          title="학교 홈페이지" 
          url={settings?.schoolWebsiteLink} 
          icon={<GlobeIcon />}
          color="bg-emerald-50 text-emerald-700"
          className="col-span-2"
        />
        <LinkCard 
          title="시간표" 
          url={settings?.timetableLink} 
          icon={<Clock className="w-6 h-6" />}
          color="bg-blue-50 text-blue-600"
        />
        <LinkCard 
          title="카톡방" 
          url={settings?.kakaoLink} 
          icon={<MessageSquareIcon />}
          color="bg-yellow-50 text-yellow-700"
        />
        {settings?.extraLinks?.map((link: ExtraLink, i: number) => (
          <div key={`extra-link-${i}`}>
            <LinkCard 
              title={link.title} 
              url={link.url} 
              icon={<ExternalLink className="w-6 h-6" />}
              color="bg-stone-50 text-stone-700"
            />
          </div>
        ))}
      </div>

      {!user && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-sm text-emerald-800 font-medium">
            로그인하면 공지사항과 일정을 더 자세히 볼 수 있습니다!
          </p>
        </div>
      )}
    </div>
  );
}

interface LinkCardProps {
  title: string;
  url?: string;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

function LinkCard({ title, url, icon, color, className }: LinkCardProps) {
  return (
    <a 
      href={url || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-3xl transition-all active:scale-95 border border-transparent hover:border-stone-200",
        color,
        !url && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={(e) => !url && e.preventDefault()}
    >
      <div className="mb-3">{icon}</div>
      <span className="font-bold">{title}</span>
      <ExternalLink className="w-3 h-3 mt-1 opacity-50" />
    </a>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MessageSquareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

import { cn } from '../lib/utils';
