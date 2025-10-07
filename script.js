const chatBox = document.getElementById("chat");
const btn = document.getElementById("createBtn");

btn.addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const symbol = document.getElementById("symbol").value;
  const decimals = document.getElementById("decimals").value;
  const supply = document.getElementById("supply").value;
  const description = document.getElementById("description").value;

  chatBox.innerHTML += `<div>Создаю токен...</div>`;

  try {
    const res = await fetch("https://learnback-twta.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, symbol, decimals, supply, description })
    });
    const data = await res.json();

    chatBox.innerHTML += `<div>✅ ${data.message}</div>`;
    chatBox.innerHTML += `<div>Mint: ${data.mint}</div>`;
    chatBox.innerHTML += `<div><a href="${data.solscan}" target="_blank">Смотреть в Solscan</a></div>`;
  } catch (err) {
    chatBox.innerHTML += `<div>❌ Ошибка: ${err.message}</div>`;
  }
});
