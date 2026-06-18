from dotenv import load_dotenv
from openai import OpenAI
import os
import random

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

MODEL_NAME = "llama-3.1-8b-instant"

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

GREETINGS = [
    "Здравствуйте! Чем могу помочь? 🌸",
    "Привет! Я — Flora AI, ваш помощник 🌸",
]

def ask_flower_ai(user_message):
    user_lower = user_message.lower()
    print(f"\n🤔 Вопрос: {user_message}")
    
    if any(word in user_lower for word in ['привет', 'здравствуйте', 'добрый день', 'как дела']):
        return random.choice(GREETINGS)
    
    if 'кто ты' in user_lower:
        return "Я — Flora AI. Помогаю с цветами, растениями и подарками 🌸"
    
    # Поиск в базе знаний
    for question, answer in KNOWLEDGE_BASE.items():
        if question in user_lower:
            return answer
    
    # Поиск по ключевым словам
    user_words = set(user_lower.split())
    best_match = None
    best_score = 0
    
    for question, answer in KNOWLEDGE_BASE.items():
        q_words = set(question.split())
        common = user_words & q_words
        score = len(common) / len(q_words) if q_words else 0
        if score > best_score:
            best_score = score
            best_match = answer
    
    if best_match and best_score > 0.3:
        return best_match
    
    # Groq
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Ты помощник. Отвечай кратко, 1-2 предложения."},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,
            max_tokens=60
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Error: {e}")
        return "🌸 Извините, я временно недоступен"