from correpy.parsers.brokerage_notes.parser_factory import ParserFactory
from correpy.domain.entities.brokerage_note import BrokerageNote
from typing import List

def parse_sinacor_pdf(file_path: str) -> List[dict]:
    """Parses a Sinacor PDF brokerage note and returns a list of transactions."""
    with open(file_path, "rb") as f:
        parser = ParserFactory.create_parser(f)
        notes: List[BrokerageNote] = parser.parse()
        
    transactions = []
    for note in notes:
        for transaction in note.transactions:
            transactions.append({
                "symbol": transaction.security.ticker,
                "quantity": float(transaction.amount),
                "price": float(transaction.unit_price),
                "type": transaction.transaction_type.name, # BUY or SELL
                "date": note.reference_date.isoformat()
            })
    return transactions
