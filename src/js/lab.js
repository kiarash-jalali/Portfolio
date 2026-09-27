export function initLab() {
  initMatterBall();
  initSpringGrid();
}

function initMatterBall() {
  const stage = document.querySelector("#magnetStage");
  const ballElement = document.querySelector("#physicsBall");
  const ballVisual = ballElement?.querySelector(".goo-ball-visual");
  const Matter = window.Matter;

  if (!stage || !ballElement || !ballVisual || stage.dataset.physicsBound) return;
  stage.dataset.physicsBound = "1";

  if (!Matter) {
    console.warn("Matter.js did not load, so the physics Lab experiment is unavailable.");
    ballElement.disabled = true;
    return;
  }

  const { Body, Bodies, Composite, Engine, Events, Sleeping } = Matter;
  const engine = Engine.create({ enableSleeping: true });

  engine.world.gravity.y = 1;
  engine.world.gravity.scale = .00105;

  const wallThickness = 70;
  const fixedStep = 1000 / 60;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let radius = Math.max(30, ballElement.offsetWidth / 2);
  let walls = [];
  let dragging = false;
  let activePointer = null;
  let grabOffset = { x: 0, y: 0 };
  let pointerVelocity = { x: 0, y: 0 };
  let previousPointer = { x: 0, y: 0, time: 0 };

  let squash = 0;
  let squashVelocity = 0;
  let squashAngle = 0;
  let dragPress = 0;
  let dragPressAngle = 0;

  const size = () => ({
    width: stage.clientWidth,
    height: stage.clientHeight
  });

  const ballBody = Bodies.circle(
    Math.max(radius, stage.clientWidth * .5),
    Math.max(radius, stage.clientHeight * .3),
    radius,
    {
      label: "goo-ball",
      restitution: .82,
      friction: .015,
      frictionStatic: .02,
      frictionAir: .009,
      density: .0017,
      sleepThreshold: 85
    }
  );

  Composite.add(engine.world, ballBody);

  function rebuildWalls() {
    if (walls.length) Composite.remove(engine.world, walls);

    const { width, height } = size();

    walls = [
      Bodies.rectangle(
        width / 2,
        -wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        { isStatic: true, label: "wall-top" }
      ),
      Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        { isStatic: true, label: "wall-bottom" }
      ),
      Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        { isStatic: true, label: "wall-left" }
      ),
      Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        { isStatic: true, label: "wall-right" }
      )
    ];

    Composite.add(engine.world, walls);

    const clampedX = clamp(ballBody.position.x, radius, Math.max(radius, width - radius));
    const clampedY = clamp(ballBody.position.y, radius, Math.max(radius, height - radius));

    Body.setPosition(ballBody, { x: clampedX, y: clampedY });
  }

  function resizeBallAndWalls() {
    const nextRadius = Math.max(30, ballElement.offsetWidth / 2);

    if (Math.abs(nextRadius - radius) > .5) {
      const ratio = nextRadius / radius;
      Body.scale(ballBody, ratio, ratio);
      radius = nextRadius;
    }

    rebuildWalls();
  }

  function triggerSquash(angle, speed) {
    if (reducedMotion || dragging || speed < 2.2) return;

    const amount = clamp((speed - 1.5) / 30, .07, .34);

    if (amount > squash) squash = amount;
    squashVelocity += amount * 1.15;
    squashAngle = angle;
  }

  Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      const touchesBall = pair.bodyA === ballBody || pair.bodyB === ballBody;
      if (!touchesBall) continue;

      const normal = pair.collision.normal;
      const horizontalWall = Math.abs(normal.x) > Math.abs(normal.y);
      const angle = horizontalWall ? 0 : Math.PI / 2;

      triggerSquash(angle, ballBody.speed);
    }
  });

  function updateSquash(deltaSeconds) {
    if (reducedMotion) {
      squash = 0;
      squashVelocity = 0;
      return;
    }

    if (dragging && dragPress > 0) {
      squash = dragPress;
      squashAngle = dragPressAngle;
      squashVelocity = 0;
      return;
    }

    const stiffness = 105;
    const damping = 13;

    squashVelocity += (-squash * stiffness - squashVelocity * damping) * deltaSeconds;
    squash += squashVelocity * deltaSeconds;
    squash = clamp(squash, -.16, .38);
  }

  function paintBall() {
    const x = ballBody.position.x - radius;
    const y = ballBody.position.y - radius;

    ballElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    const speed = ballBody.speed;
    const impactActive = Math.abs(squash) > .012;

    let angle = squashAngle;
    let scaleX = 1;
    let scaleY = 1;

    if (impactActive) {
      scaleX = clamp(1 - squash, .64, 1.22);
      scaleY = clamp(1 + squash * .62, .82, 1.34);
    } else if (!dragging && speed > 7 && !reducedMotion) {
      const stretch = clamp((speed - 7) / 180, 0, .09);
      angle = Math.atan2(ballBody.velocity.y, ballBody.velocity.x);
      scaleX = 1 + stretch;
      scaleY = 1 - stretch * .46;
    }

    ballVisual.style.transform =
      `rotate(${angle}rad) scale(${scaleX}, ${scaleY})`;
  }

  function pointerPosition(event) {
    const rect = stage.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function updateDraggedPosition(event) {
    const now = performance.now();
    const pointer = pointerPosition(event);
    const dt = Math.max(8, now - previousPointer.time);

    const rawX = pointer.x - grabOffset.x;
    const rawY = pointer.y - grabOffset.y;

    const minX = radius;
    const maxX = Math.max(radius, pointer.width - radius);
    const minY = radius;
    const maxY = Math.max(radius, pointer.height - radius);

    const nextX = clamp(rawX, minX, maxX);
    const nextY = clamp(rawY, minY, maxY);

    pointerVelocity.x =
      pointerVelocity.x * .35 +
      ((event.clientX - previousPointer.x) / dt) * fixedStep * .65;

    pointerVelocity.y =
      pointerVelocity.y * .35 +
      ((event.clientY - previousPointer.y) / dt) * fixedStep * .65;

    const pressureLeft = Math.max(0, minX - rawX);
    const pressureRight = Math.max(0, rawX - maxX);
    const pressureTop = Math.max(0, minY - rawY);
    const pressureBottom = Math.max(0, rawY - maxY);

    const horizontalPressure = Math.max(pressureLeft, pressureRight);
    const verticalPressure = Math.max(pressureTop, pressureBottom);

    if (horizontalPressure > verticalPressure && horizontalPressure > 0) {
      dragPress = clamp(horizontalPressure / (radius * 1.35), 0, .34);
      dragPressAngle = 0;
    } else if (verticalPressure > 0) {
      dragPress = clamp(verticalPressure / (radius * 1.35), 0, .34);
      dragPressAngle = Math.PI / 2;
    } else {
      dragPress = 0;
    }

    Body.setPosition(ballBody, { x: nextX, y: nextY });
    Body.setVelocity(ballBody, { x: 0, y: 0 });
    Sleeping.set(ballBody, false);

    previousPointer = {
      x: event.clientX,
      y: event.clientY,
      time: now
    };
  }

  ballElement.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    dragging = true;
    activePointer = event.pointerId;
    pointerVelocity = { x: 0, y: 0 };
    dragPress = 0;

    const pointer = pointerPosition(event);

    grabOffset = {
      x: pointer.x - ballBody.position.x,
      y: pointer.y - ballBody.position.y
    };

    previousPointer = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now()
    };

    Body.setStatic(ballBody, true);
    Sleeping.set(ballBody, false);

    ballElement.setPointerCapture(event.pointerId);
    ballElement.classList.add("dragging");
  });

  ballElement.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== activePointer) return;
    updateDraggedPosition(event);
  });

  function releaseBall(event) {
    if (!dragging || event.pointerId !== activePointer) return;

    dragging = false;
    activePointer = null;
    dragPress = 0;

    ballElement.classList.remove("dragging");

    Body.setStatic(ballBody, false);
    Sleeping.set(ballBody, false);

    const velocity = limitVector(pointerVelocity, 34);
    Body.setVelocity(ballBody, velocity);

    try {
      ballElement.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }

  ballElement.addEventListener("pointerup", releaseBall);
  ballElement.addEventListener("pointercancel", releaseBall);

  ballElement.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    Sleeping.set(ballBody, false);
    Body.setVelocity(ballBody, {
      x: (Math.random() - .5) * 14,
      y: -18
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    resizeBallAndWalls();
  });

  resizeObserver.observe(stage);
  requestAnimationFrame(resizeBallAndWalls);

  let lastTime = performance.now();
  let accumulator = 0;

  function frame(time) {
    const frameDelta = Math.min(50, time - lastTime);
    lastTime = time;
    accumulator += frameDelta;

    while (accumulator >= fixedStep) {
      if (!dragging) Engine.update(engine, fixedStep);
      updateSquash(fixedStep / 1000);
      accumulator -= fixedStep;
    }

    paintBall();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function limitVector(vector, maxLength) {
  const length = Math.hypot(vector.x, vector.y);

  if (length <= maxLength || length === 0) return vector;

  const scale = maxLength / length;

  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
}
