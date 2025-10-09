// Адрес вашего бэкенд сервиса
const BACKEND_URL = 'https://learnback-twta.onrender.com';

// ------------------------------------------
// I. Элементы DOM
// ------------------------------------------
const createTokenBtn = document.getElementById('create-token-btn');
const tokenAmountInput = document.getElementById('token-amount');
const createStatusMessage = document.getElementById('create-status-message');

const connectWalletBtn = document.getElementById('connect-wallet-btn');
const walletDisplay = document.getElementById('wallet-display');
const balanceDisplay = document.getElementById('balance-display');
const tokenList = document.getElementById('token-list');

// ------------------------------------------
// II. Глобальное состояние
// ------------------------------------------
let userWalletAddress = null; // Будет хранить адрес подключенного кошелька


// ------------------------------------------
// III. Утилита для обновления статуса
// ------------------------------------------

/**
 * Обновляет сообщение о статусе для секции создания токена.
 * @param {string} message - Текст сообщения.
 * @param {'success' | 'error' | 'loading'} type - Тип сообщения.
 */
function updateCreateStatus(message, type) {
    createStatusMessage.textContent = message;
    createStatusMessage.className = `status-message ${type}`;
}


// ------------------------------------------
// IV. Логика Создания Токена (POST)
// ------------------------------------------

createTokenBtn.addEventListener('click', async () => {
    const amount = parseInt(tokenAmountInput.value);

    if (!amount || amount <= 0) {
        updateCreateStatus('Пожалуйста, введите корректное количество.', 'error');
        return;
    }

    if (!userWalletAddress) {
        updateCreateStatus('Сначала подключите кошелек!', 'error');
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
            body: JSON.stringify({
                amount: amount,
                recipient: userWalletAddress // Отправляем адрес, куда отправить токены
            })
        });

        const data = await response.json();

        if (response.ok) {
            updateCreateStatus(`Успех! Создано ${amount} токенов. Транзакция: ${data.txHash.slice(0, 10)}...`, 'success');
            // После успешного создания обновляем информацию о кошельке
            fetchWalletInfo(userWalletAddress); 
        } else {
            // Ошибка от сервера (4xx, 5xx)
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
// V. Логика Подключения Кошелька (Имитация)
// ------------------------------------------

/**
 * Имитирует подключение кошелька (в реальном приложении - MetaMask или Web3).
 * В учебных целях просто генерируем фейковый адрес.
 */
function connectWallet() {
    // В реальном приложении здесь будет логика Web3/MetaMask
    // Например: const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Имитация:
    userWalletAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''); 
    
    walletDisplay.textContent = `Адрес кошелька: ${userWalletAddress.slice(0, 8)}...${userWalletAddress.slice(-6)}`;
    connectWalletBtn.textContent = 'КОШЕЛЕК ПОДКЛЮЧЕН';
    connectWalletBtn.disabled = true;
    
    fetchWalletInfo(userWalletAddress);
}

connectWalletBtn.addEventListener('click', connectWallet);


// ------------------------------------------
// VI. Логика Получения Информации о Кошельке (GET)
// ------------------------------------------

/**
 * Загружает баланс и список токенов пользователя.
 * @param {string} address - Адрес кошелька пользователя.
 */
async function fetchWalletInfo(address) {
    if (!address) return;
    
    balanceDisplay.textContent = 'Баланс ETH: Загрузка...';
    tokenList.innerHTML = '<li>Загрузка токенов...</li>';

    try {
        // Запрос на получение баланса и токенов по адресу
        const response = await fetch(`${BACKEND_URL}/api/wallet-info?address=${address}`);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке данных кошелька.');
        }

        const data = await response.json();

        // 1. Обновление баланса
        balanceDisplay.textContent = `Баланс ETH: ${data.ethBalance} ETH`; 

        // 2. Обновление списка токенов
        tokenList.innerHTML = '';
        if (data.tokens && data.tokens.length > 0) {
            data.tokens.forEach(token => {
                const listItem = document.createElement('li');
                listItem.textContent = `${token.symbol}: ${token.balance}`;
                tokenList.appendChild(listItem);
            });
        } else {
            tokenList.innerHTML = '<li>Токены не найдены.</li>';
        }

    } catch (error) {
        console.error('Ошибка при получении информации о кошельке:', error);
        balanceDisplay.textContent = 'Баланс ETH: Ошибка загрузки';
        tokenList.innerHTML = `<li>Ошибка: ${error.message}</li>`;
    }
}
