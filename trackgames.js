const API_URL = "https://script.google.com/macros/s/AKfycbzE5qFRSjO4HNn-4F48LbRNQyn0Uet0KLZ76r5suMVJoGP5O18cBQF7HIF1ALeDC1te/exec"; // from Apps Script deployment

// Track a click
function trackClick(gameId, gameName) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ game: gameId, name: gameName }),
    keepalive: true
  });
}

// Load top 5 on page load
async function loadTop5() {
  const res = await fetch(API_URL);
  const top5 = await res.json();

  const container = document.getElementById("top5");
  container.innerHTML = "";
  top5.forEach(([id, name, clicks]) => {
    const a = document.createElement("a");
    if (clicks === 1) {
        a.textContent = `${name} (${clicks} Play)`;
    } else {
        a.textContent = `${name} (${clicks} Plays)`;
    }
    a.href = id;
    container.appendChild(a);
  });
}

document.addEventListener("DOMContentLoaded", loadTop5);

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".game").forEach(gameDiv => {
    const link = gameDiv.querySelector("a");
    if (!link) return; // Skip if no link inside

    const gameId = link.href; // Or parse out part of the URL if needed
    const gameName = link.textContent.trim();

    link.addEventListener("click", () => {
      trackClick(gameId, gameName);
    });
  });
});
