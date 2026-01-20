import { useState, useEffect } from 'react';
import { api } from './api';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  User, 
  Scissors, 
  Users,
  CalendarCheck,
  CalendarX
} from 'lucide-react';

interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Employee {
  id: number;
  name: string;
}

interface Appointment {
  id: number;
  start_time: string;
  employee_id: number;
}

interface BookingCalendarProps {
  onSuccess?: () => void;
}

// Horários disponíveis do salão
const HORARIOS_SALAO = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function BookingCalendar({ onSuccess }: BookingCalendarProps) {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agendamentosMes, setAgendamentosMes] = useState<Appointment[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    client_name: '',
    service_id: '',
    employee_id: '',
    horario: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // Carrega serviços e funcionários
  useEffect(() => {
    api.get('/servicos/').then(res => setServices(res.data)).catch(console.error);
    api.get('/funcionarios/').then(res => setEmployees(res.data)).catch(console.error);
  }, []);

  // Carrega agendamentos do mês
  useEffect(() => {
    carregarAgendamentosMes();
  }, [mesAtual, anoAtual]);

  const carregarAgendamentosMes = async () => {
    try {
      const res = await api.get(`/agendamentos/mes/?ano=${anoAtual}&mes=${mesAtual + 1}`);
      setAgendamentosMes(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Quando muda o funcionário selecionado, recarrega horários ocupados
  useEffect(() => {
    if (diaSelecionado && formData.employee_id) {
      carregarHorariosDia();
    }
  }, [formData.employee_id, diaSelecionado]);

  const carregarHorariosDia = async () => {
    if (!diaSelecionado || !formData.employee_id) return;
    
    setLoadingHorarios(true);
    try {
      const dataStr = diaSelecionado.toISOString().split('T')[0];
      const res = await api.get(`/agendamentos/dia/?data=${dataStr}&employee_id=${formData.employee_id}`);
      
      // Extrai os horários ocupados
      const ocupados = res.data.map((a: Appointment) => {
        const hora = new Date(a.start_time);
        return `${hora.getHours().toString().padStart(2, '0')}:${hora.getMinutes().toString().padStart(2, '0')}`;
      });
      
      setHorariosOcupados(ocupados);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHorarios(false);
    }
  };

  // Navegação do calendário
  const mesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const mesProximo = () => {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  // Gera os dias do mês
  const gerarDiasDoMes = () => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    
    const dias: (number | null)[] = [];
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= diasNoMes; i++) {
      dias.push(i);
    }
    
    return dias;
  };

  // Verifica se um dia tem agendamentos
  const contarAgendamentosDia = (dia: number) => {
    return agendamentosMes.filter(a => {
      const data = new Date(a.start_time);
      return data.getDate() === dia;
    }).length;
  };

  // Verifica se é dia passado
  const isDiaPassado = (dia: number) => {
    const data = new Date(anoAtual, mesAtual, dia);
    const hojeInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return data < hojeInicio;
  };

  // Clica em um dia
  const selecionarDia = (dia: number) => {
    if (isDiaPassado(dia)) return;
    
    const data = new Date(anoAtual, mesAtual, dia);
    setDiaSelecionado(data);
    setFormData({ ...formData, horario: '' });
    setHorariosOcupados([]);
    setShowModal(true);
  };

  // Fecha o modal
  const fecharModal = () => {
    setShowModal(false);
    setDiaSelecionado(null);
    setFormData({ client_name: '', service_id: '', employee_id: '', horario: '' });
    setHorariosOcupados([]);
  };

  // Verifica se horário já passou (para o dia atual)
  const isHorarioPassado = (horario: string) => {
    if (!diaSelecionado) return false;
    
    const hojeData = new Date();
    const diaSelData = new Date(diaSelecionado);
    
    // Se não é hoje, não bloqueia
    if (diaSelData.toDateString() !== hojeData.toDateString()) return false;
    
    const [h, m] = horario.split(':').map(Number);
    const horarioDate = new Date(diaSelData.setHours(h, m, 0, 0));
    
    return horarioDate <= hojeData;
  };

  // Envia o agendamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.service_id || !formData.employee_id || !formData.horario) {
      alert("Preencha todos os campos!");
      return;
    }
    
    setLoading(true);
    
    try {
      const dataStr = diaSelecionado!.toISOString().split('T')[0];
      
      await api.post('/agendamentos/', {
        client_name: formData.client_name,
        service_id: Number(formData.service_id),
        employee_id: Number(formData.employee_id),
        start_time: `${dataStr}T${formData.horario}:00`
      });
      
      alert("Agendamento realizado com sucesso! ✅");
      fecharModal();
      carregarAgendamentosMes();
      onSuccess?.();
      
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao agendar");
    } finally {
      setLoading(false);
    }
  };

  const dias = gerarDiasDoMes();

  return (
    <div className="fade-in">
      {/* Calendário */}
      <div className="card">
        {/* Header do Calendário */}
        <div className="card-header">
          <div className="card-title">
            <div className="card-icon">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h2>Agendar Horário</h2>
              <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>Escolha uma data disponível</p>
            </div>
          </div>
        </div>

        {/* Navegação do Mês */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          padding: 'var(--space-sm) 0'
        }}>
          <button onClick={mesAnterior} className="btn btn-secondary btn-icon">
            <ChevronLeft size={20} />
          </button>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>
            {MESES[mesAtual]} {anoAtual}
          </h3>
          <button onClick={mesProximo} className="btn btn-secondary btn-icon">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dias da Semana */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '4px',
          marginBottom: 'var(--space-sm)'
        }}>
          {DIAS_SEMANA.map(dia => (
            <div key={dia} style={{ 
              textAlign: 'center', 
              padding: 'var(--space-sm)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {dia}
            </div>
          ))}
        </div>

        {/* Dias do Mês */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '4px'
        }}>
          {dias.map((dia, idx) => {
            if (dia === null) {
              return <div key={`empty-${idx}`} />;
            }
            
            const passado = isDiaPassado(dia);
            const agendamentos = contarAgendamentosDia(dia);
            const isHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
            
            return (
              <button
                key={dia}
                onClick={() => selecionarDia(dia)}
                disabled={passado}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isHoje ? 'var(--primary)' : passado ? 'var(--bg-input)' : 'var(--bg-hover)',
                  border: isHoje ? '2px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius-md)',
                  color: isHoje ? 'var(--bg-dark)' : passado ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: passado ? 'not-allowed' : 'pointer',
                  opacity: passado ? 0.5 : 1,
                  transition: 'all var(--transition-fast)',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  position: 'relative'
                }}
                onMouseOver={(e) => !passado && (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {dia}
                {agendamentos > 0 && (
                  <span style={{
                    position: 'absolute',
                    bottom: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: agendamentos >= 5 ? 'var(--danger)' : 'var(--success)'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-lg)', 
          marginTop: 'var(--space-lg)',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
            Horários disponíveis
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
            Muitos agendamentos
          </div>
        </div>
      </div>

      {/* Modal de Horários */}
      {showModal && diaSelecionado && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-md)'
          }}
          onClick={(e) => e.target === e.currentTarget && fecharModal()}
        >
          <div 
            className="card fade-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            {/* Header do Modal */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--space-lg)'
            }}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>
                  {diaSelecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Escolha o horário e preencha os dados
                </p>
              </div>
              <button onClick={fecharModal} className="btn btn-secondary btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nome do Cliente */}
              <div className="form-group">
                <label className="form-label">
                  <User size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Digite seu nome"
                  value={formData.client_name}
                  onChange={e => setFormData({ ...formData, client_name: e.target.value })}
                />
              </div>

              {/* Serviço */}
              <div className="form-group">
                <label className="form-label">
                  <Scissors size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Serviço
                </label>
                <select
                  className="form-select"
                  value={formData.service_id}
                  onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                >
                  <option value="">Selecione um serviço...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.duration_minutes}min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Profissional */}
              <div className="form-group">
                <label className="form-label">
                  <Users size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Profissional
                </label>
                <select
                  className="form-select"
                  value={formData.employee_id}
                  onChange={e => setFormData({ ...formData, employee_id: e.target.value, horario: '' })}
                >
                  <option value="">Escolha o profissional...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Horários */}
              {formData.employee_id && (
                <div className="form-group">
                  <label className="form-label">
                    <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Horário Disponível
                  </label>
                  
                  {loadingHorarios ? (
                    <div className="loading" style={{ padding: 'var(--space-md)' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: 'var(--space-sm)' 
                    }}>
                      {HORARIOS_SALAO.map(horario => {
                        const ocupado = horariosOcupados.includes(horario);
                        const passado = isHorarioPassado(horario);
                        const indisponivel = ocupado || passado;
                        const selecionado = formData.horario === horario;
                        
                        return (
                          <button
                            key={horario}
                            type="button"
                            disabled={indisponivel}
                            onClick={() => setFormData({ ...formData, horario })}
                            style={{
                              padding: 'var(--space-sm)',
                              background: selecionado 
                                ? 'var(--primary)' 
                                : indisponivel 
                                  ? 'var(--bg-input)' 
                                  : 'var(--bg-hover)',
                              border: selecionado 
                                ? '2px solid var(--primary-light)' 
                                : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 'var(--radius-sm)',
                              color: selecionado 
                                ? 'var(--bg-dark)' 
                                : indisponivel 
                                  ? 'var(--text-muted)' 
                                  : 'var(--text-primary)',
                              cursor: indisponivel ? 'not-allowed' : 'pointer',
                              opacity: indisponivel ? 0.4 : 1,
                              fontWeight: selecionado ? '700' : '500',
                              fontSize: '0.875rem',
                              transition: 'all var(--transition-fast)',
                              textDecoration: ocupado ? 'line-through' : 'none'
                            }}
                          >
                            {horario}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {horariosOcupados.length > 0 && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--text-muted)', 
                      marginTop: 'var(--space-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CalendarX size={12} />
                      Horários riscados já estão ocupados
                    </p>
                  )}
                </div>
              )}

              {/* Botão de Confirmar */}
              <div className="form-actions">
                <button type="button" onClick={fecharModal} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2 }}
                  disabled={loading || !formData.horario}
                >
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
