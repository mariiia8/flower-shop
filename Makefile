.PHONY: start stop restart status logs install clean

VENV_PYTHON := $(HOME)/flower-shop/backend/venv/bin/python

start:
	@cd backend && $(VENV_PYTHON) app.py > /tmp/backend.log 2>&1 &
	@cd backend && $(VENV_PYTHON) ai.py > /tmp/ai.log 2>&1 &
	@cd frontend && python3 -m http.server 5500 > /tmp/frontend.log 2>&1 &
	@echo "Серверы запущены: http://localhost:5500"

stop:
	@pkill -f "python.*app.py" 2>/dev/null || true
	@pkill -f "python.*ai.py" 2>/dev/null || true
	@pkill -f "http.server 5500" 2>/dev/null || true
	@echo "Серверы остановлены"

restart: stop start

status:
	@lsof -i:5000 > /dev/null && echo "Бэкенд: работает" || echo "Бэкенд: не работает"
	@lsof -i:5001 > /dev/null && echo "AI: работает" || echo "AI: не работает"
	@lsof -i:5500 > /dev/null && echo "Фронтенд: работает" || echo "Фронтенд: не работает"

logs:
	@tail -20 /tmp/backend.log 2>/dev/null || echo "Нет логов бэкенда"
	@tail -20 /tmp/ai.log 2>/dev/null || echo "Нет логов AI"
	@tail -20 /tmp/frontend.log 2>/dev/null || echo "Нет логов фронтенда"

install:
	@cd backend && python3 -m venv venv
	@cd backend && ./venv/bin/pip install flask flask-cors openai python-dotenv requests google-generativeai

clean:
	@rm -f /tmp/backend.log /tmp/ai.log /tmp/frontend.log