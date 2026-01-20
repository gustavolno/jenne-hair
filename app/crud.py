from sqlalchemy.orm import Session
from . import models, schemas
from datetime import timedelta

def create_service(db: Session, service: schemas.ServiceCreate):
    db_service = models.Service(
        name=service.name,
        price=service.price,
        duration_minutes=service.duration_minutes,
        description=service.description
    )
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
    return db_service

def create_appointment(db: Session, appointment: schemas.AppointmentCreate):
    # 1. Busca o serviço para saber a duração
    db_service = db.query(models.Service).filter(models.Service.id == appointment.service_id).first()
    
    if not db_service:
        return None # Serviço não existe

    # 2. Calcula o horário de fim
    calculated_end_time = appointment.start_time + timedelta(minutes=db_service.duration_minutes)

    # 3. Cria o agendamento
    db_appointment = models.Appointment(
        client_name=appointment.client_name,
        service_id=appointment.service_id,
        start_time=appointment.start_time,
        end_time=calculated_end_time,
        status="agendado"
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def get_appointments(db: Session, skip: int = 0, limit: int = 100):
    # Traz os agendamentos e carrega os dados do serviço junto (join)
    return db.query(models.Appointment).offset(skip).limit(limit).all()

def create_employee(db: Session, employee: schemas.EmployeeCreate):
    db_employee = models.Employee(
        name=employee.name,
        commission_percent=employee.commission_percent
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def get_employees(db: Session):
    return db.query(models.Employee).filter(models.Employee.active == True).all()

# ATENÇÃO: Atualize a função create_appointment para salvar o employee_id
def create_appointment(db: Session, appointment: schemas.AppointmentCreate):
    db_service = db.query(models.Service).filter(models.Service.id == appointment.service_id).first()
    if not db_service: return None

    calculated_end_time = appointment.start_time + timedelta(minutes=db_service.duration_minutes)

    db_appointment = models.Appointment(
        client_name=appointment.client_name,
        service_id=appointment.service_id,
        employee_id=appointment.employee_id, # <--- ADICIONE ISTO
        start_time=appointment.start_time,
        end_time=calculated_end_time,
        status="agendado"
    )
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment