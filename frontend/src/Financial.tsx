import { useEffect, useState } from 'react';
import { api } from './api';
import { DollarSign, Wallet, TrendingUp, PieChart, Users } from 'lucide-react';

interface Appointment {
  id: number;
  service_id: number;
  employee_id: number;
  status: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
}

interface Employee {
  id: number;
  name: string;
  commission_percent: number;
}

export function Financial() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/agendamentos/'),
      api.get('/servicos/'),
      api.get('/funcionarios/')
    ]).then(([resApps, resServs, resEmps]) => {
      setAppointments(resApps.data);
      setServices(resServs.data);
      setEmployees(resEmps.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const calculateStats = () => {
    let faturamentoTotal = 0;
    let comissaoTotal = 0;

    const concluidos = appointments.filter(app => app.status === 'concluido');

    concluidos.forEach(app => {
      const service = services.find(s => s.id === app.service_id);
      const employee = employees.find(e => e.id === app.employee_id);

      if (service && employee) {
        faturamentoTotal += service.price;
        comissaoTotal += service.price * (employee.commission_percent / 100);
      }
    });

    return {
      total: faturamentoTotal,
      comissoes: comissaoTotal,
      lucro: faturamentoTotal - comissaoTotal,
      qtd: concluidos.length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <PieChart size={24} />
          <h2>Controle Financeiro</h2>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon success">
              <TrendingUp size={20} />
            </div>
            <span className="stat-label">Faturamento</span>
          </div>
          <div className="stat-value">R$ {stats.total.toFixed(2)}</div>
          <div className="stat-detail">{stats.qtd} serviços concluídos</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon warning">
              <Wallet size={20} />
            </div>
            <span className="stat-label">Comissões</span>
          </div>
          <div className="stat-value">R$ {stats.comissoes.toFixed(2)}</div>
          <div className="stat-detail">A pagar aos profissionais</div>
        </div>

        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon info">
              <DollarSign size={20} />
            </div>
            <span className="stat-label">Lucro Líquido</span>
          </div>
          <div className="stat-value">R$ {stats.lucro.toFixed(2)}</div>
          <div className="stat-detail">Caixa do Salão</div>
        </div>
      </div>

      {/* Tabela de Funcionários */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <h3>Comissões por Profissional</h3>
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Serviços Realizados</th>
                <th>Comissão (%)</th>
                <th>A Receber</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const appsDoFunc = appointments.filter(a => a.employee_id === emp.id && a.status === 'concluido');
                const totalComissao = appsDoFunc.reduce((acc, curr) => {
                  const serv = services.find(s => s.id === curr.service_id);
                  return acc + (serv ? serv.price * (emp.commission_percent / 100) : 0);
                }, 0);

                return (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: '600' }}>{emp.name}</td>
                    <td>
                      <span className="badge badge-info">{appsDoFunc.length}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{emp.commission_percent}%</td>
                    <td>
                      <span style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '1rem' }}>
                        R$ {totalComissao.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {employees.length === 0 && (
            <div className="empty-state">
              <Users size={48} />
              <h3>Nenhum profissional cadastrado</h3>
              <p>Cadastre profissionais para ver as comissões</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}