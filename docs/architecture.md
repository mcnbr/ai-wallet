# System Architecture - Carteira

## Overview
Carteira is a full-stack investment tracking platform designed for the Brazilian and global markets.

## Data Model
### Asset Classes
- **Stocks (BR/US)**: Ticker, Name, Quantity, Average Price, Currency.
- **Crypto**: Symbol, Name, Quantity, Average Price, Exchange.
- **FIIs**: Ticker, Quantity, Average Price.
- **Fixed Income (Tesouro Direto, CDB, etc.)**: Issuer, Rate, Maturity Date, Amount.

### Entity Relationship
- `User`: Profile and authentication.
- `Asset`: Base class for all investment types.
- `Transaction`: Buy/Sell/Dividend records.
- `MarketData`: Cache for real-time and historical prices.

## API Integration Workflow
1. User adds an asset.
2. Backend validates via `yfinance` or `CoinGecko`.
3. Worker (Celery/Cron) updates prices periodically.
4. Frontend fetches data via FastAPI endpoints (JWT Auth).
