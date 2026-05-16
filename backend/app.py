from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Flower, Order, Favorite
import json

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# =========================
# 📦 СОЗДАНИЕ БАЗЫ + ДАННЫЕ
# =========================
with app.app_context():
    db.create_all()

    if Flower.query.count() == 0:

        flowers_data = [

            # === БУКЕТЫ ===
            Flower(
                name="Нежные пионы",
                price=45,
                category="bouquet",
                description="Розовые пионы для особого дня",
                image_url="https://i.pinimg.com/736x/fa/a9/04/faa9047c5b91df074ebc552a74d455d5.jpg"
            ),
            Flower(
                name="Классические розы",
                price=38,
                category="bouquet",
                description="Бордовые розы для признания",
                image_url="https://i.pinimg.com/1200x/5f/d3/1e/5fd31ede61a822f34676600342eb5011.jpg"
            ),
            Flower(
                name="Весенние тюльпаны",
                price=28,
                category="bouquet",
                description="Яркие тюльпаны из Голландии",
                image_url="https://i.pinimg.com/736x/59/32/a0/5932a08a0b0aad8e6eb1b7cc35335a05.jpg"
            ),
            Flower(
                name="Эвкалипт",
                price=32,
                category="bouquet",
                description="Свежий минималистичный букет с эвкалиптом",
                image_url="https://i.pinimg.com/736x/5e/e3/3f/5ee33f2262303ea9b0c21a26ba7401a1.jpg"
            ),
            Flower(
                name="Гортензия",
                price=48,
                category="bouquet",
                description="Пышная гортензия нежного оттенка",
                image_url="https://i.pinimg.com/1200x/de/7a/e4/de7ae4e1b621896abdcd51fdfe375bd2.jpg"
            ),
            Flower(
                name="Ромашки",
                price=25,
                category="bouquet",
                description="Полевые ромашки — простота и нежность",
                image_url="https://i.pinimg.com/1200x/43/16/d8/4316d815122746fbf0881e029cdec0ea.jpg"
            ),
            Flower(
                name="Букет лилий",
                price=42,
                category="bouquet",
                description="Элегантный букет белых лилий",
                image_url="https://i.pinimg.com/1200x/25/c6/d5/25c6d59aef614abc47257facada02ed4.jpg"
            ),
            Flower(
                name="Букет подсолнухов",
                price=35,
                category="bouquet",
                description="Солнечный букет подсолнухов",
                image_url="https://i.pinimg.com/736x/46/66/12/4666125dbe2b2a3f7bb18bd667a41fc1.jpg"
            ),

            # === РАСТЕНИЯ ===
            Flower(
                name="Монстера",
                price=55,
                category="plant",
                description="Крупное растение для интерьера",
                image_url="https://i.pinimg.com/736x/c9/34/a5/c934a5fc5e823a18680b59bb843b8a2f.jpg"
            ),
            Flower(
                name="Сансевиерия",
                price=25,
                category="plant",
                description="Неприхотливое растение",
                image_url="https://i.pinimg.com/736x/eb/3e/89/eb3e8943b307340ee416491835829eda.jpg"
            ),
            Flower(
                name="Фикус Бенджамина",
                price=42,
                category="plant",
                description="Изящное дерево для интерьера",
                image_url="https://i.pinimg.com/1200x/4f/40/8b/4f408bd02f0bc4aa5db2ec8999da329c.jpg"
            ),
            Flower(
                name="Спатифиллум",
                price=32,
                category="plant",
                description="Женское счастье",
                image_url="https://i.pinimg.com/1200x/d9/c1/b6/d9c1b68bc196475247f69be8312e448c.jpg"
            ),
            Flower(
                name="Фиалка",
                price=18,
                category="plant",
                description="Миниатюрное цветущее растение",
                image_url="https://i.pinimg.com/1200x/de/5d/53/de5d53c77d994405870b3136b4de4af2.jpg"
            ),
            Flower(
                name="Антуриум",
                price=38,
                category="plant",
                description="Тропический цветок",
                image_url="https://i.pinimg.com/736x/2c/f7/4b/2cf74b234d6e3be8925fe961117635c2.jpg"
            ),
            Flower(
                name="Замиокулькас",
                price=35,
                category="plant",
                description="Долларовое дерево",
                image_url="https://i.pinimg.com/736x/00/64/c5/0064c530e1ca191a49c3a08144f9e4b3.jpg"
            ),
            Flower(
                name="Алоэ вера",
                price=22,
                category="plant",
                description="Лечебное растение",
                image_url="https://i.pinimg.com/736x/ee/4e/dc/ee4edc3327ece61ebdab88f5b82b6174.jpg"
            ),

            # === ПОДАРКИ ===
            Flower(
                name="Диффузор",
                price=28,
                category="gift",
                description="Аромат для дома",
                image_url="https://i.pinimg.com/736x/40/e4/8c/40e48c023a98bdb14886419036fbdbd4.jpg"
            ),
            Flower(
                name="Конфеты",
                price=18,
                category="gift",
                description="Шоколадные трюфели",
                image_url="https://i.pinimg.com/736x/51/14/bf/5114bf94933d8e8c86114af799ecccb0.jpg"
            ),
            Flower(
                name="Капкейки",
                price=25,
                category="gift",
                description="Сладкие капкейки",
                image_url="https://i.pinimg.com/1200x/50/e9/ce/50e9ce37d00006dab858df2d1a2f66c1.jpg"
            ),
            Flower(
                name="Трайфлы",
                price=27,
                category="gift",
                description="Десерт в стакане",
                image_url="https://i.pinimg.com/736x/b8/61/de/b861deb0a64b7243eb0d159f78db3044.jpg"
            ),
            Flower(
                name="Клубника в шоколаде",
                price=30,
                category="gift",
                description="Клубника в шоколаде",
                image_url="https://i.pinimg.com/736x/4b/e9/92/4be9920bceadc992ad5a6e5afa624ea5.jpg"
            ),
            Flower(
                name="Набор",
                price=40,
                category="gift",
                description="Подарочный набор",
                image_url="https://i.pinimg.com/736x/87/a4/6d/87a46d51a79bb141987cd0de49d771a0.jpg"
            ),
            Flower(
                name="Мармелад",
                price=15,
                category="gift",
                description="Фруктовый мармелад",
                image_url="https://i.pinimg.com/736x/d1/ee/1b/d1ee1bcdf2aee8c30588863d650d5ffa.jpg"
            ),
            Flower(
    name="Мягкая игрушка",
    price=29,
    category="gift",
    description="Мягкий и идеальный подарок",
    image_url="https://i.pinimg.com/736x/a9/1f/a8/a91fa8562684b8c10b6313f718ade476.jpg"
),
        ]

        db.session.add_all(flowers_data)
        db.session.commit()
        print("✅ База заполнена товарами")

