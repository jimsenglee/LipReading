"""
Date and time utilities
Following README.txt separation of concerns
"""
from datetime import datetime
from typing import Optional


def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime to ISO string"""
    return dt.isoformat() if dt else None


def parse_datetime(date_str: str) -> Optional[datetime]:
    """Parse ISO datetime string to datetime object"""
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None
