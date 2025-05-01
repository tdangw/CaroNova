import { getAIMove } from './ai.js';

const boardSize = 15;
const board = [];
let currentPlayer = 'X';
let gameOver = false;

const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const timerElement = document.getElementById('timer');
const turnProgress = document.getElementById('turn-progress-bar');

// Thống kê điểm và lượt
let playerScore = 0;
let aiScore = 0;
let playerWins = 0;
let aiWins = 0;
let drawCount = 0;

// Thời gian
let totalTime = 300;
let turnTime = 30;
let totalTimerId = null;
let turnTimerId = null;

// ==============================================

function createBoard() {
  boardElement.innerHTML = '';
  board.length = 0;

  for (let row = 0; row < boardSize; row++) {
    board[row] = [];
    for (let col = 0; col < boardSize; col++) {
      board[row][col] = '';
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', handleCellClick);
      boardElement.appendChild(cell);
    }
  }

  currentPlayer = 'X';
  gameOver = false;
  statusElement.textContent = 'Lượt: ❌ Người chơi';
  updateTotalTimer();
  resetTimers();
}

// ==============================================

function handleCellClick(e) {
  if (gameOver || currentPlayer !== 'X') return;

  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);
  if (board[row][col] !== '') return;

  makeMove(row, col, 'X');

  if (checkWin(row, col, 'X')) {
    endGame('❌ Người chơi thắng!', 'player');
    return;
  }

  currentPlayer = 'O';
  statusElement.textContent = 'Lượt: ⭕ Máy';
  resetTimers();

  const aiThinkTime = Math.floor(Math.random() * 300) + 600;

  setTimeout(() => {
    if (!gameOver && currentPlayer === 'O') {
      const [aiRow, aiCol] = getAIMove(board);
      makeMove(aiRow, aiCol, 'O');

      const index = aiRow * boardSize + aiCol;
      const cells = boardElement.querySelectorAll('.cell');
      cells[index].classList.add('ai-move');

      setTimeout(() => {
        cells[index].classList.remove('ai-move');
      }, 500);

      if (checkWin(aiRow, aiCol, 'O')) {
        endGame('⭕ Máy thắng!', 'ai');
      } else {
        currentPlayer = 'X';
        statusElement.textContent = 'Lượt: ❌ Người chơi';
        resetTimers();
      }
    }
  }, aiThinkTime);
}

// ==============================================

function makeMove(row, col, player) {
  board[row][col] = player;
  const index = row * boardSize + col;
  const cells = boardElement.querySelectorAll('.cell');
  cells[index].textContent = player;
  cells[index].classList.add(player);
}

function checkWin(row, col, player) {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dRow, dCol] of directions) {
    let count = 1;
    let cells = [[row, col]];

    let r = row + dRow,
      c = col + dCol;
    while (count < 5 && inBounds(r, c) && board[r][c] === player) {
      cells.push([r, c]);
      r += dRow;
      c += dCol;
      count++;
    }

    r = row - dRow;
    c = col - dCol;
    while (count < 5 && inBounds(r, c) && board[r][c] === player) {
      cells.unshift([r, c]);
      r -= dRow;
      c -= dCol;
      count++;
    }

    if (count === 5) {
      highlightCells(cells);
      return true;
    }
  }

  return false;
}

