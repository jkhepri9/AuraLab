// public/share-modal.js
(function () {
  function init() {
    const el = document.getElementById("share-open");
    if (!el) return; // if it isn't on this page, do nothing

    el.addEventListener("click", () => {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
