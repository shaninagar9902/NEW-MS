function placeMines(clickedRow, clickedCol) {
    let minesLeft = gLevel.mines;

    for (let A = 0; A < minesLeft; A++) {
        const i = getRandomIntInclusive(0, gLevel.size - 1);
        const j = getRandomIntInclusive(0, gLevel.size - 1);

        // FIRST CLICKED === EMPTY
        if (gBoard[i][j].isMine) continue;
        if (Math.abs(i - clickedRow) <= 1 &&
            Math.abs(j - clickedCol) <= 1) continue;

        // CONTINUE
        gBoard[i][j].isMine = true;
        minesLeft++;
    }
}

function placeMines(clickedRow, clickedCol) {
    let minesLeft = gLevel.mines;

    while (minesLeft > 0) {
        const i = getRandomIntInclusive(0, gLevel.size - 1);
        const j = getRandomIntInclusive(0, gLevel.size - 1);

        // תנאי חדש: אל תשים מוקש איפה שכבר יש מוקש,
        // ואל תשים מוקש בדיוק במשבצת שלחצו עליה.
        if (gBoard[i][j].isMine || (i === clickedRow && j === clickedCol)) continue;

        gBoard[i][j].isMine = true;
        minesLeft--;
    }
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return;

    const cell = gBoard[i][j];
    if (cell.isShown || cell.isMarked) return;

    if (gGame.isFirstClick) {
        placeMines(i, j);
        setMinesNegsCount(gBoard);
        gGame.isFirstClick = false;
        startTimer();

        // מהלך הקליק הראשון
        cell.isShown = true;
        // אם זה תא ריק, נפתח שכנים אבל לא נבדוק ניצחון עדיין
        if (cell.minesAroundCount === 0) {
            expandShown(gBoard, elCell, i, j);
        }
        renderBoard(gBoard);
        return; // עוצרים כאן כדי שלא ירוץ checkGameOver מיד
    }

    // שאר הלוגיקה הרגילה של לחיצה (מוקשים, חשיפה ובדיקת ניצחון)
    // ...
}

'use strict';

const mine = '💣';
const flag = '🚩';
const clown = '🤡';

let gLevel = {
    size: 4,
    mines: 2,
    lives: 1
};

let gGame;
let gBoard = [];
let gTimerInterval = null;
let gGameHistory = [];
let gIsHintActive = false;

function onInit() {
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        isFirstClick: true,
        lives: gLevel.lives,
        hints: 3
    };

    clearInterval(gTimerInterval);
    gTimerInterval = null;
    gGameHistory = [];


    document.querySelector('.timer').innerText = '⏱ : 0.000';
    document.querySelector('.msg').innerText = 'Minesweeper';

    gBoard = buildBoard();
    renderBoard(gBoard);
    renderFlagsCounter();
    renderLives();
    renderSmiley('normal');
    renderBestScore();
    renderHints();
    gIsHintActive = false;
}

function buildBoard() {
    const board = [];

    for (let i = 0; i < gLevel.size; i++) {
        board[i] = [];
        for (let j = 0; j < gLevel.size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            };
        }
    }
    // setMinesNegsCount(board)
    return board;
}

function setMinesNegsCount(board) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j].isMine) continue;
            let count = 0;
            for (let x = i - 1; x <= i + 1; x++) {
                for (let y = j - 1; y <= j + 1; y++) {
                    if (x < 0 || y < 0 || x >= board.length || y >= board[0].length) continue;
                    if (x === i && y === j) continue;
                    if (board[x][y].isMine) count++;
                }
            }
            board[i][j].minesAroundCount = count;
        }
    }
}

