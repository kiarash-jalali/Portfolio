import {
  facts, services, education, interests, skillGroups, tools,
  projects, aiSteps, contactLinks, marqueeStack
} from "./content.js";
import { getLang, localized, t } from "./i18n.js";

const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));

export function renderDynamicContent() {
  const lang = getLang();

  document.querySelector("#facts").innerHTML = facts.map((fact) => `
    <div class="fact"><span>${esc(localized(fact.label, lang))}</span><b>${esc(localized(fact.value, lang))}</b></div>
  `).join("");

  document.querySelector("#services").innerHTML = services.map((item) => `
    <article class="svc glowy hot-target"><span class="si">${esc(item.icon)}</span><h4>${esc(localized(item.title, lang))}</h4><p>${esc(localized(item.body, lang))}</p></article>
  `).join("");

  document.querySelector("#timeline").innerHTML = education.map((item) => `
    <article class="tl-item ${item.now ? "now" : ""}"><div class="tl-card hot-target">
      <span class="tl-year">${esc(localized(item.year, lang))}</span>
      <h3>${esc(localized(item.title, lang))}</h3>
      <p class="place">${esc(localized(item.place, lang))}</p>
      <p>${esc(localized(item.body, lang))}</p>
      <div class="tl-tags">${item.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
    </div></article>
  `).join("");

  document.querySelector("#interestGrid").innerHTML = interests.map((item, index) => `
    <article class="int hot-target" style="--ig:${item.gradient}"><span class="num">0${index + 1}</span><span class="emo">${item.emoji}</span><h3>${esc(localized(item.title, lang))}</h3><p>${esc(localized(item.body, lang))}</p></article>
  `).join("");

  document.querySelector("#skillBlocks").innerHTML = skillGroups.map((group, groupIndex) => `
    <section class="skill-block rv ${groupIndex ? `d${Math.min(groupIndex, 3)}` : ""}">
      <h3><span class="section-icon">${esc(group.icon)}</span>${esc(localized(group.title, lang))}</h3>
      ${group.items.map((item) => `
        <div class="bar ${group.warm ? "warm" : ""}" data-val="${item.level}" data-skills="${esc(item.skills.join(","))}">
          <div class="bar-top"><span>${esc(item.name)}</span><em>${esc(localized(item.status, lang))}</em></div>
          <div class="bar-track"><div class="bar-fill"></div></div>
        </div>`).join("")}
    </section>
  `).join("");

  document.querySelector("#toolGrid").innerHTML = tools.map((tool) => `
    <div class="tool hot-target"><div class="glyph" style="background:${tool.color}">${esc(tool.glyph)}</div><b>${esc(tool.name)}</b><span>${esc(tool.sub)}</span></div>
  `).join("");

  document.querySelector("#filters").innerHTML = ["all", "app", "clone", "tool"].map((key, i) => `
    <button class="fbtn hot-target ${i === 0 ? "active" : ""}" type="button" data-filter="${key}">${esc(t(`projects.filters.${key}`))}</button>
  `).join("");

  const rootine = projects.find((project) => project.featured);
  document.querySelector("#featuredProject").innerHTML = renderFeatured(rootine, lang);
  document.querySelector("#projectGrid").innerHTML = projects.filter((project) => !project.featured).map((project, index) => renderProjectCard(project, lang, index)).join("");

  document.querySelector("#aiSteps").innerHTML = aiSteps.map((step, index) => `
    <button class="ai-step hot-target ${index === 0 ? "active" : ""}" type="button" role="tab" aria-selected="${index === 0}" data-ai-step="${step.key}"><span>${step.number}</span>${esc(localized(step.title, lang))}</button>
  `).join("");

  document.querySelector("#contactLinks").innerHTML = contactLinks.map((link) => `
    <a class="contact-link hot-target" href="${link.href}" ${link.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}><span><small>${esc(localized(link.label, lang))}</small><br><b>${esc(link.value)}</b></span><span aria-hidden="true">↗</span></a>
  `).join("");

  const items = marqueeStack.map((item) => `<span class="mq-item"><i></i>${esc(item)}</span>`).join("");
  document.querySelector("#mqTrack").innerHTML = items + items;
}

function renderFeatured(project, lang) {
  return `
    <article class="featured rv glowy project-node" data-project="${project.key}" data-project-skills="${project.skills.join(",")}">
      <div class="featured-copy">
        <div class="featured-top"><span class="status-badge">${esc(t("projects.rootineStatus"))}</span><span class="featured-number">01 / FEATURED</span></div>
        <h3>${esc(project.title)}</h3>
        <p class="featured-tagline">${esc(t("projects.rootineTagline"))}</p>
        <p class="featured-desc">${esc(localized(project.description, lang))}</p>
        <div class="featured-tags">${project.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
        <div class="featured-actions">
          <button class="btn btn-primary magnet hot-target" type="button" data-open-project="${project.key}">${esc(t("projects.viewCase"))}<span>↗</span></button>
          <a class="btn btn-ghost magnet hot-target" href="${project.repo}" target="_blank" rel="noopener">${esc(t("projects.repo"))}<span>↗</span></a>
        </div>
      </div>
      <div class="rootine-preview rootine-live-preview" id="rootinePreview">
        <div class="rootine-live-bar">
          <span><i></i>${esc(t("projects.interactive"))}</span>
          <a href="${project.live}" target="_blank" rel="noopener">${esc(t("projects.live"))} ↗</a>
        </div>
        <iframe src="${project.live}" title="${esc(project.title)} live login preview" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>
      </div>
    </article>`;
}

function renderProjectCard(project, lang, index) {
  return `
    <article class="pj rv d${Math.min(index + 1, 3)} project-node" data-project="${project.key}" data-project-cat="${project.category}" data-project-skills="${project.skills.join(",")}">
      <div class="shot">
        <img src="${project.image}" alt="${esc(project.title)} preview" loading="lazy" />
        <div class="shot-veil"><span class="btn btn-primary viewbtn">${esc(t("projects.viewCase"))}</span></div>
      </div>
      <div class="pj-body">
        <span class="pj-type">${esc(project.category.toUpperCase())}</span>
        <h3>${esc(project.title)}</h3>
        <p>${esc(localized(project.description, lang))}</p>
        <div class="tl-tags">${project.tags.slice(0, 4).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
        <div class="pj-links">
          <a class="live hot-target" href="${project.live}" target="_blank" rel="noopener">${esc(t("projects.live"))} ↗</a>
          <button class="hot-target" type="button" data-open-project="${project.key}">${esc(t("projects.details"))} +</button>
        </div>
      </div>
    </article>`;
}
