export function initLab() {
  initMagneticField();
  initSpringGrid();
}

function initMagneticField() {
  const field = document.querySelector("#magnetLab");
  const target = document.querySelector("#magnetTarget");
  if (!field || !target || field.dataset.magnetFieldBound) return;
  field.dataset.magnetFieldBound = "1";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  field.addEventListener("pointermove", (event) => {
    const rect = field.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    target.style.transform = `translate3d(${x * 58}px,${y * 42}px,0) rotate(${x * 6}deg)`;
  });

  field.addEventListener("pointerleave", () => {
    target.style.transform = "";
  });
}

function initSpringGrid() {
  const grid = document.querySelector("#springGrid");
  if (!grid || grid.dataset.springBound) return;
  grid.dataset.springBound = "1";

  const size = 10;
  grid.innerHTML = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    return `<button class="spring-cell" type="button" tabindex="-1" data-row="${row}" data-col="${col}" aria-label="Spring cell ${index + 1}"></button>`;
  }).join("");

  const cells = [...grid.querySelectorAll(".spring-cell")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      const pushX = (dx / length) * 7 * strength;
      const pushY = (dy / length) * 7 * strength;

      cell.getAnimations().forEach((animation) => animation.cancel());
      cell.animate([
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${pushX}px,${pushY}px,0) scale(${1.12 + strength * .08})`, offset: .32 },
        { transform: `translate3d(${-pushX * .28}px,${-pushY * .28}px,0) scale(.93)`, offset: .67 },
        { transform: "translate3d(0,0,0) scale(1)" }
      ], {
        duration: 520 + distance * 16,
        delay: distance * 25,
        easing: "cubic-bezier(.22,.82,.18,1)"
      });
    });
  };

  grid.addEventListener("pointerover", (event) => {
    const cell = event.target.closest(".spring-cell");
    if (!cell || event.relatedTarget?.closest?.(".spring-cell") === cell) return;
    ripple(cell, .72);
  });

  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".spring-cell");
    if (!cell) return;
    cell.classList.toggle("latched");
    ripple(cell, 1.15);
  });
}
