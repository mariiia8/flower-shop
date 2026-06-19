from dotenv import load_dotenv
from openai import OpenAI
import os
import random
import requests

load_dotenv()

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
    "как поливать гортензию": "Гортензию поливают 2-3 раза в неделю, обильно. Она любит влагу 💧",
    "как поливать фикус": "Фикус поливают раз в 5-7 дней, когда земля просохнет 🌿",
    "как ухаживать за розами": "Розы любят солнце, полив под корень и обрезку сухих листьев 🌹",
    "как ухаживать за гортензией": "Гортензия любит полутень, обильный полив и кислую почву 💙",
    "как ухаживать за фикусом": "Фикус ставьте на свет без сквозняков, опрыскивайте листья 🌿",
    "какой срез нужен для роз": "Обновите срез стеблей под водой под углом 45 градусов 🌹",
    "как сохранить свежесть цветов": "Обновите срез, добавьте сахар в воду, меняйте воду каждый день 💐",
}

# =====================
# ПОЛУЧЕНИЕ КАТАЛОГА
# =====================
def get_catalog():
    """Получает список товаров из базы данных"""
    try:
        response = requests.get('http://localhost:5000/api/flowers', timeout=2)
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []

def get_catalog_text():
    """Возвращает текстовое описание каталога"""
    catalog = get_catalog()
    if not catalog:
        return "Каталог временно недоступен 🌸"
    
    # Группируем по категориям
    categories = {}
    for item in catalog:
        cat = item.get('category', 'other')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item['name'])
    
    # Формируем текст
    text = "В нашем магазине есть:\n"
    for cat, items in categories.items():
        cat_names = {
            'bouquet': '💐 Букеты',
            'plant': '🌿 Растения для дома',
            'gift': '🎁 Подарки'
        }.get(cat, cat)
        text += f"\n{cat_names}: {', '.join(items)}"
    
    return text

# =====================
# ВЕСЁЛЫЕ ФРАЗЫ
# =====================
GREETINGS = [
    "Здравствуйте! Чем могу помочь? 🌸",
    "Привет! Я — Flora AI, ваш помощник в мире цветов 🌸",
]

CREATOR_RESPONSES = [
    "Меня создала Мария Сидорова.",
    "Мария Сидорова — вот кто мой разработчик.",
]

# =====================
# AI FUNCTION
# =====================
def ask_flower_ai(user_message):
    user_lower = user_message.lower()
    print(f"\n🤔 Вопрос: {user_message}")
    
    # Приветствия
    if any(word in user_lower for word in ['привет', 'здравствуйте', 'добрый день', 'как дела']):
        return random.choice(GREETINGS)
    
    # Кто создал
    if any(word in user_lower for word in ['кто тебя создал', 'кто тебя разработал', 'твой создатель']):
        return random.choice(CREATOR_RESPONSES)
    
    # Вопросы про каталог
    if any(word in user_lower for word in ['каталог', 'что есть', 'какие цветы', 'что в магазине', 'ассортимент']):
        return get_catalog_text()
    
    # Поиск конкретного товара
    catalog = get_catalog()
    if catalog:
        for item in catalog:
            if item['name'].lower() in user_lower:
                return f"🌺 {item['name']} — {item['description']} Цена: {item['price'] * 90} ₽"
    
    # Поиск в базе знаний
    for question, answer in KNOWLEDGE_BASE.items():
        if question in user_lower:
            return answer
    
    # Groq
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system", 
                    "content": """
Ты — Flora AI. Весёлый помощник по цветам и подаркам.

ПРАВИЛА:
- Отвечай кратко (1-2 предложения).
- Если вопрос про цветы/растения — дай полезный совет.
- Если спрашивают про каталог — опиши ассортимент.
"""
                },
                {
                    "role": "user", 
                    "content": user_message
                }
            ],
            temperature=0.7,
            max_tokens=80
        )
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return "Ой, что-то я завис!"