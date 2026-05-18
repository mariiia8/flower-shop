from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
from dotenv import load_dotenv
import os

# ===================== LOAD ENV =====================
load_dotenv()

# ===================== FLASK =====================
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "*"])

# ===================== OLLAMA SETTINGS =====================
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "phi3:mini" # Можно заменить на другую модель

# ===================== AI FUNCTION =====================
def ask_flower_ai(user_message):
    print(f"\n🤔 Вопрос: {user_message}")
    
    # Специальный промпт для phi3:mini
    prompt = f"""<|system|>
Ты - консультант цветочного магазина Flora. Отвечай коротко и по делу, максимум 2-3 предложения.

Правила:
- Только русский язык
- Только про цветы, растения, букеты, уход, подарки
- Если вопрос не о цветах - скажи: "Извините, я только про цветы 🌸"
- Без лишних слов и повторов

Пример хорошего ответа на вопрос "как поливать розы":
"Розы поливают 1-2 раза в неделю под корень, лучше утром или вечером. Не лейте на листья - это вызывает грибок 🌹"
<|user|>
{user_message}
<|assistant|>
"""
    
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "phi3:mini",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,  # НИЖЕ = более точные ответы
                    "num_predict": 150,   # Короткие ответы
                    "top_p": 0.85,
                    "top_k": 30,
                    "repeat_penalty": 1.15,  # Убирает повторы
                    "stop": ["<|user|>", "<|assistant|>", "\n\n\n"]  # Стоп-слова
                }
            },
            timeout=60
        )
        
        if response.status_code == 200:
            reply = response.json().get("response", "")
            # Чистим ответ
            reply = reply.replace("Ответ:", "").replace("<|assistant|>", "").strip()
            
            # Обрезаем слишком длинные ответы
            if len(reply) > 300:
                reply = reply[:300] + "..."
            
            return reply if reply else "🌸 Пожалуйста, переформулируйте вопрос"
        else:
            return "🌸 AI помощник временно недоступен"
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return "🌸 Извините, произошла ошибка"
# ===================== ROUTES =====================
@app.route("/api/ai-chat", methods=["POST"])
def ai_chat():
    try:
        data = request.json
        if not data:
            return jsonify({"reply": "Некорректный запрос 🌸"}), 400
            
        message = data.get("message", "")
        
        if not message:
            return jsonify({"reply": "Напиши вопрос 🌸"}), 400

        print(f"\n📨 Получен запрос: {message}")
        reply = ask_flower_ai(message)
        
        return jsonify({
            "success": True,
            "reply": reply
        })

    except Exception as e:
        error_msg = str(e)
        print(f"\n💥 ОШИБКА: {error_msg}")
        return jsonify({
            "success": False,
            "reply": f"🌸 Извините, произошла ошибка: {error_msg[:100]}"
        }), 500

@app.route("/api/test", methods=["GET"])
def test():
    """Проверка статуса сервера и Ollama"""
    # Проверяем подключение к Ollama
    ollama_status = "unknown"
    try:
        test_response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": "test", "stream": False},
            timeout=5
        )
        ollama_status = "connected" if test_response.status_code == 200 else f"error_{test_response.status_code}"
    except Exception as e:
        ollama_status = f"connection_error: {str(e)[:50]}"
    
    return jsonify({
        "status": "Server is running", 
        "port": 5001,
        "ollama_status": ollama_status,
        "model": MODEL_NAME,
        "api_type": "Local Ollama (Free)"
    })

@app.route("/api/check-models", methods=["GET"])
def check_models():
    """Проверяет доступные модели в Ollama"""
    try:
        response = requests.get("http://localhost:11434/api/tags")
        if response.status_code == 200:
            models = response.json()
            return jsonify({
                "status": "✅ Ollama работает",
                "models": models.get("models", [])
            })
        else:
            return jsonify({
                "status": "❌ Ollama не отвечает",
                "error": f"HTTP {response.status_code}"
            }), 500
    except Exception as e:
        return jsonify({
            "status": "❌ Не удалось подключиться к Ollama",
            "error": str(e)
        }), 500

@app.route("/")
def home():
    return "Flora AI server with Ollama is running on port 5001 🌸"

# ===================== RUN =====================
if __name__ == "__main__":
    print("\n" + "="*50)
    print("🌸 ЗАПУСК FLORA AI СЕРВЕРА (OLLAMA) 🌸")
    print("="*50)
    print(f"📡 API: http://localhost:5001")
    print(f"🤖 Модель: {MODEL_NAME}")
    print(f"🔗 Ollama URL: {OLLAMA_URL}")
    print("="*50 + "\n")
    
    # Проверяем, запущен ли Ollama перед стартом
    try:
        test_ollama = requests.get("http://localhost:11434/api/tags", timeout=2)
        print("✅ Ollama обнаружен и работает!")
    except:
        print("⚠️ ВНИМАНИЕ: Ollama не запущен!")
        print("   Откройте новый терминал и выполните: ollama serve")
        print("   Затем перезапустите этот сервер\n")
    
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )