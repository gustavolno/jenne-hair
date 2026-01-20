import { useState, useEffect } from 'react';
import { api } from './api';
import { UserPlus, Trash2, Users, Shield, Scissors, Search, Mail, Lock, User } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await api.get('/users');
      // Filtra apenas funcionários e admins (não clientes)
      const staff = res.data.filter((u: TeamMember) => u.role !== 'client');
      setMembers(staff);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await api.post('/register', formData);
      setFormData({ name: '', email: '', password: '', role: 'employee' });
      setShowForm(false);
      loadMembers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Erro ao cadastrar');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja remover ${name} da equipe?`)) return;
    
    try {
      await api.delete(`/users/${id}`);
      loadMembers();
    } catch (err) {
      console.error('Erro ao remover:', err);
      alert('Erro ao remover membro da equipe');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Shield size={16} />;
    return <Scissors size={16} />;
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Administrador';
    return 'Profissional';
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === 'admin') return 'badge badge-warning';
    return 'badge badge-info';
  };

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Users size={24} />
            Equipe
          </h2>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '14px' }}>
            Gerencie funcionários e administradores
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={18} />
          Novo Membro
        </button>
      </div>

      {/* Formulário de Cadastro */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', background: 'var(--bg-tertiary)', border: '2px dashed var(--primary)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>➕ Cadastrar Novo Membro</h3>
          
          {formError && (
            <div style={{ 
              background: 'rgba(220, 53, 69, 0.1)', 
              border: '1px solid #dc3545', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              color: '#dc3545'
            }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">
                  <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Nome completo
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome do funcionário"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  E-mail
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@exemplo.com"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                  placeholder="Senha inicial"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Shield size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Tipo de acesso
                </label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="employee">💇 Profissional</option>
                  <option value="admin">🔐 Administrador</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Carregando...</p>
      ) : filteredMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>
          <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>Nenhum membro da equipe encontrado.</p>
          <p style={{ fontSize: '14px' }}>Clique em "Novo Membro" para cadastrar.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Tipo</th>
                <th style={{ width: '80px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'var(--primary)', 
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{member.name}</span>
                    </div>
                  </td>
                  <td style={{ opacity: 0.7 }}>{member.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(member.role)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {getRoleIcon(member.role)}
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(member.id, member.name)}
                      title="Remover membro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumo */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: 'var(--bg-tertiary)', 
        borderRadius: '8px',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} style={{ color: 'var(--primary)' }} />
          <span><strong>{members.length}</strong> membros na equipe</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={18} style={{ color: 'var(--info)' }} />
          <span><strong>{members.filter(m => m.role === 'employee').length}</strong> profissionais</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} style={{ color: 'var(--warning)' }} />
          <span><strong>{members.filter(m => m.role === 'admin').length}</strong> administradores</span>
        </div>
      </div>
    </div>
  );
}