function renderBoard(board) {
    let strHTML = '';

    for (let i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (let j = 0; j < board[i].length; j++) {
            const cell = board[i][j];

            let display = '';
            let cellClass = '';
            if (cell.isShown) {
                cellClass = 'shown';
                if (cell.isMine) display = mine;
                else if (cell.display) display = cell.display;
                else if (cell.minesAroundCount > 0) {
                    display = cell.minesAroundCount;
                    cellClass += ' num' + cell.minesAroundCount;
                }
            } else if (cell.isMarked) {
                display = flag;
            }

            strHTML += `
                <td data-i="${i}" data-j="${j}"
                    onclick="onCellClicked(this, ${i}, ${j})"
                    oncontextmenu="onCellMarked(this); return false;"
                    class="${cellClass}">${display}</td>`;
        }
        strHTML += '</tr>';
    }
    document.querySelector('.board').innerHTML = strHTML;
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    const cell = gBoard[i][j];

    if (gIsHintActive) {
        if (cell.isShown) return;
        revealNeighborsForSecond(i, j);
        gGame.hints--;
        gIsHintActive = false;

        const elActiveHint = document.querySelector('.hint-btn.active');
        if (elActiveHint) {
            elActiveHint.classList.remove('active');
            elActiveHint.classList.add('used');
        }
        return;
    }

    if (cell.isShown || cell.isMarked) return;
    if (!cell.isMine) saveGameState();

    if (gGame.isFirstClick) {
        placeMines(i, j);
        setMinesNegsCount(gBoard);
        gGame.isFirstClick = false;
        startTimer();
    }

    cell.isShown = true;
    gGame.shownCount++;

    if (cell.isMine) {
        console.log(cell.isMine);
        gGame.lives--;
        renderLives();

        if (gGame.lives === 2) {
            renderSmiley('2lives');
        } else if (gGame.lives === 1) {
            renderSmiley('1life');
        }

        if (gGame.lives > 0) {
            cell.isShown = true;
            renderBoard(gBoard);
            return;
        } else {
            gGame.isOn = false;
            revealAllMines();
            clearInterval(gTimerInterval);
            document.querySelector('.msg').innerText = `Game Over! 
            Play again!`;
            // renderBoard(gBoard);
            // renderFlagsCounter();
            renderSmiley('lose');
            return;
        }
    }
    if (cell.minesAroundCount === 0) {
        expandShown(gBoard, elCell, i, j);
    }

    renderBoard(gBoard);
    // renderFlagsCounter();
    checkGameOver();
}

function onCellMarked(elCell) {
    if (!gGame.isOn || gGame.isFirstClick) return;

    const i = +elCell.dataset.i;
    const j = +elCell.dataset.j;

    const cell = gBoard[i][j];
    if (cell.isShown) return;

    if (!cell.isMarked && gGame.markedCount >= gLevel.mines) {
        console.log('No flags left!');
        return;
    }

    cell.isMarked = !cell.isMarked;
    gGame.markedCount += cell.isMarked ? 1 : -1;

    renderBoard(gBoard);
    renderFlagsCounter();
}

function checkGameOver() {
    const totalCells = Math.pow(gLevel.size, 2);
    const safeCells = totalCells - gLevel.mines;

    if (gGame.shownCount === safeCells) {
        gGame.isOn = false;
        clearInterval(gTimerInterval);

        const currTime = (Date.now() - gGame.secsPassed) / 1000;
        const storageKey = `bestScore-${gLevel.size}`;
        const bestTime = localStorage.getItem(storageKey);
        if (!bestTime || currTime < bestTime) {
            localStorage.setItem(storageKey, currTime.toFixed(3));
            renderBestScore();
        }

        revealAllMines();
        document.querySelector('.msg').innerHTML = `Congrats! You won!
        Thanks for playing!`;
        renderSmiley('win');

    }
}

