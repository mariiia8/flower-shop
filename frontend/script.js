const API = 'http://localhost:5000/api';

let flowers = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = new Set();
let currentCategory = 'bouquet';
let quickViewItem = null;
let quickViewQuantity = 1;

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
        const grid = document.getElementById('catalog-grid');
        if (grid) grid.innerHTML = '<div class="loader">❌ Сервер не запущен</div>';
        console.error(e);
    }
}

// ===================== UI =====================
function updatePageUI() {
    const config = categoryConfig[currentCategory];

    const title = document.getElementById('page-title');
    const subtitle = document.querySelector('.page-subtitle');
    const breadcrumbs = document.querySelector('.breadcrumbs');

    if (title) title.textContent = config.title;
    if (subtitle) subtitle.textContent = config.subtitle;
    if (breadcrumbs) breadcrumbs.textContent = config.breadcrumb;

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

    document.querySelectorAll('.flower-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn') || e.target.closest('.favorite-btn')) return;
            const id = parseInt(card.dataset.id);
            const item = flowers.find(f => f.id === id);
            if (item) openQuickView(item);
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(
                parseInt(btn.dataset.id),
                btn.dataset.name,
                parseInt(btn.dataset.price),
                e
            );
            btn.classList.add('cart-bump');
            setTimeout(() => btn.classList.remove('cart-bump'), 300);
        });
    });

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
    quickViewQuantity = 1;
    
    document.getElementById('qv-img').src = item.image_url;
    document.getElementById('qv-name').innerText = item.name;
    document.getElementById('qv-desc').innerText = item.description;
    document.getElementById('qv-price').innerHTML = `₽${item.price * 90}`;
    document.getElementById('qv-qty-value').innerText = '1';
    
    document.getElementById('quick-view').classList.add('open');
}

document.getElementById('qv-qty-plus')?.addEventListener('click', () => {
    quickViewQuantity++;
    document.getElementById('qv-qty-value').innerText = quickViewQuantity;
    const price = quickViewItem.price * 90 * quickViewQuantity;
    document.getElementById('qv-price').innerHTML = `₽${price} <span style="font-size: 14px; color: #999;">(×${quickViewQuantity})</span>`;
});

document.getElementById('qv-qty-minus')?.addEventListener('click', () => {
    if (quickViewQuantity > 1) {
        quickViewQuantity--;
        document.getElementById('qv-qty-value').innerText = quickViewQuantity;
        const price = quickViewItem.price * 90 * quickViewQuantity;
        document.getElementById('qv-price').innerHTML = `₽${price} <span style="font-size: 14px; color: #999;">(×${quickViewQuantity})</span>`;
    }
});

document.getElementById('qv-add')?.addEventListener('click', () => {
    if (quickViewItem) {
        for (let i = 0; i < quickViewQuantity; i++) {
            addToCart(quickViewItem.id, quickViewItem.name, quickViewItem.price * 90);
        }
        document.getElementById('quick-view').classList.remove('open');
        showAddToCartNotification(quickViewItem.name, quickViewQuantity);
        quickViewQuantity = 1;
    }
});

