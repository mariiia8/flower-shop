const API = 'http://localhost:5000/api';

let flowers = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = new Set();
let currentCategory = 'bouquet';
let quickViewItem = null;

const categoryConfig = {
    bouquet: {
        title: 'Букеты',
        subtitle: 'Свежие цветы с доставкой по всему городу',
        breadcrumb: 'Главная · Букеты',
        bodyClass: 'bouquet-mode'
    },
    plant: {
        title: 'Растения для дома',
        subtitle: 'Живая зелень для уюта и чистого воздуха',
        breadcrumb: 'Главная · Растения',
        bodyClass: 'plant-mode'
    },
    gift: {
        title: 'Подарки',
        subtitle: 'Приятные мелочи для особых моментов',
        breadcrumb: 'Главная · Подарки',
        bodyClass: 'gift-mode'
    }
};

// ===================== LOAD =====================
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

// ===================== UI =====================
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

// ===================== CATALOG =====================
function renderCatalog(items) {
    const grid = document.getElementById('catalog-grid');

    if (!items.length) {
        grid.innerHTML = '<div class="loader">Нет товаров</div>';
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="flower-card" data-id="${item.id}">
            <div class="flower-image">
                <img src="${item.image_url}" alt="${item.name}">
                <button class="favorite-btn ${favorites.has(item.id) ? 'active' : ''}" data-id="${item.id}"></button>
            </div>

            <div class="flower-info">
                <div class="flower-name">${item.name}</div>
                <div class="flower-price">₽${item.price * 90}</div>

                <button class="add-to-cart-btn"
                    data-id="${item.id}"
                    data-name="${item.name}"
                    data-price="${item.price * 90}">
                    В корзину
                </button>
            </div>
        </div>
    `).join('');

    // ===== QUICK VIEW =====
    document.querySelectorAll('.flower-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn') || e.target.closest('.favorite-btn')) return;

            const id = parseInt(card.dataset.id);
            const item = flowers.find(f => f.id === id);
            if (item) openQuickView(item);
        });
    });

    // ===== CART BUTTONS =====
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            addToCart(
                parseInt(btn.dataset.id),
                btn.dataset.name,
                parseInt(btn.dataset.price)
            );

            btn.classList.add('cart-bump');
            setTimeout(() => btn.classList.remove('cart-bump'), 300);
        });
    });

    // ===== FAVORITES =====
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await toggleFavorite(parseInt(btn.dataset.id), btn);
        });
    });
}

// ===================== QUICK VIEW =====================
function openQuickView(item) {
    quickViewItem = item;

    document.getElementById('qv-img').src = item.image_url;
    document.getElementById('qv-name').innerText = item.name;
    document.getElementById('qv-desc').innerText = item.description;
    document.getElementById('qv-price').innerText = `₽${item.price * 90}`;

    document.getElementById('quick-view').classList.add('open');
}

// ===================== FAVORITES =====================
async function toggleFavorite(flowerId, btn) {
    if (favorites.has(flowerId)) {
        await fetch(`${API}/favorites/${flowerId}`, { method: 'DELETE' });
        favorites.delete(flowerId);
    } else {
        await fetch(`${API}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ flower_id: flowerId })
        });
        favorites.add(flowerId);
    }

    btn.classList.toggle('active');
    updateFavoritesUI();
}

function updateFavoritesUI() {
    const counter = document.getElementById('favorites-count');
    if (counter) counter.innerText = favorites.size;

    const favItems = document.getElementById('favorites-items');
    if (!favItems) return;

    const favFlowers = flowers.filter(f => favorites.has(f.id));

    if (!favFlowers.length) {
        favItems.innerHTML = '<p style="opacity:0.6">Нет избранных</p>';
        return;
    }

    favItems.innerHTML = favFlowers.map(f => `
        <div class="favorite-item">
            <div>
                <strong>${f.name}</strong><br>
                <small>₽${f.price * 90}</small>
            </div>
            <button class="remove-fav-btn" data-id="${f.id}">✕</button>
        </div>
    `).join('');

    document.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            await fetch(`${API}/favorites/${id}`, { method: 'DELETE' });
            favorites.delete(id);
            loadData();
        });
    });
}

// ===================== CART =====================
function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);

    if (item) item.quantity++;
    else cart.push({ id, name, price, quantity: 1 });

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const counter = document.getElementById('cart-count');
    if (counter) {
        counter.innerText = cart.reduce((s, i) => s + i.quantity, 0);
    }

    const itemsDiv = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');

    if (!itemsDiv) return;

    if (!cart.length) {
        itemsDiv.innerHTML = '<p style="opacity:0.6">Корзина пуста</p>';
    } else {
        itemsDiv.innerHTML = cart.map(i => `
            <div class="cart-item">
                <div class="cart-info">
                    <div class="cart-name">${i.name}</div>
                    <div class="cart-price">₽${i.price}</div>
                </div>

                <div class="cart-controls">
                    <button onclick="changeQty(${i.id}, -1)">-</button>
                    <span>${i.quantity}</span>
                    <button onclick="changeQty(${i.id}, 1)">+</button>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (totalSpan) totalSpan.innerText = total;
}

window.changeQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
};

// ===================== EVENTS =====================
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
        document.getElementById('favorites-modal').classList.add('open');
        updateFavoritesUI();
    });

    document.querySelector('.close-favorites')?.addEventListener('click', () => {
        document.getElementById('favorites-modal').classList.remove('open');
    });

    // QUICK VIEW CLOSE
    document.querySelector('.close-quick')?.addEventListener('click', () => {
        document.getElementById('quick-view').classList.remove('open');
    });

    document.getElementById('qv-add')?.addEventListener('click', () => {
        if (!quickViewItem) return;

        addToCart(
            quickViewItem.id,
            quickViewItem.name,
            quickViewItem.price * 90
        );

        document.getElementById('quick-view').classList.remove('open');
    });

    // ORDER
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
        localStorage.removeItem('cart');
        updateCartUI();
        document.getElementById('cart-modal').classList.remove('open');
    });

    loadData();
    updateCartUI();
});