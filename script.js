// Адрес вашего бэкенд сервиса
const BACKEND_URL = 'https://learnback-twta.onrender.com';

// ------------------------------------------
// I. Элементы DOM
// ------------------------------------------
const createTokenBtn = document.getElementById('create-token-btn');
const tokenAmountInput = document.getElementById('token-amount');
const createStatusMessage = document.getElementById('create-status-message');

// Элементы для сервисного кошелька (остались)
const serviceWalletAddressEl = document.getElementById('service-wallet-address');
const serviceBalanceDisplay = document.getElementById('service-balance-display');
const serviceTokenList = document.getElementById('service-token-list');

// ------------------------------------------
// II. Глобальное состояние
// ------------------------------------------
// Переменная для хранения адреса сервисного кошелька,
// который мы получим с бэкенда
let serviceWalletAddress = null; 

// ------------------------------------------
// III. Утилита для обновления статуса
// ------------------------------------------

function updateCreateStatus(message, type) {
    createStatusMessage.textContent = message;
    createStatusMessage.className = `status-message ${type}`;
}

// ------------------------------------------
// IV. Логика Создания Токена (POST) - Обновлена
// ------------------------------------------

createTokenBtn.addEventListener('click', async () => {
    const amount = parseInt(tokenAmountInput.value);

    if (!amount || amount <= 0) {
        updateCreateStatus('Пожалуйста, введите корректное количество.', 'error');
        return;
    }
    
    // Используем адрес, который мы загрузили при старте
    if (!serviceWalletAddress) {
        updateCreateStatus('Ошибка: Адрес сервисного кошелька не загружен. Обновите страницу.', 'error');
        return;
    }

    updateCreateStatus('Создание токена, подождите...', 'loading');
    createTokenBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/create-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Отправляем токены обратно на тот же сервисный кошелек
            body: JSON.stringify({
                amount: amount,
                recipient: serviceWalletAddress 
            })
        });

        const data = await response.json();

        if (response.ok) {
            updateCreateStatus(`Успех! Создано ${amount} токенов. Транзакция: ${data.txHash.slice(0, 10)}...`, 'success');
            // После создания обновляем информацию о сервисном кошельке
            fetchServiceWalletInfo(); 
        } else {
            throw new Error(data.message || 'Ошибка сервера при создании токена.');
        }

    } catch (error) {
        console.error('Ошибка создания токена:', error);
        updateCreateStatus(`Ошибка: ${error.message}`, 'error');
    } finally {
        createTokenBtn.disabled = false;
    }
});


// ------------------------------------------
// V. ЛОГИКА: Получение Информации о Сервисном Кошельке
// ------------------------------------------

async function fetchServiceWalletInfo() {
    serviceWalletAddressEl.textContent = 'Адрес сервиса: Загрузка...';
    serviceBalanceDisplay.textContent = 'Баланс SOL: Загрузка...';
    serviceTokenList.innerHTML = '<li>Загрузка...</li>';

    try {
        const response = await fetch(`${BACKEND_URL}/api/service-wallet-info`);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке данных сервисного кошелька. Проверьте бэкенд.');
        }

        const data = await response.json();

        // **СОХРАНЯЕМ АДРЕС СЕРВИСНОГО КОШЕЛЬКА для POST-запроса**
        serviceWalletAddress = data.address;
        
        // 1. Обновление адреса в интерфейсе
        const address = data.address;
        serviceWalletAddressEl.textContent = `Адрес сервиса: ${address.slice(0, 4)}...${address.slice(-4)}`; 

        // 2. Обновление баланса
        serviceBalanceDisplay.textContent = `Баланс SOL: ${data.solBalance} SOL`; 

        // 3. Обновление списка токенов
        serviceTokenList.innerHTML = '';
        if (data.tokens && data.tokens.length > 0) {
            data.tokens.forEach(token => {
                const listItem = document.createElement('li');
                listItem.textContent = `${token.symbol}: ${token.balance}`;
                serviceTokenList.appendChild(listItem);
            });
        } else {
            serviceTokenList.innerHTML = '<li>Токены не найдены.</li>';
        }

    } catch (error) {
        console.error('КРИТИЧЕСКАЯ ОШИБКА: Сервис недоступен или не возвращает данных.', error);
        serviceWalletAddressEl.textContent = 'Адрес сервиса: Ошибка загрузки!';
        serviceBalanceDisplay.textContent = 'Баланс SOL: Ошибка!';
        serviceTokenList.innerHTML = `<li>Критическая ошибка: ${error.message}</li>`;
    }
}

// ------------------------------------------
// VI. ИНИЦИАЛИЗАЦИЯ (Автоматический старт)
// ------------------------------------------

document.addEventListener('DOMContentLoaded', fetchServiceWalletInfo);