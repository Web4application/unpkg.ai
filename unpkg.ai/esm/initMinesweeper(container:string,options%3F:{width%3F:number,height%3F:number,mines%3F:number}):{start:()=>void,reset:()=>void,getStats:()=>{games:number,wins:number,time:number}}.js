export function initMinesweeper(container, options = {}) {
  const width = Math.max(2, options.width ?? 10);
  const height = Math.max(2, options.height ?? 10);
  let mines = options.mines ?? Math.floor((width * height) * 0.15);
  mines = Math.max(1, Math.min(width * height - 1, mines));

  let games = 0;
  let wins = 0;
  let time = 0;
  let timerInterval = null;

  let grid = [];
  let boardEl = null;
  let firstClickDone = false;
  let isOver = false;
  let revealedCount = 0;

  function inBounds(x, y) {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  function createBoard() {
    grid = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      }))
    );
  }

  function placeMines(excludeX, excludeY) {
    const cells = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === excludeX && y === excludeY) continue;
        cells.push([x, y]);
      }
    }
    // shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    for (let i = 0; i < mines; i++) {
      const [mx, my] = cells[i];
      grid[my][mx].mine = true;
    }
    // compute adjacencies
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x].mine) continue;
        let cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx,
              ny = y + dy;
            if (inBounds(nx, ny) && grid[ny][nx].mine) cnt++;
          }
        }
        grid[y][x].adjacent = cnt;
      }
    }
  }

  function render() {
    if (typeof container === 'string') {
      boardEl = document.querySelector(container);
    } else {
      boardEl = container;
    }
    if (!boardEl) throw new Error('Minesweeper container not found');
    boardEl.innerHTML = '';

    const gridEl = document.createElement('div');
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${width}, 28px)`;
    gridEl.style.gridAutoRows = '28px';
    gridEl.style.gap = '4px';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = grid[y][x];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.padding = '0';
        btn.style.border = '1px solid #999';
        btn.style.borderRadius = '4px';
        btn.style.background = cell.revealed ? '#ddd' : '#bbb';
        btn.style.fontFamily = 'inherit';
        btn.style.fontSize = '14px';
        btn.style.lineHeight = '28px';
        btn.style.textAlign = 'center';
        btn.style.cursor = 'pointer';
        btn.dataset.x = String(x);
        btn.dataset.y = String(y);

        if (cell.revealed) {
          btn.disabled = true;
          if (cell.mine) {
            btn.textContent = 'ðŸ’£';
            btn.style.background = '#e86';
          } else if (cell.adjacent > 0) {
            btn.textContent = cell.adjacent;
            btn.style.color = '#000';
          } else {
            btn.textContent = '';
            btn.style.background = '#ddd';
          }
        } else if (cell.flagged) {
          btn.textContent = 'ðŸš©';
        } else {
          btn.textContent = '';
        }

        btn.addEventListener('click', onLeftClick);
        btn.addEventListener('contextmenu', onRightClick);
        gridEl.appendChild(btn);
      }
    }

    boardEl.appendChild(gridEl);
  }

  function reveal(x, y) {
    if (!inBounds(x, y)) return;
    const cell = grid[y][x];
    if (cell.revealed || cell.flagged) return;
    cell.revealed = true;
    revealedCount++;

    if (cell.mine) {
      isOver = true;
      stopTimer();
      revealAllMines();
      render();
      return;
    }

    if (cell.adjacent === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx,
            ny = y + dy;
          if (inBounds(nx, ny)) {
            if (!grid[ny][nx].revealed) reveal(nx, ny);
          }
        }
      }
    }

    // check win
    if (checkWin()) {
      isOver = true;
      stopTimer();
      wins += 1;
      render();
    } else {
      render();
    }
  }

  function revealAllMines() {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x].mine) {
          grid[y][x].revealed = true;
        }
      }
    }
  }

  function checkWin() {
    const totalNonMines = width * height - mines;
    return revealedCount >= totalNonMines;
  }

  function onLeftClick(e) {
    if (isOver) return;
    const btn = e.currentTarget;
    const x = parseInt(btn.dataset.x, 10);
    const y = parseInt(btn.dataset.y, 10);

    if (!firstClickDone) {
      placeMines(x, y);
      firstClickDone = true;
      time = 0;
      startTimer();
    }

    if (!grid[y][x].revealed && !grid[y][x].flagged) {
      reveal(x, y);
    }
  }

  function onRightClick(e) {
    e.preventDefault();
    if (isOver) return;
    const btn = e.currentTarget;
    const x = parseInt(btn.dataset.x, 10);
    const y = parseInt(btn.dataset.y, 10);
    const cell = grid[y][x];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    render();
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      time += 1;
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetBoardToInitial() {
    createBoard();
    firstClickDone = false;
    isOver = false;
    revealedCount = 0;
    time = 0;
    render();
  }

  function start() {
    games += 1;
    stopTimer();
    createBoard();
    firstClickDone = false;
    isOver = false;
    revealedCount = 0;
    time = 0;
    render();
  }

  function reset() {
    stopTimer();
    resetBoardToInitial();
  }

  function getStats() {
    return { games, wins, time };
  }

  // initialize
  createBoard();
  render();

  return { start, reset, getStats };
}
