var sortAscending = false;
const sortbtn = document.getElementById('sortToggle');
const gamesContainer = document.getElementById("games-container");
const originalOrder = Array.from(gamesContainer.getElementsByClassName("game"));
const gamesCount = document.getElementById("count");


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
