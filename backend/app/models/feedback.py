from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Feedback(db.Model):
    __tablename__ = 'feedback'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    submitted_by_user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('users.id'), nullable=False, index=True)
    feedback_type: so.Mapped[str] = so.mapped_column(sa.String(50), nullable=False)
    description: so.Mapped[str] = so.mapped_column(sa.Text(), nullable=False)
    attached_file_path: so.Mapped[str | None] = so.mapped_column(sa.String(255))
    submission_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    status: so.Mapped[str] = so.mapped_column(sa.String(50), nullable=False, default='New')
    reviewed_by_admin_id: so.Mapped[int | None] = so.mapped_column(sa.ForeignKey('accounts.id'))

    def __repr__(self) -> str:
        return f"<Feedback {self.public_id} type={self.feedback_type}>"