# =========================
# 🌸 API
# =========================

@app.route('/')
def home():
    return 'Flora API работает 🌸'

@app.route('/api/flowers', methods=['GET'])
def get_flowers():
    category = request.args.get('category')

    if category:
        flowers = Flower.query.filter_by(category=category).all()
    else:
        flowers = Flower.query.all()

    return jsonify([f.to_dict() for f in flowers])

# =========================
# ❤️ FAVORITES
# =========================

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    favorites = Favorite.query.all()
    return jsonify([
        {"id": f.id, "flower_id": f.flower_id}
        for f in favorites
    ])

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    flower_id = data.get('flower_id')

    existing = Favorite.query.filter_by(flower_id=flower_id).first()
    if existing:
        return jsonify({'status': 'already_exists'})

    db.session.add(Favorite(flower_id=flower_id))
    db.session.commit()

    return jsonify({'status': 'added'})

@app.route('/api/favorites/<int:flower_id>', methods=['DELETE'])
def remove_favorite(flower_id):
    fav = Favorite.query.filter_by(flower_id=flower_id).first()

    if fav:
        db.session.delete(fav)
        db.session.commit()
        return jsonify({'status': 'removed'})

    return jsonify({'status': 'not_found'}), 404

# =========================
# 🛒 ORDERS
# =========================

@app.route('/api/order', methods=['POST'])
def create_order():
    data = request.json

    order = Order(
        customer_name=data.get('name', 'Guest'),
        customer_phone=data.get('phone', ''),
        total_amount=data.get('total', 0),
        items=json.dumps(data.get('cart', []))
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({'status': 'ok', 'order_id': order.id})

# =========================

if __name__ == '__main__':
    app.run(debug=True, port=5000)