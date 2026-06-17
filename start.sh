#!/bin/bash

echo "🚀 Запуск Flora Shop на Railway..."

# Устанавливаем зависимости Python
cd backend
pip install --upgrade pip
pip install -r requirements.txt
pip install flask flask-cors openai python-dotenv requests google-generativeai

# Запускаем бэкенд в фоне
python3 app.py &
BACKEND_PID=$!

# Запускаем AI сервер в фоне
python3 ai.py &
AI_PID=$!

# Возвращаемся и запускаем фронтенд
cd ..
cd frontend
python3 -m http.server $PORT &

# Ждем завершения
wait $BACKEND_PID $AI_PID