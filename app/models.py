from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="client") # 'admin', 'employee', 'client'

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    duration_minutes = Column(Integer)
    active = Column(Boolean, default=True)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Integer)
    price = Column(Float, default=0.0)
    unit = Column(String, default="un")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String)
    
    # Relacionamentos
    service_id = Column(Integer, ForeignKey("services.id"))
    
    # AGORA APONTA PARA A TABELA DE USERS (PROFISSIONAL)
    employee_id = Column(Integer, ForeignKey("users.id")) 
    
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String, default="agendado") # agendado, concluido, cancelado

    service = relationship("Service")
    employee = relationship("User") # O funcionário é um User