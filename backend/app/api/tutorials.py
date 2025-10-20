from flask import jsonify, request
import sqlalchemy as sa

from ..extensions import db
from ..models import Tutorial
from . import bp


@bp.get('/tutorials')
def list_tutorials():
    category_id = request.args.get('categoryId', type=int)
    stmt = sa.select(Tutorial)
    if category_id:
        stmt = stmt.where(Tutorial.category_id == category_id)
    stmt = stmt.order_by(Tutorial.title)
    rows = db.session.scalars(stmt).all()
    return jsonify([
        {
            'id': t.id,
            'publicId': t.public_id,
            'categoryId': t.category_id,
            'title': t.title,
            'description': t.description,
            'videoPath': t.video_path,
        }
        for t in rows
    ])


