.PHONY: start stop restart status logs install clean

VENV_PYTHON := $(HOME)/flower-shop/backend/venv/bin/python

start:
	@echo "🚀 Запуск серверов..."
	@cd backend && $(VENV_PYTHON) app.py > /tmp/backend.log 2>&1 &
	@cd backend && $(VENV_PYTHON) ai.py > /tmp/ai.log 2>&1 &
	@cd frontend && python3 -m http.server 5500 > /tmp/frontend.log 2>&1 &
	@sleep 2
	@echo "✅ Серверы запущены: http://localhost:5500"

stop:
	@echo "🛑 Остановка серверов..."
	@-killall python3 2>/dev/null || true
	@-pkill -f "python.*app.py" 2>/dev/null || true
	@-pkill -f "python.*ai.py" 2>/dev/null || true
	@-pkill -f "http.server 5500" 2>/dev/null || true
	@-fuser -k 5000/tcp 2>/dev/null || true
	@-fuser -k 5001/tcp 2>/dev/null || true
	@-fuser -k 5500/tcp 2>/dev/null || true
	@echo "✅ Серверы остановлены"

restart: stop
	@sleep 2
	@$(MAKE) start

status:
	@echo "📊 Статус серверов:"
	@-lsof -i:5000 > /dev/null && echo "✅ Бэкенд (5000): работает" || echo "❌ Бэкенд (5000): не работает"
	@-lsof -i:5001 > /dev/null && echo "✅ AI (5001): работает" || echo "❌ AI (5001): не работает"
	@-lsof -i:5500 > /dev/null && echo "✅ Фронтенд (5500): работает" || echo "❌ Фронтенд (5500): не работает"

logs:
	@echo "=== Бэкенд ==="
	@tail -20 /tmp/backend.log 2>/dev/null || echo "Нет логов"
	@echo ""
	@echo "=== AI ==="
	@tail -20 /tmp/ai.log 2>/dev/null || echo "Нет логов"
	@echo ""
	@echo "=== Фронтенд ==="
	@tail -20 /tmp/frontend.log 2>/dev/null || echo "Нет логов"

install:
	@cd backend && python3 -m venv venv
	@cd backend && ./venv/bin/pip install flask flask-cors openai python-dotenv requests google-generativeai gunicorn

clean:
	@rm -f /tmp/backend.log /tmp/ai.log /tmp/frontend.log
	@echo "🧹 Логи очищены"