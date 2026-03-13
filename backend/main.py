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
try:
    from langchain_classic.agents import AgentType, initialize_agent
except ImportError:
    from langchain.agents import AgentType, initialize_agent

# Drive Sync
from drive_sync import upload_to_drive
from pdf_parser import parse_sinacor_pdf
from fastapi import UploadFile, File
import shutil

load_dotenv()

# Configuration
LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://127.0.0.1:1234/v1")
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
    category = Column(String, default="stocks") # stocks, crypto, fii, fixed_income

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    type = Column(String) # buy, sell
    quantity = Column(Float)
    price = Column(Float)
    fees = Column(Float, default=0.0)
    category = Column(String, default="stocks")
    date = Column(DateTime, default=datetime.datetime.utcnow)

# Additional Imports for Analysis
import yfinance as yf
import pandas as pd

# AI Tools
@tool
def get_stock_price(ticker: str) -> str:
    """Obtém o preço atual e dados básicos de uma ação na B3 (use o sufixo .SA, ex: PETR4.SA) ou EUA."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 'N/A'))
        return f"Preço de {ticker}: R$ {current_price} (Setor: {info.get('sector', 'N/A')})"
    except Exception as e:
        return f"Erro ao buscar preço de {ticker}: {str(e)}"

@tool
def get_technical_indicators(ticker: str) -> str:
    """Calcula indicadores técnicos básicos (SMA 20, SMA 50) para uma ação."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="3mo")
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        
        last_close = hist['Close'].iloc[-1]
        sma_20 = hist['SMA_20'].iloc[-1]
        sma_50 = hist['SMA_50'].iloc[-1]
        
        trend = "Bullish" if last_close > sma_20 and sma_20 > sma_50 else "Bearish" if last_close < sma_20 and sma_20 < sma_50 else "Neutral"
        return f"{ticker} Análise Técnica: Fechamento={last_close:.2f}, SMA20={sma_20:.2f}, SMA50={sma_50:.2f}. Tendência: {trend}"
    except Exception as e:
        return f"Erro ao calcular indicadores para {ticker}: {str(e)}"

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

tools = [add_asset_tool, get_portfolio_summary, get_stock_price, get_technical_indicators]

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
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
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
async def ask_ai(question: str, base_url: str = None):
    try:
        # Use provided base_url or fallback to default
        target_url = base_url or LM_STUDIO_URL
        
        # Initialize LLM locally for this request to ensure the correct base_url is used
        current_llm = ChatOpenAI(
            base_url=target_url,
            api_key="not-needed",
            model="gpt-oss-20b",
            temperature=0.7
        )
        
        # Initialize Agent
        current_agent = initialize_agent(
            tools, 
            current_llm, 
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            handle_parsing_errors=True
        )
        
        response = current_agent.run(input=question, chat_history=[])
        return {"answer": response}
    except Exception as e:
        return {"error": str(e)}

@app.post("/transactions/add")
async def add_transaction(symbol: str, quantity: float, price: float, type: str, category: str = "stocks", date: str = None, fees: float = 0.0):
    """Manually adds a transaction to the database."""
    db = SessionLocal()
    try:
        # Parse date if provided
        tx_date = datetime.datetime.utcnow()
        if date:
            try:
                tx_date = datetime.datetime.fromisoformat(date)
            except ValueError:
                pass

        # Update or create Asset
        asset = db.query(Asset).filter(Asset.symbol == symbol.upper()).first()
        if not asset:
            asset = Asset(symbol=symbol.upper(), quantity=quantity, average_price=price, category=category)
            db.add(asset)
        else:
            asset.category = category # Update category if it changed
            if type.lower() == "buy":
                new_quantity = asset.quantity + quantity
                # Net price including fees for average price calculation
                total_cost = (asset.quantity * asset.average_price) + (quantity * price) + fees
                asset.average_price = total_cost / new_quantity
                asset.quantity = new_quantity
            else:
                asset.quantity -= quantity
        
        # Log Transaction
        transaction = Transaction(asset_id=asset.id, type=type, quantity=quantity, price=price, fees=fees, category=category, date=tx_date)
        db.add(transaction)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.get("/api/stock/validate")
async def validate_stock(symbol: str):
    """Verifica se um ticker existe e retorna o nome da empresa correspondente."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        if 'shortName' in info or 'longName' in info:
            name = info.get('shortName', info.get('longName', symbol))
            return {"valid": True, "symbol": symbol, "name": name, "currency": info.get('currency', 'BRL')}
        return {"valid": False, "error": "Ticker não encontrado."}
    except Exception as e:
        return {"valid": False, "error": str(e)}

@app.get("/api/stock/historical")
async def get_historical_price(symbol: str, date: str):
    """Retorna o preço de fechamento ajustado de um ativo em uma data específica."""
    try:
        # Tenta pegar um intervalo curto que inclua a data
        target_date = datetime.datetime.strptime(date, "%Y-%m-%d")
        end_date = target_date + datetime.timedelta(days=5) # Margem para fds/feriado
        
        ticker = yf.Ticker(symbol)
        history = ticker.history(start=target_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"))
        
        if not history.empty:
            closing_price = float(history['Close'].iloc[0])
            actual_date = history.index[0].strftime("%Y-%m-%d")
            return {"symbol": symbol, "price": closing_price, "date": actual_date}
        else:
            return {"error": "Cotação não encontrada para esta data."}
    except Exception as e:
        return {"error": str(e)}

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
