from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Review(db.Model):
    __tablename__ = 'reviews'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)

    # The author of the review (Account.id)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'), nullable=False, index=True)

    # Polymorphic target: 'tutorial' or 'quiz'
    target_type: so.Mapped[str] = so.mapped_column(sa.String(20), nullable=False, index=True)
    target_id: so.Mapped[int] = so.mapped_column(nullable=False, index=True)

    rating: so.Mapped[int] = so.mapped_column(sa.Integer, nullable=False)
    review_text: so.Mapped[str | None] = so.mapped_column(sa.Text())
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow)
    updated_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        sa.UniqueConstraint('user_id', 'target_type', 'target_id', name='uq_review_user_target'),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name='ck_review_rating_range'),
    )

    def __repr__(self) -> str:
        return f"<Review {self.public_id} {self.target_type}:{self.target_id} rating={self.rating}>"