function expandShown(board, elCell, i, j) {
    for (let row = i - 1; row <= i + 1; row++) {
        for (let col = j - 1; col <= j + 1; col++) {
            if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) continue;
            if (row === i && col === j) continue;

            let cell = board[row][col];
            if (cell.isShown || cell.isMine || cell.isMarked) continue;

            cell.isShown = true;
            gGame.shownCount++;

            if (cell.minesAroundCount === 0) {
                expandShown(board, elCell, row, col);
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////

function placeMines(clickedRow, clickedCol) {
    let minesLeft = gLevel.mines;

    for (let a = 0; a < 1000 && minesLeft > 0; a++) {
        const i = getRandomIntInclusive(0, gLevel.size - 1);
        const j = getRandomIntInclusive(0, gLevel.size - 1);

        if (gBoard[i][j].isMine) continue;
        if (Math.abs(i - clickedRow) <= 1 && Math.abs(j - clickedCol) <= 1) continue;

        gBoard[i][j].isMine = true;
        minesLeft--;

        if (minesLeft === 0) break;
    }
}

function useHint(elHint) {
    if (!gGame.isOn || gGame.hints === 0) return;
    if (gIsHintActive) {
        gIsHintActive = false;
        elHint.classList.remove('active');
        return;
    }
    gIsHintActive = true;
    elHint.classList.add('active');
}

function renderFlagsCounter() {
    document.querySelector('.flags-counter').innerText = gLevel.mines - gGame.markedCount;
}

function renderLives() {
    document.querySelector('.lives').innerText = '❤️'.repeat(gGame.lives) || '💔';
}

function renderSmiley(status) {
    const elBtn = document.querySelector('.restart-btn');

    switch (status) {
        case 'win':
            elBtn.innerText = '😎';
            break;
        case 'lose':
            elBtn.innerText = '😵';
            break;
        case '2lives':
            elBtn.innerText = '😒';
            break;
        case '1life':
            elBtn.innerText = '😭';
            break;
        default:
            elBtn.innerText = '😊';
    }
}

function renderBestScore() {
    const storageKey = `bestScore-${gLevel.size}`;
    const bestScore = localStorage.getItem(storageKey);
    const elBestScore = document.querySelector('.best-score-value');

    if (bestScore) {
        elBestScore.innerText = `${bestScore}s`;
    } else {
        elBestScore.innerText = 'None';
    }
}

function renderHints() {
    document.querySelector('.hints-container').innerHTML = `
                        <span class="hint-btn" onclick="useHint(this)">💡</span>
                        <span class="hint-btn" onclick="useHint(this)">💡</span>
                        <span class="hint-btn" onclick="useHint(this)">💡</span>
                        `;
}

function revealNeighborsForSecond(rowIdx, colIdx) {
    const cellsToHideAgain = [];

    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;

            const cell = gBoard[i][j];
            if (!cell.isShown) {
                cell.isShown = true;
                cellsToHideAgain.push(cell);
            }
        }
    }
    renderBoard(gBoard);

    setTimeout(() => {
        cellsToHideAgain.forEach(cell => cell.isShown = false);
        renderBoard(gBoard);
    }, 1000);
}

function revealAllMines() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j];

            // If mine but not flagged -> Show mine
            if (cell.isMine && !cell.isMarked) {
                cell.isShown = true;
            }
            // If flagged but no mine -> Show clown
            else if (!cell.isMine && cell.isMarked) {
                cell.isMarked = false;
                cell.isShown = true;
                cell.display = clown;
            }
            // If mine but flagged -> Show flag
        }
    }
    renderBoard(gBoard);
}

function setLevel(size, mines) {
    gLevel.size = +size;
    gLevel.mines = +mines;
    if (gLevel.size === 4) {
        gLevel.lives = 1;
    } else {
        gLevel.lives = 3;
    }
    restart();
}

function startTimer() {
    if (gTimerInterval) return;
    gGame.secsPassed = Date.now();
    gTimerInterval = setInterval(() => {
        const delta = Date.now() - gGame.secsPassed;
        document.querySelector('.timer').innerText = `⏱ : ${(delta / 1000).toFixed(3)} sec`;
    }, 37);
}

function darkMode() {
    var element = document.body;
    document.body.classList.toggle("dark-mode");

    const elBtn = document.querySelector('.dark-mode-btn');
    if (element.classList.contains("dark-mode")) {
        elBtn.innerText = "Light Mode ☀️";
    } else {
        elBtn.innerText = "Dark Mode 🌓";
    }
}

function saveGameState() {
    const boardCopy = JSON.parse(JSON.stringify(gBoard));
    const gameCopy = { ...gGame };

    gGameHistory.push({
        board: boardCopy,
        game: gameCopy
    });
}

function undo() {
    if (!gGame.isOn || gGameHistory.length === 0) return;
    playClickSound();

    const lastState = gGameHistory.pop();
    gBoard = lastState.board;
    gGame = lastState.game;

    renderBoard(gBoard);
    renderLives();
    renderFlagsCounter();
    renderSmiley('normal');
    renderHints();

    document.querySelector('.safe-click-count').innerText = gGame.safeClicks;
    document.querySelector('.msg').innerText = 'Mineswiper';
}

function restart() {
    onInit();
}

function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

'use strict';
// MUSIC //
let gIsMusicPlaying = false;
let gMusic = new Audio('assets/2.mp3');
gMusic.loop = true;
gMusic.volume = 0.3;

