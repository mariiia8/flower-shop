.PHONY: start stop restart status logs install clean

# Путь к Python в виртуальном окружении
VENV_PYTHON := $(HOME)/flower-shop/backend/venv/bin/python

# Запуск всех серверов
start:
	@echo "🌸 Запуск Flora Shop..."
	@if [ ! -f $(VENV_PYTHON) ]; then \
		echo "⚠️  Виртуальное окружение не найдено!"; \
		echo "📦 Установите зависимости: make install"; \
		exit 1; \
	fi
	@echo "🐍 Используется: $(VENV_PYTHON)"
	@echo "📡 Запуск бэкенда (порт 5000)..."
	@cd backend && $(VENV_PYTHON) app.py > /tmp/backend.log 2>&1 &
	@sleep 2
	@echo "🤖 Запуск AI сервера (порт 5001)..."
	@cd backend && $(VENV_PYTHON) ai.py > /tmp/ai.log 2>&1 &
	@sleep 2
	@echo "🎨 Запуск фронтенда (порт 5500)..."
	@cd frontend && python3 -m http.server 5500 > /tmp/frontend.log 2>&1 &
	@sleep 2
	@echo "========================================="
	@echo "✅ Все серверы запущены!"
	@echo "📱 Сайт:  http://localhost:5500"
	@echo "🔧 API:  http://localhost:5000"
	@echo "🤖 AI:   http://localhost:5001"
	@echo "========================================="
	@echo "🛑 Остановка: make stop"
	@echo "📝 Логи: make logs"

# Установка зависимостей (исправленная версия)
install:
	@echo "📦 Установка зависимостей..."
	@if [ ! -d backend/venv ]; then \
		echo "📁 Создание виртуального окружения..."; \
		cd backend && python3 -m venv venv; \
	fi
	@echo "Установка Python пакетов..."
	@cd backend && ./venv/bin/pip install --upgrade pip
	@cd backend && ./venv/bin/pip install flask flask-cors openai python-dotenv requests google-generativeai
	@echo "✅ Зависимости установлены!"
	@echo "🚀 Теперь запускайте: make start"

# Быстрая установка (если venv уже есть)
install-fast:
	@echo "📦 Быстрая установка/обновление пакетов..."
	@cd backend && ./venv/bin/pip install --upgrade flask flask-cors openai python-dotenv requests google-generativeai
	@echo "✅ Готово!"

# Остановка серверов
stop:
	@echo "Остановка серверов..."
	@-pkill -f "python.*app.py" 2>/dev/null || true
	@-pkill -f "python.*ai.py" 2>/dev/null || true
	@-pkill -f "http.server 5500" 2>/dev/null || true
	@-fuser -k 5000/tcp 2>/dev/null || true
	@-fuser -k 5001/tcp 2>/dev/null || true
	@-fuser -k 5500/tcp 2>/dev/null || true
	@echo "Серверы остановлены"

# Перезапуск
restart: stop
	@sleep 2
	@$(MAKE) start

# Статус
status:
	@echo "========================================="
	@echo "📊 СТАТУС СЕРВЕРОВ"
	@echo "========================================="
	@-lsof -i:5000 > /dev/null && echo "Бэкенд (5000) - РАБОТАЕТ" || echo "Бэкенд (5000) - НЕ РАБОТАЕТ"
	@-lsof -i:5001 > /dev/null && echo "AI сервер (5001) - РАБОТАЕТ" || echo "AI сервер (5001) - НЕ РАБОТАЕТ"
	@-lsof -i:5500 > /dev/null && echo "Фронтенд (5500) - РАБОТАЕТ" || echo "Фронтенд (5500) - НЕ РАБОТАЕТ"
	@echo "========================================="

# Просмотр логов
logs:
	@echo "=== Бэкенд (последние 20 строк) ==="
	@tail -20 /tmp/backend.log 2>/dev/null || echo "Нет логов"
	@echo ""
	@echo "=== AI сервер (последние 20 строк) ==="
	@tail -20 /tmp/ai.log 2>/dev/null || echo "Нет логов"
	@echo ""
	@echo "=== Фронтенд (последние 20 строк) ==="
	@tail -20 /tmp/frontend.log 2>/dev/null || echo "Нет логов"

# Очистка
clean:
	@echo "Очистка логов и временных файлов..."
	@rm -f /tmp/backend.log /tmp/ai.log /tmp/frontend.log
	@echo "Очищено"

# Помощь
help:
	@echo "========================================="
	@echo "🌸 Flora Shop - Доступные команды"
	@echo "========================================="
	@echo "make start      - Запустить все серверы"
	@echo "make stop       - Остановить все серверы"
	@echo "make restart    - Перезапустить серверы"
	@echo "make status     - Проверить статус"
	@echo "make logs       - Показать логи"
	@echo "make install    - Установить зависимости"
	@echo "make clean      - Очистить логи"
	@echo "========================================="