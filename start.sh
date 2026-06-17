#!/bin/bash

# Переходим в папку с бэкендом и запускаем его в фоне
cd backend
python3 app.py &
BACKEND_PID=$!

# Запускаем AI сервер в фоне
python3 ai.py &
AI_PID=$!

# Возвращаемся в корень и запускаем фронтенд
cd ..
cd frontend
python3 -m http.server 5500

# Ожидаем завершения всех процессов (это нужно, чтобы контейнер не завершился сразу)
wait $BACKEND_PID $AI_PID