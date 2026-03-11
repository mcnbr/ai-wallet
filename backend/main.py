from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import datetime
import os
from dotenv import load_dotenv

# Langchain and AI
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain.agents import AgentType, initialize_agent
from langchain_community.tools import DuckDuckGoSearchRun

# Drive Sync
from drive_sync import upload_to_drive
from pdf_parser import parse_sinacor_pdf
from fastapi import UploadFile, File
import shutil

load_dotenv()

# Configuration
LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./carteira.db")

# Database Setup
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

init_db()

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    name = Column(String)
    quantity = Column(Float)
    average_price = Column(Float)
    type = Column(String) # stocks, crypto, fii, fixed_income

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    type = Column(String) # buy, sell
    quantity = Column(Float)
    price = Column(Float)
    date = Column(DateTime, default=datetime.datetime.utcnow)

# AI Tools
@tool
def add_asset_tool(symbol: str, quantity: float, price: float, asset_type: str):
    """Adiciona um novo ativo ou atualiza a quantidade e preço médio de um existente."""
    db = SessionLocal()
    try:
        asset = db.query(Asset).filter(Asset.symbol == symbol.upper()).first()
        if not asset:
            asset = Asset(symbol=symbol.upper(), quantity=quantity, average_price=price, type=asset_type)
            db.add(asset)
        else:
            new_quantity = asset.quantity + quantity
            new_avg_price = ((asset.quantity * asset.average_price) + (quantity * price)) / new_quantity
            asset.quantity = new_quantity
            asset.average_price = new_avg_price
        
        db.commit()
        return f"Sucesso: Adicionado {quantity} de {symbol} a R$ {price} ({asset_type}) à sua carteira."
    except Exception as e:
        return f"Erro ao adicionar ativo: {str(e)}"
    finally:
        db.close()

@tool
def get_portfolio_summary():
    """Retorna um resumo de todos os ativos na carteira."""
    return "Sua carteira atual: 100 PETR4 (R$ 35,50), 0.5 BTC (R$ 350.000,00), R$ 10.000,00 Tesouro Selic."

search = DuckDuckGoSearchRun()
@tool
def investment_research_tool(query: str):
    """Pesquisa na internet sobre ativos financeiros, resultados trimestrais e notícias de mercado."""
    return search.run(query)

tools = [add_asset_tool, get_portfolio_summary, investment_research_tool]

# Initialize LLM
llm = ChatOpenAI(
    base_url=LM_STUDIO_URL,
    api_key="not-needed",
    model="gpt-oss-20b",
    temperature=0.7
)

# Initialize Agent
agent = initialize_agent(
    tools, 
    llm, 
    agent=AgentType.CHAT_CONVERSATIONAL_REACT_DESCRIPTION,
    verbose=True,
    handle_parsing_errors=True
)

app = FastAPI(title="Carteira API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Carteira API", "status": "active"}

@app.post("/ai/ask")
async def ask_ai(question: str):
    try:
        response = agent.run(input=question, chat_history=[])
        return {"answer": response}
    except Exception as e:
        return {"error": str(e)}

@app.post("/transactions/add")
async def add_transaction(symbol: str, quantity: float, price: float, type: str):
    """Manually adds a transaction to the database."""
    db = SessionLocal()
    try:
        # Update or create Asset
        asset = db.query(Asset).filter(Asset.symbol == symbol.upper()).first()
        if not asset:
            asset = Asset(symbol=symbol.upper(), quantity=quantity, average_price=price, type="stocks")
            db.add(asset)
        else:
            if type.lower() == "buy":
                new_quantity = asset.quantity + quantity
                asset.average_price = ((asset.quantity * asset.average_price) + (quantity * price)) / new_quantity
                asset.quantity = new_quantity
            else:
                asset.quantity -= quantity
        
        # Log Transaction
        transaction = Transaction(asset_id=asset.id, type=type, quantity=quantity, price=price)
        db.add(transaction)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.post("/sync")
async def sync_database(access_token: str):
    """Triggers a manual sync of the database to Google Drive."""
    db_path = "./carteira.db"
    if not os.path.exists(db_path):
        return {"error": "Banco de dados não encontrado localmente."}
    
    file_id = upload_to_drive(db_path, access_token)
    if file_id:
        return {"status": "success", "file_id": file_id}
@app.post("/brokerage/upload")
async def upload_brokerage_note(file: UploadFile = File(...)):
    """Receives a brokerage note PDF, parses it, and syncs with the database."""
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        extracted_data = parse_sinacor_pdf(temp_path)
        return {
            "status": "success",
            "message": f"Nota {file.filename} processada com sucesso.",
            "extracted_data": extracted_data
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
