"""
ID generation utilities
Following README.txt separation of concerns
"""
from datetime import datetime
import sqlalchemy as sa
from ..extensions import db


def generate_public_id(model_class, prefix: str):
    """
    Generate sequential public ID following seed.py pattern
    Example: TUT-20250101-0001, CAT-20250101-0001
    """
    # Get the highest existing ID to determine next sequential number
    max_id = db.session.scalar(sa.select(sa.func.max(model_class.id)))
    next_id = (max_id or 0) + 1
    
    # Format: PREFIX-YYYYMMDD-NNNN
    date_str = datetime.now().strftime('%Y%m%d')
    return f"{prefix}-{date_str}-{next_id:04d}"
