// Game configuration
const config = {
    size: 4, // 4x4 grid
    winValue: 2048,
    localStorageKey: 'espresso2048_highscore'
};

// Game state
let board = [];
let score = 0;
let highScore = 0;
let win = false;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// DOM elements
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score-display');
const restartButton = document.getElementById('restart-button');
const gameMessage = document.getElementById('game-message');
const messageText = document.getElementById('message-text');
const continueButton = document.getElementById('continue-button');
const newGameButton = document.getElementById('new-game-button');

// Initialize the game
function initGame() {
    // Clear the board
    board = Array(config.size).fill().map(() => Array(config.size).fill(0));
    score = 0;
    win = false;
    updateScore();
    
    // Load high score from local storage
    loadHighScore();
    
    // Clear the game board UI
    gameBoard.innerHTML = '';
    
    // Hide game message
    gameMessage.classList.remove('show');
    
    // Create the grid cells
    for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
            const cell = document.createElement('div');
            cell.classList.add('tile');
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameBoard.appendChild(cell);
        }
    }
    
    // Add initial tiles
    addRandomTile();
    addRandomTile();
    
    // Update the board display
    updateBoard();
}

// Load high score from local storage
function loadHighScore() {
    const savedHighScore = localStorage.getItem(config.localStorageKey);
    if (savedHighScore) {
        highScore = parseInt(savedHighScore);
        highScoreElement.textContent = highScore;
    }
}

// Save high score to local storage
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem(config.localStorageKey, highScore.toString());
    }
}

// Add a random tile (2 or 4) to an empty cell
function addRandomTile() {
    const emptyCells = [];
    
    // Find all empty cells
    for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
            if (board[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }
    
    // If there are empty cells, add a new tile
    if (emptyCells.length > 0) {
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[row][col] = Math.random() < 0.9 ? 2 : 4;
        
        // Mark the tile as new for animation
        const tile = getTileElement(row, col);
        tile.classList.add('tile-new');
        setTimeout(() => tile.classList.remove('tile-new'), 200);
    }
}

// Update the board display based on the current state
function updateBoard() {
    for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
            const value = board[row][col];
            const tile = getTileElement(row, col);
            
            // Clear the tile
            tile.className = 'tile';
            tile.textContent = '';
            
            // If the cell has a value, update the tile
            if (value > 0) {
                tile.textContent = value;
                tile.classList.add(`tile-${value}`);
            }
        }
    }
}

// Get the tile element at a specific row and column
function getTileElement(row, col) {
    return document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
}

// Update the score display
function updateScore() {
    scoreElement.textContent = score;
    if (score > highScore) {
        saveHighScore();
    }
}

// Handle keyboard input
function handleKeyDown(event) {
    if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        
        let moved = false;
        
        switch (event.key) {
            case 'ArrowUp':
                moved = moveTiles('up');
                break;
            case 'ArrowDown':
                moved = moveTiles('down');
                break;
            case 'ArrowLeft':
                moved = moveTiles('left');
                break;
            case 'ArrowRight':
                moved = moveTiles('right');
                break;
        }
        
        if (moved) {
            addRandomTile();
            updateBoard();
            checkGameStatus();
        }
    }
}

// Handle touch events for swipe gestures
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].clientX;
    touchEndY = event.changedTouches[0].clientY;
    handleSwipe();
}

// Determine swipe direction and move tiles accordingly
function handleSwipe() {
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // Only consider swipes that are sufficiently long
    if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
        let moved = false;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal swipe
            if (dx > 0) {
                moved = moveTiles('right');
            } else {
                moved = moveTiles('left');
            }
        } else {
            // Vertical swipe
            if (dy > 0) {
                moved = moveTiles('down');
            } else {
                moved = moveTiles('up');
            }
        }
        
        if (moved) {
            addRandomTile();
            updateBoard();
            checkGameStatus();
        }
    }
}

