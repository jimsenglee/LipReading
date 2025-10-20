from datetime import datetime
import sqlalchemy as sa
import sqlalchemy.orm as so

from ..extensions import db


class Report(db.Model):
    __tablename__ = 'reports'

    id: so.Mapped[int] = so.mapped_column(primary_key=True, autoincrement=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True, index=True)
    report_type: so.Mapped[str] = so.mapped_column(sa.String(50), nullable=False)
    generated_date: so.Mapped[datetime] = so.mapped_column(sa.DateTime(), nullable=False, default=datetime.utcnow)
    data_json: so.Mapped[str | None] = so.mapped_column(sa.Text())

    def __repr__(self) -> str:
        return f"<Report {self.report_type}>"


