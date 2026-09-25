/* PesaCerto — tema claro/escuro */
(function () {
  "use strict";
  var KEY = "pesacerto-theme";
  var root = document.documentElement;

  function getSaved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setSaved(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  function applyTheme(theme) {
    theme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", theme);
    var buttons = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-theme-set") === theme));
    }
  }

  var saved = getSaved();
  applyTheme(saved || "light");

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getSaved() || "light");
    var buttons = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        event.preventDefault();
        var theme = this.getAttribute("data-theme-set");
        applyTheme(theme);
        setSaved(theme);
        root.classList.add("theme-anim");
        setTimeout(function () { root.classList.remove("theme-anim"); }, 200);
      });
    }
  });
})();
