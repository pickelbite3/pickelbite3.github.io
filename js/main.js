const gamesContainer = document.getElementById('games-container')
const recentContainer = document.getElementById('recently-played')
const favoritesContainer = document.getElementById('favorited-games')
const gameDirs = ['/games/', '/games_2/', '/games_3/', '/games_4/']
const originalOrder = Array.from(gamesContainer.querySelectorAll('.game'))
const input = document.querySelector('.search-input')
const search_results = document.getElementById('search-results');

// --- NEW Sort variables ---
window.currentSort = 'new'; // 'new', 'az', 'plays'
let sortRadios; // Will be assigned in DOMContentLoaded
// --------------------------

/**
 * Normalizes a URL to its relative path if it matches a game directory.
 * This function must be identical to the one in trackgames.js for key consistency.
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
            // Return only the path, stripping query/hash for consistent keys
            return pathname;
        }
    } catch (e) {
        // Handle case where fullUrl is malformed and URL() constructor fails
        return null;
    }
    
    return null; // Ignore external links
}


function updateCount() {
  const count = gamesContainer.querySelectorAll('.game').length
  input.placeholder = "Search " + count + " games" 
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function filterGames() {
  
  if (!input || !search_results) return;

  const term = input.value.trim().toLowerCase();
  const list = gamesContainer.querySelectorAll('.game');
  const topResults = []; // To store the top 5 matches

  // 1. Clear previous dropdown results
  search_results.innerHTML = '';

  // 2. If search is empty, hide dropdown and show all games
  if (term.length === 0) {
    search_results.style.display = 'none';
    list.forEach(g => {
      g.style.display = ''; // Show all games in the main list
    });
    return; // We're done
  }

  // 3. Filter main list AND find top 5 results
  list.forEach(g => {
    const txt = (g.querySelector('.gametxt')?.textContent || '').toLowerCase();
    const isMatch = txt.includes(term);

    // Filter the main list (like before)
    g.style.display = isMatch ? '' : 'none';

    // Add to our dropdown list (up to 5)
    if (isMatch && topResults.length < 5) {
      topResults.push(g);
    }
  });

  // 4. Render the top 5 results into the dropdown
  if (topResults.length > 0) {
    topResults.forEach(game => {
      const link = game.querySelector('a.gametxt');
      if (!link) return;

      // Create a new <p> element to hold the result
      const p = document.createElement('p');
      p.className = 'search-result-item'; // For styling if you want
      
      // Clone the link so we don't affect the original
      const newLink = link.cloneNode(true); 
      
      p.appendChild(newLink);
      search_results.appendChild(p);
    });
    
    // Show the results dropdown
    search_results.style.display = 'block';
  } else {
    // No results found, hide the dropdown
    search_results.style.display = 'none';
  }
}

// --- REPLACED toggleSort() with sortGames() ---
function sortGames(forceSortType) {
  const sortTypeInput = document.querySelector('.sort-options input[name="sort"]:checked');
  
  // 1. Determine sort type: use forced type, otherwise checked radio, otherwise default to 'new'
  const sortType = forceSortType || (sortTypeInput ? sortTypeInput.value : 'new'); 
  
  window.currentSort = sortType;
  const games = Array.from(gamesContainer.querySelectorAll('.game'));
  
  if (games.length === 0) {
      console.warn("[SORT] No game elements found to sort.");
      return;
  }

  if (sortType === 'new') {
    // Re-add games in their original HTML order
    originalOrder.forEach(g => gamesContainer.appendChild(g));
  } else if (sortType === 'az') {
    // Sort A-Z
    games.sort((a, b) => {
      const an = a.querySelector('.gametxt')?.textContent || '';
      const bn = b.querySelector('.gametxt')?.textContent || '';
      return an.localeCompare(bn, undefined, { sensitivity: 'base' });
    });
    // Append sorted games
    games.forEach(g => gamesContainer.appendChild(g));
  } else if (sortType === 'plays') {
    // Sort by play count (descending)
    
    // Check if data is available before sorting
    if (!window.gamePlayCounts || window.gamePlayCounts.size === 0) {
        console.warn("[SORT:PLAYS] Play count data not available for sorting. Skipping reorder.");
        return; 
    }

    games.sort((a, b) => {
      const aLinkElement = a.querySelector('a');
      const bLinkElement = b.querySelector('a');
      
      if (!aLinkElement || !bLinkElement) {
          return 0; 
      }

      // Use normalizeGameUrl to get the exact relative path key (which strips query/hash)
      const aPath = normalizeGameUrl(aLinkElement.getAttribute('href') || '');
      const bPath = normalizeGameUrl(bLinkElement.getAttribute('href') || '');
      
      // If a path is invalid or null (e.g., external link not in database), treat count as 0
      const aPlays = aPath ? (window.gamePlayCounts.get(aPath) || 0) : 0;
      const bPlays = bPath ? (window.gamePlayCounts.get(bPath) || 0) : 0;
      
      // Sort descending (highest plays first)
      return bPlays - aPlays;
    });
    
    // Append sorted games (This is the DOM manipulation step that performs the reorder)
    games.forEach(g => gamesContainer.appendChild(g));
  }
}
// Expose to global scope (for trackgames.js to call if needed)
window.sortGames = sortGames; 
// -----------------------------------------------

function pickRandom() {
  const visibleGames = Array.from(gamesContainer.querySelectorAll('.game')).filter(g => g.style.display !== 'none')
  if (!visibleGames.length) return
  const idx = getRndInteger(0, visibleGames.length - 1)
  const link = visibleGames[idx].querySelector('a')
  if (!link) return
  const href = link.getAttribute('href')
  saveRecentlyPlayed(link.textContent.trim() || href.split('/').pop().replace('.html', ''), href)
  window.location.href = href
}

function saveRecentlyPlayed(name, url) {
  const key = 'recentGames'
  const max = 5
  const stored = JSON.parse(localStorage.getItem(key) || '[]')
  const filtered = stored.filter(g => g.url !== url)
  filtered.unshift({ name, url })
  localStorage.setItem(key, JSON.stringify(filtered.slice(0, max)))
  renderRecentlyPlayed()
}

function loadRecentlyPlayed() {
  renderRecentlyPlayed()
}

function renderRecentlyPlayed() {
  if (!recentContainer) return
  const list = JSON.parse(localStorage.getItem('recentGames') || '[]')
  recentContainer.innerHTML = ''
  if (!list.length) {
    recentContainer.innerHTML = '<p>No games played yet.</p>'
    return
  }
  list.forEach(g => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.className = 'gametxt';
    a.href = g.url;
    a.textContent = g.name;
    p.appendChild(a);
    p.classList.add('recent-game');
    recentContainer.appendChild(p);
  })
}

function loadStarredGames() {
  return JSON.parse(localStorage.getItem('starredGames') || '[]')
}

function saveStarredGames(arr) {
  localStorage.setItem('starredGames', JSON.stringify(arr))
}

function ensureMainStars() {
  const games = gamesContainer.querySelectorAll('.game')
  const starred = loadStarredGames()
  games.forEach(game => {
    const link = game.querySelector('.gametxt')
    if (!link) return
    const already = game.querySelector('.fav-star')
    if (already) {
      const name = link.textContent.trim()
      already.classList.toggle('fa-solid', starred.includes(name))
      already.classList.toggle('fa-regular', !starred.includes(name))
      return
    }
    const star = document.createElement('i')
    star.className = 'fa-star fa-lg fa-clickable fav-star'
    star.style.marginRight = '8px'
    star.style.cursor = 'pointer'
    const name = link.textContent.trim()
    star.classList.toggle('fa-solid', starred.includes(name))
    star.classList.toggle('fa-regular', !star.classList.contains('fa-solid'))
    link.parentElement.insertBefore(star, link)
  })
}

function renderFavorites() {
  if (!favoritesContainer) return
  const starred = loadStarredGames()
  const allGames = Array.from(gamesContainer.querySelectorAll('.game'))
  favoritesContainer.innerHTML = ''
  if (!starred.length) {
    favoritesContainer.innerHTML = '<p>No favorites yet.</p>'
    return
  }
  starred.forEach(name => {
    const match = allGames.find(g => (g.querySelector('.gametxt')?.textContent || '').trim() === name)
    if (!match) return
    const link = match.querySelector('.gametxt')
    const p = document.createElement('p')
    p.className = 'favorite-game'
    const star = document.createElement('i')
    star.className = 'fa-star fa-lg fa-clickable fav-star'
    star.style.marginRight = '8px'
    star.style.cursor = 'pointer'
    star.classList.add('fa-solid')
    const a = document.createElement('a')
    a.className = 'gametxt'
    a.href = link.getAttribute('href')
    a.textContent = name
    p.appendChild(star)
    p.appendChild(a)
    favoritesContainer.appendChild(p)
  })
}

function toggleStarByName(gameName) {
  const starred = loadStarredGames()
  const isStarred = starred.includes(gameName)
  if (isStarred) {
    const newList = starred.filter(n => n !== gameName)
    saveStarredGames(newList)
  } else {
    starred.push(gameName)
    saveStarredGames(starred)
  }
  ensureMainStars()
  renderFavorites()
}

function handleContainerClicks(e) {
  const star = e.target.closest('.fav-star')
  if (star) {
    e.preventDefault()
    e.stopPropagation()
    const parent = star.parentElement
    const name = (parent.querySelector('.gametxt')?.textContent || '').trim()
    if (!name) return
    toggleStarByName(name)
    return
  }
  const link = e.target.closest('a')
  if (link) {
    const href = link.getAttribute('href') || ''
    if (gameDirs.some(d => href.includes(d))) {
      const name = link.textContent.trim() || decodeURIComponent(href.split('/').pop().replace('.html', ''))
      saveRecentlyPlayed(name, href)
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCount()
  ensureMainStars()
  renderFavorites()
  loadRecentlyPlayed()
  gamesContainer.addEventListener('click', handleContainerClicks)
  if (favoritesContainer) favoritesContainer.addEventListener('click', handleContainerClicks)
  
  const search = document.querySelector('.search-input');
  if (search) {
    // Run the filter function when user types
    search.addEventListener('input', filterGames);
    search.addEventListener('focus', filterGames);

    // Add listener for "Enter" key
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Stop default behavior
        
        // Find the very first link in our results
        const firstResultLink = search_results.querySelector('.search-result-item a');
        
        if (firstResultLink) {
          const href = firstResultLink.getAttribute('href');
          const name = firstResultLink.textContent.trim();
          
          saveRecentlyPlayed(name, href);
          window.location.href = href;
        }
      }
    });
  }

  // Hide results dropdown if user clicks anywhere else
  window.addEventListener('click', (e) => {
    const searchBarWrapper = document.getElementById('seachbar');
    // If the click is outside the search wrapper
    if (searchBarWrapper && !searchBarWrapper.contains(e.target)) {
      if (search_results) {
        search_results.style.display = 'none';
      }
    }
  });

  // --- ADD new listeners for radio buttons ---
  sortRadios = document.querySelectorAll('.sort-options input[name="sort"]');
  sortRadios.forEach(radio => {
    // We pass null here so sortGames() will read from the radio button
    radio.addEventListener('change', () => sortGames(null));
  });
  // -----------------------------------------

  window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
      ensureMainStars()
      renderFavorites()
      renderRecentlyPlayed()
    }
  })

  // We rely on trackgames.js to call sortGames once the play count data is loaded.
  // We do NOT call sortGames here on DOMContentLoaded.

})

window.pickRandom = pickRandom
window.filterGames = filterGames
window.closeAlert = function () { const a = document.querySelector('.alert'); if (a) a.style.display = 'none' }
window.closeNewsletter = function () { const n = document.querySelector('.newsletter'); if (n) n.style.display = 'none' }