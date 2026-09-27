import { projects, profile } from "./content.js";
import { getLang, localized, t } from "./i18n.js";
import { showToast } from "./ui.js";

let activeFilter = "all";
let evidence = null;

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

    const skill = event.target.closest("[data-evidence]");
    if (skill) {
      evidence = evidence === skill.dataset.evidence ? null : skill.dataset.evidence;
      applyEvidence();
      return;
    }

    const task = event.target.closest(".rp-task");
    if (task) {
      task.classList.toggle("done");
      task.querySelector("i").textContent = task.classList.contains("done") ? "✓" : "";
      updateRootinePreview();
      return;
    }

    if (event.target.closest("#rpCheckin")) {
      const tasks = [...document.querySelectorAll(".rp-task")];
      const allDone = tasks.every((item) => item.classList.contains("done"));
      tasks.forEach((task) => {
        task.classList.toggle("done", !allDone);
        task.querySelector("i").textContent = !allDone ? "✓" : "";
      });
      updateRootinePreview();
      showToast(allDone ? t("toast.reset") : t("toast.done"));
    }
  });

  document.addEventListener("pointerover", (event) => {
    const skill = event.target.closest("[data-evidence]");
    if (!skill || matchMedia("(hover:none)").matches) return;
    evidence = skill.dataset.evidence;
    applyEvidence();
  });
  document.addEventListener("pointerout", (event) => {
    const skill = event.target.closest("[data-evidence]");
    if (!skill || matchMedia("(hover:none)").matches) return;
    if (event.relatedTarget?.closest?.("[data-evidence]") === skill) return;
    evidence = null;
    applyEvidence();
  });
  document.addEventListener("focusin", (event) => {
    const skill = event.target.closest("[data-evidence]");
    if (skill) { evidence = skill.dataset.evidence; applyEvidence(); }
  });
  document.addEventListener("focusout", (event) => {
    if (event.target.closest("[data-evidence]")) { evidence = null; applyEvidence(); }
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
  applyEvidence();
  updateRootinePreview();
}

function applyFilter() {
  document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === activeFilter));
  document.querySelectorAll(".pj[data-project-cat]").forEach((card) => card.classList.toggle("hide", activeFilter !== "all" && card.dataset.projectCat !== activeFilter));
  const featured = document.querySelector(".featured");
  if (featured) featured.style.display = activeFilter === "all" || activeFilter === "app" ? "grid" : "none";
}

function applyEvidence() {
  document.querySelectorAll("[data-evidence]").forEach((button) => button.classList.toggle("active", evidence === button.dataset.evidence));
  document.querySelectorAll(".project-node").forEach((node) => {
    const skills = (node.dataset.projectSkills || "").split(",");
    node.classList.toggle("evidence-hit", Boolean(evidence && skills.includes(evidence)));
    node.classList.toggle("evidence-dim", Boolean(evidence && !skills.includes(evidence)));
  });
}

function updateRootinePreview() {
  const tasks = [...document.querySelectorAll(".rp-task")];
  if (!tasks.length) return;
  const done = tasks.filter((item) => item.classList.contains("done")).length;
  const count = document.querySelector("#rpCount");
  const ring = document.querySelector("#rpRing");
  const checkin = document.querySelector("#rpCheckin");
  if (count) count.textContent = `${done}/${tasks.length}`;
  if (ring) ring.style.setProperty("--pct", `${Math.round((done / tasks.length) * 100)}%`);
  if (checkin) {
    checkin.classList.toggle("complete", done === tasks.length);
    checkin.textContent = done === tasks.length ? t("projects.rootineReset") : t("projects.rootineCheckin");
  }
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
