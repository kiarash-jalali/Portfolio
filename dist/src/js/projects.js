import { projects, profile } from "./content.js";
import { getLang, localized, t } from "./i18n.js";

let activeFilter = "all";

export function initProjects() {
  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-project]");
    if (opener) {
      event.preventDefault();
      openProject(opener.dataset.openProject);
      return;
    }

    const shot = event.target.closest(".pj .shot");
    if (shot) {
      const key = shot.closest(".pj")?.dataset.project;
      if (key) openProject(key);
      return;
    }

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      applyFilter();
      return;
    }

  });

  document.querySelector("#modalClose")?.addEventListener("click", closeModal);
  document.querySelector("#projectModal")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeModal();
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
  refreshProjects();
}

export function refreshProjects() {
  applyFilter();
}

function applyFilter() {
  document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === activeFilter));
  document.querySelectorAll(".pj[data-project-cat]").forEach((card) => card.classList.toggle("hide", activeFilter !== "all" && card.dataset.projectCat !== activeFilter));
  const featured = document.querySelector(".featured");
  if (featured) featured.style.display = activeFilter === "all" || activeFilter === "app" ? "grid" : "none";
}

function openProject(key) {
  const project = projects.find((item) => item.key === key);
  const modal = document.querySelector("#projectModal");
  if (!project || !modal) return;
  const lang = getLang();
  document.querySelector("#modalEyebrow").textContent = project.featured ? t("projects.rootineStatus") : project.category.toUpperCase();
  document.querySelector("#modalTitle").textContent = project.title;
  document.querySelector("#modalDescription").textContent = localized(project.modalDescription, lang);
  document.querySelector("#modalTags").innerHTML = project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
  document.querySelector("#modalFeatures").innerHTML = localized(project.features, lang).map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#modalWhy").textContent = localized(project.why, lang);

  const art = document.querySelector("#modalArt");
  art.innerHTML = project.image
    ? `<img src="${project.image}" alt="${project.title} preview">`
    : `<div class="rootine-modal-art">Rootine.</div>`;

  const actions = [];
  if (project.live) actions.push(`<a class="btn btn-primary" href="${project.live}" target="_blank" rel="noopener">${t("projects.live")} ↗</a>`);
  if (project.repo) actions.push(`<a class="btn btn-ghost" href="${project.repo}" target="_blank" rel="noopener">${t("projects.repo")} ↗</a>`);
  document.querySelector("#modalActions").innerHTML = actions.join("");

  if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.querySelector("#projectModal");
  if (!modal?.open) return;
  if (typeof modal.close === "function") modal.close(); else modal.removeAttribute("open");
  document.body.style.overflow = "";
}
