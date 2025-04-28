var sortAscending = false;
const sortbtn = document.getElementById('sortToggle');
const gamesContainer = document.getElementById("games-container");
const originalOrder = Array.from(gamesContainer.getElementsByClassName("game"));
const gamesCount = document.getElementById("count");
const games = gamesContainer.getElementsByClassName('game');
gamesCount.textContent = String(games.length+1)

console.log("Whatever you're doing in here is probably not going to work since you are not very smart (no offense) :(");


function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function filterGames() {
    const searchInput = document.querySelector('.search-input');
    const games = gamesContainer.getElementsByClassName('game');
    
    const searchTerm = searchInput.value.toLowerCase();

    for (const game of games) {
        const gameText = game.querySelector('.gametxt').textContent.toLowerCase();
        if (gameText.includes(searchTerm)) {
            game.style.display = 'block';
        } else {
            game.style.display = 'none';
        }
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

// List of allowed game directory prefixes
const gameDirectories = ['/games/', '/games_2/', '/games_3/']; // Add more here if needed

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

document.addEventListener('DOMContentLoaded', function() {
  game_container.addEventListener('click', function(event) {
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

  loadRecentlyPlayed();
});

function loadRecentlyPlayed() {
    const recentGames = JSON.parse(localStorage.getItem('recentGames')) || [];
    const container = document.getElementById('recently-played');
  
    if (!container) return;
  
    container.innerHTML = ''; // Clear old content
  
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


loadRecentlyPlayed();


window.addEventListener('pageshow', function(event) {
  if (event.persisted) {
    // Page was restored from bfcache, re-load the recent games
    loadRecentlyPlayed();
  }
});
