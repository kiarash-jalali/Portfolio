import { content } from "./content.js";

const root = document.documentElement;
let currentLang = readStored("kj-lang") || "en";
const listeners = new Set();

function readStored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

export function getLang() { return currentLang; }

export function t(path, lang = currentLang) {
  return path.split(".").reduce((obj, key) => obj?.[key], content[lang]) ?? path;
}

export function localized(value, lang = currentLang) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.en ?? "";
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const value = t(el.dataset.i18n);
    if (typeof value === "string") el.textContent = value;
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const value = t(el.dataset.i18nHtml);
    if (typeof value === "string") el.innerHTML = value;
  });
  document.title = currentLang === "fa"
    ? "کیارش جلالی — توسعه‌دهنده فرانت‌اند"
    : "Kiarash Jalali — Front-End Developer";
}

export function setLang(next) {
  currentLang = next === "fa" ? "fa" : "en";
  root.lang = currentLang;
  root.dir = currentLang === "fa" ? "rtl" : "ltr";
  writeStored("kj-lang", currentLang);
  applyTranslations();
  listeners.forEach((fn) => fn(currentLang));
}

export function toggleLang() {
  setLang(currentLang === "en" ? "fa" : "en");
}

export function onLangChange(fn) {
  listeners.add(fn);
  fn(currentLang);
  return () => listeners.delete(fn);
}

export function initI18n() {
  setLang(currentLang);
}
