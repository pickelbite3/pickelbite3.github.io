var sortAscending = false;
const sortbtn = document.getElementById('sortToggle');
const gamesContainer = document.getElementById("games-container");
const originalOrder = Array.from(gamesContainer.getElementsByClassName("game"));
const gamesCount = document.getElementById("count");
const games = gamesContainer.getElementsByClassName('game');
gamesCount.textContent = String(games.length + 1);

console.log("Whatever you're doing in here is probably not going to work since you are not very smart (no offense) :(");

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function filterGames() {
  const searchInput = document.querySelector('.search-input');
  const games = gamesContainer.getElementsByClassName('game');
  const searchTerm = searchInput.value.toLowerCase();

  for (const game of games) {
    const gameText = game.querySelector('.gametxt').textContent.toLowerCase();
    game.style.display = gameText.includes(searchTerm) ? 'block' : 'none';
  }
}

function toggleSort() {
  var games = Array.from(gamesContainer.getElementsByClassName("game"));

  sortAscending = !sortAscending;

  if (sortAscending) {
    sortbtn.innerHTML = "A-Z";
    games.sort((a, b) => a.querySelector('.gametxt').textContent.localeCompare(b.querySelector('.gametxt').textContent));
  } else {
    sortbtn.innerHTML = "New - Old";
    games = originalOrder.slice();
  }

  gamesContainer.innerHTML = "";
  games.forEach(game => {
    gamesContainer.appendChild(game);
  });
}

function closeAlert() {
  const alertBox = document.querySelector(".alert");
  alertBox.style.display = "none";
}

function closeNewsletter() {
  const newsletterBox = document.querySelector(".newsletter");
  newsletterBox.style.display = "none";
}

function pickRandom() {
  rnum = getRndInteger(0, parseInt(gamesCount.textContent))
  rnum--;
  game = originalOrder[rnum];

  var htmlString = game.innerHTML;
  var tempElement = document.createElement('div');
  tempElement.innerHTML = htmlString;

  var link = tempElement.querySelector('a').getAttribute('href');
  window.location = link;
}

const game_container = document.getElementById("games-container")

const gameDirectories = ['/games/', '/games_2/', '/games_3/'];

function saveRecentlyPlayed(gameName, gameUrl) {
  let recentGames = JSON.parse(localStorage.getItem('recentGames')) || [];

  recentGames = recentGames.filter(game => game.url !== gameUrl);
  recentGames.unshift({ name: gameName, url: gameUrl });
  recentGames = recentGames.slice(0, 5);

  localStorage.setItem('recentGames', JSON.stringify(recentGames));
}

function isGameLink(url) {
  return gameDirectories.some(dir => url.includes(dir));
}

document.addEventListener('DOMContentLoaded', function () {
  game_container.addEventListener('click', function (event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    if (isGameLink(href)) {
      let gameName = link.textContent.trim();

      if (!gameName) {
        const urlParts = href.split('/');
        gameName = decodeURIComponent(urlParts[urlParts.length - 1].replace('.html', ''));
      }

      saveRecentlyPlayed(gameName, href);
    }
  });

  setupStarIcons();
  loadRecentlyPlayed();
  loadFavoritedGames();
});

function loadRecentlyPlayed() {
  const recentGames = JSON.parse(localStorage.getItem('recentGames')) || [];
  const container = document.getElementById('recently-played');

  if (!container) return;

  container.innerHTML = '';

  if (recentGames.length === 0) {
    container.innerHTML = '<p>No games played yet.</p>';
    return;
  }

  recentGames.forEach(game => {
    const item = document.createElement('p');
    item.innerHTML = `<a class="gametxt" href="${game.url}">${game.name}</a>`;
    container.appendChild(item);
  });
}

// FAVORITES

function loadStarredGames() {
  return JSON.parse(localStorage.getItem('starredGames') || '[]');
}

function saveStarredGames(starred) {
  localStorage.setItem('starredGames', JSON.stringify(starred));
}

function toggleStar(gameName, starElement) {
  let starredGames = loadStarredGames();
  const isStarred = starredGames.includes(gameName);

  if (isStarred) {
    starredGames = starredGames.filter(name => name !== gameName);
    starElement.classList.remove('fa-solid');
    starElement.classList.add('fa-regular');
  } else {
    starredGames.push(gameName);
    starElement.classList.remove('fa-regular');
    starElement.classList.add('fa-solid');
  }

  saveStarredGames(starredGames);
  loadFavoritedGames();
}

function setupStarIcons() {
  const games = document.querySelectorAll('#games-container .game');
  const starredGames = loadStarredGames();

  games.forEach(game => {
    const link = game.querySelector('.gametxt');
    if (!link) return;

    const gameName = link.textContent.trim();
    const star = document.createElement('i');
    star.classList.add('fa-star', 'fa-lg', 'fa-clickable', 'fav-star');

    if (starredGames.includes(gameName)) {
      star.classList.add('fa-solid');
    } else {
      star.classList.add('fa-regular');
    }

    star.style.marginRight = '8px';
    star.style.cursor = 'pointer';

    star.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleStar(gameName, star);
    });

    // Insert star before the link
    link.parentElement.insertBefore(star, link);
  });
}

function loadFavoritedGames() {
  const favoritesContainer = document.getElementById('favorited-games');
  if (!favoritesContainer) return;

  const starredGames = loadStarredGames();
  const allGames = document.querySelectorAll('#games-container .game');

  favoritesContainer.innerHTML = '';

  if (starredGames.length === 0) {
    favoritesContainer.innerHTML = '<p>No favorites yet.</p>';
    return;
  }

  starredGames.forEach(starredName => {
    for (const game of allGames) {
      const link = game.querySelector('.gametxt');
      if (link && link.textContent.trim() === starredName) {
        const href = link.getAttribute('href');

        const item = document.createElement('p');
        const star = document.createElement('i');
        star.classList.add('fa-star', 'fa-lg', 'fa-clickable', 'fav-star');
        star.style.marginRight = '8px';
        star.style.cursor = 'pointer';

        if (starredGames.includes(starredName)) {
          star.classList.add('fa-solid');
        } else {
          star.classList.add('fa-regular');
        }

        star.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          toggleStar(starredName, star);
        });

        const linkEl = document.createElement('a');
        linkEl.href = href;
        linkEl.textContent = starredName;
        linkEl.classList.add('gametxt');

        item.appendChild(star);
        item.appendChild(linkEl);
        favoritesContainer.appendChild(item);
        break;
      }
    }
  });
}

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    loadRecentlyPlayed();
    loadFavoritedGames();
  }
});
