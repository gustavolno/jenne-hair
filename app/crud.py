from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash
from datetime import timedelta

# --- USUÁRIOS ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password, 
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- SERVIÇOS ---
def create_service(db: Session, service: schemas.ServiceCreate):
    db_service = models.Service(**service.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

def get_services(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Service).filter(models.Service.active == True).offset(skip).limit(limit).all()

def delete_service(db: Session, service_id: int):
    db_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if db_service:
        db_service.active = False
        db.commit()
        db.refresh(db_service)
    return db_service

# --- AGENDAMENTOS ---
def create_appointment(db: Session, appointment: schemas.AppointmentCreate):
    service = db.query(models.Service).filter(models.Service.id == appointment.service_id).first()
    duration = service.duration_minutes if service else 30
    
    end_time = appointment.start_time + timedelta(minutes=duration)

    db_appointment = models.Appointment(
        client_name=appointment.client_name,
        service_id=appointment.service_id,
        employee_id=appointment.employee_id,
        start_time=appointment.start_time,
        end_time=end_time,
        status="agendado"
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def get_appointments(db: Session, skip: int = 0, limit: int = 100):
    # Traz os nomes do serviço e do funcionário junto (eager loading opcional)
    return db.query(models.Appointment).offset(skip).limit(limit).all()

# --- FUNCIONÁRIOS (AGORA BUSCA DA EQUIPE DE USERS) ---

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    # Essa função ficou obsoleta, usamos create_user agora, mas mantemos para não quebrar rotas antigas se houver
    pass

def get_employees(db: Session):
    # AQUI ESTÁ A MÁGICA: Retorna todos os usuários que NÃO SÃO clientes
    # Ou seja, retorna Admins e Funcionários para aparecerem no agendamento
    return db.query(models.User).filter(models.User.role.in_(['admin', 'employee'])).all()