function onInit() {
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        isFirstClick: true,
        lives: gLevel.lives,
        hints: 3,
        safeClicks: 3
    };
    let touchTimer;
    clearInterval(gTimerInterval);
    gTimerInterval = null;
    gGameHistory = [];
    // gMusic.pause();

    document.querySelector('.timer').innerText = '⏱ : 0.000';
    document.querySelector('.msg').innerText = 'Mineswiper';
    document.querySelector('.board').addEventListener('contextmenu', (e) => {
        e.preventDefault()
    });

    gBoard = buildBoard();
    renderBoard(gBoard);
    renderFlagsCounter();
    renderLives();
    renderSmiley('normal');
    renderHints();
    gIsHintActive = false;
    document.querySelector('.safe-click-count').innerText = gGame.safeClicks;
}

function buildBoard() {
    const board = [];

    for (let i = 0; i < gLevel.size; i++) {
        board[i] = [];
        for (let j = 0; j < gLevel.size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            };
        }
    }
    // setMinesNegsCount(board)
    return board;
}

function setMinesNegsCount(board) {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j].isMine) continue;
            let count = 0;
            for (let x = i - 1; x <= i + 1; x++) {
                for (let y = j - 1; y <= j + 1; y++) {
                    if (x < 0 || y < 0 || x >= board.length || y >= board[0].length) continue;
                    if (x === i && y === j) continue;
                    if (board[x][y].isMine) count++;
                }
            }
            board[i][j].minesAroundCount = count;
        }
    }
}

function renderBoard(board) {
    let strHTML = '';

    for (let i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (let j = 0; j < board[i].length; j++) {
            const cell = board[i][j];

            let display = '';
            let cellClass = '';
            if (cell.isShown) {
                cellClass = 'shown';
                if (cell.isMine) display = mine;
                else if (cell.display) display = cell.display;
                else if (cell.minesAroundCount > 0) {
                    display = cell.minesAroundCount;
                    cellClass += ' num' + cell.minesAroundCount;
                }
            } else if (cell.isMarked) {
                display = flag;
            }

            strHTML += `
                <td data-i="${i}" data-j="${j}"
                    onclick="onCellClicked(this, ${i}, ${j})"
                    oncontextmenu="onCellMarked(this); return false;"
                    class="${cellClass}">${display}</td>`;
        }
        strHTML += '</tr>';
    }
    document.querySelector('.board').innerHTML = strHTML;
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return;
    const cell = gBoard[i][j];

    if (gIsHintActive) {
        if (cell.isShown) return;
        playSpecialSound('assets/18.mp3');
        revealNeighborsForSecond(i, j);
        gGame.hints--;
        gIsHintActive = false;

        const elActiveHint = document.querySelector('.hint-btn.active');
        if (elActiveHint) {
            elActiveHint.classList.remove('active');
            elActiveHint.classList.add('used');
        }
        return;
    }

    if (cell.isShown || cell.isMarked) return;

    if (gGame.isFirstClick) {
        if (gIsMusicPlaying) gMusic.play();
        placeMines(i, j);
        setMinesNegsCount(gBoard);
        gGame.isFirstClick = false;
        startTimer();
    } else {
        saveGameState();
    }

    cell.isShown = true;

    if (!cell.isMine) {
        new Audio('assets/20.mp3').play();
    }

    if (cell.isMine) {
        console.log(cell.isMine);
        gGame.lives--;
        renderLives();
        gGameHistory = [];

        if (gGame.lives === 2) {
            renderSmiley('2-hearts');
            playSpecialSound('assets/17.mp3');
        } else if (gGame.lives === 1) {
            playSpecialSound('assets/15.mp3');
            renderSmiley('1-heart');
        }

        if (gGame.lives > 0) {
            renderBoard(gBoard);
            return;
        } else {
            gMusic.pause();
            playSpecialSound('assets/7.wav');
            gGame.isOn = false;
            revealAllMines();
            clearInterval(gTimerInterval);
            document.querySelector('.msg').innerText = `Game Over! 
            Play again!`;
            renderSmiley('lose');
            return;
        }
    } else {
        gGame.shownCount++;
        if (cell.minesAroundCount === 0) {
            expandShown(gBoard, elCell, i, j);
        }
    }
    renderBoard(gBoard);
    checkGameOver();
}

