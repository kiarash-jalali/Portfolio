import { aiSteps, promptExamples } from "./content.js";
import { getLang, localized } from "./i18n.js";

let activeStep = "prompt";
let promptIndex = 0;
let revealed = false;

export function initAI() {
  document.querySelector("#aiSteps")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ai-step]");
    if (!button) return;
    activeStep = button.dataset.aiStep;
    refreshAI();
  });

  document.querySelector("#aiSteps")?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...document.querySelectorAll("[data-ai-step]")];
    if (!buttons.length) return;
    let index = buttons.indexOf(document.activeElement);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = buttons.length - 1;
    else {
      const direction = document.documentElement.dir === "rtl" ? -1 : 1;
      index = (index + (event.key === "ArrowRight" ? direction : -direction) + buttons.length) % buttons.length;
    }
    event.preventDefault();
    buttons[index].focus();
    buttons[index].click();
  });

  document.querySelector("#refinePrompt")?.addEventListener("click", () => { revealed = true; refreshPrompt(); });
  document.querySelector("#nextPrompt")?.addEventListener("click", () => { promptIndex = (promptIndex + 1) % promptExamples.length; revealed = false; refreshPrompt(); });
  refreshAI();
}

export function refreshAI() {
  const lang = getLang();
  const step = aiSteps.find((item) => item.key === activeStep) || aiSteps[0];
  document.querySelectorAll("[data-ai-step]").forEach((button) => {
    const active = button.dataset.aiStep === step.key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const detail = document.querySelector("#aiStepDetail");
  if (detail) detail.innerHTML = `<b>${step.number} / ${localized(step.title, lang).toUpperCase()}</b><span>${localized(step.detail, lang)}</span>`;
  refreshPrompt();
}

function refreshPrompt() {
  const lang = getLang();
  const example = promptExamples[promptIndex];
  const before = document.querySelector("#promptBefore");
  const after = document.querySelector("#promptAfter");
  if (before) before.textContent = localized(example.before, lang);
  if (after) after.textContent = revealed ? localized(example.after, lang) : "···";
}
