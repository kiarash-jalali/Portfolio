export function initLab() {
  const row = document.querySelector("#switchRow");
  if (!row) return;
  row.addEventListener("click", (event) => {
    const button = event.target.closest(".micro-switch");
    if (!button) return;
    const buttons = [...row.querySelectorAll(".micro-switch")];
    const index = buttons.indexOf(button);
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    const indicator = row.querySelector(".switch-indicator");
    if (indicator) indicator.style.transform = `translateX(${index * 100 * (document.documentElement.dir === "rtl" ? -1 : 1)}%)`;
  });
}
