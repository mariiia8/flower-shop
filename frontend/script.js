const API = 'http://127.0.0.1:5000/api';

let flowers = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = new Set();
let currentCategory = 'bouquet';

const categoryConfig = {
    bouquet: { title: 'Букеты', subtitle: 'Свежие цветы', breadcrumb: 'Главная · Букеты', bodyClass: 'bouquet-mode' },
    plant: { title: 'Растения', subtitle: 'Зелень для дома', breadcrumb: 'Главная · Растения', bodyClass: 'plant-mode' },
    gift: { title: 'Подарки', subtitle: 'Приятные мелочи', breadcrumb: 'Главная · Подарки', bodyClass: 'gift-mode' }
};

async function loadData() {
    try {
        const url = `${API}/flowers?category=${currentCategory}`;

        const [flowersRes, favRes] = await Promise.all([
            fetch(url),
            fetch(`${API}/favorites`)
        ]);

        flowers = await flowersRes.json();
        const favData = await favRes.json();

        favorites = new Set(favData.map(f => f.flower_id));

        renderCatalog(flowers);
        updateFavoritesUI();
        updatePageUI();

    } catch (e) {
        document.getElementById('catalog-grid').innerHTML =
            '<div class="loader">❌ Сервер не запущен</div>';
        console.error(e);
    }
}

function updatePageUI() {
    const config = categoryConfig[currentCategory];

    document.getElementById('page-title').textContent = config.title;
    document.getElementById('page-subtitle').textContent = config.subtitle;
    document.getElementById('breadcrumbs').textContent = config.breadcrumb;

    document.body.className = config.bodyClass;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === currentCategory);
    });
}

function renderCatalog(items) {
    const grid = document.getElementById('catalog-grid');

    grid.innerHTML = items.map(item => `
        <div class="flower-card">
            <div class="flower-image">
                <img src="${item.image_url}" alt="${item.name}">
                <button class="favorite-btn ${favorites.has(item.id) ? 'active' : ''}"
                    onclick="toggleFavorite(${item.id})"></button>
            </div>

            <div class="flower-info">
                <div class="flower-name">${item.name}</div>
                <div class="flower-price">₽${item.price * 90}</div>

                <button class="add-to-cart-btn"
                    onclick="handleAddToCart(this, ${item.id}, '${item.name}', ${item.price * 90})">
                    В корзину
                </button>
            </div>
        </div>
    `).join('');
}

/* ===== АНИМАЦИЯ ===== */

function flyToCart(img) {
    const cartIcon = document.getElementById('cart-btn');

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    const clone = img.cloneNode(true);

    clone.style.position = 'fixed';
    clone.style.left = imgRect.left + 'px';
    clone.style.top = imgRect.top + 'px';
    clone.style.width = imgRect.width + 'px';
    clone.style.height = imgRect.height + 'px';
    clone.style.zIndex = 9999;
    clone.style.transition = 'all 0.8s ease';
    clone.style.borderRadius = '12px';
    clone.style.pointerEvents = 'none';

    document.body.appendChild(clone);

    setTimeout(() => {
        clone.style.left = cartRect.left + 'px';
        clone.style.top = cartRect.top + 'px';
        clone.style.width = '20px';
        clone.style.height = '20px';
        clone.style.opacity = '0.2';
    }, 10);

    setTimeout(() => clone.remove(), 850);
}

function handleAddToCart(btn, id, name, price) {
    const card = btn.closest('.flower-card');
    const img = card.querySelector('img');

    flyToCart(img);
    addToCart(id, name, price);

    const cartBtn = document.getElementById('cart-btn');
    cartBtn.classList.add('cart-bump');
    setTimeout(() => cartBtn.classList.remove('cart-bump'), 300);
}

/* ===== CART ===== */

function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);

    if (item) item.quantity++;
    else cart.push({ id, name, price, quantity: 1 });

    saveCart();
    updateCartUI();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);

    saveCart();
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-count').innerText = count;

    const itemsDiv = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');

    if (!cart.length) {
        itemsDiv.innerHTML = '<p style="opacity:0.6;">Корзина пуста</p>';
        totalSpan.innerText = 0;
        return;
    }

    itemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            
            <div class="cart-info">
                <strong>${item.name}</strong>
                <div class="cart-price">₽${item.price * item.quantity}</div>
            </div>

            <div class="cart-controls">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
                <span class="qty">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>

            <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>

        </div>
    `).join('');

    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    totalSpan.innerText = total;
}
/* ===== FAVORITES ===== */

async function toggleFavorite(id) {
    if (favorites.has(id)) {
        await fetch(`${API}/favorites/${id}`, { method: 'DELETE' });
        favorites.delete(id);
    } else {
        await fetch(`${API}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flower_id: id })
        });
        favorites.add(id);
    }

    updateFavoritesUI();
    renderCatalog(flowers);
}

/* ===== EVENTS ===== */

document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            loadData();
        });
    });

    document.getElementById('cart-btn')?.addEventListener('click', () => {
        document.getElementById('cart-modal').classList.add('open');
        updateCartUI();
    });

    document.querySelector('.close-cart')?.addEventListener('click', () => {
        document.getElementById('cart-modal').classList.remove('open');
    });

    document.getElementById('favorites-btn')?.addEventListener('click', () => {
        updateFavoritesUI();
        document.getElementById('favorites-modal').classList.add('open');
    });

    document.querySelector('.close-favorites')?.addEventListener('click', () => {
        document.getElementById('favorites-modal').classList.remove('open');
    });

    document.getElementById('checkout-btn')?.addEventListener('click', async () => {
        if (!cart.length) return alert('Корзина пуста');

        await fetch(`${API}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart,
                total: cart.reduce((s, i) => s + i.price * i.quantity, 0)
            })
        });

        alert('Заказ оформлен 💐');

        cart = [];
        saveCart();
        updateCartUI();

        document.getElementById('cart-modal').classList.remove('open');
    });

    loadData();
    updateCartUI();
});
function updateFavoritesUI() {
    const counter = document.getElementById('favorites-count');
    if (counter) counter.innerText = favorites.size;

    const favItems = document.getElementById('favorites-items');
    if (!favItems) return;

    const favFlowers = flowers.filter(f => favorites.has(f.id));

    if (!favFlowers.length) {
        favItems.innerHTML = '<p style="opacity:0.6;">Нет избранных товаров</p>';
        return;
    }

    favItems.innerHTML = favFlowers.map(flower => `
        <div class="favorite-item">
            <div>
                <strong>${flower.name}</strong><br>
                <small>₽${flower.price * 90}</small>
            </div>

            <button class="remove-fav-btn" onclick="removeFavorite(${flower.id})">
                ✕
            </button>
        </div>
    `).join('');
}
async function removeFavorite(id) {
    try {
        await fetch(`${API}/favorites/${id}`, {
            method: 'DELETE'
        });

        favorites.delete(id);

        updateFavoritesUI();
        renderCatalog(flowers); // обновит сердечки на карточках

    } catch (e) {
        console.error('Ошибка удаления из избранного:', e);
    }
}