# backend setup

## prerequisites
- python 3.11+
- mysql server running and reachable

## environment
create a `.env` or set env vars in your shell:

```
MYSQL_USER=youruser
MYSQL_PASSWORD=yourpass
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DB=lip_reading
SECRET_KEY=change-me
```

`.flaskenv` is provided so `flask` cli can find the app and enable debug.

## install
```
python -m venv .venv
. .venv/Scripts/activate  # on windows powershell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## migrations
```
flask db init
flask db migrate -m "initial schema"
flask db upgrade
```

## seeding (optional)
- place csv files in `backend/seed_data/`: `categories.csv`, `tutorials.csv`, `quizzes.csv`, `quiz_questions.csv`
- run: `python seed.py`

## running
```
flask run
```
