import { useState, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Login from './components/Login';
import Signup from './pages/Signup';
import Dashboard from './components/Dashboard';
import Borrowers from './components/Borrowers';
import Loans from './components/Loans';
import Payments from './components/Payments';
import Agreements from './components/Agreements';
import ReminderLogs from './components/ReminderLogs';
import Settings from './components/Settings';

// Route animation wrapper
function AnimatedPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col h-full"
    >
      {children}
    </motion.div>
  );
}

// Protected layout wrapper
function LayoutWrapper() {
  const { currentUser, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-800 dark:bg-[#0c0c0e] dark:text-slate-200 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 dark:bg-[#0c0c0e] dark:text-slate-200 transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile quick header line */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white dark:border-slate-800/80 dark:bg-[#09090b] px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
              title="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-serif font-black text-xs">
                A
              </div>
              <span className="font-serif text-sm font-bold tracking-tight text-slate-900 dark:text-white">Amanah</span>
            </div>
          </div>
        </div>

        {/* Top Navbar */}
        <Header />

        {/* Central interactive page scroll container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl h-full flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <div className="w-full flex-1 flex flex-col" key={location.pathname}>
                <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <AnimatedPage>
                      <Dashboard />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <AnimatedPage>
                      <Dashboard />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/borrowers"
                  element={
                    <AnimatedPage>
                      <Borrowers />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/loans"
                  element={
                    <AnimatedPage>
                      <Loans />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <AnimatedPage>
                      <Payments />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/agreements"
                  element={
                    <AnimatedPage>
                      <Agreements />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/reminders"
                  element={
                    <AnimatedPage>
                      <ReminderLogs />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <AnimatedPage>
                      <Settings />
                    </AnimatedPage>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </div>
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/*" element={<LayoutWrapper />} />
            </Routes>
          </HashRouter>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
