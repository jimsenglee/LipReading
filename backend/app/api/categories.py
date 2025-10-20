from flask import jsonify
import sqlalchemy as sa

from ..extensions import db
from ..models import Category
from . import bp


@bp.get('/categories')
def list_categories():
    rows = db.session.scalars(sa.select(Category).order_by(Category.category_name)).all()
    return jsonify([
        {
            'id': c.id,
            'publicId': c.public_id,
            'name': c.category_name,
        }
        for c in rows
    ])


