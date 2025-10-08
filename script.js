const API_URL = "https://learnback-twta.onrender.com";

const createBtn = document.getElementById('createBtn');
const chat = document.getElementById('chat');
const balanceDisplay = document.getElementById('balanceDisplay');
const connectionStatus = document.getElementById('connectionStatus');

createBtn.addEventListener('click', async () => {
  chat.textContent = "Создание токена...";
  try {
    const response = await fetch(`${API_URL}/api/create-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById('name').value,
        symbol: document.getElementById('symbol').value,
        decimals: document.getElementById('decimals').value,
        supply: document.getElementById('supply').value,
        description: document.getElementById('description').value
      })
    });
    const data = await response.json();
    chat.innerHTML = `✅ Токен создан: <br><b>${data.mint}</b>`;
  } catch (err) {
    chat.textContent = "❌ Ошибка при создании токена.";
  }
});

document.getElementById('getServerBalance').addEventListener('click', async () => {
  balanceDisplay.textContent = "Загрузка...";
  try {
    const res = await fetch(`${API_URL}/api/balance`);
    const data = await res.json();
    balanceDisplay.textContent = `Баланс: ${data.balance} SOL`;
  } catch {
    balanceDisplay.textContent = "Ошибка: не удалось получить баланс";
  }
});

document.getElementById('testConnection').addEventListener('click', async () => {
  connectionStatus.textContent = "Проверка...";
  try {
    const res = await fetch(`${API_URL}/api/ping`);
    const text = await res.text();
    connectionStatus.textContent = `Связь установлена ✅: ${text}`;
  } catch {
    connectionStatus.textContent = "❌ Ошибка соединения с backend";
  }
});
