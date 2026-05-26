import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import Reminders from './pages/Reminders';
import Navigation from './components/Navigation';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register'
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'subscriptions' | 'reminders'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated screens
  if (!user) {
    if (authScreen === 'register') {
      return <Register onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return <Login onNavigateToRegister={() => setAuthScreen('register')} />;
  }

  // Authenticated workspace shell
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'reminders':
        return <Reminders />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar Navigation */}
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Workspace Scroll Panel */}
      <main className="flex-1 overflow-y-auto h-screen">
        {renderPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
