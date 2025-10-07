console.log("✅ JS загружен");

document.getElementById("createBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const symbol = document.getElementById("symbol").value.trim();
  const decimals = document.getElementById("decimals").value.trim();
  const supply = document.getElementById("supply").value.trim();
  const description = document.getElementById("description").value.trim();
  const logoFile = document.getElementById("logo").files[0];

  if (!name || !symbol || !supply) {
    alert("❗ Заполни name, symbol и supply");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("symbol", symbol);
  formData.append("decimals", decimals);
  formData.append("supply", supply);
  formData.append("description", description);
  if (logoFile) formData.append("logo", logoFile);

  try {
    document.getElementById("result").innerHTML = "⏳ Создание токена...";
    const response = await fetch("https://learnback-twta.onrender.com/chat", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("Ответ:", data);

    if (data.error) {
      document.getElementById("result").innerHTML = `❌ Ошибка: ${data.error}`;
      return;
    }

    document.getElementById("result").innerHTML = `
      ✅ <b>Токен создан!</b><br><br>
      <b>Mint:</b> ${data.mint}<br><br>
      <b>IPFS JSON:</b> <a href="${data.metadataUrl}" target="_blank">${data.metadataUrl}</a><br>
      <b>Логотип:</b> <a href="${data.logoUrl}" target="_blank">${data.logoUrl}</a><br>
      <b>Solscan:</b> <a href="${data.solscan}" target="_blank">${data.solscan}</a>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById("result").innerHTML = `❌ Ошибка при запросе: ${err.message}`;
  }
});
