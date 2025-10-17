// Адрес вашего бэкенд сервиса.
// В данном случае, это адрес, который вы используете на Render (или локальный, если вы его запускаете).
const BACKEND_URL = 'https://learnback-twta.onrender.com'; // Используйте порт, на котором запущен ваш Express-сервер

// ------------------------------------------
// I. Элементы DOM
// ------------------------------------------
const createTokenBtn = document.getElementById('create-token-btn');
const tokenSupplyInput = document.getElementById('token-supply');
const tokenDecimalsInput = document.getElementById('token-decimals');
const createStatusMessage = document.getElementById('create-status-message');
const resultLinkDiv = document.getElementById('result-link');
// ✅ НОВЫЕ ПОЛЯ ДЛЯ МЕТАДАННЫХ
const tokenNameInput = document.getElementById('token-name');
const tokenSymbolInput = document.getElementById('token-symbol');
const tokenUriInput = document.getElementById('token-uri');

const serviceWalletAddressEl = document.getElementById('service-wallet-address');
const serviceBalanceDisplay = document.getElementById('service-balance-display');
const serviceTokenList = document.getElementById('service-token-list');
const refreshBtn = document.getElementById('refresh-btn');
const loadingStatus = document.getElementById('loading-status');

// ------------------------------------------
// II. Утилита для обновления статуса
// ------------------------------------------

function updateStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
}

// ------------------------------------------
// III. Логика Создания Токена (POST /api/create-token)
// ------------------------------------------

async function handleCreateToken() {
    // ✅ Считываем ВСЕ 5 полей
    const name = tokenNameInput.value;
    const symbol = tokenSymbolInput.value;
    const uri = tokenUriInput.value;
    const supply = tokenSupplyInput.value;
    const decimals = tokenDecimalsInput.value;

     // Обновленная проверка валидации
    if (!name || !symbol || !uri) {
        updateStatus(createStatusMessage, '❗ Заполните все поля метаданных (Имя, Символ, URI).', 'error');
        return;
    }
    if (!supply || parseInt(supply) <= 0) {
        updateStatus(createStatusMessage, '❗ Заполните количество (Supply).', 'error');
        return;
    }
    
    updateStatus(createStatusMessage, 'Создание и минт токена, подождите...', 'loading');
    createTokenBtn.disabled = true;
    resultLinkDiv.innerHTML = '';

    try {
        const response = await fetch(`${BACKEND_URL}/api/create-token`, { // Используем /create-token, как в финальной конфигурации
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // ✅ Отправляем все пять полей
            body: JSON.stringify({
                name: name,
                symbol: symbol,
                uri: uri,
                supply: supply,
                decimals: decimals
            })
        });

        const data = await response.json();

        if (response.ok) {
            updateStatus(createStatusMessage, `✅ Токен создан! Mint: ${data.mint.slice(0, 6)}...`, 'success');
            
            // Вывод ссылки на Solscan
            resultLinkDiv.innerHTML = `
                <a href="${data.solscan}" target="_blank" style="color: var(--link-color); text-decoration: none;">
                    🔍 Посмотреть транзакцию на Solscan
                </a>
            `;
            
            // Обновляем список токенов
            await fetchServiceWalletInfo(); 
        } else {
            // Ошибка от сервера (400, 500)
            throw new Error(data.error || 'Неизвестная ошибка сервера.');
        }

    } catch (error) {
        console.error('❌ Ошибка при создании токена:', error);
        updateStatus(createStatusMessage, `❌ Ошибка: ${error.message}`, 'error');
    } finally {
        createTokenBtn.disabled = false;
    }
}

// ------------------------------------------
// IV. Логика Получения Информации (GET /api/balance)
// ------------------------------------------

async function fetchServiceWalletInfo() {
    loadingStatus.textContent = 'Загрузка данных...';
    refreshBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/balance`);
        
        // ❌ ПРОВЕРКА ОШИБОК БЭКЕНДА: Если статус не 200, читаем тело ответа как ошибку
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ошибка ${response.status} при загрузке данных.`);
        }

        const data = await response.json();
        
        // 1. Адрес
        const address = data.serviceAddress || 'Адрес не предоставлен'; 
        serviceWalletAddressEl.textContent = `Адрес: ${typeof address === 'string' && address.length > 8 ? address.slice(0, 4) + '...' + address.slice(-4) : address}`;

        // 2. Баланс SOL
        // ✅ ИСПРАВЛЕНИЕ: Добавляем проверку data.sol перед вызовом toFixed()
        if (typeof data.sol === 'number') {
            serviceBalanceDisplay.textContent = `Баланс SOL: ${data.sol.toFixed(4)} SOL`; 
        } else {
            // Fallback, если бэкенд не вернул баланс (например, из-за ошибки ключа)
            serviceBalanceDisplay.textContent = `Баланс SOL: Ошибка загрузки`; 
        }

        // 3. Список токенов
        serviceTokenList.innerHTML = '';
        if (data.tokens && data.tokens.length > 0) {
            data.tokens.forEach(token => {
                const listItem = document.createElement('li');
                // Добавляем проверку на существование token.mint
                const mintDisplay = token.mint ? `${token.mint.slice(0, 6)}...${token.mint.slice(-4)}` : 'N/A';
                
                listItem.innerHTML = `
                    <span>Mint: ${mintDisplay}</span> 
                    <strong>${token.amount}</strong>
                `;
                serviceTokenList.appendChild(listItem);
            });
        } else {
            serviceTokenList.innerHTML = '<li>Токены SPL не найдены.</li>';
        }
        
        loadingStatus.textContent = 'Данные успешно загружены.';

    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
        // Отображаем ошибку, полученную от бэкенда (например, "Failed to load Keypair...")
        const errorMessage = error.message || 'Ошибка подключения';
        loadingStatus.textContent = `❌ Ошибка: ${errorMessage.slice(0, 50)}...`;
        
        // Сброс полей при ошибке
        serviceWalletAddressEl.textContent = 'Адрес: Ошибка';
        serviceBalanceDisplay.textContent = 'Баланс SOL: Ошибка';
        serviceTokenList.innerHTML = '<li>Ошибка загрузки токенов.</li>';
    } finally {
        refreshBtn.disabled = false;
    }
}

// ------------------------------------------
// V. Инициализация и обработчики
// ------------------------------------------

// Запуск загрузки данных при старте
document.addEventListener('DOMContentLoaded', fetchServiceWalletInfo);

// Обработчики кнопок
createTokenBtn.addEventListener('click', handleCreateToken);
refreshBtn.addEventListener('click', fetchServiceWalletInfo);