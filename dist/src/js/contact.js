import { profile } from "./content.js";
import { copyEmail } from "./ui.js";

export function initContact() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-copy-email]")) copyEmail(profile.email);
  });

  document.querySelector("#contactForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#contactName")?.value.trim() || "";
    const email = document.querySelector("#contactEmail")?.value.trim() || "";
    const message = document.querySelector("#contactMessage")?.value.trim() || "";
    const subject = encodeURIComponent(`Portfolio message from ${name || "a visitor"}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  });
}
