const form = document.getElementById("tokenForm");
const progressContainer = document.querySelector(".progress-container");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const resultDiv = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  const name = document.getElementById("name").value;
  const symbol = document.getElementById("symbol").value;
  const decimals = document.getElementById("decimals").value || "9";
  const supply = document.getElementById("supply").value;
  const description = document.getElementById("description").value;
  const logo = document.getElementById("logo").files[0];

  formData.append("name", name);
  formData.append("symbol", symbol);
  formData.append("decimals", decimals);
  formData.append("supply", supply);
  formData.append("description", description);
  if (logo) formData.append("logo", logo);

  progressContainer.style.display = "block";
  progressFill.style.width = "0%";
  progressText.textContent = "Загрузка: 0%";
  resultDiv.innerHTML = "";

  try {
    const response = await fetch("https://learnback-twta.onrender.com/chat", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      progressFill.style.width = "100%";
      progressText.textContent = "Загрузка: 100%";
      resultDiv.innerHTML = `
        ✅ Токен создан!<br>
        Mint: ${data.mint}<br>
        <a href="${data.metadataUrl}" target="_blank">IPFS Метаданные</a><br>
        <a href="${data.logoUrl}" target="_blank">IPFS Логотип</a><br>
        <a href="${data.solscan}" target="_blank">Solscan</a>
      `;
    } else {
      resultDiv.textContent = "❌ Ошибка: " + data.error;
    }
  } catch (err) {
    console.error(err);
    resultDiv.textContent = "❌ Ошибка сети или CORS";
  }
});
