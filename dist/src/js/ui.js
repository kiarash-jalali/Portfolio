import { t } from "./i18n.js";

let toastTimer;
export function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

export async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    showToast(t("toast.copied"));
  } catch {
    const area = document.createElement("textarea");
    area.value = email;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    try { document.execCommand("copy"); showToast(t("toast.copied")); }
    catch { showToast(t("toast.copyFailed")); }
    area.remove();
  }
}