function onCellMarked(elCell) {
    if (!gGame.isOn || gGame.isFirstClick) return;

    const i = +elCell.dataset.i;
    const j = +elCell.dataset.j;

    const cell = gBoard[i][j];
    if (cell.isShown) return;

    saveGameState();

    if (!cell.isMarked && gGame.markedCount >= gLevel.mines) {
        gGameHistory.pop();
        console.log('No flags left!');
        return;
    }

    cell.isMarked = !cell.isMarked;
    playSpecialSound('assets/8.mp3');
    gGame.markedCount += cell.isMarked ? 1 : -1;

    renderBoard(gBoard);
    renderFlagsCounter();
}

function checkGameOver() {
    const totalCells = Math.pow(gLevel.size, 2);
    const safeCells = totalCells - gLevel.mines;

    if (gGame.shownCount === safeCells) {
        gMusic.pause();
        playSpecialSound('assets/6.wav');
        gGame.isOn = false;
        clearInterval(gTimerInterval);
        revealAllMines();
        document.querySelector('.msg').innerHTML = `Congrats! You won!
        Thanks for playing!`;
        renderSmiley('win');

    }
}

function expandShown(board, elCell, i, j) {
    for (let row = i - 1; row <= i + 1; row++) {
        for (let col = j - 1; col <= j + 1; col++) {
            if (row < 0 || col < 0 || row >= board.length || col >= board[0].length) continue;
            if (row === i && col === j) continue;

            let cell = board[row][col];
            if (cell.isShown || cell.isMine || cell.isMarked) continue;

            cell.isShown = true;
            gGame.shownCount++;

            if (cell.minesAroundCount === 0) {
                expandShown(board, elCell, row, col);
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////

function placeMines(clickedRow, clickedCol) {
    let minesLeft = gLevel.mines;

    for (let A = 0; A < 1000 && minesLeft > 0; A++) {
        const i = getRandomIntInclusive(0, gLevel.size - 1);
        const j = getRandomIntInclusive(0, gLevel.size - 1);

        if (gBoard[i][j].isMine) continue;
        if (Math.abs(i - clickedRow) <= 1 && Math.abs(j - clickedCol) <= 1) continue;

        gBoard[i][j].isMine = true;
        minesLeft--;

        if (minesLeft === 0) break;
    }
}

function useHint(elHint) {
    if (!gGame.isOn || gGame.isFirstClick || gGame.hints === 0) return;
    if (gIsHintActive) {
        gIsHintActive = false;
        elHint.classList.remove('active');
        return;
    }
    gIsHintActive = true;
    playSpecialSound('assets/19.mp3');
    elHint.classList.add('active');
}

function renderFlagsCounter() {
    document.querySelector('.flags-counter').innerText = gLevel.mines - gGame.markedCount;
}

function renderLives() {
    document.querySelector('.lives').innerText = '📰'.repeat(gGame.lives) || '🪠';
}

function renderSmiley(status) {
    const elBtn = document.querySelector('.restart-btn');

    switch (status) {
        case 'win':
            elBtn.innerText = '😎';
            break;
        case 'lose':
            elBtn.innerText = '😵';
            break;
        case '2-hearts':
            elBtn.innerText = '😒';
            break;
        case '1-heart':
            elBtn.innerText = '😭';
            break;
        default:
            elBtn.innerText = '😊';
    }
}

function renderHints() {
    document.querySelector('.hints-container').innerHTML = `
                        <span class="hint-btn" onclick="useHint(this)">💡</span>
                        <span class="hint-btn" onclick="useHint(this)">💡</span>
                        <span class="hint-btn" onclick="useHint(this)">💡</span>
                        `;
}

function revealNeighborsForSecond(rowIdx, colIdx) {
    const cellsToHideAgain = [];

    for (let i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;

            const cell = gBoard[i][j];
            if (!cell.isShown) {
                cell.isShown = true;
                cellsToHideAgain.push(cell);
            }
        }
    }
    renderBoard(gBoard);

    setTimeout(() => {
        cellsToHideAgain.forEach(cell => cell.isShown = false);
        renderBoard(gBoard);
    }, 1400);
}

function revealAllMines() {
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j];

            // If mine but not flagged -> Show mine
            if (cell.isMine && !cell.isMarked) {
                cell.isShown = true;
            }
            // If flagged but no mine -> Show clown
            else if (!cell.isMine && cell.isMarked) {
                cell.isMarked = false;
                cell.isShown = true;
                cell.display = '🤡';
            }
            // If mine but flagged -> Show flag
        }
    }
    renderBoard(gBoard);
}

