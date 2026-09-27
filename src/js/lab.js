const touchLike = matchMedia("(hover: none), (pointer: coarse)");

export function initLab() {
  initMagneticExperiment();
  initSpringGrid();
}

function initMagneticExperiment() {
  const card = document.querySelector("#magnetLab");
  const stage = document.querySelector("#magnetStage");
  const target = document.querySelector("#magnetTarget");

  if (!card || !stage || !target || card.dataset.labBound) return;
  card.dataset.labBound = "1";

  if (touchLike.matches) {
    initThrowBall(card, stage, target);
    return;
  }

  initDesktopMagnet(card, target);
}

function initDesktopMagnet(card, target) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    target.style.transform =
      `translate3d(${x * 58}px, ${y * 42}px, 0) rotate(${x * 6}deg)`;
  });

  card.addEventListener("pointerleave", () => {
    target.style.transform = "";
  });
}

function initThrowBall(card, stage, ball) {
  card.classList.add("physics-mode");
  stage.classList.add("physics-stage");
  ball.classList.add("physics-ball");

  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let raf = 0;
  let lastFrame = 0;
  let dragging = false;
  let dragPointerId = null;
  let lastDragX = 0;
  let lastDragY = 0;
  let lastDragTime = 0;

  const gravity = 900;
  const bounce = .78;
  const air = .992;
  const maxThrow = 1900;

  const bounds = () => ({
    maxX: Math.max(0, stage.clientWidth - ball.offsetWidth),
    maxY: Math.max(0, stage.clientHeight - ball.offsetHeight)
  });

  const paint = () => {
    ball.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const impact = () => {
    ball.classList.remove("impact");
    void ball.offsetWidth;
    ball.classList.add("impact");
  };

  const stopPhysics = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;
  };

  const physics = (time) => {
    if (dragging) return;

    if (!lastFrame) lastFrame = time;
    const dt = Math.min((time - lastFrame) / 1000, .032);
    lastFrame = time;

    const { maxX, maxY } = bounds();

    vy += gravity * dt;
    x += vx * dt;
    y += vy * dt;

    vx *= Math.pow(air, dt * 60);

    let collided = false;

    if (x <= 0) {
      x = 0;
      vx = Math.abs(vx) * bounce;
      collided = true;
    } else if (x >= maxX) {
      x = maxX;
      vx = -Math.abs(vx) * bounce;
      collided = true;
    }

    if (y <= 0) {
      y = 0;
      vy = Math.abs(vy) * bounce;
      collided = true;
    } else if (y >= maxY) {
      y = maxY;
      vy = -Math.abs(vy) * bounce;
      vx *= .985;
      collided = true;
    }

    if (collided && Math.hypot(vx, vy) > 180) impact();

    if (y >= maxY - .5 && Math.abs(vy) < 45 && Math.abs(vx) < 12) {
      y = maxY;
      vx = 0;
      vy = 0;
      paint();
      raf = 0;
      lastFrame = 0;
      return;
    }

    paint();
    raf = requestAnimationFrame(physics);
  };

  const startPhysics = () => {
    stopPhysics();
    raf = requestAnimationFrame(physics);
  };

  const centerBall = () => {
    const { maxX, maxY } = bounds();
    x = maxX / 2;
    y = maxY / 2;
    vx = 0;
    vy = 0;
    paint();
  };

  requestAnimationFrame(centerBall);

  ball.addEventListener("pointerdown", (event) => {
    dragging = true;
    dragPointerId = event.pointerId;
    stopPhysics();

    ball.setPointerCapture(event.pointerId);
    ball.classList.add("dragging");

    const stageRect = stage.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();

    const grabOffsetX = event.clientX - ballRect.left;
    const grabOffsetY = event.clientY - ballRect.top;

    lastDragX = event.clientX;
    lastDragY = event.clientY;
    lastDragTime = performance.now();

    const move = (moveEvent) => {
      if (!dragging || moveEvent.pointerId !== dragPointerId) return;

      const now = performance.now();
      const dt = Math.max(8, now - lastDragTime);
      const { maxX, maxY } = bounds();

      const nextX = Math.min(
        maxX,
        Math.max(0, moveEvent.clientX - stageRect.left - grabOffsetX)
      );
      const nextY = Math.min(
        maxY,
        Math.max(0, moveEvent.clientY - stageRect.top - grabOffsetY)
      );

      const pointerVx = ((moveEvent.clientX - lastDragX) / dt) * 1000;
      const pointerVy = ((moveEvent.clientY - lastDragY) / dt) * 1000;

      vx = vx * .35 + pointerVx * .65;
      vy = vy * .35 + pointerVy * .65;

      x = nextX;
      y = nextY;
      paint();

      lastDragX = moveEvent.clientX;
      lastDragY = moveEvent.clientY;
      lastDragTime = now;
    };

    const release = (releaseEvent) => {
      if (releaseEvent.pointerId !== dragPointerId) return;

      dragging = false;
      dragPointerId = null;
      ball.classList.remove("dragging");

      vx = Math.max(-maxThrow, Math.min(maxThrow, vx));
      vy = Math.max(-maxThrow, Math.min(maxThrow, vy));

      ball.removeEventListener("pointermove", move);
      ball.removeEventListener("pointerup", release);
      ball.removeEventListener("pointercancel", release);

      startPhysics();
    };

    ball.addEventListener("pointermove", move);
    ball.addEventListener("pointerup", release);
    ball.addEventListener("pointercancel", release);
  });

  addEventListener("resize", () => {
    const { maxX, maxY } = bounds();
    x = Math.min(x, maxX);
    y = Math.min(y, maxY);
    paint();
  });
}

