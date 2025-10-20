# How to Start the Application

## Prerequisites
- Python 3.8+ installed
- Node.js installed
- MySQL running on localhost:3306 with credentials: root/root
- Database `my_fyp_database` created

## Step 1: Start the Backend (Flask API)

Open a terminal and run:

```bash
cd backend
python run.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
```

If you see database connection errors, make sure MySQL is running and the database exists.

## Step 2: Start the Frontend (React)

Open **another terminal** and run:

```bash
npm run dev
```

You should see:
```
VITE v5.4.20  ready in XXX ms
➜  Local:   http://localhost:8080/
```

## Step 3: Access the Application

Open your browser and go to:
```
http://localhost:8080
```

## Troubleshooting

### Backend won't start
- Make sure MySQL is running
- Check if port 5000 is available
- Verify Python dependencies are installed: `pip install -r requirements.txt`

### Frontend shows "Error Loading Content"
- Make sure the Flask backend is running on http://127.0.0.1:5000
- Check the browser console for specific error messages
- The red error banner will show if the backend is not reachable

### Database errors
- Make sure MySQL is running
- Create the database: `CREATE DATABASE my_fyp_database;`
- Run migrations: `cd backend && flask db upgrade`
- Seed the database: `cd backend && python seed.py`

