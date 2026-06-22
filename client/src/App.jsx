import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';

export default function App() {
  const [page, setPage] = useState('login'); // 'login' | 'chat'

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme" attribute="class">
      <TooltipProvider>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {page === 'login'
            ? <LoginPage onLoggedIn={() => setPage('chat')} />
            : <ChatPage onLogout={() => setPage('login')} />
          }
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
