const canvas = document.querySelector("#livingPool");

if (canvas) {
  initLivingPool(canvas);
}

function initLivingPool(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const creatures = [];
  const particles = [];
  const hearts = [];

  const pointer = {
    x: -9999,
    y: -9999,
    active: false,
    down: false
  };

  let width = innerWidth;
  let height = innerHeight;
  let dpr = 1;
  let lastTime = performance.now();

  const personalityCycle = ["shy", "friendly", "neutral", "friendly", "neutral", "shy"];

  function resize() {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const desired = reducedMotion
      ? Math.max(10, Math.round(width / 120))
      : width < 620
        ? 22
        : width < 1050
          ? 30
          : 42;

    while (creatures.length < desired) {
      creatures.push(createCreature(creatures.length));
    }

    if (creatures.length > desired) {
      creatures.length = desired;
    }
  }

  function createCreature(index = 0) {
    const personality = personalityCycle[index % personalityCycle.length];
    const angle = random(0, Math.PI * 2);
    const speed = random(22, 42);

    return {
      personality,
      x: random(24, Math.max(25, width - 24)),
      y: random(24, Math.max(25, height - 24)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      headRadius: random(5.5, 8.5),
      tailLength: random(10, 19),
      tailWidth: random(1.3, 2.4),
      phase: random(0, Math.PI * 2),
      frequency: random(1.25, 2.15),
      seed: random(-1000, 1000),
      tint: { r: 232, g: 234, b: 240 },
      opacity: random(.72, .95),
      proximity: 0,
      feed: 0,
      feedGoal: random(2.1, 4.7),
      cooldown: random(0, 2),
      annoyed: 0,
      sated: 0,
      deadUntil: 0,
      wobble: random(1.15, 2.05)
    };
  }

  function respawn(creature) {
    const side = Math.floor(random(0, 4));

    if (side === 0) {
      creature.x = random(30, width - 30);
      creature.y = -30;
    } else if (side === 1) {
      creature.x = width + 30;
      creature.y = random(30, height - 30);
    } else if (side === 2) {
      creature.x = random(30, width - 30);
      creature.y = height + 30;
    } else {
      creature.x = -30;
      creature.y = random(30, height - 30);
    }

    const targetX = width * random(.25, .75);
    const targetY = height * random(.2, .8);
    const direction = Math.atan2(targetY - creature.y, targetX - creature.x);
    const speed = random(26, 46);

    creature.vx = Math.cos(direction) * speed;
    creature.vy = Math.sin(direction) * speed;
    creature.feed = 0;
    creature.feedGoal = random(2.1, 4.7);
    creature.cooldown = random(1.5, 4);
    creature.annoyed = 0;
    creature.sated = 0;
    creature.deadUntil = 0;
    creature.tint = { r: 232, g: 234, b: 240 };
  }

  function updateCreature(creature, dt, time) {
    if (creature.deadUntil) {
      if (time >= creature.deadUntil) respawn(creature);
      else return;
    }

    creature.cooldown = Math.max(0, creature.cooldown - dt);
    creature.annoyed = Math.max(0, creature.annoyed - dt);
    creature.sated = Math.max(0, creature.sated - dt);

    const dx = pointer.x - creature.x;
    const dy = pointer.y - creature.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const nearPointer = pointer.active && distance < 185;

    let targetColor = { r: 232, g: 234, b: 240 };
    let desiredSpeed = 32;

    const flow =
      Math.sin(creature.y * .005 + time * .00028 + creature.seed) +
      Math.cos(creature.x * .004 - time * .00022 - creature.seed * .5);

    const flowAngle = flow * 1.2 + Math.sin(time * .00018 + creature.phase) * .55;

    creature.vx += Math.cos(flowAngle) * 5.5 * dt;
    creature.vy += Math.sin(flowAngle) * 5.5 * dt;

    creature.vx += Math.sin(time * .001 * creature.frequency + creature.phase) * 2.5 * dt;
    creature.vy += Math.cos(time * .0009 * creature.frequency + creature.phase) * 2.5 * dt;

    creature.proximity += ((nearPointer ? 1 - distance / 185 : 0) - creature.proximity) * Math.min(1, dt * 7);

    if (creature.personality === "shy" && nearPointer) {
      const strength = clamp(1 - distance / 185, 0, 1);
      targetColor = { r: 255, g: 74, b: 88 };
      desiredSpeed = 78 + strength * 96;

      creature.vx -= (dx / distance) * (78 + strength * 190) * dt;
      creature.vy -= (dy / distance) * (78 + strength * 190) * dt;

      const tangent = strength * 22;
      creature.vx += (-dy / distance) * tangent * dt;
      creature.vy += (dx / distance) * tangent * dt;
    }

    if (creature.personality === "friendly" && nearPointer && creature.sated <= 0) {
      const strength = clamp(1 - distance / 185, 0, 1);
      targetColor = { r: 63, g: 177, b: 255 };
      desiredSpeed = 50 + strength * 52;

      if (distance > 36) {
        creature.vx += (dx / distance) * (42 + strength * 54) * dt;
        creature.vy += (dy / distance) * (42 + strength * 54) * dt;
      } else {
        const orbit = Math.sin(time * .009 + creature.phase) > 0 ? 1 : -1;
        creature.vx += (-dy / distance) * 84 * orbit * dt;
        creature.vy += (dx / distance) * 84 * orbit * dt;
        creature.vx -= (dx / distance) * 24 * dt;
        creature.vy -= (dy / distance) * 24 * dt;
      }

      if (distance < 54 && creature.cooldown <= 0) {
        creature.feed += dt * (1.05 + strength * .9);

        const nibble = Math.sin(time * .024 + creature.phase) * 11;
        creature.vx += (dx / distance) * nibble * dt;
        creature.vy += (dy / distance) * nibble * dt;

        if (creature.feed >= creature.feedGoal) {
          spawnHeart(creature);
          creature.feed = 0;
          creature.feedGoal = random(2.6, 5.2);
          creature.cooldown = random(4.2, 7.2);
          creature.sated = 1.8;
          creature.vx -= (dx / distance) * random(70, 105);
          creature.vy -= (dy / distance) * random(70, 105);
        }
      }
    }

    if (creature.personality === "friendly" && creature.sated > 0) {
      targetColor = { r: 88, g: 192, b: 255 };
      desiredSpeed = 102;
    }

    if (creature.personality === "neutral" && creature.annoyed > 0) {
      targetColor = { r: 244, g: 214, b: 142 };
      desiredSpeed = 92;
    }

    creature.tint.r += (targetColor.r - creature.tint.r) * Math.min(1, dt * 7);
    creature.tint.g += (targetColor.g - creature.tint.g) * Math.min(1, dt * 7);
    creature.tint.b += (targetColor.b - creature.tint.b) * Math.min(1, dt * 7);

    const margin = 74;
    const edgeForce = 54;

    if (creature.x < margin) creature.vx += edgeForce * dt;
    if (creature.x > width - margin) creature.vx -= edgeForce * dt;
    if (creature.y < margin) creature.vy += edgeForce * dt;
    if (creature.y > height - margin) creature.vy -= edgeForce * dt;

    creature.vx *= Math.pow(.992, dt * 60);
    creature.vy *= Math.pow(.992, dt * 60);

    const currentSpeed = Math.hypot(creature.vx, creature.vy) || 1;

    if (currentSpeed < desiredSpeed * .72) {
      creature.vx += (creature.vx / currentSpeed) * desiredSpeed * .18 * dt;
      creature.vy += (creature.vy / currentSpeed) * desiredSpeed * .18 * dt;
    }

    const maxSpeed = desiredSpeed * 1.22;
    const limited = limitVector({ x: creature.vx, y: creature.vy }, maxSpeed);
    creature.vx = limited.x;
    creature.vy = limited.y;

    creature.x += creature.vx * dt;
    creature.y += creature.vy * dt;

    if (creature.x < -90) creature.x = width + 70;
    if (creature.x > width + 90) creature.x = -70;
    if (creature.y < -90) creature.y = height + 70;
    if (creature.y > height + 90) creature.y = -70;

    const movementAngle = Math.atan2(creature.vy, creature.vx);
    creature.angle += angleDelta(creature.angle, movementAngle) * Math.min(1, dt * 4.5);
  }

  function drawCreature(creature, time) {
    if (creature.deadUntil) return;

    const tailWave =
      Math.sin(time * .0105 * creature.frequency + creature.phase) *
      creature.headRadius * .72;

    const tailTipWave =
      Math.sin(time * .016 * creature.wobble + creature.phase * 1.35) *
      creature.headRadius * .34;

    ctx.save();
    ctx.translate(creature.x, creature.y);
    ctx.rotate(creature.angle);

    const color =
      `${Math.round(creature.tint.r)},${Math.round(creature.tint.g)},${Math.round(creature.tint.b)}`;

    const glow =
      creature.proximity > .04 ||
      creature.annoyed > 0 ||
      creature.sated > 0;

    if (glow) {
      ctx.shadowColor = `rgba(${color},${.26 + creature.proximity * .3})`;
      ctx.shadowBlur = 12 + creature.proximity * 11;
    }

    // Round leading head.
    ctx.beginPath();
    ctx.arc(0, 0, creature.headRadius * 1.18, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color},${creature.opacity * .18})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, creature.headRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color},${creature.opacity})`;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Small specular highlight so the head reads as the front.
    ctx.beginPath();
    ctx.arc(
      creature.headRadius * .22,
      -creature.headRadius * .26,
      creature.headRadius * .25,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(255,255,255,${creature.opacity * .68})`;
    ctx.fill();

    // Short tapered tail, attached behind the head.
    const tailStartX = -creature.headRadius * .72;
    const tailMidX = tailStartX - creature.tailLength * .42;
    const tailEndX = tailStartX - creature.tailLength;

    const drawTail = (lineWidth, alpha) => {
      ctx.beginPath();
      ctx.moveTo(tailStartX, 0);
      ctx.bezierCurveTo(
        tailStartX - creature.tailLength * .18,
        tailWave * .18,
        tailMidX,
        tailWave * .72,
        tailEndX,
        tailWave + tailTipWave
      );
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.stroke();
    };

    drawTail(creature.tailWidth * 2.1, creature.opacity * .18);
    drawTail(creature.tailWidth, creature.opacity * .92);

    ctx.beginPath();
    ctx.moveTo(tailStartX, 0);
    ctx.bezierCurveTo(
      tailStartX - creature.tailLength * .18,
      tailWave * .18,
      tailMidX,
      tailWave * .72,
      tailEndX,
      tailWave + tailTipWave
    );
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(.7, creature.tailWidth * .3);
    ctx.strokeStyle = `rgba(255,255,255,${creature.opacity * .72})`;
    ctx.stroke();

    ctx.restore();
  }

  function explode(creature, now) {
    if (creature.deadUntil) return;

    const count = Math.round(random(13, 20));

    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(45, 175);

      particles.push({
        x: creature.x,
        y: creature.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: random(1.1, 3.2),
        life: random(.55, 1.15),
        maxLife: 1,
        spin: random(-8, 8)
      });
    }

    creature.deadUntil = now + random(4800, 8200);
  }

  function annoy(creature, x, y) {
    const dx = creature.x - x;
    const dy = creature.y - y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const impulse = random(105, 155);

    creature.vx += (dx / distance) * impulse;
    creature.vy += (dy / distance) * impulse;
    creature.annoyed = 1.2;
  }

  function spawnHeart(creature) {
    hearts.push({
      x: creature.x,
      y: creature.y - creature.headRadius * 1.7,
      vx: random(-7, 7),
      vy: random(-28, -20),
      life: 1.45,
      maxLife: 1.45,
      scale: random(.8, 1.1),
      drift: random(-1, 1)
    });
  }

  function updateEffects(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(.96, dt * 60);
      particle.vy *= Math.pow(.96, dt * 60);
      particle.vy += 34 * dt;

      if (particle.life <= 0) particles.splice(i, 1);
    }

    for (let i = hearts.length - 1; i >= 0; i--) {
      const heart = hearts[i];

      heart.life -= dt;
      heart.x += heart.vx * dt + Math.sin(heart.life * 6 + heart.drift) * 5 * dt;
      heart.y += heart.vy * dt;
      heart.vy -= 2 * dt;

      if (heart.life <= 0) hearts.splice(i, 1);
    }
  }

  function drawEffects() {
    for (const particle of particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha * .9})`;
      ctx.fill();
    }

    for (const heart of hearts) {
      const alpha = clamp(heart.life / heart.maxLife, 0, 1);
      drawHeart(heart.x, heart.y, heart.scale * (1 + (1 - alpha) * .28), alpha);
    }
  }

  function drawHeart(x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-12, -4, -10, -14, -3, -14);
    ctx.bezierCurveTo(2, -14, 4, -10, 5, -7);
    ctx.bezierCurveTo(6, -10, 8, -14, 13, -14);
    ctx.bezierCurveTo(21, -14, 23, -4, 10, 5);
    ctx.lineTo(5, 10);
    ctx.closePath();

    ctx.fillStyle = `rgba(255,108,144,${alpha})`;
    ctx.shadowColor = `rgba(255,108,144,${alpha * .55})`;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  function frame(time) {
    const dt = Math.min(.034, Math.max(.001, (time - lastTime) / 1000));
    lastTime = time;

    ctx.clearRect(0, 0, width, height);

    const motionScale = reducedMotion ? .28 : 1;

    for (const creature of creatures) {
      updateCreature(creature, dt * motionScale, time);
      drawCreature(creature, time);
    }

    updateEffects(dt);
    drawEffects();

    requestAnimationFrame(frame);
  }

  function handlePointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }

  function handlePointerLeave() {
    pointer.active = false;
  }

  function handlePointerDown(event) {
    pointer.down = true;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;

    if (event.target.closest("a, button, input, textarea, select, dialog, .project-modal")) return;

    const now = performance.now();

    const hit = creatures
      .filter((creature) => !creature.deadUntil)
      .map((creature) => ({
        creature,
        distance: Math.hypot(creature.x - pointer.x, creature.y - pointer.y)
      }))
      .filter(({ creature, distance }) =>
        distance < Math.max(14, creature.headRadius + creature.tailLength * .45)
      )
      .sort((a, b) => a.distance - b.distance)[0];

    if (!hit) return;

    if (hit.creature.personality === "shy") {
      explode(hit.creature, now);
    } else if (hit.creature.personality === "neutral") {
      annoy(hit.creature, pointer.x, pointer.y);
    }
  }

  function handlePointerUp() {
    pointer.down = false;
  }

  addEventListener("resize", resize, { passive: true });
  addEventListener("pointermove", handlePointerMove, { passive: true });
  addEventListener("pointerleave", handlePointerLeave, { passive: true });
  addEventListener("blur", handlePointerLeave);
  addEventListener("pointerdown", handlePointerDown, { passive: true });
  addEventListener("pointerup", handlePointerUp, { passive: true });

  resize();
  requestAnimationFrame(frame);
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function limitVector(vector, maxLength) {
  const length = Math.hypot(vector.x, vector.y);

  if (!length || length <= maxLength) return vector;

  const scale = maxLength / length;

  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
}

function angleDelta(current, target) {
  let delta = target - current;

  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;

  return delta;
}
