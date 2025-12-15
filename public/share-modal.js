// public/share-modal.js
// Never crash if the share UI elements are missing.

(function () {
  function init() {
    const openBtn =
      document.querySelector("[data-share-open]") ||
      document.getElementById("share-open");

    const closeBtn =
      document.querySelector("[data-share-close]") ||
      document.getElementById("share-close");

    const modal =
      document.querySelector("[data-share-modal]") ||
      document.getElementById("share-modal");

    // If not present on this page, do nothing.
    if (!openBtn || !modal) return;

    openBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
