import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { Home, Bell, Calendar, MessageSquare, ShieldCheck, LogIn, LogOut, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';
import HomeView from './components/HomeView';
import NoticeView from './components/NoticeView';
import ScheduleView from './components/ScheduleView';
import RequestView from './components/RequestView';
import StudyView from './components/StudyView';
import AdminView from './components/AdminView';

type View = 'home' | 'notice' | 'schedule' | 'study' | 'request' | 'admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAdmin = user?.email === 'slgdj1228@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Connection test as per guidelines
  useEffect(() => {
    if (isAuthReady) {
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'settings', 'global'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();
    }
  }, [isAuthReady]);

  const handleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      setLoginError(error.message || "로그인에 실패했습니다.");
      setTimeout(() => setLoginError(null), 5000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="mt-4 text-stone-500 font-medium">학교 소식을 불러오는 중...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView user={user} />;
      case 'notice': return <NoticeView user={user} />;
      case 'schedule': return <ScheduleView user={user} />;
      case 'study': return <StudyView />;
      case 'request': return <RequestView user={user} />;
      case 'admin': return isAdmin ? <AdminView /> : <HomeView user={user} />;
      default: return <HomeView user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 font-sans text-stone-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">GOAT3.3</h1>
        </div>
        
        {user ? (
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL || ''} 
              alt={user.displayName || ''} 
              className="w-8 h-8 rounded-full border border-stone-200"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={handleLogout}
              className="p-2 text-stone-500 hover:text-red-600 transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            로그인
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-6">
        {loginError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{loginError}</p>
          </div>
        )}
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 px-4 py-3 pb-8 flex items-center justify-between max-w-md mx-auto shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <NavButton 
          active={currentView === 'home'} 
          onClick={() => setCurrentView('home')} 
          icon={<Home className="w-5 h-5" />} 
          label="홈" 
        />
        <NavButton 
          active={currentView === 'notice'} 
          onClick={() => setCurrentView('notice')} 
          icon={<Bell className="w-5 h-5" />} 
          label="공지" 
        />
        <NavButton 
          active={currentView === 'schedule'} 
          onClick={() => setCurrentView('schedule')} 
          icon={<Calendar className="w-5 h-5" />} 
          label="일정" 
        />
        <NavButton 
          active={currentView === 'study'} 
          onClick={() => setCurrentView('study')} 
          icon={<BookOpen className="w-5 h-5" />} 
          label="학습" 
        />
        <NavButton 
          active={currentView === 'request'} 
          onClick={() => setCurrentView('request')} 
          icon={<MessageSquare className="w-5 h-5" />} 
          label="요청" 
        />
        {isAdmin && (
          <NavButton 
            active={currentView === 'admin'} 
            onClick={() => setCurrentView('admin')} 
            icon={<ShieldCheck className="w-5 h-5" />} 
            label="관리" 
          />
        )}
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-200",
        active ? "text-emerald-600 scale-110" : "text-stone-400 hover:text-stone-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

