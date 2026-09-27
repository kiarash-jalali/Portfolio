let matterReady;

export function initLab() {
  initSpringGrid();
  initMatterSoftBody();
}

async function initMatterSoftBody() {
  const stage = document.querySelector("#magnetStage");
  const svg = document.querySelector("#gooPhysicsSvg");
  const blob = document.querySelector("#gooBlob");
  const rim = document.querySelector("#gooBlobRim");
  const highlight = document.querySelector("#gooHighlight");
  const shadow = document.querySelector("#gooFloorShadow");

  if (!stage || !svg || !blob || !rim || !highlight || !shadow || stage.dataset.softBodyBound) return;
  stage.dataset.softBodyBound = "1";

  let Matter;

  try {
    Matter = await loadMatter();
  } catch (error) {
    console.error("Matter.js failed to load:", error);
    stage.classList.add("physics-error");
    return;
  }

  const {
    Body,
    Bodies,
    Composite,
    Constraint,
    Engine,
    Sleeping
  } = Matter;

  const fixedStep = 1000 / 120;
  const maxFrameDelta = 50;
  const particleCount = 24;
  const particleRadius = 5;

  let engine;
  let ring = [];
  let centre;
  let walls = [];
  let grabConstraint = null;
  let activePointer = null;
  let previousPointer = { x: 0, y: 0, time: 0 };
  let releaseVelocity = { x: 0, y: 0 };
  let stageWidth = 0;
  let stageHeight = 0;
  let targetRadius = 46;
  let accumulator = 0;
  let previousTime = performance.now();
  let resizeTimer = 0;

  function buildSimulation() {
    stageWidth = Math.max(240, stage.clientWidth);
    stageHeight = Math.max(220, stage.clientHeight);
    targetRadius = clamp(stageWidth * .09, 40, 52);

    svg.setAttribute("viewBox", `0 0 ${stageWidth} ${stageHeight}`);

    engine = Engine.create({ enableSleeping: true });
    engine.gravity.x = 0;
    engine.gravity.y = 1.05;
    engine.gravity.scale = .001;

    const wallThickness = 70;

    walls = [
      Bodies.rectangle(stageWidth / 2, -wallThickness / 2, stageWidth + wallThickness * 2, wallThickness, wallOptions()),
      Bodies.rectangle(stageWidth / 2, stageHeight + wallThickness / 2, stageWidth + wallThickness * 2, wallThickness, wallOptions()),
      Bodies.rectangle(-wallThickness / 2, stageHeight / 2, wallThickness, stageHeight + wallThickness * 2, wallOptions()),
      Bodies.rectangle(stageWidth + wallThickness / 2, stageHeight / 2, wallThickness, stageHeight + wallThickness * 2, wallOptions())
    ];

    const startX = stageWidth * .24;
    const startY = stageHeight * .24;
    const noSelfCollisionGroup = Body.nextGroup(true);

    ring = Array.from({ length: particleCount }, (_, index) => {
      const angle = (Math.PI * 2 * index) / particleCount;

      return Bodies.circle(
        startX + Math.cos(angle) * targetRadius,
        startY + Math.sin(angle) * targetRadius,
        particleRadius,
        {
          density: .0016,
          restitution: .68,
          friction: .025,
          frictionStatic: .02,
          frictionAir: .012,
          sleepThreshold: 90,
          collisionFilter: { group: noSelfCollisionGroup },
          render: { visible: false }
        }
      );
    });

    centre = Bodies.circle(startX, startY, 3, {
      density: .001,
      frictionAir: .03,
      collisionFilter: { mask: 0 },
      render: { visible: false }
    });

    const blobComposite = Composite.create({ label: "goo-soft-body" });
    Composite.add(blobComposite, [...ring, centre]);

    const neighbourLength = 2 * targetRadius * Math.sin(Math.PI / particleCount);
    const secondLength = 2 * targetRadius * Math.sin((Math.PI * 2) / particleCount);

    for (let i = 0; i < particleCount; i++) {
      const next = (i + 1) % particleCount;
      const next2 = (i + 2) % particleCount;
      const opposite = (i + particleCount / 2) % particleCount;

      Composite.add(blobComposite, Constraint.create({
        bodyA: ring[i],
        bodyB: ring[next],
        length: neighbourLength,
        stiffness: .48,
        damping: .08
      }));

      Composite.add(blobComposite, Constraint.create({
        bodyA: ring[i],
        bodyB: ring[next2],
        length: secondLength,
        stiffness: .13,
        damping: .06
      }));

      Composite.add(blobComposite, Constraint.create({
        bodyA: centre,
        bodyB: ring[i],
        length: targetRadius,
        stiffness: .055,
        damping: .11
      }));

      if (i < particleCount / 2) {
        Composite.add(blobComposite, Constraint.create({
          bodyA: ring[i],
          bodyB: ring[opposite],
          length: targetRadius * 2,
          stiffness: .026,
          damping: .08
        }));
      }
    }

    Composite.add(engine.world, [...walls, blobComposite]);

    grabConstraint = null;
    activePointer = null;
    accumulator = 0;
    previousTime = performance.now();

    renderBlob();
  }

  function wallOptions() {
    return {
      isStatic: true,
      restitution: .52,
      friction: .06,
      render: { visible: false }
    };
  }

  function points() {
    return ring.map((particle) => ({
      x: particle.position.x,
      y: particle.position.y
    }));
  }

  function smoothClosedPath(shape, tension = .92) {
    const count = shape.length;
    if (count < 3) return "";

    let d = `M ${shape[0].x.toFixed(2)} ${shape[0].y.toFixed(2)}`;

    for (let i = 0; i < count; i++) {
      const p0 = shape[(i - 1 + count) % count];
      const p1 = shape[i];
      const p2 = shape[(i + 1) % count];
      const p3 = shape[(i + 2) % count];

      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return d + " Z";
  }

  function renderBlob() {
    if (!ring.length) return;

    const shape = points();
    const path = smoothClosedPath(shape);

    blob.setAttribute("d", path);
    rim.setAttribute("d", path);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let centreX = 0;
    let centreY = 0;

    for (const point of shape) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      centreX += point.x;
      centreY += point.y;
    }

    centreX /= shape.length;
    centreY /= shape.length;

    const width = maxX - minX;
    const height = maxY - minY;
    const floorDistance = Math.max(0, stageHeight - maxY);

    shadow.setAttribute("cx", centreX.toFixed(2));
    shadow.setAttribute("cy", Math.min(stageHeight - 8, maxY + 17).toFixed(2));
    shadow.setAttribute("rx", Math.max(22, width * .40).toFixed(2));
    shadow.setAttribute("ry", Math.max(5, Math.min(11, height * .09)).toFixed(2));
    shadow.style.opacity = String(clamp(.34 - floorDistance / 260, .07, .34));

    highlight.setAttribute("cx", (centreX - width * .18).toFixed(2));
    highlight.setAttribute("cy", (centreY - height * .21).toFixed(2));
    highlight.setAttribute("rx", Math.max(8, width * .13).toFixed(2));
    highlight.setAttribute("ry", Math.max(5, height * .08).toFixed(2));
  }

  function pointerPosition(event) {
    const rect = stage.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function pointInsidePolygon(point, polygon) {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersects =
        ((yi > point.y) !== (yj > point.y)) &&
        (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || .0001) + xi);

      if (intersects) inside = !inside;
    }

    return inside;
  }

  function nearestParticle(point) {
    let nearest = ring[0];
    let distance = Infinity;

    for (const particle of ring) {
      const dx = particle.position.x - point.x;
      const dy = particle.position.y - point.y;
      const nextDistance = Math.hypot(dx, dy);

      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = particle;
      }
    }

    return { particle: nearest, distance };
  }

  stage.addEventListener("pointerdown", (event) => {
    if (!engine || !ring.length || activePointer !== null) return;

    const pointer = pointerPosition(event);
    const shape = points();
    const nearest = nearestParticle(pointer);
    const inside = pointInsidePolygon(pointer, shape);

    if (!inside && nearest.distance > 20) return;

    event.preventDefault();

    activePointer = event.pointerId;
    previousPointer = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now()
    };
    releaseVelocity = { x: 0, y: 0 };

    const bodyToGrab = nearest.distance < targetRadius * .72 ? nearest.particle : centre;

    grabConstraint = Constraint.create({
      pointA: pointer,
      bodyB: bodyToGrab,
      pointB: { x: 0, y: 0 },
      stiffness: .22,
      damping: .14,
      length: 0
    });

    Composite.add(engine.world, grabConstraint);

    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });

  stage.addEventListener("pointermove", (event) => {
    if (!grabConstraint || event.pointerId !== activePointer) return;

    event.preventDefault();

    const now = performance.now();
    const dt = Math.max(8, now - previousPointer.time);

    releaseVelocity.x =
      releaseVelocity.x * .42 +
      ((event.clientX - previousPointer.x) / dt) * 16.6667 * .58;

    releaseVelocity.y =
      releaseVelocity.y * .42 +
      ((event.clientY - previousPointer.y) / dt) * 16.6667 * .58;

    grabConstraint.pointA = pointerPosition(event);

    previousPointer = {
      x: event.clientX,
      y: event.clientY,
      time: now
    };
  });

  function release(event) {
    if (!grabConstraint || event.pointerId !== activePointer) return;

    Composite.remove(engine.world, grabConstraint);
    grabConstraint = null;

    const limited = limitVector(releaseVelocity, 28);

    for (const particle of [...ring, centre]) {
      Body.setVelocity(particle, {
        x: particle.velocity.x * .42 + limited.x * .58,
        y: particle.velocity.y * .42 + limited.y * .58
      });
      Sleeping.set(particle, false);
    }

    activePointer = null;
    stage.classList.remove("dragging");

    try {
      stage.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may already have released capture.
    }
  }

  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  stage.addEventListener("keydown", (event) => {
    if (!engine || !ring.length) return;

    const impulses = {
      ArrowLeft: { x: -4.5, y: 0 },
      ArrowRight: { x: 4.5, y: 0 },
      ArrowUp: { x: 0, y: -6.5 },
      ArrowDown: { x: 0, y: 3 },
      " ": { x: 3.5, y: -7 }
    };

    const impulse = impulses[event.key];
    if (!impulse) return;

    event.preventDefault();

    for (const particle of [...ring, centre]) {
      Body.setVelocity(particle, {
        x: particle.velocity.x + impulse.x,
        y: particle.velocity.y + impulse.y
      });
      Sleeping.set(particle, false);
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildSimulation, 140);
  });

  resizeObserver.observe(stage);
  buildSimulation();

  function frame(time) {
    const delta = Math.min(maxFrameDelta, time - previousTime);
    previousTime = time;
    accumulator += delta;

    while (accumulator >= fixedStep) {
      Engine.update(engine, fixedStep);
      accumulator -= fixedStep;
    }

    renderBlob();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  if (matterReady) return matterReady;

  matterReady = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-matter-loader]');

    if (existing) {
      existing.addEventListener("load", () => resolve(window.Matter), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/public/vendor/matter.min.js?v=20260927-6";
    script.async = true;
    script.dataset.matterLoader = "1";
    script.addEventListener("load", () => {
      if (window.Matter) resolve(window.Matter);
      else reject(new Error("Matter.js loaded without exposing window.Matter"));
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Could not load Matter.js")), { once: true });
    document.head.appendChild(script);
  });

  return matterReady;
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
