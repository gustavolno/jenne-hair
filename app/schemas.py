from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# O que precisamos receber para criar um serviço
class ServiceCreate(BaseModel):
    name: str
    price: float
    duration_minutes: int
    description: Optional[str] = None

class ServiceResponse(ServiceCreate):
    id: int
    active: bool

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    client_name: str
    service_id: int
    start_time: datetime # O formato será "2026-01-20T14:00:00"

class AppointmentResponse(AppointmentCreate):
    id: int
    end_time: datetime
    status: str
    
    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    name: str
    commission_percent: float = 30.0

class EmployeeResponse(EmployeeCreate):
    id: int
    active: bool
    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    client_name: str
    service_id: int
    employee_id: int  # <--- Agora é obrigatório escolher o profissional
    start_time: datetime

class AppointmentResponse(AppointmentCreate):
    id: int
    end_time: datetime
    status: str
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "client"  # client, employee, admin

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    role: str

class ProductCreate(BaseModel):
    name: str
    quantity: int
    unit: str

class ProductResponse(ProductCreate):
    id: int
    class Config:
        from_attributes = True
