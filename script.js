const btn = document.getElementById("createBtn");
const messages = document.getElementById("messages");

btn.onclick = async () => {
  const name = document.getElementById("name").value;
  const symbol = document.getElementById("symbol").value;
  const decimals = document.getElementById("decimals").value;
  const supply = document.getElementById("supply").value;
  const description = document.getElementById("description").value;
  const logo = document.getElementById("logo").files[0];

  if (!name || !symbol || !supply) {
    alert("Заполни name, symbol и supply");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("symbol", symbol);
  formData.append("decimals", decimals);
  formData.append("supply", supply);
  formData.append("description", description);
  if (logo) formData.append("logo", logo);

  try {
    const res = await fetch("https://learnback-twta.onrender.com/chat", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    messages.innerHTML = `<div class="message"><pre>${JSON.stringify(data, null, 2)}</pre></div>`;
  } catch (err) {
    messages.innerHTML = `<div class="message" style="background:#f8d7da;">Ошибка: ${err.message}</div>`;
  }
};
