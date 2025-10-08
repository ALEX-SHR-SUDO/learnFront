document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "https://learnback-twta.onrender.com";

  const createBtn = document.getElementById("createBtn");
  const getBalanceBtn = document.getElementById("getBalanceBtn");

  const tokenInfo = document.getElementById("tokenInfo");
  const balanceInfo = document.getElementById("balanceInfo");
  const tokenList = document.getElementById("tokenList");

  // === Создать токен ===
  createBtn.addEventListener("click", async () => {
    const decimals = parseInt(document.getElementById("decimals").value);
    const supply = parseFloat(document.getElementById("supply").value);

    tokenInfo.innerText = "Создаю токен...";

    try {
      const res = await fetch(`${BACKEND_URL}/api/create-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decimals, supply })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      tokenInfo.innerHTML = `Токен: <a href="${data.solscan}" target="_blank">${data.mint}</a>`;
    } catch (err) {
      tokenInfo.innerText = "❌ Ошибка: " + err.message;
    }
  });

  // === Показать баланс и токены ===
  getBalanceBtn.addEventListener("click", async () => {
    balanceInfo.innerText = "Загрузка...";
    tokenList.innerText = "Загрузка...";
    try {
      const res = await fetch(`${BACKEND_URL}/api/balance`);
      const data = await res.json();

      balanceInfo.innerText = `💰 SOL: ${data.sol}`;

      if (!data.tokens || data.tokens.length === 0) {
        tokenList.innerText = "Нет токенов";
        return;
      }

      tokenList.innerHTML = data.tokens
        .map(
          t =>
            `<div class="token-card">
               <div>${t.mint}</div>
               <div>${t.amount}</div>
             </div>`
        )
        .join("");
    } catch (err) {
      balanceInfo.innerText = "❌ Ошибка: " + err.message;
      tokenList.innerText = "❌ Ошибка: " + err.message;
    }
  });
});
