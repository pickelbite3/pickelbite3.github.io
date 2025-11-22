// https://script.google.com/macros/s/AKfycbyArT9q9glV9pLn5Xy3KcJ7OVZXZNxvnfVUPOyRmQsh89JZg-vawoOJiPkay3rKkEjZow/exec
const API_URL = "https://script.google.com/macros/s/AKfycbyArT9q9glV9pLn5Xy3KcJ7OVZXZNxvnfVUPOyRmQsh89JZg-vawoOJiPkay3rKkEjZow/exec";

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
      // Use the normalized path (href) as the unique ID for the backend
      const gameId = normalizeGameUrl(link.href);
      const gameName = link.textContent.trim();
      
      if (gameId) {
          link.addEventListener("click", () => {
            trackClick(gameId, gameName);
          });
          link.dataset.trackingAttached = "true";
      }
    }
  });
}

/**
 * Normalizes a URL to its relative path if it matches a game directory.
 * This function must be identical to the one in main.js for key consistency.
 */
function normalizeGameUrl(fullUrl) {
    const GAME_DIRS = ['/games/', '/games_2/', '/games_3/', '/games_4/'];
    
    // If the URL is already a simple path (like /games/example/index.html), use it.
    if (fullUrl.startsWith('/') && GAME_DIRS.some(dir => fullUrl.startsWith(dir))) {
        return fullUrl.split(/[?#]/)[0]; // Remove query/hash
    }

    // Resolve the full URL against the document's base URL
    try {
        const url = new URL(fullUrl, document.baseURI);
        const pathname = url.pathname;
        
        // Check if the path starts with any of the known game directories
        if (GAME_DIRS.some(dir => pathname.startsWith(dir))) {
            // Return only the path (query is intentionally stripped for consistent tracking keys)
            return pathname;
        }
    } catch (e) {
        // Handle case where fullUrl is malformed and URL() constructor fails
        return null;
    }
    
    return null; // Ignore external links
}


// Load game play counts for sorting
async function loadGamePlayCounts() {
    try {
        const res = await fetch(`${API_URL}?action=getAllCounts`); 
        
        if (!res.ok) {
             throw new Error(`Failed to fetch counts: ${res.statusText}`);
        }
        
        const counts = await res.json(); // Array of [gamePath, name, playCount]
        
        // Initialize the global map
        window.gamePlayCounts = new Map();
        counts.forEach(([path, name, count]) => {
            // Ensure path is normalized (though it should be from the server)
            const gamePath = normalizeGameUrl(path);
            if(gamePath) {
                // We parse the count to ensure it's a number
                window.gamePlayCounts.set(gamePath, parseInt(count, 10) || 0);
            }
        });
        
        console.log(`Loaded ${window.gamePlayCounts.size} game play counts.`);
        
        // --- DEBUG OVERRIDE BLOCK REMOVED ---
        
        // NOW THAT DATA IS READY, we check if sortGames exists and trigger it.
        if (typeof window.sortGames === 'function') {
            
            // 1. Manually check the 'plays' radio button in the UI
            const playsRadio = document.querySelector('.sort-options input[value="plays"]');
            if (playsRadio) {
                playsRadio.checked = true;
            } else {
                // Fallback: If 'plays' isn't available, check 'new'
                const newRadio = document.querySelector('.sort-options input[value="new"]');
                if (newRadio) newRadio.checked = true;
            }
            
            // 2. Force the sort type to 'plays' when calling sortGames
            setTimeout(() => {
                window.sortGames('plays');
            }, 100);
        } else {
            console.warn("window.sortGames not defined. Cannot trigger initial sort.");
        }

    } catch (e) {
        console.error("Failed to load game play counts:", e);
        window.gamePlayCounts = new Map();
    }
}

// Load top 5 on page load
async function loadTop5() {
  try {
      const res = await fetch(API_URL); // Default GET for Top 5
      if (!res.ok) {
           throw new Error(`Failed to fetch Top 5: ${res.statusText}`);
      }
      const top5 = await res.json();

      const container = document.getElementById("top5");
      container.innerHTML = "";
      top5.forEach(([id, name, clicks]) => {
        const wrapper = document.createElement("div");

        const a = document.createElement("a");
        a.textContent = name;
        a.href = id; // This 'id' is the relative path from the server

        const count = document.createElement("span");
        count.textContent = `${clicks}`;
        count.classList.add("play-count");

        wrapper.appendChild(a);
        wrapper.appendChild(count);
        container.appendChild(wrapper);
      });

      addTrackingListeners("#top5 a");
  } catch (e) {
       console.error("Failed to load top 5:", e);
       const container = document.getElementById("top5");
       if (container) container.innerHTML = "<p>Error loading top games.</p>";
  }
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
  loadGamePlayCounts(); // Load all counts first and trigger sort when done
  loadTop5();

  // Initial attach for existing items
  addTrackingListeners(".game a");
  addTrackingListeners("#recently-played a");
  addTrackingListeners("#favorited-games a");

  // Set up observers for dynamic content
  observeSection("#recently-played");
  observeSection("#favorited-games");
  observeSection("#top5"); // Added observer for top5 as well
});