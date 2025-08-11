const API_URL = "https://script.google.com/macros/s/AKfycbx_Q3HAu02JUvEX0Ac0lJc_u7cpeagjPgIIbVfco8wtTzkw-XaVlCtzopngJxmI8BgzUA/exec"; // Replace with Apps Script URL

// Load top 5 on page load
async function loadTop5() {
  try {
    const res = await fetch(API_URL);
    const top5 = await res.json();

    const container = document.getElementById("top5");
    container.innerHTML = "";
    top5.forEach(([id, name, clicks]) => {
      const a = document.createElement("a");
      a.textContent = clicks === 1 ? `${name} (${clicks} Play)` : `${name} (${clicks} Plays)`;
      a.href = id;
      container.appendChild(a);
    });
  } catch (err) {
    console.error("Failed to load top 5:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTop5);

// Track clicks via Beacon
document.querySelectorAll(".game a.gametxt").forEach(link => {
  link.addEventListener("click", () => {
    const gameName = link.textContent.trim();
    const gameId = link.getAttribute("href");

    const payload = JSON.stringify({ game: gameId, name: gameName });
    const blob = new Blob([payload], { type: "application/json" });

    navigator.sendBeacon(API_URL, blob);
  });
});
