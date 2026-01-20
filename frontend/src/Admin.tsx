import { useEffect, useState } from 'react';
import { api } from './api';
import { CheckCircle, XCircle, RefreshCw, Calendar, Clock, UserCheck } from 'lucide-react';

interface Appointment {
  id: number;
  client_name: string;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
}

export function Admin() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await api.get('/agendamentos/');
      setAppointments(response.data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, null, {
        params: { status: novoStatus }
      });
      
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: novoStatus } : app
      ));
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const formatarData = (isoString: string) => {
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'concluido': 
        return <span className="badge badge-success">Concluído</span>;
      case 'cancelado': 
        return <span className="badge badge-danger">Cancelado</span>;
      default: 
        return <span className="badge badge-warning">Agendado</span>;
    }
  };

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-title">
          <div className="card-icon">
            <Calendar size={22} />
          </div>
          <div>
            <h2>Agenda do Salão</h2>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Gerencie os atendimentos</p>
          </div>
        </div>
        <button onClick={carregarDados} className="btn btn-secondary btn-icon" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                      {app.client_name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      {formatarData(app.start_time)}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {formatarData(app.end_time).split(' ')[1]}
                  </td>
                  <td>{getStatusBadge(app.status)}</td>
                  <td>
                    <div className="action-buttons">
                      {app.status === 'agendado' ? (
                        <>
                          <button 
                            onClick={() => atualizarStatus(app.id, 'concluido')}
                            className="btn btn-success btn-sm btn-icon"
                            title="Concluir"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => atualizarStatus(app.id, 'cancelado')}
                            className="btn btn-danger btn-sm btn-icon"
                            title="Cancelar"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {appointments.length === 0 && (
            <div className="empty-state">
              <Calendar size={48} />
              <h3>Nenhum agendamento</h3>
              <p>Os agendamentos aparecerão aqui</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}