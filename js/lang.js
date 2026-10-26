const LANG_KEY = "lang";
const FRENCH_PATH = "/fr/";

function savedLang() {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch (_) {
    return null;
  }
}

function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (_) {}
}

function preferredLang() {
  const saved = savedLang();
  if (saved) return saved;
  const first = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  return first.toLowerCase().startsWith("fr") ? "fr" : "en";
}

if (location.pathname === "/" && preferredLang() === "fr") {
  location.replace(FRENCH_PATH + location.hash);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest(".lang-switch a");
  if (link) saveLang(link.hreflang);
});
