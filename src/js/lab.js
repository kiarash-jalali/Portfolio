import RAPIER from "/vendor/rapier2d/rapier.es.js";

let rapierReady;

export function initLab() {
  initSpringGrid();
  initSoftBodyBall();
}

async function initSoftBodyBall() {
  const stage = document.querySelector("#magnetStage");
  const svg = document.querySelector("#gooPhysicsSvg");
  const blob = document.querySelector("#gooBlob");
  const rim = document.querySelector("#gooBlobRim");
  const highlight = document.querySelector("#gooHighlight");
  const shadow = document.querySelector("#gooFloorShadow");

  if (!stage || !svg || !blob || !rim || !highlight || !shadow || stage.dataset.softBodyBound) return;
  stage.dataset.softBodyBound = "1";

  try {
    rapierReady ||= RAPIER.init();
    await rapierReady;
  } catch (error) {
    console.error("Rapier failed to initialize:", error);
    stage.classList.add("physics-error");
    return;
  }

  const pixelsPerMeter = 100;
  const fixedStep = 1 / 120;
  const maxFrameDelta = .05;
  const particleCount = 28;

  let world;
  let softBody;
  let radiusPx = 46;
  let stageWidth = 0;
  let stageHeight = 0;
  let accumulator = 0;
  let previousTime = performance.now();
  let grabbedParticle = -1;
  let activePointer = null;
  let resizeTimer = 0;

  function pxToWorld(value) {
    return value / pixelsPerMeter;
  }

  function worldToPx(value) {
    return value * pixelsPerMeter;
  }

  function createWall(x, y, halfWidth, halfHeight) {
    const collider = RAPIER.ColliderDesc
      .cuboid(halfWidth, halfHeight)
      .setTranslation(x, y)
      .setFriction(.48)
      .setRestitution(.42);

    world.createCollider(collider);
  }

  function buildSimulation() {
    stageWidth = Math.max(240, stage.clientWidth);
    stageHeight = Math.max(220, stage.clientHeight);
    radiusPx = clamp(stageWidth * .09, 38, 50);

    svg.setAttribute("viewBox", `0 0 ${stageWidth} ${stageHeight}`);

    const width = pxToWorld(stageWidth);
    const height = pxToWorld(stageHeight);
    const radius = pxToWorld(radiusPx);
    const wall = .09;

    world = new RAPIER.World({ x: 0, y: 13.5 });
    world.timestep = fixedStep;

    createWall(width / 2, -wall, width / 2 + wall, wall);
    createWall(width / 2, height + wall, width / 2 + wall, wall);
    createWall(-wall, height / 2, wall, height / 2 + wall);
    createWall(width + wall, height / 2, wall, height / 2 + wall);

    const surface = RAPIER.ColliderDesc
      .ball(radius * .08)
      .setFriction(.42)
      .setRestitution(.50);

    const desc = RAPIER.SoftBodyDesc
      .disk(
        { x: width * .24, y: height * .22 },
        radius,
        particleCount
      )
      .setSoftness(16, .62)
      .setVolumeFactor(1.035)
      .setParticleMass(.045)
      .setParticleRadius(radius * .085)
      .setLinearDamping(.22)
      .setSurfaceCollider(surface)
      .setSelfContacts(true)
      .setAdditionalPgsIterations(4)
      .setAdditionalSolverIterations(2)
      .setCanSleep(true);

    softBody = world.createSoftBody(desc);
    grabbedParticle = -1;
    activePointer = null;
    accumulator = 0;
    previousTime = performance.now();

    renderSoftBody();
  }

  function particlePoints() {
    if (!softBody) return [];

    const positions = softBody.particlePositions();
    const points = [];

    for (let i = 0; i < positions.length; i += 2) {
      points.push({
        x: worldToPx(positions[i]),
        y: worldToPx(positions[i + 1])
      });
    }

    return points;
  }

  function smoothClosedPath(points, tension = .86) {
    const count = points.length;
    if (count < 3) return "";

    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < count; i++) {
      const p0 = points[(i - 1 + count) % count];
      const p1 = points[i];
      const p2 = points[(i + 1) % count];
      const p3 = points[(i + 2) % count];

      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return d + " Z";
  }

  function renderSoftBody() {
    const points = particlePoints();
    if (!points.length) return;

    const path = smoothClosedPath(points);
    blob.setAttribute("d", path);
    rim.setAttribute("d", path);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let centreX = 0;
    let centreY = 0;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      centreX += point.x;
      centreY += point.y;
    }

    centreX /= points.length;
    centreY /= points.length;

    const blobWidth = maxX - minX;
    const blobHeight = maxY - minY;
    const floorDistance = Math.max(0, stageHeight - maxY);

    shadow.setAttribute("cx", centreX.toFixed(2));
    shadow.setAttribute("cy", Math.min(stageHeight - 8, maxY + 18).toFixed(2));
    shadow.setAttribute("rx", Math.max(22, blobWidth * .42).toFixed(2));
    shadow.setAttribute("ry", Math.max(5, Math.min(11, blobHeight * .10)).toFixed(2));
    shadow.style.opacity = String(clamp(.34 - floorDistance / 260, .08, .34));

    highlight.setAttribute("cx", (centreX - blobWidth * .18).toFixed(2));
    highlight.setAttribute("cy", (centreY - blobHeight * .20).toFixed(2));
    highlight.setAttribute("rx", Math.max(8, blobWidth * .13).toFixed(2));
    highlight.setAttribute("ry", Math.max(5, blobHeight * .08).toFixed(2));
  }

  function frame(time) {
    const elapsed = Math.min(maxFrameDelta, (time - previousTime) / 1000);
    previousTime = time;
    accumulator += elapsed;

    while (accumulator >= fixedStep) {
      world.step();
      accumulator -= fixedStep;
    }

    renderSoftBody();
    requestAnimationFrame(frame);
  }

  function pointerWorld(event) {
    const rect = stage.getBoundingClientRect();

    return {
      x: pxToWorld(event.clientX - rect.left),
      y: pxToWorld(event.clientY - rect.top)
    };
  }

  function nearestParticle(target) {
    if (!softBody) return { index: -1, distance: Infinity };

    const positions = softBody.particlePositions();
    let bestIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < positions.length; i += 2) {
      const dx = positions[i] - target.x;
      const dy = positions[i + 1] - target.y;
      const distance = Math.hypot(dx, dy);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i / 2;
      }
    }

    return { index: bestIndex, distance: bestDistance };
  }

  stage.addEventListener("pointerdown", (event) => {
    if (!softBody || activePointer !== null) return;

    const target = pointerWorld(event);
    const nearest = nearestParticle(target);
    const grabRadius = pxToWorld(radiusPx * 1.35);

    if (nearest.index < 0 || nearest.distance > grabRadius) return;

    event.preventDefault();

    grabbedParticle = nearest.index;
    activePointer = event.pointerId;

    softBody.setParticlePinned(grabbedParticle, true);
    softBody.setParticleKinematicTarget(grabbedParticle, target);
    softBody.wakeUp();

    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });

  stage.addEventListener("pointermove", (event) => {
    if (!softBody || event.pointerId !== activePointer || grabbedParticle < 0) return;

    event.preventDefault();
    softBody.setParticleKinematicTarget(grabbedParticle, pointerWorld(event));
    softBody.wakeUp();
  });

  function release(event) {
    if (!softBody || event.pointerId !== activePointer || grabbedParticle < 0) return;

    softBody.setParticleKinematicTarget(grabbedParticle, pointerWorld(event));
    softBody.setParticlePinned(grabbedParticle, false);
    softBody.wakeUp();

    grabbedParticle = -1;
    activePointer = null;
    stage.classList.remove("dragging");

    try {
      stage.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may already have released pointer capture.
    }
  }

  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  stage.addEventListener("keydown", (event) => {
    if (!softBody) return;

    const impulses = {
      ArrowLeft: { x: -.24, y: 0 },
      ArrowRight: { x: .24, y: 0 },
      ArrowUp: { x: 0, y: -.34 },
      ArrowDown: { x: 0, y: .18 },
      " ": { x: .16, y: -.36 }
    };

    const impulse = impulses[event.key];
    if (!impulse) return;

    event.preventDefault();
    softBody.applyImpulse(impulse, true);
  });

  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildSimulation, 120);
  });

  resizeObserver.observe(stage);
  buildSimulation();
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
