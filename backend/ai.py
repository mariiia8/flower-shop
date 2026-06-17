from dotenv import load_dotenv
from openai import OpenAI
import os

# =====================
# LOAD ENV
# =====================
load_dotenv()

# =====================
# OPENROUTER
# =====================
client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

MODEL_NAME = "deepseek/deepseek-r1"

# =====================
# AI FUNCTION
# =====================
def ask_flower_ai(user_message):
    print(f"\n🤔 Вопрос: {user_message}")

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": """
Ты консультант цветочного магазина Flora.

Твои правила:
- Отвечай только на русском языке.
- Разрешённые темы: цветы, растения, букеты, уход за растениями, подарки из цветов.
- Если вопрос не связан с цветами или растениями, отвечай: "Извините, я только про цветы 🌸"
- Отвечай подробно и развёрнуто.
- Приводи примеры и рекомендации.
- Будь дружелюбным и полезным.
"""
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.8,
            max_tokens=2048
        )

        reply = response.choices[0].message.content.strip()

        if not reply:
            return "🌸 Пожалуйста, задайте вопрос о цветах"

        print(f"✅ Ответ: {reply[:100]}...")

        return reply

    except Exception as e:
        print(f"❌ OpenRouter Error: {e}")
        return "🌸 AI помощник временно недоступен"