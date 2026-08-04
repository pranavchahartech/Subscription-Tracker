import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import Reminders from './pages/Reminders';
import Navigation from './components/Navigation';
import DemoBanner from './components/DemoBanner';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register' | 'forgot-password'
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
      return (
        <>
          <DemoBanner />
          <Register onNavigateToLogin={() => setAuthScreen('login')} />
          <ToastContainer />
        </>
      );
    }
    if (authScreen === 'forgot-password') {
      return (
        <>
          <DemoBanner />
          <ForgotPassword onNavigateToLogin={() => setAuthScreen('login')} />
          <ToastContainer />
        </>
      );
    }
    return (
      <>
        <DemoBanner />
        <Login 
          onNavigateToRegister={() => setAuthScreen('register')} 
          onNavigateToForgotPassword={() => setAuthScreen('forgot-password')} 
        />
        <ToastContainer />
      </>
    );
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <DemoBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Main Workspace Scroll Panel */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-2.25rem)]">
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
