const API_URL = "https://script.google.com/macros/s/AKfycbyArT9q9glV9pLn5Xy3KcJ7OVZXZNxvnfVUPOyRmQsh89JZg-vawoOJiPkay3rKkEjZow/exec"; // from Apps Script deployment                              

// NEW: Make play counts global for main.js
window.gamePlayCounts = new Map(); 

// Track a click
function trackClick(gameId, gameName) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ game: gameId, name: gameName }),
    keepalive: true // Ensures request tries to complete even if page unloads
  });
}

// Helper to attach click tracking
function addTrackingListeners(selector, root = document) {
  root.querySelectorAll(selector).forEach(link => {
    if (!link.dataset.trackingAttached) { // Avoid duplicates
      // Ensure we get the full, absolute URL
      const gameId = new URL(link.href, document.baseURI).href;
      const gameName = link.textContent.trim();
      
      link.addEventListener("click", (e) => {
        // Only track clicks on actual game links, not all links
        if (gameId.includes('/games')) {
            trackClick(gameId, gameName);
        }
      });
      link.dataset.trackingAttached = "true";
    }
  });
}

// Load top 5 on page load
async function loadTop5() {
  try {
    const res = await fetch(API_URL); // Default GET for top 5
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const top5 = await res.json();

    const container = document.getElementById("top5");
    container.innerHTML = "";
    top5.forEach(([id, name, clicks]) => {
      const wrapper = document.createElement("div");
      // wrapper.classList.add("game-item"); // This class isn't in main.css, but harmless
      
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
  } catch (error) {
    console.error("Failed to load top 5:", error);
    const container = document.getElementById("top5");
    if(container) container.innerHTML = "<p>Could not load top games.</p>";
  }
}

// --- NEW function to load ALL game counts ---
async function loadAllGameCounts() {
  try {
    // This new endpoint param 'action=getAllCounts' needs to be handled by your Google Apps Script
    const res = await fetch(`${API_URL}?action=getAllCounts`);
    if (!res.ok) {
      throw new Error(`Failed to fetch play counts: ${res.statusText}`);
    }
    const allCounts = await res.json(); // Expecting [[id, name, clicks], ...]
    
    window.gamePlayCounts.clear();
    allCounts.forEach(([id, name, clicks]) => {
      // Use the full URL as the key to match links in main.js
      const fullUrl = new URL(id, document.baseURI).href;
      window.gamePlayCounts.set(fullUrl, clicks);
    });
    
    console.log(`Loaded ${window.gamePlayCounts.size} game play counts.`);
    
    // If the sort function is available and current sort is 'plays', re-sort
    if (window.sortGames && window.currentSort === 'plays') {
      window.sortGames();
    }

  } catch (error) {
    console.error("Could not load all game counts:", error);
    // Disable the 'Play Count' sort option as it won't work
    const playsRadio = document.querySelector('.sort-options input[value="plays"]');
    if (playsRadio) {
      playsRadio.disabled = true;
      const label = playsRadio.closest('label');
      if (label) {
        label.style.opacity = '0.5';
        label.style.cursor = 'not-allowed';
        label.title = 'Could not load play count data.';
        const labelText = label.querySelector('.sort-label');
        if (labelText) labelText.textContent = 'Play Count (Error)';
      }
    }
  }
}
// Expose new function to global scope
window.loadAllGameCounts = loadAllGameCounts;
// --------------------------------------------


// Observe DOM changes and auto-attach listeners
function observeSection(selector) {
  const target = document.querySelector(selector);
  if (!target) return;

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element
          // Check if the node itself is an 'a' or contains 'a' tags
          if (node.tagName === 'A') {
            addTrackingListeners("a", node.parentElement); 
          } else {
            addTrackingListeners("a", node); // Add listeners inside new nodes
          }
        }
      });
    });
  });

  observer.observe(target, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTop5();
  loadAllGameCounts(); // <<< --- ADDED THIS CALL

  // Initial attach for existing items
  addTrackingListeners(".game a");
  addTrackingListeners("#recently-played a");
  addTrackingListeners("#favorited-games a");

  // Set up observers for dynamic content
  observeSection("#recently-played");
  observeSection("#favorited-games");
  observeSection("#top5");
});