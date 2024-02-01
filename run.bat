@echo off
start cmd /k "cd frontend && npm run start"
start cmd /k "cd backend/src && python main.py"