function initSpringGrid() {
  const grid = document.querySelector("#springGrid");
  if (!grid || grid.dataset.springBound) return;
  grid.dataset.springBound = "1";

  const size = 10;
  const initialIndex = 44;

  grid.innerHTML = `
    <span class="spring-selection" aria-hidden="true"></span>
    ${Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size);
      const col = index % size;
      const selected = index === initialIndex;

      return `<button
        class="spring-cell${selected ? " selected" : ""}"
        type="button"
        data-index="${index}"
        data-row="${row}"
        data-col="${col}"
        aria-label="Spring cell ${index + 1}"
        aria-pressed="${selected}"
      ></button>`;
    }).join("")}
  `;

  const cells = [...grid.querySelectorAll(".spring-cell")];
  const selection = grid.querySelector(".spring-selection");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let selectedCell = cells[initialIndex];
  let selectionX = 0;
  let selectionY = 0;

  const placeSelection = (cell, animate = true) => {
    if (!selection || !cell) return;

    const nextX = cell.offsetLeft;
    const nextY = cell.offsetTop;
    const width = cell.offsetWidth;
    const height = cell.offsetHeight;

    selection.style.width = `${width}px`;
    selection.style.height = `${height}px`;

    if (!animate || reduced) {
      selection.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      selectionX = nextX;
      selectionY = nextY;
      return;
    }

    const dx = nextX - selectionX;
    const dy = nextY - selectionY;
    const mostlyHorizontal = Math.abs(dx) >= Math.abs(dy);
    const stretchX = mostlyHorizontal ? 1.42 : .78;
    const stretchY = mostlyHorizontal ? .78 : 1.42;
    const midX = selectionX + dx * .56;
    const midY = selectionY + dy * .56;

    selection.getAnimations().forEach((animation) => animation.cancel());

    selection.animate([
      {
        transform: `translate3d(${selectionX}px, ${selectionY}px, 0) scale(1, 1)`,
        borderRadius: "7px"
      },
      {
        transform: `translate3d(${midX}px, ${midY}px, 0) scale(${stretchX}, ${stretchY})`,
        borderRadius: "14px",
        offset: .48
      },
      {
        transform: `translate3d(${nextX}px, ${nextY}px, 0) scale(.92, 1.08)`,
        borderRadius: "9px",
        offset: .78
      },
      {
        transform: `translate3d(${nextX}px, ${nextY}px, 0) scale(1, 1)`,
        borderRadius: "7px"
      }
    ], {
      duration: 560,
      easing: "cubic-bezier(.2,.82,.2,1)"
    });

    selection.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
    selectionX = nextX;
    selectionY = nextY;
  };

  const ripple = (origin, strength = 1) => {
    if (reduced) return;

    const originRow = Number(origin.dataset.row);
    const originCol = Number(origin.dataset.col);

    cells.forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const dx = col - originCol;
      const dy = row - originRow;
      const distance = Math.hypot(dx, dy);
      const length = distance || 1;
      const pushX = (dx / length) * 6 * strength;
      const pushY = (dy / length) * 6 * strength;

      cell.getAnimations().forEach((animation) => animation.cancel());

      cell.animate([
        { transform: "translate3d(0,0,0) scale(1)" },
        {
          transform: `translate3d(${pushX}px,${pushY}px,0) scale(${1.08 + strength * .06})`,
          offset: .34
        },
        {
          transform: `translate3d(${-pushX * .22}px,${-pushY * .22}px,0) scale(.95)`,
          offset: .68
        },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], {
        duration: 470 + distance * 14,
        delay: distance * 18,
        easing: "cubic-bezier(.22,.82,.18,1)"
      });
    });
  };

  const selectCell = (cell) => {
    if (!cell || cell === selectedCell) {
      if (cell) ripple(cell, .95);
      return;
    }

    selectedCell.classList.remove("selected");
    selectedCell.setAttribute("aria-pressed", "false");

    cell.classList.add("selected");
    cell.setAttribute("aria-pressed", "true");

    placeSelection(cell, true);
    ripple(cell, 1.08);
    selectedCell = cell;
  };

  grid.addEventListener("pointerover", (event) => {
    const cell = event.target.closest(".spring-cell");
    if (!cell || event.relatedTarget?.closest?.(".spring-cell") === cell) return;
    ripple(cell, .58);
  });

  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".spring-cell");
    if (!cell) return;
    selectCell(cell);
  });

  requestAnimationFrame(() => placeSelection(selectedCell, false));

  addEventListener("resize", () => {
    requestAnimationFrame(() => placeSelection(selectedCell, false));
  });
}
