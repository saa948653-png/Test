
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  Layers, 
  MessageCircle, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ChevronRight,
  Bell
} from 'lucide-react';
import { User, UserRole, ExamAttempt, Flashcard, Doubt, Exam } from './types';
import { MOCK_USER, MOCK_EXAMS } from './services/mockData';

// --- Context & Auth ---
interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Fix: Export useAuth to make it accessible in other files
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Pages ---
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamSession from './pages/ExamSession';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import FlashcardsPage from './pages/FlashcardsPage';
import DoubtsPage from './pages/DoubtsPage';
import LoginPage from './pages/LoginPage';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Exams', icon: BookOpen, path: '/exams' },
    { label: 'History', icon: History, path: '/history' },
    { label: 'Flashcards', icon: Layers, path: '/flashcards' },
    { label: 'Doubts', icon: MessageCircle, path: '/doubts' },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-indigo-600">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">S</div>
            StudyFlow
          </Link>
        </div>
        
        <nav className="mt-4 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${location.pathname === item.path 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 mb-2">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-100" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="hidden lg:block text-slate-400 text-sm">
            {navItems.find(n => n.path === location.pathname)?.label || 'Page'}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <UserIcon size={18} className="text-slate-400 group-hover:text-indigo-600" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('studyflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (email: string) => {
    // In production, this would be a real API call
    const newUser = { ...MOCK_USER, email };
    setUser(newUser);
    localStorage.setItem('studyflow_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studyflow_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
          <Route path="/exams" element={user ? <Layout><ExamList /></Layout> : <Navigate to="/login" />} />
          <Route path="/exam/:id" element={user ? <ExamSession /> : <Navigate to="/login" />} />
          <Route path="/result/:attemptId" element={user ? <Layout><ResultPage /></Layout> : <Navigate to="/login" />} />
          <Route path="/history" element={user ? <Layout><HistoryPage /></Layout> : <Navigate to="/login" />} />
          <Route path="/flashcards" element={user ? <Layout><FlashcardsPage /></Layout> : <Navigate to="/login" />} />
          <Route path="/doubts" element={user ? <Layout><DoubtsPage /></Layout> : <Navigate to="/login" />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}
