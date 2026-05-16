from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Flower(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

    # ✅ ДОБАВИЛИ category
    category = db.Column(db.String(50), nullable=False)

    description = db.Column(
        db.String(300),
        default="Нежное растение из нашей оранжереи"
    )

    image_url = db.Column(
        db.String(500),
        default="/static/default.jpg"
    )

    in_stock = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': self.price,
            'category': self.category,   # ✅
            'description': self.description,
            'image_url': self.image_url,
            'in_stock': self.in_stock
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))
    total_amount = db.Column(db.Float)
    items = db.Column(db.Text)


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    flower_id = db.Column(db.Integer, nullable=False)