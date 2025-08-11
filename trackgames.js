const API_URL = "https://script.google.com/macros/s/AKfycbx_Q3HAu02JUvEX0Ac0lJc_u7cpeagjPgIIbVfco8wtTzkw-XaVlCtzopngJxmI8BgzUA/exec"; // from Apps Script deployment

// Track a click
function trackClick(gameId, gameName) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ game: gameId, name: gameName })
  });
}

// Load top 5 on page load
async function loadTop5() {
  const res = await fetch(API_URL);
  const top5 = await res.json();

  const container = document.getElementById("top5");
  container.innerHTML = "";
  top5.forEach(([id, name, clicks]) => {
    const li = document.createElement("li");
    li.textContent = `${name} (${clicks} clicks)`;
    container.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", loadTop5);
