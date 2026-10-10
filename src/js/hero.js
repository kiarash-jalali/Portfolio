import { getLang, onLangChange, t } from "./i18n.js";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let timer;

export function initHeroTyping() {
  const el = document.querySelector("#typed");
  if (!el) return;

  const start = () => {
    clearTimeout(timer);
    const list = t("hero.roles");
    if (!Array.isArray(list) || !list.length) return;
    if (reduceMotion) { el.textContent = list[0]; return; }
    let wordIndex = 0, chars = 0, deleting = false;
    el.textContent = "";

    const tick = () => {
      const word = list[wordIndex];
      chars += deleting ? -1 : 1;
      el.textContent = word.slice(0, Math.max(chars, 0));
      let wait = deleting ? 36 : 62;
      if (!deleting && chars === word.length) { wait = 1550; deleting = true; }
      else if (deleting && chars === 0) { deleting = false; wordIndex = (wordIndex + 1) % list.length; wait = 280; }
      timer = setTimeout(tick, wait);
    };
    tick();
  };

  onLangChange(start);
}
