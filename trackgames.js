const API_URL = "https://script.google.com/macros/s/AKfycbzE5qFRSjO4HNn-4F48LbRNQyn0Uet0KLZ76r5suMVJoGP5O18cBQF7HIF1ALeDC1te/exec"; // from Apps Script deployment

// Track a click
function trackClick(gameId, gameName) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ game: gameId, name: gameName }),
    keepalive: true
  });
}

// Helper to attach click tracking
function addTrackingListeners(selector, root = document) {
  root.querySelectorAll(selector).forEach(link => {
    if (!link.dataset.trackingAttached) { // Avoid duplicates
      const gameId = link.href;
      const gameName = link.textContent.trim();
      link.addEventListener("click", () => {
        trackClick(gameId, gameName);
      });
      link.dataset.trackingAttached = "true";
    }
  });
}

// Load top 5 on page load
async function loadTop5() {
  const res = await fetch(API_URL);
  const top5 = await res.json();

  const container = document.getElementById("top5");
  container.innerHTML = "";
  top5.forEach(([id, name, clicks]) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("game-item");

    const a = document.createElement("a");
    a.textContent = name;
    a.href = id;

    const count = document.createElement("span");
    count.textContent = `${clicks}`;
    count.classList.add("play-count");

    wrapper.appendChild(a);
    wrapper.appendChild(count);
    container.appendChild(wrapper);
  });

  addTrackingListeners("#top5 a");
}

// Observe DOM changes and auto-attach listeners
function observeSection(selector) {
  const target = document.querySelector(selector);
  if (!target) return;

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element
          addTrackingListeners("a", node); // Add listeners inside new nodes
        }
      });
    });
  });

  observer.observe(target, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTop5();

  // Initial attach for existing items
  addTrackingListeners(".game a");
  addTrackingListeners("#recently-played a");
  addTrackingListeners("#favorited-games a");

  // Set up observers for dynamic content
  observeSection("#recently-played");
  observeSection("#favorited-games");
  observeSection("#top5");
});
