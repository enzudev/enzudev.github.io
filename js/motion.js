function formatCount(text, value) {
  const separator = (text.match(/\d([\s,\u00a0\u202f])\d/) || [])[1] || "";
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function countUp(element) {
  const text = element.textContent;
  const match = text.match(/\d(?:[\s,\u00a0\u202f]?\d)*/);
  const target = Number(match[0].replace(/\D/g, ""));
  const start = performance.now();
  const duration = 1400;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = text.replace(match[0], formatCount(match[0], Math.round(target * eased)));
    if (progress < 1) requestAnimationFrame(frame);
  }

  element.textContent = text.replace(match[0], formatCount(match[0], 0));
  requestAnimationFrame(frame);
}

function watch(elements, onChange, threshold) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => onChange(entry, observer)),
    { threshold }
  );
  elements.forEach((element) => observer.observe(element));
}

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("motion");

  document.addEventListener("DOMContentLoaded", () => {
    const revealed = document.querySelectorAll(
      ".hero-text, .status, .figures li, .section-label, .project-head, .shot, .project-grid, .rows > li, .contact-intro, .contact-list li, .foot"
    );
    revealed.forEach((element) => {
      const siblings = [...element.parentElement.children].filter((child) => child.tagName === element.tagName);
      element.style.setProperty("--delay", `${siblings.indexOf(element) * 0.09}s`);
      element.classList.add("reveal");
    });
    document.querySelectorAll(".slashed li").forEach((item) => {
      item.style.setProperty("--i", [...item.parentElement.children].indexOf(item));
    });

    const rules = document.querySelectorAll(".section");
    rules.forEach((rule) => rule.classList.add("draw"));
    watch(rules, (entry, observer) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }, 0.05);

    watch(revealed, (entry, observer) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }, 0.15);

    watch(document.querySelectorAll(".figures strong"), (entry, observer) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      observer.unobserve(entry.target);
    }, 1);

  });
}

let sideFrame = 0;

function updateSides() {
  sideFrame = 0;
  const sides = [...document.querySelectorAll(".side")];
  const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  sides.forEach((side, index) => {
    const box = side.parentElement.getBoundingClientRect();
    let progress = Math.min(Math.max((innerHeight * 0.95 - box.top) / box.height, 0), 1);
    if (atEnd && index === sides.length - 1) progress = 1;
    side.style.setProperty("--p", progress.toFixed(3));
  });
}

function queueSides() {
  if (!sideFrame) sideFrame = requestAnimationFrame(updateSides);
}

addEventListener("scroll", queueSides, { passive: true });
addEventListener("resize", queueSides);
document.addEventListener("DOMContentLoaded", updateSides);

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lost .ch").forEach((letter, index) => letter.style.setProperty("--i", index));
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".roll").forEach((roll) => {
    [...roll.children].forEach((letter, index) => letter.style.setProperty("--i", index));
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const brand = document.querySelector(".brand");
  if (!brand || !document.documentElement.classList.contains("motion")) return;
  brand.classList.add("typing");
  brand.addEventListener("animationend", (event) => {
    if (event.animationName === "logo-type-caret") brand.classList.replace("typing", "typed");
  });
});