// Move tiles in the specified direction and handle merging
function moveTiles(direction) {
    let moved = false;
    const newBoard = Array(config.size).fill().map(() => Array(config.size).fill(0));
    
    // Mark all tiles as not merged for this move
    const merged = Array(config.size).fill().map(() => Array(config.size).fill(false));
    
    // Process the board based on direction
    if (direction === 'left') {
        for (let row = 0; row < config.size; row++) {
            let col = 0;
            let lastValue = 0;
            let lastCol = -1;
            
            for (let c = 0; c < config.size; c++) {
                if (board[row][c] !== 0) {
                    if (lastValue === board[row][c] && !merged[row][lastCol]) {
                        // Merge tiles
                        newBoard[row][lastCol] = lastValue * 2;
                        score += lastValue * 2;
                        merged[row][lastCol] = true;
                        markMergedTile(row, lastCol);
                        lastValue = 0;
                        moved = true;
                    } else {
                        if (col !== c) moved = true;
                        newBoard[row][col] = board[row][c];
                        lastValue = board[row][c];
                        lastCol = col;
                        col++;
                    }
                }
            }
        }
    } else if (direction === 'right') {
        for (let row = 0; row < config.size; row++) {
            let col = config.size - 1;
            let lastValue = 0;
            let lastCol = -1;
            
            for (let c = config.size - 1; c >= 0; c--) {
                if (board[row][c] !== 0) {
                    if (lastValue === board[row][c] && !merged[row][lastCol]) {
                        // Merge tiles
                        newBoard[row][lastCol] = lastValue * 2;
                        score += lastValue * 2;
                        merged[row][lastCol] = true;
                        markMergedTile(row, lastCol);
                        lastValue = 0;
                        moved = true;
                    } else {
                        if (col !== c) moved = true;
                        newBoard[row][col] = board[row][c];
                        lastValue = board[row][c];
                        lastCol = col;
                        col--;
                    }
                }
            }
        }
    } else if (direction === 'up') {
        for (let col = 0; col < config.size; col++) {
            let row = 0;
            let lastValue = 0;
            let lastRow = -1;
            
            for (let r = 0; r < config.size; r++) {
                if (board[r][col] !== 0) {
                    if (lastValue === board[r][col] && !merged[lastRow][col]) {
                        // Merge tiles
                        newBoard[lastRow][col] = lastValue * 2;
                        score += lastValue * 2;
                        merged[lastRow][col] = true;
                        markMergedTile(lastRow, col);
                        lastValue = 0;
                        moved = true;
                    } else {
                        if (row !== r) moved = true;
                        newBoard[row][col] = board[r][col];
                        lastValue = board[r][col];
                        lastRow = row;
                        row++;
                    }
                }
            }
        }
    } else if (direction === 'down') {
        for (let col = 0; col < config.size; col++) {
            let row = config.size - 1;
            let lastValue = 0;
            let lastRow = -1;
            
            for (let r = config.size - 1; r >= 0; r--) {
                if (board[r][col] !== 0) {
                    if (lastValue === board[r][col] && !merged[lastRow][col]) {
                        // Merge tiles
                        newBoard[lastRow][col] = lastValue * 2;
                        score += lastValue * 2;
                        merged[lastRow][col] = true;
                        markMergedTile(lastRow, col);
                        lastValue = 0;
                        moved = true;
                    } else {
                        if (row !== r) moved = true;
                        newBoard[row][col] = board[r][col];
                        lastValue = board[r][col];
                        lastRow = row;
                        row--;
                    }
                }
            }
        }
    }
    
    if (moved) {
        board = newBoard;
        updateScore();
    }
    
    return moved;
}

// Mark a tile as merged for animation
function markMergedTile(row, col) {
    const tile = getTileElement(row, col);
    tile.classList.add('tile-merged');
    setTimeout(() => tile.classList.remove('tile-merged'), 200);
}

// Check if the game is won or lost
function checkGameStatus() {
    // Check for win
    if (!win) {
        for (let row = 0; row < config.size; row++) {
            for (let col = 0; col < config.size; col++) {
                if (board[row][col] === config.winValue) {
                    win = true;
                    showGameMessage(`You Win - Espresso Master!`, true);
                    return;
                }
            }
        }
    }
    
    // Check for game over
    if (isGameOver()) {
        showGameMessage('Game Over - Try Again Brewer!', false);
    }
}

// Check if the game is over (no more moves possible)
function isGameOver() {
    // Check for empty cells
    for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
            if (board[row][col] === 0) {
                return false;
            }
        }
    }
    
    // Check for possible merges
    for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
            const value = board[row][col];
            
            // Check right neighbor
            if (col < config.size - 1 && board[row][col + 1] === value) {
                return false;
            }
            
            // Check bottom neighbor
            if (row < config.size - 1 && board[row + 1][col] === value) {
                return false;
            }
        }
    }
    
    return true;
}

// Show game message (win or lose)
function showGameMessage(text, isWin) {
    messageText.textContent = text;
    continueButton.style.display = isWin ? 'block' : 'none';
    gameMessage.classList.add('show');
    saveHighScore();
}

// Event listeners
restartButton.addEventListener('click', initGame);
newGameButton.addEventListener('click', () => {
    gameMessage.classList.remove('show');
    initGame();
});
continueButton.addEventListener('click', () => {
    gameMessage.classList.remove('show');
});

// Keyboard controls
document.addEventListener('keydown', handleKeyDown);

// Touch controls
gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });

// Initialize the game
initGame();