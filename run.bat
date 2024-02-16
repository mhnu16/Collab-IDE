@echo off
cd frontend && npm run build && cd ../backend/src && python main.py