/* =========================================================
   Finesse Detailing — site scripts
   ========================================================= */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "27732941730";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");

  /* ---------- Header: solid on scroll + mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

  function onScroll() {
    if (header) header.classList.toggle("is-solid", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function setMenu(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (toggle && header) {
    toggle.addEventListener("click", function () {
      setMenu(!header.classList.contains("is-open"));
    });
    header.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) setMenu(false);
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function startReveals() {
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    }
  }

  /* ---------- Logo: intro on first page view, shine on load + hover ---------- */
  var headerLogo = document.querySelector(".brand .fd-logo");

  function shine() {
    if (!headerLogo || reduceMotion) return;
    headerLogo.classList.remove("is-shining");
    void headerLogo.getBoundingClientRect(); // restart the animation
    headerLogo.classList.add("is-shining");
  }
  if (headerLogo) {
    headerLogo.addEventListener("animationend", function () { headerLogo.classList.remove("is-shining"); });
  }

  function runIntro(done) {
    var root = document.documentElement;
    if (!root.classList.contains("fd-intro") || !headerLogo) {
      root.classList.remove("fd-intro");
      done();
      setTimeout(shine, 700);
      return;
    }
    try { sessionStorage.setItem("fd-intro", "1"); } catch (e) {}

    // Build the overlay from a copy of the header logo (minus the shine layer)
    var overlay = document.createElement("div");
    overlay.className = "intro";
    overlay.setAttribute("aria-hidden", "true");
    var logo = headerLogo.cloneNode(true);
    logo.querySelectorAll("defs, .fd-shine-wrap").forEach(function (n) { n.remove(); });
    logo.querySelectorAll("[id]").forEach(function (n) { n.removeAttribute("id"); });
    logo.removeAttribute("role");
    logo.removeAttribute("aria-label");
    overlay.appendChild(logo);
    document.body.appendChild(overlay);
    root.classList.add("fd-intro-active");
    root.classList.remove("fd-intro");

    var left = false;
    var timer = setTimeout(leave, 2100);

    // Fly the big logo into the header logo's spot, then hand over
    function leave(e) {
      if (left) return;
      left = true;
      clearTimeout(timer);
      if (e) overlay.classList.add("is-skipped");
      var from = logo.getBoundingClientRect();
      var to = headerLogo.getBoundingClientRect();
      logo.style.transform = "translate(" + (to.left - from.left) + "px," + (to.top - from.top) + "px) scale(" + (to.width / from.width) + ")";
      overlay.classList.add("is-leaving");
      done();
      setTimeout(function () {
        root.classList.remove("fd-intro-active");
        overlay.remove();
        shine();
      }, 880);
      ["keydown", "wheel", "touchstart"].forEach(function (t) { window.removeEventListener(t, leave); });
    }

    overlay.addEventListener("click", leave);
    ["keydown", "wheel", "touchstart"].forEach(function (t) { window.addEventListener(t, leave, { passive: true }); });
  }

  runIntro(startReveals);

  /* ---------- Hero video: respect reduced motion ---------- */
  var heroVideo = document.querySelector(".hero-media video");
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    } else {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  /* ---------- Film dialog ---------- */
  var filmDialog = document.getElementById("film-dialog");
  if (filmDialog) {
    var filmVideo = filmDialog.querySelector("video");

    document.querySelectorAll("[data-film]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (heroVideo) heroVideo.pause();
        filmDialog.showModal();
        filmVideo.currentTime = 0;
        var p = filmVideo.play();
        if (p && p.catch) p.catch(function () {});
      });
    });

    filmDialog.querySelector(".dialog-close").addEventListener("click", function () {
      filmDialog.close();
    });
    filmDialog.addEventListener("click", function (e) {
      if (e.target === filmDialog) filmDialog.close();
    });
    filmDialog.addEventListener("close", function () {
      filmVideo.pause();
      if (heroVideo && !reduceMotion) heroVideo.play().catch(function () {});
    });
  }

  /* ---------- Service cards: whole card opens its link ---------- */
  document.querySelectorAll(".service-card").forEach(function (card) {
    var link = card.querySelector("a");
    if (!link) return;
    card.addEventListener("click", function (e) {
      if (!e.target.closest("a")) link.click();
    });
  });

  /* ---------- Before / after slider ---------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var range = ba.querySelector("input[type='range']");
    if (!range) return;
    function update() { ba.style.setProperty("--pos", range.value + "%"); }
    range.addEventListener("input", update);
    update();
  });

  /* ---------- Gallery lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var galleryLinks = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));

  if (lightbox && galleryLinks.length) {
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector("figcaption");
    var current = 0;

    function show(i) {
      current = (i + galleryLinks.length) % galleryLinks.length;
      var link = galleryLinks[current];
      var thumb = link.querySelector("img");
      lbImg.src = link.getAttribute("href");
      lbImg.alt = thumb ? thumb.alt : "";
      lbCap.textContent = (current + 1) + " / " + galleryLinks.length;
    }

    galleryLinks.forEach(function (link, i) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        show(i);
        lightbox.showModal();
      });
    });

    lightbox.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    lightbox.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    lightbox.querySelector(".dialog-close").addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.tagName === "FIGURE") lightbox.close();
    });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });

    // Swipe on touch screens
    var startX = null;
    lightbox.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ---------- Services page: highlight current section ---------- */
  var svcLinks = document.querySelectorAll(".svc-nav a");
  if (svcLinks.length && "IntersectionObserver" in window) {
    var map = {};
    svcLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var svcIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        svcLinks.forEach(function (a) { a.classList.remove("is-active"); });
        var a = map[entry.target.id];
        if (a) {
          a.classList.add("is-active");
          // Scroll only the pill bar sideways. scrollIntoView would also nudge the page and fight the user's scroll.
          var bar = a.closest("ul");
          if (bar.scrollWidth > bar.clientWidth) {
            bar.scrollTo({
              left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2,
              behavior: reduceMotion ? "auto" : "smooth"
            });
          }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) svcIO.observe(el);
    });
  }

  /* ---------- Open / closed status (SAST, Mon–Sat 07:00–16:00) ---------- */
  var statusEls = document.querySelectorAll("[data-open-status]");
  if (statusEls.length) {
    var openNow = false;
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Johannesburg",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(new Date());
      var get = function (t) {
        var p = parts.filter(function (x) { return x.type === t; })[0];
        return p ? p.value : "";
      };
      var mins = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
      openNow = get("weekday") !== "Sun" && mins >= 7 * 60 && mins < 16 * 60;
    } catch (err) { /* leave as closed */ }

    statusEls.forEach(function (el) {
      el.classList.toggle("is-open", openNow);
      el.textContent = openNow ? "Open now" : "Closed now";
    });
  }

  /* ---------- Contact form → WhatsApp / email ---------- */
  var form = document.getElementById("quote-form");
  if (form) {
    var service = form.querySelector("#service");
    var pkgField = form.querySelector("#package-field");
    var pkg = form.querySelector("#package");

    function syncPackage() {
      var show = service.value === "Car Detailing";
      pkgField.hidden = !show;
      if (!show) pkg.value = "";
    }
    service.addEventListener("change", syncPackage);

    // Pre-select from URL, e.g. contact.html?service=Car%20Detailing&package=Finesse%20Premium%20Pro
    var params = new URLSearchParams(window.location.search);
    if (params.get("service")) service.value = params.get("service");
    if (params.get("package")) {
      service.value = "Car Detailing";
      pkg.value = params.get("package");
    }
    syncPackage();

    function buildMessage() {
      var d = new FormData(form);
      var lines = [
        "Hi Finesse Detailing, I'd like a quote.",
        "",
        "Name: " + (d.get("name") + " " + d.get("surname")).trim(),
        "Phone: " + d.get("phone"),
        "Vehicle: " + (d.get("vehicle") || "-"),
        "Service: " + d.get("service")
      ];
      if (d.get("package")) lines.push("Package: " + d.get("package"));
      if (d.get("message")) lines.push("", d.get("message"));
      return lines.join("\n");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage());
      window.open(url, "_blank", "noopener");
    });

    var emailBtn = form.querySelector("[data-send-email]");
    if (emailBtn) {
      emailBtn.addEventListener("click", function () {
        if (!form.reportValidity()) return;
        var subject = "Quote request: " + service.value;
        window.location.href = "mailto:info@finessedetailing.co.za?subject=" +
          encodeURIComponent(subject) + "&body=" + encodeURIComponent(buildMessage());
      });
    }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
