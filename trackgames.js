const API_URL = "https://script.google.com/macros/s/AKfycbznzRXMp4oT_eM8lt_N_yUZEq2qHmlKacf6W0ozgllR-RY0OZ5YacfEvrLeA1iQ8_YQeg/exec"; // from Apps Script deployment

document.addEventListener("DOMContentLoaded", () => {
  // =============================
  // 1. Automatic click tracking
  // =============================
  document.querySelectorAll(".game a.gametxt").forEach(link => {
    link.addEventListener("click", () => {
      const gameName = link.textContent.trim();
      const gameId = link.getAttribute("href");

      const payload = JSON.stringify({ game: gameId, name: gameName });
      const blob = new Blob([payload], { type: "application/json" });

      navigator.sendBeacon(API_URL, blob);
    });
  });

  // =============================
  // 2. Load Top 5 Games
  // =============================
  const container = document.getElementById("top5");
  if (container) {
    fetch(API_URL)
      .then(res => res.json())
      .then(top5 => {
        container.innerHTML = "";
        top5.forEach(([id, name, clicks]) => {
          const li = document.createElement("li");
          
          // Create clickable link
          const link = document.createElement("a");
          link.href = id;
          link.textContent = `${name} (${clicks} clicks)`;
          link.classList.add("gametxt"); // so click tracking also works

          // Attach click tracker for Top 5 links too
          link.addEventListener("click", () => {
            const payload = JSON.stringify({ game: id, name: name });
            const blob = new Blob([payload], { type: "application/json" });
            navigator.sendBeacon(API_URL, blob);
          });

          li.appendChild(link);
          container.appendChild(li);
        });
      })
      .catch(err => console.error("Error loading top 5 games:", err));
  }
});
