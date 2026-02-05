from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- TOKEN ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    role: str

# --- USUÁRIOS ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "client"

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

# --- SERVIÇOS ---
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

# --- FUNCIONÁRIOS ---
class EmployeeCreate(BaseModel):
    name: str
    commission_percent: float = 30.0

class EmployeeResponse(EmployeeCreate):
    id: int
    active: bool

    class Config:
        from_attributes = True

# --- AGENDAMENTOS ---
class AppointmentCreate(BaseModel):
    client_name: str
    service_id: int
    employee_id: int
    start_time: datetime

class AppointmentResponse(AppointmentCreate):
    id: int
    end_time: datetime
    status: str

    class Config:
        from_attributes = True

# --- PRODUTOS ---
class ProductCreate(BaseModel):
    name: str
    quantity: int
    price: Optional[float] = 0.0
    unit: Optional[str] = "un"

class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True