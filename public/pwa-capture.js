(function () {
  if (typeof window === "undefined") return;
  window.__ravaliPwa = window.__ravaliPwa || { prompt: null, ready: false };

  if (!window.__ravaliPwaCaptureInit) {
    window.__ravaliPwaCaptureInit = true;

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      window.__ravaliPwa.prompt = e;
      window.__ravaliPwa.ready = true;
      window.dispatchEvent(new Event("ravali-pwa-prompt-ready"));
    });

    window.addEventListener("appinstalled", function () {
      window.__ravaliPwa.prompt = null;
      window.__ravaliPwa.ready = false;
      try {
        localStorage.setItem("ravali-pwa-installed", "1");
      } catch (err) {}
      window.dispatchEvent(new Event("ravali-pwa-state"));
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function () {});
    }
  }
})();
