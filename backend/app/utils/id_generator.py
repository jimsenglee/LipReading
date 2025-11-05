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
    # Get the highest existing public_id for this prefix to determine next sequential number
    # Query for public_ids starting with the prefix
    date_str = datetime.now().strftime('%Y%m%d')
    prefix_pattern = f"{prefix}-{date_str}-%"
    
    max_public_id = db.session.scalar(
        sa.select(sa.func.max(model_class.public_id))
        .where(model_class.public_id.like(prefix_pattern))
    )
    
    if max_public_id:
        # Extract the number part and increment
        last_num = int(max_public_id.split('-')[-1])
        next_id = last_num + 1
    else:
        next_id = 1
    
    # Format: PREFIX-YYYYMMDD-NNNN
    return f"{prefix}-{date_str}-{next_id:04d}"
