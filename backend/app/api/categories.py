from flask import jsonify, current_app
import sqlalchemy as sa

from ..extensions import db
from ..models import Category
from . import bp


@bp.get('/categories')
def list_categories():
    # exclude deleted records by default
    rows = db.session.scalars(sa.select(Category).where(Category.status != 'deleted').order_by(Category.category_name)).all()
    return jsonify([
        {
            'id': c.id,
            'publicId': c.public_id,
            'name': c.category_name,
        }
        for c in rows
    ])


@bp.delete('/categories/<int:category_id>')
def delete_category(category_id: int):
    try:
        category = db.session.scalar(
            sa.select(Category).where(Category.id == category_id)
        )
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # soft delete category (change status to deleted)
        category.status = 'deleted'
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'})
        
    except Exception as e:
        current_app.logger.error(f"Error deleting category {category_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete category'}), 500


