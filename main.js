var sortAscending = false;
const sortbtn = document.getElementById('sortToggle');
const gamesContainer = document.getElementById("games-container");
const originalOrder = Array.from(gamesContainer.getElementsByClassName("game"));
const gamesCount = document.getElementById("count");


console.log(originalOrder);


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

function pickRandom() {
    rnum = getRndInteger(0, parseInt(gamesCount.textContent))
    rnum--;

    // get the numbered game in the list, generate link for that game, go to it by setting rgame to it

    game = originalOrder[rnum];
    console.log(game)

    var htmlString = game.innerHTML;

    // Create a temporary DOM element
    var tempElement = document.createElement('div');
    
    // Set the innerHTML of the temporary element to the HTML string
    tempElement.innerHTML = htmlString;
    
    // Extract the href attribute from the first 'a' tag within the temporary element
    var link = tempElement.querySelector('a').getAttribute('href');
    
    // Output the link
    console.log(link); // Outputs: /games/roadblocks/index.html

    window.location = link;
}