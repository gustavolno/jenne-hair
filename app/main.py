from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from database import engine, get_db
import auth
import models, database, schemas, crud
from fastapi.security import OAuth2PasswordBearer

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Jenne Hair API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Função para verificar se é ADMIN
def get_current_user_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    # Decodifica o token
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
    except:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Busca o usuário no banco
    user = db.query(models.User).filter(models.User.email == email).first()
    
    # A MÁGICA: Verifica se ele é admin
    if user is None or user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado: Apenas administradores")
    
    return user


origins = [
    "http://localhost:5173", # Porta padrão do Vite (Frontend)
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, mudaremos para a lista 'origins' acima
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Rota para cadastrar serviço
@app.post("/servicos/", response_model=schemas.ServiceResponse)
def criar_servico(
    service: schemas.ServiceCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user_admin) # <--- AQUI
):
    return crud.create_service(db=db, service=service)

# Rota para listar serviços
@app.get("/servicos/", response_model=List[schemas.ServiceResponse])
def listar_servicos(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_services(db, skip=skip, limit=limit)

# Rota para deletar serviço
@app.delete("/servicos/{service_id}")
def deletar_servico(service_id: int, db: Session = Depends(database.get_db)):
    db_service = crud.delete_service(db, service_id)
    if db_service is None:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return {"message": "Serviço desativado com sucesso"}

@app.post("/agendamentos/", response_model=schemas.AppointmentResponse)
def criar_agendamento(appointment: schemas.AppointmentCreate, db: Session = Depends(database.get_db)):
    # Verifica se já existe agendamento no mesmo horário para o mesmo funcionário
    conflito = db.query(models.Appointment).filter(
        models.Appointment.employee_id == appointment.employee_id,
        models.Appointment.start_time == appointment.start_time,
        models.Appointment.status != "cancelado"
    ).first()
    
    if conflito:
        raise HTTPException(status_code=400, detail="Já existe um agendamento neste horário para este profissional")
    
    db_appointment = crud.create_appointment(db=db, appointment=appointment)
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return db_appointment

@app.get("/agendamentos/", response_model=List[schemas.AppointmentResponse])
def listar_agendamentos(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_appointments(db, skip=skip, limit=limit)

# Busca agendamentos por mês (para o calendário)
@app.get("/agendamentos/mes/")
def agendamentos_por_mes(ano: int, mes: int, db: Session = Depends(database.get_db)):
    from calendar import monthrange
    primeiro_dia = datetime(ano, mes, 1)
    ultimo_dia = datetime(ano, mes, monthrange(ano, mes)[1], 23, 59, 59)
    
    agendamentos = db.query(models.Appointment).filter(
        models.Appointment.start_time >= primeiro_dia,
        models.Appointment.start_time <= ultimo_dia,
        models.Appointment.status != "cancelado"
    ).all()
    
    return agendamentos

# Busca horários ocupados de um dia específico
@app.get("/agendamentos/dia/")
def agendamentos_por_dia(data: str, employee_id: int = None, db: Session = Depends(database.get_db)):
    # data no formato "2026-01-20"
    dia = datetime.strptime(data, "%Y-%m-%d")
    inicio_dia = datetime(dia.year, dia.month, dia.day, 0, 0, 0)
    fim_dia = datetime(dia.year, dia.month, dia.day, 23, 59, 59)
    
    query = db.query(models.Appointment).filter(
        models.Appointment.start_time >= inicio_dia,
        models.Appointment.start_time <= fim_dia,
        models.Appointment.status != "cancelado"
    )
    
    if employee_id:
        query = query.filter(models.Appointment.employee_id == employee_id)
    
    return query.all()

@app.get("/users/", response_model=List[schemas.User])
def listar_equipe(db: Session = Depends(database.get_db)):
    # Usa a função do CRUD que já filtramos para trazer só Admins e Funcionários
    return crud.get_employees(db)

# --- ROTAS DE AUTENTICAÇÃO ---

@app.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. Verifica se email já existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # 2. Valida o role
    valid_roles = ["client", "employee", "admin"]
    role = user.role if hasattr(user, 'role') and user.role in valid_roles else "client"
    
    # 3. Cria usuário com senha criptografada
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Já devolve o token para ele entrar direto
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": new_user.name,
        "role": new_user.role
    }

@app.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # 1. Busca usuário pelo email
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    
    # 2. Verifica se usuário existe e se a senha bate
    if not user or not auth.verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # 3. Gera o token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_name": user.name,
        "role": user.role
    }

@app.post("/produtos/", response_model=schemas.ProductResponse)
def criar_produto(product: schemas.ProductCreate, db: Session = Depends(database.get_db)):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/produtos/", response_model=List[schemas.ProductResponse])
def listar_produtos(db: Session = Depends(database.get_db)):
    return db.query(models.Product).all()

@app.post("/produtos/{id}/uso")
def usar_produto(id: int, quantidade: int = 1, db: Session = Depends(database.get_db)):
    # Busca o produto
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Desconta do estoque
    product.quantity -= quantidade
    db.commit()
    db.refresh(product)
    return product

# Atualiza status do agendamento
@app.patch("/agendamentos/{id}/status")
def atualizar_status_agendamento(id: int, status: str, db: Session = Depends(database.get_db)):
    agendamento = db.query(models.Appointment).filter(models.Appointment.id == id).first()
    if not agendamento:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    if status not in ["agendado", "concluido", "cancelado"]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    agendamento.status = status
    db.commit()
    db.refresh(agendamento)
    return agendamento

# Listar usuários (para gestão de equipe)
@app.get("/users")
def listar_usuarios(db: Session = Depends(database.get_db)):
    users = db.query(models.User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]

# Deletar usuário
@app.delete("/users/{user_id}")
def deletar_usuario(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuário removido com sucesso"}

@app.post("/users/", status_code=201, response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado.")

    return crud.create_user(db=db, user=user)