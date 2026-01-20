import { useState, useContext } from 'react';
import { Admin } from './Admin';
import { Financial } from './Financial';
import { Stock } from './Stock';
import { Team } from './Team';
import { BookingCalendar } from './BookingCalendar';
import { AuthProvider, AuthContext } from './AuthContext';
import { LoginScreen } from './LoginScreen';
import { 
  Scissors, 
  CalendarDays, 
  Users, 
  Package, 
  DollarSign, 
  LogOut,
  UserCog
} from 'lucide-react';
import './styles/global.css';

// Componente Interno Principal
function MainApp() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  
  const [view, setView] = useState<'client' | 'admin' | 'financial' | 'stock' | 'team'>('client');

  // Se não estiver logado, mostra Login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleLogout = () => {
    logout();
    // Força navegação limpa
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  // Determina quais abas mostrar baseado no role
  const userRole = user?.role || 'client';
  const isAdmin = userRole === 'admin';
  const isEmployee = userRole === 'employee';
  const isClient = userRole === 'client';

  // Labels para cada role
  const roleLabels: Record<string, string> = {
    client: '👤 Cliente',
    employee: '💇 Profissional',
    admin: '🔐 Admin'
  };

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-top">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">
              <Scissors size={22} />
            </div>
            <span className="logo-text">Jenne Hair</span>
          </div>
          
          {/* User Info */}
          <div className="user-info">
            <div className="user-greeting">
              <div className="user-avatar">{getInitials(user?.name || '')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span>Olá, {user?.name}</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{roleLabels[userRole]}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-logout btn-sm">
              <LogOut size={16} />
              <span className="nav-label">Sair</span>
            </button>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="nav-menu">
          {/* Todos podem agendar */}
          <button 
            onClick={() => setView('client')} 
            className={`nav-btn ${view === 'client' ? 'active' : ''}`}
          >
            <CalendarDays size={18} />
            <span className="nav-label">Agendamento</span>
          </button>
          
          {/* Funcionário e Admin podem ver agenda completa */}
          {(isEmployee || isAdmin) && (
            <button 
              onClick={() => setView('admin')} 
              className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
            >
              <Users size={18} />
              <span className="nav-label">Agenda</span>
            </button>
          )}
          
          {/* Apenas Admin pode ver financeiro */}
          {isAdmin && (
            <button 
              onClick={() => setView('financial')} 
              className={`nav-btn ${view === 'financial' ? 'active' : ''}`}
            >
              <DollarSign size={18} />
              <span className="nav-label">Financeiro</span>
            </button>
          )}
          
          {/* Apenas Admin pode ver estoque */}
          {isAdmin && (
            <button 
              onClick={() => setView('stock')} 
              className={`nav-btn ${view === 'stock' ? 'active' : ''}`}
            >
              <Package size={18} />
              <span className="nav-label">Estoque</span>
            </button>
          )}
          
          {/* Apenas Admin pode gerenciar equipe */}
          {isAdmin && (
            <button 
              onClick={() => setView('team')} 
              className={`nav-btn ${view === 'team' ? 'active' : ''}`}
            >
              <UserCog size={18} />
              <span className="nav-label">Equipe</span>
            </button>
          )}
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main className="fade-in">
        {/* --- TELA DO CLIENTE (AGENDAMENTO COM CALENDÁRIO) --- */}
        {view === 'client' && <BookingCalendar />}

        {/* --- OUTRAS TELAS (só renderiza se tiver permissão) --- */}
        {view === 'admin' && (isEmployee || isAdmin) && <Admin />}
        {view === 'financial' && isAdmin && <Financial />}
        {view === 'stock' && isAdmin && <Stock />}
        {view === 'team' && isAdmin && <Team />}
        
        {/* Se tentar acessar algo sem permissão */}
        {view === 'admin' && isClient && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <h2>🔒 Acesso Restrito</h2>
            <p>Apenas profissionais e administradores podem acessar esta área.</p>
          </div>
        )}
        {(view === 'financial' || view === 'stock' || view === 'team') && !isAdmin && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <h2>🔒 Acesso Restrito</h2>
            <p>Apenas administradores podem acessar esta área.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// O App exportado fornece o Contexto
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}