const chatBox = document.getElementById("chat");
document.getElementById("createBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value;
  const symbol = document.getElementById("symbol").value;
  const decimals = document.getElementById("decimals").value;
  const supply = document.getElementById("supply").value;
  const description = document.getElementById("description").value;

  chatBox.innerHTML = "Создаю токен...";

  try {
    const res = await fetch("https://learnback-twta.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, symbol, decimals, supply, description })
    });

    const data = await res.json();
    if (res.ok) {
      chatBox.innerHTML = `✅ ${data.message}<br>Mint: ${data.mint}<br><a href="${data.solscan}" target="_blank">Solscan</a>`;
    } else {
      chatBox.innerHTML = `❌ Ошибка: ${data.error}<br>${data.details}`;
    }
  } catch (err) {
    chatBox.innerHTML = `❌ Ошибка: ${err.message}`;
  }
});