function showAddToCartNotification(name, quantity) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: white;
        padding: 12px 20px;
        border-radius: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        border-left: 4px solid #ff5f8f;
        font-size: 14px;
    `;
    notification.innerHTML = `✅ ${name} добавлен${quantity > 1 ? ` (×${quantity})` : ''} в корзину`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// ===================== КОРЗИНА С АНИМАЦИЕЙ =====================
function addToCart(id, name, price, event) {
    const item = cart.find(i => i.id === id);
    
    if (item) item.quantity++;
    else cart.push({ id, name, price, quantity: 1 });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    
    if (event && event.target) {
        const btn = event.target.closest('.add-to-cart-btn');
        if (btn) {
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => { if (btn) btn.style.transform = 'scale(1)'; }, 150);
        }
    }
    
    if (event) animateToCart(event);
    animateCartCounter();
}

function animateToCart(event) {
    if (!event || !event.target) return;

    const btn = event.target.closest('.add-to-cart-btn');
    if (!btn) return;

    const flower = document.createElement("div");
    flower.innerHTML = "🌸";
    flower.style.cssText = `
        position: fixed;
        z-index: 10000;
        font-size: 28px;
        pointer-events: none;
        transition: all 0.6s cubic-bezier(0.34, 1.2, 0.64, 1);
    `;
    document.body.appendChild(flower);

    const start = btn.getBoundingClientRect();
    const cartIcon = document.querySelector('.cart-icon');
    const end = cartIcon?.getBoundingClientRect();

    if (!end) {
        flower.remove();
        return;
    }

    flower.style.left = start.left + start.width / 2 - 15 + "px";
    flower.style.top = start.top + start.height / 2 - 15 + "px";
    flower.style.transform = "scale(1)";
    flower.style.opacity = "1";

    requestAnimationFrame(() => {
        const deltaX = end.left + end.width / 2 - (start.left + start.width / 2);
        const deltaY = end.top + end.height / 2 - (start.top + start.height / 2);
        
        flower.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
        flower.style.opacity = "0";
    });

    setTimeout(() => {
        flower.remove();
        if (cartIcon) {
            cartIcon.classList.add("cart-icon-bump");
            setTimeout(() => cartIcon.classList.remove("cart-icon-bump"), 400);
        }
    }, 600);
}

function animateCartCounter() {
    const counter = document.getElementById('cart-count');
    if (counter) {
        counter.classList.add('increment');
        setTimeout(() => counter.classList.remove('increment'), 300);
        counter.style.transform = 'scale(1.2)';
        setTimeout(() => { if (counter) counter.style.transform = 'scale(1)'; }, 200);
    }
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

// ===================== AI CHAT =====================
const aiToggle = document.getElementById("ai-toggle");
const aiBox = document.getElementById("ai-box");
const aiClose = document.getElementById("ai-close");
const aiSend = document.getElementById("ai-send");
const aiInput = document.getElementById("ai-input");
const aiMessages = document.getElementById("ai-messages");

if (aiToggle) {
    aiToggle.addEventListener("click", () => {
        if (aiBox) aiBox.classList.add("open");
    });
}

if (aiClose) {
    aiClose.addEventListener("click", () => {
        if (aiBox) aiBox.classList.remove("open");
    });
}

async function sendAI() {
    const text = aiInput.value.trim();
    if (!text) return;

    const userMsg = document.createElement("div");
    userMsg.className = "msg user";
    userMsg.textContent = text;
    aiMessages.appendChild(userMsg);
    
    aiInput.value = "";
    aiMessages.scrollTop = aiMessages.scrollHeight;

    const loadingMsg = document.createElement("div");
    loadingMsg.className = "msg bot";
    loadingMsg.textContent = "🌸 Думаю...";
    aiMessages.appendChild(loadingMsg);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    try {
        const res = await fetch("http://127.0.0.1:5001/api/ai-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        loadingMsg.remove();
        const botMsg = document.createElement("div");
        botMsg.className = "msg bot";
        botMsg.textContent = data.reply || "🌸 Извините, не могу ответить";
        aiMessages.appendChild(botMsg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    } catch (e) {
        console.error("AI Error:", e);
        loadingMsg.remove();
        const errorMsg = document.createElement("div");
        errorMsg.className = "msg bot";
        errorMsg.textContent = "❌ Ошибка подключения к AI серверу. Убедитесь, что сервер запущен на порту 5001 🌸";
        aiMessages.appendChild(errorMsg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }
}

if (aiSend) aiSend.addEventListener("click", sendAI);
if (aiInput) aiInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendAI(); });

// ===================== PAYMENT MODAL =====================
const paymentModal = document.getElementById("payment-modal");
const closePayment = document.querySelector(".close-payment");
const payBtn = document.getElementById("pay-btn");
const paymentStatus = document.getElementById("payment-status");

function updatePayAmount() {
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const amountSpan = document.querySelector(".pay-amount");
    if (amountSpan) amountSpan.textContent = `${total} ₽`;
}

document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (!cart.length) {
        alert('Корзина пуста 🌸');
        return;
    }
    updatePayAmount();
    paymentModal.classList.add("open");
});

document.querySelectorAll(".pay-method").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".pay-method").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const method = btn.dataset.method;
        document.querySelectorAll(".payment-form").forEach(form => form.classList.remove("active"));
        if (method === "card") document.getElementById("card-form")?.classList.add("active");
        else if (method === "apple") document.getElementById("apple-form")?.classList.add("active");
        else if (method === "google") document.getElementById("google-form")?.classList.add("active");
    });
});

const cardNumberInput = document.getElementById("card-number");
if (cardNumberInput) {
    cardNumberInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 16) value = value.slice(0, 16);
        let formatted = "";
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += " ";
            formatted += value[i];
        }
        e.target.value = formatted;
        const displayCard = document.getElementById("display-card-number");
        if (displayCard) {
            displayCard.textContent = value.length ? "**** **** **** " + value.slice(-4) : "**** **** **** ****";
        }
    });
}

if (closePayment) {
    closePayment.addEventListener("click", () => {
        paymentModal.classList.remove("open");
        if (paymentStatus) paymentStatus.innerHTML = "";
        document.querySelector('.pay-method[data-method="card"]')?.click();
    });
}

if (paymentModal) {
    paymentModal.addEventListener("click", (e) => {
        if (e.target === paymentModal) {
            paymentModal.classList.remove("open");
            if (paymentStatus) paymentStatus.innerHTML = "";
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && paymentModal?.classList.contains("open")) {
        paymentModal.classList.remove("open");
        if (paymentStatus) paymentStatus.innerHTML = "";
    }
});

if (payBtn) {
    payBtn.addEventListener("click", () => {
        paymentStatus.innerHTML = `<div style="animation: fadeInStep 0.5s ease;"><div style="font-size: 48px;">⏳</div><div style="font-size: 16px; font-weight: 500;">Обработка платежа...</div></div>`;
        setTimeout(() => { startFakeDelivery(); }, 1500);
    });
}

// ===================== DELIVERY SIMULATION =====================
function startFakeDelivery() {
    const steps = [
        { icon: "💳", text: "Оплата подтверждена" },
        { icon: "🌸", text: "Флорист собирает букет" },
        { icon: "🎀", text: "Упаковка подарка" },
        { icon: "📦", text: "Передаём курьеру" },
        { icon: "🚚", text: "Курьер в пути" },
        { icon: "📍", text: "Курьер рядом с вами" },
        { icon: "🎉", text: "Доставлено! Спасибо за заказ!" }
    ];
    
    let stepIndex = 0;
    const statusDiv = document.getElementById("payment-status");
    
    const backBtn = document.createElement("button");
    backBtn.innerHTML = "← Назад к оплате";
    backBtn.style.cssText = `
        background: none;
        border: none;
        color: #ff5f8f;
        font-size: 14px;
        cursor: pointer;
        margin-top: 15px;
        padding: 8px;
        width: 100%;
        text-align: center;
    `;
    backBtn.onclick = () => {
        stepIndex = steps.length;
        statusDiv.innerHTML = "";
        backBtn.remove();
        document.querySelector(".pay-method.active")?.click();
        if (payBtn) payBtn.style.display = "flex";
    };
    
    function updateStep() {
        if (stepIndex >= steps.length) {
            setTimeout(() => {
                paymentModal.classList.remove("open");
                cart = [];
                localStorage.removeItem("cart");
                updateCartUI();
                showThankYouModal();
                backBtn.remove();
                if (payBtn) payBtn.style.display = "flex";
            }, 1500);
            return;
        }
        
        if (payBtn) payBtn.style.display = "none";
        
        if (stepIndex < 3 && !document.querySelector(".back-to-payment")) {
            backBtn.classList.add("back-to-payment");
            statusDiv.appendChild(backBtn);
        }
        
        const step = steps[stepIndex];
        const progressPercent = (stepIndex / steps.length) * 100;
        
        statusDiv.innerHTML = `
            <div style="animation: fadeInUp 0.6s ease;">
                <div style="font-size: 64px; margin-bottom: 15px; animation: bounce 0.5s ease;">${step.icon}</div>
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #333;">${step.text}</div>
                <div style="width: 100%; background: #f0f0f0; border-radius: 20px; margin: 20px 0; overflow: hidden; height: 6px;">
                    <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #ff8fb1, #ff5f8f); transition: width 0.5s ease; border-radius: 20px;"></div>
                </div>
                <div style="font-size: 13px; color: #ff8fb1;">~${Math.round((steps.length - stepIndex) * 2)} секунд до доставки</div>
            </div>
        `;
        
        if (stepIndex < 3 && !statusDiv.querySelector(".back-to-payment")) {
            backBtn.classList.add("back-to-payment");
            statusDiv.appendChild(backBtn);
        }
        
        stepIndex++;
        
        let delay = 2200;
        if (step.text.includes("Курьер в пути")) delay = 2800;
        if (step.text.includes("рядом")) delay = 2500;
        if (step.text.includes("Доставлено")) delay = 2000;
        
        setTimeout(updateStep, delay);
    }
    
    updateStep();
}

function showThankYouModal() {
    const statusDiv = document.getElementById("payment-status");
    statusDiv.innerHTML = `
        <div style="text-align: center; animation: heartBeat 0.5s ease;">
            <div style="font-size: 80px; margin-bottom: 15px;">💐</div>
            <div style="font-size: 24px; font-weight: 600; color: #ff5f8f; margin-bottom: 10px;">Спасибо за заказ!</div>
            <div style="font-size: 14px; color: #666;">Мы отправили детали на вашу почту</div>
        </div>
    `;
    setTimeout(() => {
        document.getElementById("payment-modal").classList.remove("open");
        statusDiv.innerHTML = "";
    }, 2500);
}

// ===================== CSS ANIMATIONS =====================
const extraStyles = document.createElement("style");
extraStyles.textContent = `
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    @keyframes heartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    @keyframes fadeInStep { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes cartBump { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
    @keyframes counterPop { 0% { transform: scale(1); } 50% { transform: scale(1.3); color: #ff5f8f; } 100% { transform: scale(1); } }
    
    .cart-icon-bump { animation: cartBump 0.4s ease; }
    .cart-counter.increment { animation: counterPop 0.3s ease; }
    .cart-bump { animation: bump 0.3s ease; }
    @keyframes bump { 0% { transform: scale(1); } 50% { transform: scale(0.95); } 100% { transform: scale(1); } }
`;
document.head.appendChild(extraStyles);

// ===================== INIT =====================
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

    document.querySelector('.close-quick')?.addEventListener('click', () => {
        document.getElementById('quick-view').classList.remove('open');
    });

    loadData();
    updateCartUI();
});

// ===================== МОБИЛЬНОЕ МЕНЮ =====================
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('nav');

if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
        
        if (navMenu.classList.contains('open')) {
            mobileMenuBtn.textContent = '✕';
        } else {
            mobileMenuBtn.textContent = '☰';
        }
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navMenu.classList.remove('open');
            if (mobileMenuBtn) mobileMenuBtn.textContent = '☰';
        });
    });
}