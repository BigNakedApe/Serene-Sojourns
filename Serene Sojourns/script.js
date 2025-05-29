const destinations = [
    { name: 'Мальдивы', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206', description: 'Райские острова', lat: 3.2028, lng: 73.2207, continent: 'Indian Ocean', type: 'Beach', budget: 'Premium' },
    { name: 'Бали', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', description: 'Остров богов', lat: -8.3405, lng: 115.0920, continent: 'Asia', type: 'Beach', budget: 'Economy' },
    { name: 'Канары', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', description: 'Вулканические пляжи', lat: 28.2916, lng: -16.6291, continent: 'Atlantic Ocean', type: 'Beach', budget: 'Standard' },
    { name: 'Гавайи', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', description: 'Тропический рай', lat: 19.8968, lng: -155.5828, continent: 'Atlantic Ocean', type: 'Luxury', budget: 'Premium' },
    { name: 'Багамы', image: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9', description: 'Кристальные воды', lat: 25.0343, lng: -77.3963, continent: 'Atlantic Ocean', type: 'Luxury', budget: 'Premium' }
];

const hotels = {
    'Мальдивы': [
        { id: 'MAL1', name: 'Maldives Paradise', price: 500, rating: 5.0 },
        { id: 'MAL2', name: 'Ocean Villa', price: 350, rating: 4.8 },
        { id: 'MAL3', name: 'Coral Reef Resort', price: 600, rating: 4.9 },
        { id: 'MAL4', name: 'Sunset Bungalow', price: 200, rating: 4.5 },
        { id: 'MAL5', name: 'Lagoon Retreat', price: 450, rating: 4.7 }
    ],
    'Бали': [
        { id: 'BAL1', name: 'Bali Beach Hut', price: 80, rating: 3.8 },
        { id: 'BAL2', name: 'Ubud Retreat', price: 150, rating: 4.2 },
        { id: 'BAL3', name: 'Seminyak Villa', price: 250, rating: 4.6 },
        { id: 'BAL4', name: 'Jungle Lodge', price: 100, rating: 4.0 },
        { id: 'BAL5', name: 'Canggu Resort', price: 200, rating: 4.4 }
    ],
    'Канары': [
        { id: 'CAN1', name: 'Tenerife Resort', price: 200, rating: 4.3 },
        { id: 'CAN2', name: 'Gran Canaria Inn', price: 120, rating: 4.0 },
        { id: 'CAN3', name: 'La Palma Retreat', price: 300, rating: 4.5 },
        { id: 'CAN4', name: 'Fuerteventura Beach', price: 90, rating: 3.9 },
        { id: 'CAN5', name: 'Lanzarote Luxury', price: 400, rating: 4.8 }
    ],
    'Гавайи': [
        { id: 'HAW1', name: 'Hawaii Luxury', price: 400, rating: 4.9 },
        { id: 'HAW2', name: 'Maui Beach Hotel', price: 250, rating: 4.5 },
        { id: 'HAW3', name: 'Kauai Resort', price: 550, rating: 5.0 },
        { id: 'HAW4', name: 'Oahu Inn', price: 150, rating: 4.2 },
        { id: 'HAW5', name: 'Big Island Bungalow', price: 300, rating: 4.6 }
    ],
    'Багамы': [
        { id: 'BAH1', name: 'Nassau Grand', price: 300, rating: 4.7 },
        { id: 'BAH2', name: 'Paradise Island Resort', price: 350, rating: 4.8 },
        { id: 'BAH3', name: 'Exuma Retreat', price: 450, rating: 4.9 },
        { id: 'BAH4', name: 'Andros Beach Hotel', price: 100, rating: 4.1 },
        { id: 'BAH5', name: 'Eleuthera Villa', price: 200, rating: 4.4 }
    ]
};

const elements = {
    grid: document.getElementById('destinations-grid'),
    destinationSelect: document.getElementById('destination'),
    hotelSelect: document.getElementById('hotel'),
    bookingForm: document.getElementById('booking-form'),
    continentFilter: document.getElementById('continent-filter'),
    typeFilter: document.getElementById('type-filter'),
    ratingFilter: document.getElementById('rating-filter'),
    priceFilter: document.getElementById('price-filter'),
    resetFilters: document.getElementById('reset-filters'),
    map: document.getElementById('map'),
    themeToggle: document.getElementById('theme-toggle')
};

const weatherCache = {
    data: {},
    ttl: 7200000, // 2 часа
    get: function(key) {
        const cached = this.data[key];
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.weather;
        }
        return null;
    },
    set: function(key, weather) {
        this.data[key] = { weather, timestamp: Date.now() };
    }
};

const hotelCache = {
    data: {},
    ttl: 3600000, // 1 час
    get: function(key) {
        const cached = this.data[key];
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.hotels;
        }
        return null;
    },
    set: function(key, hotels) {
        this.data[key] = { hotels, timestamp: Date.now() };
    }
};

async function fetchWeather(lat, lng, retries = 3) {
    const cacheKey = `${lat},${lng}`;
    const cachedWeather = weatherCache.get(cacheKey);
    if (cachedWeather) return cachedWeather;

    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const weather = {
            temperature: data.current.temperature_2m,
            condition: getWeatherCondition(data.current.weather_code),
            emoji: getWeatherCondition(data.current.weather_code).emoji
        };
        weatherCache.set(cacheKey, weather);
        return weather;
    } catch (error) {
        console.error(`Ошибка загрузки погоды для ${lat},${lng}:`, error);
        if (retries > 0) {
            console.log(`Повторная попытка (${retries} осталось)...`);
            return fetchWeather(lat, lng, retries - 1);
        }
        return { temperature: 'N/A', condition: { text: 'Погода недоступна', emoji: '❓' }, emoji: '❓' };
    }
}

function getWeatherCondition(code) {
    const conditions = {
        0: { text: 'Ясно', emoji: '☀️' },
        1: { text: 'Переменная облачность', emoji: '⛅' },
        2: { text: 'Облачно', emoji: '☁️' },
        3: { text: 'Пасмурно', emoji: '☁️' },
        45: { text: 'Туман', emoji: '🌫️' },
        61: { text: 'Дождь', emoji: '🌧️' },
        71: { text: 'Снег', emoji: '❄️' }
    };
    return conditions[code] || { text: 'Неизвестно', emoji: '❓' };
}

async function fetchHotels(destination) {
    console.log(`Fetching hotels for ${destination}`);
    const cacheKey = destination;
    const cachedHotels = hotelCache.get(cacheKey);
    if (cachedHotels) return cachedHotels;

    const hotelsData = hotels[destination] || [];
    hotelCache.set(cacheKey, hotelsData);
    return hotelsData;
}

async function createCard(dest, index, map, markers) {
    console.log(`Creating card for ${dest.name}`);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${dest.image}" alt="${dest.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/350x280?text=${dest.name}'">
        <span class="card-label">${dest.type}</span>
        <div class="card-content weather-loading">
            <h3>${dest.name}</h3>
            <p>${dest.description}</p>
            <p><b>Погода:</b> <span class="weather-data">...</span></p>
            <p class="weather-loading">Загрузка погоды...</p>
            <p><b>Отель:</b> Загрузка...</p>
        </div>
    `;

    try {
        const weather = await fetchWeather(dest.lat, dest.lng);
        const hotels = await fetchHotels(dest.name);
        const hotel = hotels[0] || { name: 'Отель не найден', price: null, rating: 'N/A' };

        const weatherElement = card.querySelector('.weather-data');
        weatherElement.innerHTML = `${weather.emoji} ${weather.temperature}°C, ${weather.condition.text}`;
        card.querySelector('.card-content').classList.remove('weather-loading');
        card.querySelector('p:last-child').innerHTML = `<b>Отель:</b> ${hotel.name} ($${hotel.price || 'N/A'}/ночь, ★${hotel.rating})`;
    } catch (error) {
        console.error(`Ошибка при создании карточки для ${dest.name}:`, error);
    }

    card.addEventListener('click', () => {
        map.setView([dest.lat, dest.lng], 5);
        markers[index].openPopup();
    });
    return card;
}

function populateDestinationSelect() {
    console.log('Populating destination select');
    destinations.forEach(dest => {
        const option = document.createElement('option');
        option.value = dest.name;
        option.textContent = dest.name;
        elements.destinationSelect.appendChild(option);
    });

    elements.destinationSelect.addEventListener('change', async () => {
        const selectedDestination = elements.destinationSelect.value;
        elements.hotelSelect.innerHTML = '<option value="" disabled selected>Выберите отель</option>';
        if (selectedDestination) {
            const hotels = await fetchHotels(selectedDestination);
            hotels.forEach(hotel => {
                const option = document.createElement('option');
                option.value = hotel.id;
                option.textContent = `${hotel.name} ($${hotel.price}/ночь, ★${hotel.rating})`;
                elements.hotelSelect.appendChild(option);
            });
        }
    });
}

async function initMap() {
    console.log('Initializing map');
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map);

    const coconutIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2839/2839020.png',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });

    const markers = await Promise.all(destinations.map(async (dest, index) => {
        const weather = await fetchWeather(dest.lat, dest.lng);
        const hotels = await fetchHotels(dest.name);
        const hotel = hotels[0] || { name: 'Отель не найден', price: null, rating: 'N/A' };
        return L.marker([dest.lat, dest.lng], { icon: coconutIcon })
            .addTo(map)
            .bindPopup(`
                <div style="background: linear-gradient(45deg, #26a69a, #ff8a65); color: white; padding: 12px; border-radius: 10px; backdrop-filter: blur(5px);">
                    <b>${dest.name}</b><br>
                    ${dest.description}<br>
                    Тип: ${dest.type}<br>
                    Погода: ${weather.emoji} ${weather.temperature}°C, ${weather.condition.text}<br>
                    Отель: ${hotel.name} ($${hotel.price || 'N/A'}/ночь, ★${hotel.rating})
                </div>
            `);
    }));

    elements.map.classList.add('loaded');

    async function updateMapAndCards() {
        console.log('Updating map and cards');
        const continent = elements.continentFilter.value;
        const type = elements.typeFilter.value;
        const rating = elements.ratingFilter.value;
        const price = elements.priceFilter.value;

        elements.grid.innerHTML = '';

        const filtered = [];
        for (let i = 0; i < destinations.length; i++) {
            const dest = destinations[i];
            const hotels = await fetchHotels(dest.name);
            const continentMatch = continent === 'all' || dest.continent === continent;
            const typeMatch = type === 'all' || dest.type === type;
            const ratingMatch = rating === 'all' || hotels.some(hotel => hotel.rating >= parseFloat(rating));
            let priceMatch = true;
            if (price !== 'all') {
                if (price === '501') {
                    priceMatch = hotels.some(hotel => hotel.price > 500);
                } else {
                    priceMatch = hotels.some(hotel => hotel.price <= parseFloat(price));
                }
            }

            if (continentMatch && typeMatch && ratingMatch && priceMatch) {
                filtered.push(dest);
                markers[i].addTo(map);
                const card = await createCard(dest, i, map, markers);
                elements.grid.appendChild(card);
            } else {
                map.removeLayer(markers[i]);
            }
        }

        animateCards();

        if (filtered.length) {
            const avgLat = filtered.reduce((sum, dest) => sum + dest.lat, 0) / filtered.length;
            const avgLng = filtered.reduce((sum, dest) => sum + dest.lng, 0) / filtered.length;
            map.setView([avgLat, avgLng], filtered.length === 1 ? 5 : 3);
        } else {
            map.setView([0, 0], 2);
        }
    }

    elements.continentFilter.addEventListener('change', updateMapAndCards);
    elements.typeFilter.addEventListener('change', updateMapAndCards);
    elements.ratingFilter.addEventListener('change', updateMapAndCards);
    elements.priceFilter.addEventListener('change', updateMapAndCards);
    elements.resetFilters.addEventListener('click', () => {
        elements.continentFilter.value = 'all';
        elements.typeFilter.value = 'all';
        elements.ratingFilter.value = 'all';
        elements.priceFilter.value = 'all';
        updateMapAndCards();
    });

    return { map, markers };
}

function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {
        name: elements.bookingForm.name.value,
        email: elements.bookingForm.email.value,
        destination: elements.bookingForm.destination.value,
        hotel: elements.bookingForm.hotel.value,
        date: elements.bookingForm.date.value
    };
    if (Object.values(formData).every(val => val)) {
        const selectedHotel = hotels[formData.destination]?.find(h => h.id === formData.hotel);
        const hotelName = selectedHotel ? selectedHotel.name : 'Не выбран';
        alert(`Заявка отправлена!\nИмя: ${formData.name}\nEmail: ${formData.email}\nНаправление: ${formData.destination}\nОтель: ${hotelName}\nДата: ${formData.date}`);
        elements.bookingForm.reset();
        elements.hotelSelect.innerHTML = '<option value="" disabled selected>Выберите отель</option>';
    } else {
        alert('Пожалуйста, заполните все поля');
    }
}

function animateCards() {
    console.log('Animating cards');
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    cards.forEach(card => observer.observe(card));
}

function animateForm() {
    console.log('Animating form');
    const form = document.querySelector('#booking-form');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(form);
}

function initTheme() {
    console.log('Initializing theme');
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
    }

    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDarkNow = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    });
}

function initParallax() {
    console.log('Initializing parallax');
    const parallaxBg = document.querySelector('.parallax-bg');
    const waveOverlay = document.querySelector('.wave-overlay');
    let lastScrollY = window.scrollY;

    function updateParallax() {
        const scrollY = window.scrollY;
        const bgOffset = Math.min(scrollY * 0.4, 150); // Фон: до 150px
        const waveOffset = Math.min(scrollY * 0.2, 50); // Волны: до 50px

        parallaxBg.style.transform = `translateY(${bgOffset}px)`;
        waveOverlay.style.transform = `translateY(${waveOffset}px)`;

        lastScrollY = scrollY;
        requestAnimationFrame(updateParallax);
    }

    requestAnimationFrame(updateParallax);
}

async function init() {
    console.log('Initializing app');
    try {
        const { map, markers } = await initMap();
        for (let i = 0; i < destinations.length; i++) {
            const card = await createCard(destinations[i], i, map, markers);
            elements.grid.appendChild(card);
        }
        populateDestinationSelect();
        elements.bookingForm.addEventListener('submit', handleFormSubmit);
        animateCards();
        animateForm();
        initTheme();
        initParallax();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);