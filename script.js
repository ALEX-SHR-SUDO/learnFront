const createBtn = document.getElementById('createBtn');
const chat = document.getElementById('chat');
const balanceDisplay = document.getElementById('balanceDisplay');

createBtn.addEventListener('click', async () => {
  chat.innerHTML = "Создание токена...";
  try {
    const response = await fetch("/api/create-token", {
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
    chat.innerHTML = `✅ Токен создан: <br> <b>${data.mintAddress}</b>`;
  } catch (err) {
    chat.innerHTML = "❌ Ошибка при создании токена.";
  }
});

document.getElementById('getServerBalance').addEventListener('click', async () => {
  balanceDisplay.textContent = "Загрузка...";
  try {
    const res = await fetch("/api/balance");
    const data = await res.json();
    balanceDisplay.textContent = `Баланс: ${data.balance} SOL`;
  } catch {
    balanceDisplay.textContent = "Ошибка: не удалось получить баланс";
  }
});
