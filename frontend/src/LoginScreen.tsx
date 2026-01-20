import { useState } from 'react';
import { api } from './api';
import { Scissors, Mail, Lock, User, ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const payload = isRegister 
        ? formData 
        : { email: formData.email, password: formData.password };

      const response = await api.post(endpoint, payload);
      const { access_token, user_name, role } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify({ name: user_name, role }));
      
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Scissors size={32} />
          </div>
          <h1>Jenne Hair</h1>
          <p>Sistema de Gestão para Salão</p>
        </div>

        {/* Título */}
        <div className="login-title">
          <h2>{isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}</h2>
          <p>{isRegister ? 'Preencha os dados para se cadastrar' : 'Faça login para continuar'}</p>
        </div>
        
        {/* Erro */}
        {error && <div className="login-error">{error}</div>}

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Nome completo
              </label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Digite seu nome"
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              E-mail
            </label>
            <input 
              type="email" 
              className="form-input"
              placeholder="seu@email.com"
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Senha
            </label>
            <input 
              type="password" 
              className="form-input"
              placeholder="••••••••"
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <span>Aguarde...</span>
            ) : (
              <>
                {isRegister ? 'Criar conta' : 'Entrar'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>
            {isRegister ? 'Já tem uma conta? ' : 'Não tem conta? '}
            <button type="button" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Fazer login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}