const THEME_KEY = "theme";
const THEME_COLORS = { dark: "#0d0d0d", light: "#f4f3ee" };
const root = document.documentElement;

function savedTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch (_) {
    return null;
  }
}

function currentTheme() {
  return root.dataset.theme || "dark";
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {}
}

function syncThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[currentTheme()];
}

function syncButtons() {
  const pressed = String(currentTheme() === "dark");
  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.setAttribute("aria-pressed", pressed);
  });
}

function applyTheme(theme, x, y) {
  const apply = () => {
    root.dataset.theme = theme;
    syncButtons();
    syncThemeColor();
  };
  const canAnimate =
    document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canAnimate) {
    apply();
    return;
  }
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    );
  });
}

const saved = savedTheme();
if (saved) root.dataset.theme = saved;

document.addEventListener("DOMContentLoaded", () => {
  syncButtons();
  syncThemeColor();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".theme-toggle");
  if (!button) return;
  const next = currentTheme() === "dark" ? "light" : "dark";
  const box = button.getBoundingClientRect();
  saveTheme(next);
  applyTheme(next, box.left + box.width / 2, box.top + box.height / 2);
});