function setLevel(size, mines) {
    playClickSound();
    gLevel.size = +size;
    gLevel.mines = +mines;
    if (gLevel.size === 4) {
        gLevel.lives = 1;
    } else {
        gLevel.lives = 3;
    }
    restart();
}

function startTimer() {
    if (gTimerInterval) return;
    gGame.secsPassed = Date.now();
    gTimerInterval = setInterval(() => {
        const delta = Date.now() - gGame.secsPassed;
        const totalSeconds = delta / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = (totalSeconds % 60).toFixed(3);
        const timeStr = minutes > 0 ?
            `${minutes}:${seconds.padStart(6, '0')}` :
            `${seconds}`;
        document.querySelector('.timer').innerText = `⏱ : ${timeStr}`;
    }, 37);
}

function darkMode() {
    var element = document.body;
    document.body.classList.toggle("dark-mode");

    const elBtn = document.querySelector('.dark-mode-btn');
    if (element.classList.contains("dark-mode")) {
        elBtn.innerText = "☀️";
        playSpecialSound('assets/10.mp3');
    } else {
        elBtn.innerText = "🌓";
        playClickSound();
    }
}

function saveGameState() {
    const boardCopy = JSON.parse(JSON.stringify(gBoard));
    const gameCopy = { ...gGame };

    gGameHistory.push({
        board: boardCopy,
        game: gameCopy
    });
}

function undo() {
    if (!gGame.isOn || gGameHistory.length === 0) return;
    playClickSound();

    const lastState = gGameHistory.pop();
    gBoard = lastState.board;
    gGame = lastState.game;

    if (!gGame.isOn && gGame.lives > 0) {
        gGame.isOn = true;
        startTimer();
    }

    if (gGame.isOn) {
        if (!gTimerInterval) {
            const timeAlreadyPassed = lastState.game.secsPassed;
            startTimer();
        }
    }

    renderBoard(gBoard);
    renderLives();
    renderFlagsCounter();
    renderSmiley('normal');
    renderHints();

    document.querySelector('.safe-click-count').innerText = gGame.safeClicks;
    document.querySelector('.msg').innerText = 'Mineswiper';
}

function onSafeClick() {
    if (!gGame.isOn || gGame.safeClicks <= 0) return;
    const safeCandidates = [];

    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[0].length; j++) {
            const cell = gBoard[i][j];
            if (!cell.isShown && !cell.isMine && !cell.isMarked) {
                safeCandidates.push({ i, j });
            }
        }
    }

    if (safeCandidates.length === 0) return;
    playClickSound();

    const randIdx = getRandomIntInclusive(0, safeCandidates.length - 1);
    const pos = safeCandidates[randIdx];

    gGame.safeClicks--;
    document.querySelector('.safe-click-count').innerText = gGame.safeClicks;

    const elCell = document.querySelector(`[data-i="${pos.i}"][data-j="${pos.j}"]`);
    elCell.classList.add('safe-click-highlight');
    setTimeout(() => {
        elCell.classList.remove('safe-click-highlight');
    }, 2000);
}

function playClickSound() {
    gMusic.volume = 0.05;
    const ad = new Audio('assets/3.mp3');
    ad.play();
    ad.onended = () => gMusic.volume = 0.3;
}

function playSpecialSound(path) {
    gMusic.volume = 0.05;
    const ad = new Audio(path);
    ad.play();
    ad.onended = () => gMusic.volume = 0.3;
}

function toggleMusic() {
    const elBtn = document.querySelector('.music-btn');

    if (!gIsMusicPlaying) {
        gMusic.play().catch(err => {
            console.log("Interaction required to play audio");
        });
        elBtn.innerText = '🔊';
        gIsMusicPlaying = true;
    } else {
        gMusic.pause();
        elBtn.innerText = '🔇';
        gIsMusicPlaying = false;
    }
}

function handleTouchStart(el, i, j) {
    touchTimer = setTimeout(() => {
        onCellMarked(el);
    }, 500);
}

function handleTouchEnd() {
    clearTimeout(touchTimer);
}

function restart() {
    playClickSound();
    onInit();
}

function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}