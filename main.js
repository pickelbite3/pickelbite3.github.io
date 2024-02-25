var sortAscending = false;
const sortbtn = document.getElementById('sortToggle');

function filterGames() {
    const searchInput = document.querySelector('.search-input');
    const gamesContainer = document.getElementById('games-container');
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
    var gamesContainer = document.getElementById("games-container");
    var games = Array.from(gamesContainer.getElementsByClassName("game"));

    sortAscending = !sortAscending;

    if (sortAscending) {
        sortbtn.innerHTML = "A-Z";
        games.sort((a, b) => a.textContent.localeCompare(b.textContent));
    } else {
        sortbtn.innerHTML = "New - Old";
        games.reverse();
    }

    gamesContainer.innerHTML = "";

    games.forEach(game => {
        gamesContainer.appendChild(game);
    });
}
