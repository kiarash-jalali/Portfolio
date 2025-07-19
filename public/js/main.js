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
    "header-title": "Hi, I’m Kiarash",
    "header-text": "Junior Front‑end Developer passionate about clean code.",
    "info-header": "Contact",
    "info-txt-1": `Phone:
              <a href="tel:+989218089883">+989218089883</a>`,
    "info-txt-2": `Email:
              <a href="mailto:kiarash11.kj@gmail.com"
                >kiarash11.kj@gmail.com</a
              >`,
    "info-txt-3": `Telegram:
              <a href="https://t.me/Kiarash_jal"
                >@Kiarash_jal</a
              >`,
    "info-txt-4": `GitHub:
              <a href="https://github.com/kiarash-jalali"
                >Kiarash-jalali</a
              >`,
    "education-title": "Education",
    "education-txt-1":
      "Associate of Science in Chemical Engineering. AmirKabir University of Technology (2023)",
    "education-txt-2": " Web Development at Tehran Technical Complex",
    "interests-title": "Interests",
    "interests-txt-1": "Coding",
    "interests-txt-2": "Gaming",
    "interests-txt-3": "Profesional cooking. I’m a chef!",
    "interests-txt-4": "Writing fictional stories",
    "skills-title": "Skills",
    "skills-txt-1": "HTML & CSS",
    "skills-txt-2": "Java Script",
    "skills-txt-3": "Git & Github",
    "skills-txt-4": "Tailwind & bootstrap",
    "skills-txt-5": "Learning React",
    "skills-txt-6": "Sass",
    "skills-txt-7": "C & Python",
    "skills-txt-8": "Matlab & DWSim",
    "projects-title": "Projects",
    "projects-txt-1": `<img src="./public/media/golestan.jpg" />
            <span>Golestan Company clone (HTML, CSS)</span><br />
            A responsive replica of the Golestan landing page. Features flexbox
            layout and hover effects.
            <br /><a
              href="https://kiarashi-coder.github.io/Golestan/"
             
              rel="noopener noreferrer"
              >Golestan</a
            >`,
    "projects-txt-2": `<img src="./public/media/digikala.jpg" />
            <span>Digikala clone (HTML, CSS)</span><br />
            A responsive replica of the Digakala landing page. with mega menu,
            swiper and literaly every single detail available on it!
            <br /><a
              href="https://kiarash-jalali.github.io/digikala/"
             
              rel="noopener noreferrer"
              >Digikala</a
            >`,
    "projects-txt-3": `<img src="./public/media/cpg.jpg" />
            <span>Color Palette Generator (JS)</span><br />
            Generates random color palettes and lets users copy HEX codes with a
            click.
            <br /><a
              href="https://kiarash-jalali.github.io/color-pallet/"
             
              rel="noopener noreferrer"
              >Color Pallet</a
            >`,
    "projects-txt-4": "New projects will be added here...",
    copyright: `&copy; 2025 Kiarash Jalali`,
  },
  فارسی: {
    "header-title": "سلام، من کیارش هستم",
    "header-text": "برنامه نویس فرانت اند",
    "info-header": "Contact",
    "info-txt-1": `تلفن:
              <a href="tel:+989218089883">+989218089883</a>`,
    "info-txt-2": `ایمیل:
              <a href="mailto:kiarash11.kj@gmail.com"
                >kiarash11.kj@gmail.com</a
              >`,
    "info-txt-3": `تلگرام:
              <a href="https://t.me/Kiarash_jal"
                >@Kiarash_jal</a
              >`,
    "info-txt-4": `GitHub:
              <a href="https://github.com/kiarash-jalali"
                >Kiarash-jalali</a
              >`,
    "education-title": "تحصیلات",
    "education-txt-1": "کاردانی مهندسی شیمی از دانشگاه صنعتی امیرکبیر تهران",
    "education-txt-2": "دوره web development از مجتمع فنی تهران",
    "interests-title": "علاقه مندی ها",
    "interests-txt-1": "برنامه نوسی",
    "interests-txt-2": "Gaming",
    "interests-txt-3": "آشپزی حرفه ای",
    "interests-txt-4": "نویسندگی و مطالعه",
    "skills-title": "توانایی ها",
    "skills-txt-1": "HTML & CSS",
    "skills-txt-2": "Java Script",
    "skills-txt-3": "Git & Github",
    "skills-txt-4": "Tailwind & bootstrap",
    "skills-txt-5": "Learning React",
    "skills-txt-6": "Sass",
    "skills-txt-7": "C & Python",
    "skills-txt-8": "Matlab & DWSim",
    "projects-title": "پروژه ها",
    "projects-txt-1": `<img src="./public/media/golestan.jpg" />
            <span>سایت شرکت گلستان (HTML, CSS)</span><br />
            یک کپی واکنشگرا از صفحه اول شرکت گلستان. دارای طرح بندی فلکس باکس و افکت های هاور.
            <br /><a
              href="https://kiarashi-coder.github.io/Golestan/"
             
              rel="noopener noreferrer"
              >Golestan</a
            >`,
    "projects-txt-2": `<img src="./public/media/digikala.jpg" />
            <span>صفحه اول سایت دیجیکالا (HTML, CSS)</span><br />
            یک کپی واکنش‌گرا از صفحه اول دیجی‌کالا. با مگا منو، سواپر و به معنای واقعی کلمه تک تک جزئیات موجود در آن!
            <br /><a
              href="https://kiarash-jalali.github.io/digikala/"
             
              rel="noopener noreferrer"
              >Digikala</a
            >`,
    "projects-txt-3": `<img src="./public/media/cpg.jpg" />
            <span>تولید کننده پلت رنگ (JS)</span><br />
            پالت‌های رنگی تصادفی تولید می‌کند و به کاربران اجازه می‌دهد کدهای HEX را با یک کلیک کپی کنند.
            <br /><a
              href="https://kiarash-jalali.github.io/color-pallet/"
             
              rel="noopener noreferrer"
              >Color Pallet</a
            >`,
    "projects-txt-4": "پروژه های بعدی اینجا قرار داده خواهند شد...",
    copyright: `&copy; 2025 Kiarash Jalali`,
  },
};

let currentLang = "en";

document.getElementById("langToggle").addEventListener("click", () => {
  document.querySelector(".intro").classList.toggle("intro-rtl");
  document.querySelector(".header-container").classList.toggle("intro-rtl");
  document.querySelector("body,html").classList.toggle("direction");
  currentLang = currentLang === "en" ? "فارسی" : "en";
  updateLanguage();
  document.getElementById("langToggle").innerHTML = currentLang.toUpperCase();
});

function updateLanguage() {
  document.querySelectorAll("[data-tr]").forEach((item) => {
    const key = item.getAttribute("data-tr");
    const translation = translations[currentLang][key];
    if (translation) {
      item.innerHTML = translation;
    }
  });
}
