document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * 17;
    const rotateX = (y / rect.height - 0.5) * -17;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
});

const translations = {
  en: {
    "header-title": "Lorem Ipsum",
    "header-text":
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam euturpis molestie, dictum est a, mattis tellus.",
    "education-title": "Education",
    "education-txt-1": "Lorem University - B.S. in Computer Science (2020)",
    "education-txt-2": "Ipsum College - Frontend Bootcamp (2022)",
    "interests-title": "Interests",
    "interests-txt-1": "Coding",
    "interests-txt-2": "UI/UX Design",
    "interests-txt-3": "Gaming",
    "interests-txt-4": "Photography",
    "projects-title": "Projects",
    "projects-txt-1":
      " Project One - Lorem ipsum dolor sit amet, consectetur adipiscingelit.",
    "projects-txt-2":
      " Project Two - Duis aute irure dolor in reprehenderit in voluptate velit.",
    "projects-txt-3":
      " Project Three - Excepteur sint occaecat cupidatat non proident.",
    copyright: "&copy; 2025 Lorem Ipsum. All rights reserved.",
  },
  فارسی: {
    "header-title": "سلیدسبلد",
    "header-text":
      "ثتقا رذصخقعر دخصتثذرهصاخیذرم تیذرخصتیذ رخعصارحصدیمرتذصخعی ذرمحصیذدر مصاذتذ",
    "education-title": "هصابذمتص دب",
    "education-txt-1": "نتذختدحصقهبدرذخصایذزمرتصدکینئئرصیر",
    "education-txt-2": "سثبهذحسهبیاذهتد",
    "interests-title": "ثقتثقلت",
    "interests-txt-1": "فتلت",
    "interests-txt-2": "ثبشدلن",
    "interests-txt-3": "قغسلفاشبشذ",
    "interests-txt-4": "صقلدسلبذصفا",
    "projects-title": "ص4ثفاسلبدقغدغد",
    "projects-txt-1": " ثمانبقذرصهابثذصحبرذضثبجخردصبحخهغذارصخبهاحذحصثبتدذصثفقذ",
    "projects-txt-2": " صثبکهذاصثبخعراذصحثبراضذحثقرهاضتربضثقض",
    "projects-txt-3": " سبذهصاذرضخعثقذرحضاتردحضختیصنزد",
    copyright: "&copy; 2025 صقدفصهاذصثبرنتصثذ",
  },
};

let currentLang = "en";

document.getElementById("langToggle").addEventListener("click", () => {
  document.querySelector(".intro").classList.toggle("intro-rtl");
  document.querySelector("body,html").classList.toggle("direction");
  currentLang = currentLang === "en" ? "فارسی" : "en";
  updateLanguage();
  document.getElementById("langToggle").textContent = currentLang.toUpperCase();
  updateLanguage();
});

function updateLanguage() {
  document.querySelectorAll("[data-tr]").forEach((el) => {
    const key = el.getAttribute("data-tr");
    const translation = translations[currentLang][key];
    if (translation) {
      el.textContent = translation;
    }
  });
}