function inBounds(row, col) {
  return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

function highlightCells(cells) {
  const allCells = boardElement.querySelectorAll('.cell');
  cells.forEach(([r, c]) => {
    const index = r * boardSize + c;
    allCells[index].classList.remove('ai-move'); // Gỡ hiệu ứng AI

    allCells[index].classList.add('win');
  });
}

// ==============================================

function endGame(message, winner) {
  gameOver = true;
  statusElement.textContent = `🎉 ${message}`;
  clearInterval(totalTimerId);
  clearInterval(turnTimerId);

  if (winner === 'player') {
    playerWins++;
    playerScore += 100;
  } else if (winner === 'ai') {
    aiWins++;
    aiScore += 100;
  } else {
    drawCount++;
    playerScore += 50;
    aiScore += 50;
  }

  updateScoreboard();
  saveScoreboard();
}

// ==============================================

function updateScoreboard() {
  document.getElementById('player-score').textContent = playerScore;
  document.getElementById('ai-score').textContent = aiScore;
  document.getElementById('player-wins').textContent = playerWins;
  document.getElementById('ai-wins').textContent = aiWins;
  document.getElementById('draw-count').textContent = drawCount;
}

function saveScoreboard() {
  localStorage.setItem(
    'caro-scoreboard',
    JSON.stringify({
      playerScore,
      aiScore,
      playerWins,
      aiWins,
      drawCount,
    })
  );
}

function loadScoreboard() {
  const saved = JSON.parse(localStorage.getItem('caro-scoreboard'));
  if (saved) {
    playerScore = saved.playerScore || 0;
    aiScore = saved.aiScore || 0;
    playerWins = saved.playerWins || 0;
    aiWins = saved.aiWins || 0;
    drawCount = saved.drawCount || 0;
    updateScoreboard();
  }
}

// ==============================================

function resetTimers() {
  clearInterval(turnTimerId);
  clearInterval(totalTimerId);

  let turnRemaining = turnTime;

  turnProgress.style.width = '100%';
  turnTimerId = setInterval(() => {
    turnRemaining--;
    turnProgress.style.width = `${(turnRemaining / turnTime) * 100}%`;

    if (turnRemaining <= 0) {
      clearInterval(turnTimerId);
      handleTurnTimeout();
    }
  }, 1000);

  totalTimerId = setInterval(() => {
    totalTime--;
    updateTotalTimer();

    if (totalTime <= 0) {
      clearInterval(totalTimerId);
      clearInterval(turnTimerId);
      endGame('⏱️ Hết giờ!', 'draw');
    }
  }, 1000);
}

function updateTotalTimer() {
  const min = String(Math.floor(totalTime / 60)).padStart(2, '0');
  const sec = String(totalTime % 60).padStart(2, '0');
  timerElement.textContent = `⏱️ ${min}:${sec}`;
}

function handleTurnTimeout() {
  if (gameOver) return;

  if (currentPlayer === 'X') {
    endGame('❌ Hết giờ! Thua cuộc!', 'ai');
  } else {
    endGame('⭕ Hết giờ! ❌ Bạn thắng!', 'player');
  }
}

// ==============================================

resetBtn.addEventListener('click', () => {
  totalTime = 300;
  createBoard();
});
document.getElementById('reset-stats-btn').addEventListener('click', () => {});
// Tạo popup xác nhận xoá thống kê
function createConfirmPopup() {
  const confirmOverlay = document.createElement('div');
  confirmOverlay.id = 'confirm-overlay';
  confirmOverlay.className = 'overlay hidden';
  confirmOverlay.innerHTML = `
    <div class="confirm-box">
      <p>Bạn có chắc muốn xóa toàn bộ điểm và thống kê?</p>
      <div class="confirm-actions">
        <button id="confirm-yes">✅ Đồng ý</button>
        <button id="confirm-no">❌ Hủy</button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmOverlay);
}

const resetStatsBtn = document.getElementById('reset-stats-btn');

resetStatsBtn.addEventListener('click', () => {
  document.getElementById('confirm-overlay')?.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
  if (e.target.id === 'confirm-no') {
    document.getElementById('confirm-overlay').classList.add('hidden');
  }
  if (e.target.id === 'confirm-yes') {
    playerScore = 0;
    aiScore = 0;
    playerWins = 0;
    aiWins = 0;
    drawCount = 0;
    updateScoreboard();
    saveScoreboard();
    document.getElementById('confirm-overlay').classList.add('hidden');
  }
});

createConfirmPopup();
createBoard();
loadScoreboard();
