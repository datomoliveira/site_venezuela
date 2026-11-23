/* ==========================================================================
   GET VENEZUELA — comportamento
   ========================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------------------------------------------------------------------
     Transição entre páginas
     --------------------------------------------------------------------- */
  const NAV_KEY = "gv-nav";

  // Se a página anterior marcou navegação interna, o véu já está fechado
  // (classe aplicada no <head>). Aqui ele se abre.
  if (sessionStorage.getItem(NAV_KEY) === "1") {
    sessionStorage.removeItem(NAV_KEY);
    root.classList.add("is-veiled");
  }

  const openCurtain = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("is-veiled"));
    });
  };
  if (root.classList.contains("is-veiled")) {
    setTimeout(openCurtain, 70);
  }

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      root.classList.remove("is-leaving", "is-veiled");
      sessionStorage.removeItem(NAV_KEY);
    }
  });

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest("a");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const raw = link.getAttribute("href");
    if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
    if (/^https?:/i.test(raw)) return;

    let url;
    try { url = new URL(link.href, location.href); } catch { return; }

    // âncora na mesma página: deixa o scroll nativo acontecer
    if (url.pathname === location.pathname && url.hash) {
      closeMenu();
      return;
    }
    if (url.pathname === location.pathname && !url.hash) return;

    e.preventDefault();
    sessionStorage.setItem(NAV_KEY, "1");
    if (reduce) { location.href = link.href; return; }

    root.classList.add("is-leaving");
    closeMenu();
    setTimeout(() => { location.href = link.href; }, 920);
  });

  /* ---------------------------------------------------------------------
     Cabeçalho + progresso
     --------------------------------------------------------------------- */
  const head = $(".site-head");
  const progress = $(".progress");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    if (head) {
      head.classList.toggle("is-solid", y > 24);
      const goingDown = y > lastY;
      const menuOpen = head.classList.contains("is-open");
      head.classList.toggle("is-hidden", goingDown && y > 440 && !menuOpen);
    }
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progress.style.transform = `scaleX(${p})`;
    }
    const hero = $("[data-hero]");
    if (hero && !reduce) {
      const p = Math.min(1, y / (hero.offsetHeight * 0.8));
      hero.style.opacity = String(1 - p * 0.92);
      hero.style.transform = `translateY(${p * 34}px)`;
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------------
     Menu mobile
     --------------------------------------------------------------------- */
  const menu = $("#menu");
  const menuBtn = $(".menu-btn");

  function closeMenu() {
    if (!menu || !menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");
    head?.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    menuBtn?.setAttribute("aria-expanded", "false");
    menuBtn?.setAttribute("aria-label", "Abrir menu");
  }

  function openMenu() {
    if (!menu) return;
    menu.classList.add("is-open");
    menu.inert = false;
    menu.setAttribute("aria-hidden", "false");
    head?.classList.add("is-open");
    head?.classList.remove("is-hidden");
    document.body.classList.add("is-locked");
    menuBtn?.setAttribute("aria-expanded", "true");
    menuBtn?.setAttribute("aria-label", "Fechar menu");
    setTimeout(() => menu.querySelector("a, button")?.focus(), 350);
  }

  if (menu && menuBtn) {
    menu.inert = true;
    menuBtn.addEventListener("click", () => {
      menu.classList.contains("is-open") ? closeMenu() : openMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
      if (e.key !== "Tab" || !menu.classList.contains("is-open")) return;
      const focusables = $$("a[href], button:not([disabled])", menu).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------------------------------------------------------------
     Revelações
     --------------------------------------------------------------------- */
  const revealTargets = [];

  function splitLines(el) {
    if (el.dataset.split === "1") return;
    const parts = el.innerHTML.trim().split(/<br\s*\/?>/i).filter((p) => p.trim() !== "");
    if (!parts.length) return;
    el.innerHTML = "";
    parts.forEach((part, i) => {
      const line = document.createElement("span");
      line.className = "line";
      const inner = document.createElement("span");
      inner.className = "line__in";
      if (i > 0) inner.style.setProperty("--d", `${i * 80}ms`);
      inner.innerHTML = part;
      line.appendChild(inner);
      el.appendChild(line);
    });
    el.classList.add("lines");
    el.dataset.split = "1";
  }

  function setupReveals() {
    $$("[data-lines]").forEach(splitLines);

    $$("[data-stagger]").forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        if (child.hasAttribute("data-reveal")) return;
        child.setAttribute("data-reveal", "");
        child.style.setProperty("--d", `${i * 90}ms`);
        revealTargets.push(child);
      });
    });

    $$("[data-reveal]").forEach((el) => revealTargets.push(el));
    $$("[data-lines]").forEach((el) => revealTargets.push(el));

    if (!("IntersectionObserver" in window) || reduce) {
      revealTargets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    /* Resguardo: se o observer não disparar (iframes, navegadores antigos
       ou elementos maiores que a viewport), a varredura por posição revela. */
    const scan = () => {
      const vh = window.innerHeight;
      revealTargets.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        const r = el.getBoundingClientRect();
        if (r.height && r.top < vh * 0.94 && r.bottom > 0) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    };
    let lastScan = 0;
    const onScroll = () => {
      const now = performance.now();
      if (now - lastScan < 90) return;
      lastScan = now;
      scan();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", scan, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    scan();

    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------------
     Entrada da home: letras + ready
     --------------------------------------------------------------------- */
  function setupIntro() {
    const word = $("[data-letters]");
    if (word) {
      const text = word.textContent.trim();
      word.setAttribute("aria-label", text);
      word.textContent = "";
      Array.from(text).forEach((ch, i) => {
        const outer = document.createElement("span");
        outer.className = "ltr";
        outer.setAttribute("aria-hidden", "true");
        const inner = document.createElement("span");
        inner.className = "ltr__in";
        inner.style.setProperty("--i", String(i));
        inner.textContent = ch === " " ? "\u00A0" : ch;
        outer.appendChild(inner);
        word.appendChild(outer);
      });
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.setAttribute("aria-hidden", "true");
      dot.textContent = ".";
      word.appendChild(dot);
    }

    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    const timer = new Promise((res) => setTimeout(res, 900));
    Promise.race([fonts, timer]).then(() => {
      requestAnimationFrame(() => root.classList.add("is-ready"));
      setTimeout(() => $$(".stage").forEach((s) => s.classList.add("is-ready")), 350);
    });
  }

  /* ---------------------------------------------------------------------
     Cursor + ímã
     --------------------------------------------------------------------- */
  function setupCursor() {
    if (!finePointer || reduce) return;
    const cursor = $(".cursor");
    if (!cursor) return;
    root.classList.add("has-cursor");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    }, { passive: true });

    const loop = () => {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const hoverables = "a, button, .plate, .offer__row, [data-cursor]";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
    document.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; });
    document.addEventListener("mouseenter", () => { cursor.style.opacity = ""; });

    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = `translate(${dx * 6}px, ${dy * 5}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------------------
     FAQ
     --------------------------------------------------------------------- */
  function setupFaq() {
    $$(".faq__item").forEach((item) => {
      const btn = $(".faq__btn", item);
      const panel = $(".faq__panel", item);
      if (!btn || !panel) return;
      panel.inert = !item.classList.contains("is-open");
      btn.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");
      btn.addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        item.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        panel.inert = !open;
      });
    });
  }

  /* ---------------------------------------------------------------------
     Copiar
     --------------------------------------------------------------------- */
  function setupCopy() {
    $$("[data-copy]").forEach((btn) => {
      const original = btn.innerHTML;
      btn.addEventListener("click", async () => {
        const value = btn.getAttribute("data-copy");
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
          } else {
            const ta = document.createElement("textarea");
            ta.value = value;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
          }
          btn.classList.add("is-done");
          btn.innerHTML = "Copiado ✓";
          setTimeout(() => {
            btn.classList.remove("is-done");
            btn.innerHTML = original;
          }, 1800);
        } catch {
          btn.innerHTML = "Copie: " + value;
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Formulário → mailto
     --------------------------------------------------------------------- */
  function setupForm() {
    const form = $("[data-mail-form]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const nome = String(data.get("nome") || "").trim();
      const contato = String(data.get("contato") || "").trim();
      const msg = String(data.get("mensagem") || "").trim();
      if (!nome || !msg) return;
      const subject = encodeURIComponent(`Site — mensagem de ${nome}`);
      const body = encodeURIComponent(`${msg}\n\n---\nNome: ${nome}\nContato: ${contato || "não informado"}`);
      window.location.href = `mailto:emvenezuela@rioeduca.net?subject=${subject}&body=${body}`;
    });
  }

  /* ---------------------------------------------------------------------
     Cena 3D (carregada só quando existe palco)
     --------------------------------------------------------------------- */
  function setupScene() {
    const stages = $$("[data-scene]");
    if (!stages.length) return;
    if (reduce) { stages.forEach((s) => s.classList.add("is-static")); }

    const load = () => {
      import("./scene.js")
        .then((mod) => mod.mountAll())
        .catch((err) => {
          console.warn("3D indisponível:", err);
          stages.forEach((s) => s.classList.add("is-fallback"));
        });
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(load, { timeout: 1400 });
    } else {
      setTimeout(load, 320);
    }
  }

  /* ---------------------------------------------------------------------
     Início
     --------------------------------------------------------------------- */
  setupIntro();
  setupReveals();
  setupCursor();
  setupFaq();
  setupCopy();
  setupForm();
  setupScene();
  $$("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
