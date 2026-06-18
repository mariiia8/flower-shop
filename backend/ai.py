from dotenv import load_dotenv
from openai import OpenAI
import os
from turboquant_db import TurboQuantDB
from sentence_transformers import SentenceTransformer

load_dotenv()

# =====================
# GROQ CLIENT
# =====================
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

MODEL_NAME = "llama-3.1-8b-instant"

# =====================
# БАЗА ЗНАНИЙ
# =====================
KNOWLEDGE_BASE = {
    "как поливать розы": "Розы поливают 1-2 раза в неделю под корень, утром или вечером 🌹",
    "как поливать ромашки": "Ромашки поливают 2-3 раза в неделю, когда подсохнет верхний слой 🌼",
    "как ухаживать за фикусом": "Фикус ставьте на свет без сквозняков, опрыскивайте листья 🌿",
    "какие цветы дарят на 8 марта": "На 8 марта дарят тюльпаны, мимозу, розы и ирисы 🌷",
    "как выбрать букет для девушки": "Розы или пионы — универсальный выбор 💕",
    "какой подарок выбрать для мамы": "Цветы, тёплый плед или книга — от души 💐",
    "как ухаживать за монстерой": "Монстере нужна опора и влажность, протирайте листья 🌱",
    "какие растения очищают воздух": "Хлорофитум, сансевиерия, спатифиллум, алоэ 🌿",
}

# =====================
# ИНИЦИАЛИЗАЦИЯ TURBOQUANT-DB
# =====================
print("🔄 Загрузка модели эмбеддингов...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Модель загружена")

# Создаём базу данных
db = TurboQuantDB(
    model=embedder,           # модель для векторизации
    distance="cosine",        # метрика сходства
    quant_type="float16"      # сжатие в 2 раза (экономия памяти)
)

# Добавляем вопросы в базу
questions = list(KNOWLEDGE_BASE.keys())
answers = list(KNOWLEDGE_BASE.values())

print(f"🔄 Добавление {len(questions)} вопросов в базу...")
db.add_texts(questions, metadatas=[{"answer": a} for a in answers])
print("✅ База знаний готова!")

# =====================
# AI FUNCTION
# =====================
def ask_flower_ai(user_message):
    user_lower = user_message.lower()
    print(f"\n🤔 Вопрос: {user_message}")
    
    # Приветствия
    if any(word in user_lower for word in ['привет', 'здравствуйте', 'добрый день', 'как дела']):
        return "Здравствуйте! Чем могу помочь? 🌸"
    
    if 'кто ты' in user_lower:
        return "Я — Flora AI. Помогаю с цветами, растениями и подарками 🌸"
    
    # Поиск в TurboQuant-DB
    try:
        results = db.search(user_message, top_k=1)
        if results and results[0]['score'] > 0.6:
            print(f"📖 Найден ответ с уверенностью: {results[0]['score']:.3f}")
            return results[0]['metadata']['answer']
        else:
            print(f"ℹ️ Уверенность слишком низкая ({results[0]['score']:.3f} если есть)")
    except Exception as e:
        print(f"⚠️ Ошибка в БД: {e}")
    
    # Если не нашли — Groq
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Ты универсальный помощник. Отвечай кратко, 1-2 предложения."},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,
            max_tokens=60
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Error: {e}")
        return "🌸 Извините, я временно недоступен"