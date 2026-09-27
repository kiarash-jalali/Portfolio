import { initI18n, toggleLang, getLang, applyTranslations } from "./i18n.js";
import { renderDynamicContent } from "./render.js";
import { initTheme, initGlobalEffects, refreshEffects } from "./effects.js";
import { initHeroTyping } from "./hero.js";
import { initProjects, refreshProjects } from "./projects.js";
import { initAI, refreshAI } from "./ai.js";
import { initLab } from "./lab.js";
import { initContact } from "./contact.js";

initTheme();
initI18n();
renderDynamicContent();
initGlobalEffects();
initHeroTyping();
initProjects();
initAI();
initLab();
initContact();

const langButton = document.querySelector("#langBtn");
function syncLanguageUi() {
  applyTranslations();
  renderDynamicContent();
  langButton.textContent = getLang() === "en" ? "فا" : "EN";
  requestAnimationFrame(() => {
    refreshEffects();
    refreshProjects();
    refreshAI();
  });
}

langButton?.addEventListener("click", () => {
  toggleLang();
  syncLanguageUi();
});

// Static translation was already applied by initI18n; dynamic sections need one final sync.
syncLanguageUi();

document.querySelector("#year").textContent = new Date().getFullYear();

console.log(
  "%cYou found the backstage :)%c\nThis portfolio intentionally keeps the interaction layer in plain JavaScript. Rootine is where I push React/Next.js further.\nTry: window.kj.help()",
  "color:#22d3ee;font-size:16px;font-weight:700",
  "color:#9698ad"
);

window.kj = {
  help() {
    return {
      hello: "Hi. You're inspecting the right things.",
      stack: ["HTML", "CSS", "JavaScript", "React/Next.js in Rootine", "AI-assisted workflow"],
      github: "https://github.com/kiarash-jalali"
    };
  }
};
