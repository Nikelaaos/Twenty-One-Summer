const navLinks = [...document.querySelectorAll("[data-nav]")];
const optionalImages = document.querySelectorAll("[data-optional-image]");
const currentPage = document.body.dataset.page;
const menuTabs = [...document.querySelectorAll("[data-menu-tab]")];
const menuPanels = [...document.querySelectorAll("[data-menu-panel]")];
const likeButton = document.querySelector("[data-like-button]");
const countdown = document.querySelector("[data-countdown]");
const rsvpButton = document.querySelector("[data-rsvp-button]");
const rsvpModal = document.querySelector("[data-rsvp-modal]");
const rsvpCloseButtons = document.querySelectorAll("[data-rsvp-close]");
const rsvpForm = document.querySelector("[data-rsvp-form]");
const rsvpSuccess = document.querySelector("[data-rsvp-success]");
const rsvpStatus = document.querySelector("[data-rsvp-status]");
const rsvpEndpoint =
  "https://script.google.com/macros/s/AKfycbwIYUWP0j5_fxpn1S8bftTIac-gl03LOiHgV6TzQrqO8ZZQlVxeK6adwsTW_1Iee5A7ug/exec";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setupFlowerSnow = () => {
  const shell = document.querySelector(".app-shell");
  if (!shell) return;

  const decorationBase =
    currentPage === "home"
      ? "assets/decoration/"
      : currentPage === "product"
        ? "../../assets/decoration/"
        : "../assets/decoration/";

  const flowerSources = [
    "flor%201.png",
    "flor%202.png",
    "flor%203.png",
    "flor%204.png",
    "flor%205.png",
    "flor%206.png",
    "flor%207.png",
  ].map((name) => `${decorationBase}${name}`);

  const canvasLayer = document.createElement("div");
  canvasLayer.className = "flower-snow-layer";
  canvasLayer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "flower-snow-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvasLayer.appendChild(canvas);
  shell.prepend(canvasLayer);

  const context = canvas.getContext("2d", { alpha: true });
  const pileCanvas = document.createElement("canvas");
  const pileContext = pileCanvas.getContext("2d", { alpha: true });
  if (!context || !pileContext) return;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;
  const terrainStep = 2;
  const activeFlowers = [];
  let flowerImages = [];
  let terrain = new Float32Array(0);
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let spawnElapsed = 0;
  let lastFrame = performance.now();
  let animationFrame = 0;
  let isRunning = true;
  let isReady = false;

  const loadImage = (source) =>
    new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = source;
    });

  const resizeCanvas = () => {
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight));
    if (nextWidth === width && nextHeight === height) return;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    pileCanvas.width = canvas.width;
    pileCanvas.height = canvas.height;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    pileContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    terrain = new Float32Array(Math.ceil(width / terrainStep) + 1);
    terrain.fill(height + 4);
    activeFlowers.length = 0;
  };

  const createFlower = (startOnScreen = false) => {
    if (!flowerImages.length || activeFlowers.length >= 64) return;

    const size = randomBetween(26, Math.min(62, width * 0.15));
    const x = randomBetween(size * 0.4, width - size * 0.4);
    activeFlowers.push({
      image: flowerImages[Math.floor(Math.random() * flowerImages.length)],
      baseX: x,
      x,
      y: startOnScreen ? randomBetween(-height * 0.7, -size) : -size,
      size,
      speedY: randomBetween(48, 88),
      sway: randomBetween(8, 30),
      swaySpeed: randomBetween(0.8, 1.65),
      phase: randomBetween(0, Math.PI * 2),
      rotation: randomBetween(-Math.PI, Math.PI),
      rotationSpeed: randomBetween(-0.45, 0.45),
      opacity: randomBetween(0.42, 0.74),
    });
  };

  const settleFlower = (flower) => {
    const terrainIndex = Math.max(0, Math.min(terrain.length - 1, Math.round(flower.x / terrainStep)));
    const landingY = terrain[terrainIndex];

    pileContext.save();
    pileContext.globalAlpha = Math.min(0.82, flower.opacity + 0.08);
    pileContext.translate(flower.x, landingY - flower.size * 0.36);
    pileContext.rotate(flower.rotation);
    pileContext.drawImage(
      flower.image,
      -flower.size / 2,
      -flower.size / 2,
      flower.size,
      flower.size,
    );
    pileContext.restore();

    const footprint = flower.size * 0.44;
    const rise = flower.size * 0.34;
    const startIndex = Math.max(0, Math.floor((flower.x - footprint) / terrainStep));
    const endIndex = Math.min(terrain.length - 1, Math.ceil((flower.x + footprint) / terrainStep));
    const mountainLimit = height * 0.48;

    for (let index = startIndex; index <= endIndex; index += 1) {
      const sampleX = index * terrainStep;
      const normalizedDistance = Math.abs(sampleX - flower.x) / footprint;
      const mound = rise * Math.sqrt(Math.max(0, 1 - normalizedDistance * normalizedDistance));
      terrain[index] = Math.max(mountainLimit, Math.min(terrain[index], landingY - mound));
    }
  };

  const drawFlower = (flower) => {
    context.save();
    context.globalAlpha = flower.opacity;
    context.translate(flower.x, flower.y);
    context.rotate(flower.rotation);
    context.drawImage(
      flower.image,
      -flower.size / 2,
      -flower.size / 2,
      flower.size,
      flower.size,
    );
    context.restore();
  };

  const render = (now) => {
    if (!isRunning) return;

    const elapsed = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    spawnElapsed += elapsed;

    const spawnDelay = prefersReducedMotion ? 0.58 : 0.28;
    while (spawnElapsed >= spawnDelay) {
      spawnElapsed -= spawnDelay;
      createFlower();
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(pileCanvas, 0, 0, width, height);

    for (let index = activeFlowers.length - 1; index >= 0; index -= 1) {
      const flower = activeFlowers[index];
      flower.phase += flower.swaySpeed * elapsed;
      flower.y += flower.speedY * elapsed;
      flower.x = flower.baseX + Math.sin(flower.phase) * flower.sway;
      flower.rotation += flower.rotationSpeed * elapsed;

      const sampleX = Math.max(0, Math.min(width, flower.x));
      const terrainIndex = Math.min(terrain.length - 1, Math.round(sampleX / terrainStep));
      const hasLanded = flower.y + flower.size * 0.34 >= terrain[terrainIndex];

      if (hasLanded) {
        settleFlower(flower);
        activeFlowers.splice(index, 1);
      } else {
        drawFlower(flower);
      }
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  const handleResize = () => {
    if (!isRunning) return;
    window.cancelAnimationFrame(animationFrame);
    resizeCanvas();
    if (!isReady) return;
    lastFrame = performance.now();
    animationFrame = window.requestAnimationFrame(render);
  };

  Promise.all(flowerSources.map(loadImage)).then((images) => {
    flowerImages = images.filter(Boolean);
    if (!flowerImages.length) return;

    isReady = true;
    resizeCanvas();
    const initialFlowerCount = prefersReducedMotion ? 5 : 12;
    for (let index = 0; index < initialFlowerCount; index += 1) createFlower(true);
    animationFrame = window.requestAnimationFrame(render);
  });

  window.addEventListener("resize", handleResize, { passive: true });
  window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener(
    "pagehide",
    () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
      activeFlowers.length = 0;
    },
    { once: true },
  );
};

setupFlowerSnow();

optionalImages.forEach((image) => {
  if (image.complete && image.naturalWidth > 0) {
    image.classList.add("is-loaded");
  }
  image.addEventListener("load", () => image.classList.add("is-loaded"));
  image.addEventListener("error", () => image.remove());
});

navLinks.forEach((link) => {
  link.classList.toggle("is-active", link.dataset.nav === currentPage);
});

let menuPanelTimer = 0;

const updateMenuTabs = (targetId, animate = true) => {
  menuTabs.forEach((tab) => {
    const isActive = tab.dataset.target === targetId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));

    if (isActive && animate && !prefersReducedMotion) {
      tab.classList.remove("is-popping");
      void tab.offsetWidth;
      tab.classList.add("is-popping");
      window.setTimeout(() => tab.classList.remove("is-popping"), 520);
    }
  });
};

const showMenuPanel = (targetId) => {
  menuPanels.forEach((panel) => {
    const isActive = panel.id === targetId;
    panel.classList.toggle("is-active", isActive);
    panel.classList.remove("is-entering", "is-leaving");
    panel.hidden = !isActive;
  });
};

const scrollToMenuPanel = (target) => {
  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
};

const activateMenuPanel = (targetId, shouldScroll = true) => {
  const target = document.getElementById(targetId);
  if (!target) return;

  const currentPanel = menuPanels.find((panel) => !panel.hidden);
  const isSamePanel = currentPanel === target;
  window.clearTimeout(menuPanelTimer);
  updateMenuTabs(targetId, shouldScroll);

  if (!currentPanel || isSamePanel || !shouldScroll || prefersReducedMotion) {
    showMenuPanel(targetId);
    if (shouldScroll && !isSamePanel) scrollToMenuPanel(target);
    return;
  }

  currentPanel.classList.add("is-leaving");

  menuPanelTimer = window.setTimeout(() => {
    currentPanel.hidden = true;
    currentPanel.classList.remove("is-active", "is-leaving");
    target.hidden = false;
    target.classList.add("is-active", "is-entering");

    window.requestAnimationFrame(() => {
      target.classList.remove("is-entering");
      if (shouldScroll) scrollToMenuPanel(target);
    });
  }, 180);
};

menuTabs.forEach((tab) => {
  tab.setAttribute("aria-selected", String(tab.classList.contains("is-active")));
  tab.addEventListener("click", () => activateMenuPanel(tab.dataset.target));
});

if (menuPanels.length) {
  const hashTarget = window.location.hash.slice(1);
  const initialPanel = menuPanels.some((panel) => panel.id === hashTarget)
    ? hashTarget
    : menuTabs.find((tab) => tab.classList.contains("is-active"))?.dataset.target;

  if (initialPanel) {
    activateMenuPanel(initialPanel, false);
  }
}

if (likeButton) {
  const liked = localStorage.getItem("twenty-one-liked") === "true";
  likeButton.classList.toggle("is-liked", liked);
  likeButton.setAttribute("aria-pressed", String(liked));

  likeButton.addEventListener("click", () => {
    const next = !likeButton.classList.contains("is-liked");
    likeButton.classList.toggle("is-liked", next);
    likeButton.setAttribute("aria-pressed", String(next));
    localStorage.setItem("twenty-one-liked", String(next));
  });
}

if (rsvpButton && rsvpModal) {
  const closeRsvpModal = () => {
    rsvpModal.hidden = true;
    rsvpModal.classList.remove("is-visible");
    document.body.classList.remove("modal-open");
    rsvpButton.focus();
  };

  const setRsvpSubmitting = (isSubmitting) => {
    const controls = rsvpForm?.querySelectorAll("button, input");
    controls?.forEach((control) => {
      control.disabled = isSubmitting;
    });
  };

  const showRsvpForm = () => {
    if (rsvpForm) rsvpForm.hidden = false;
    if (rsvpSuccess) rsvpSuccess.hidden = true;
    if (rsvpStatus) rsvpStatus.textContent = "";
    setRsvpSubmitting(false);
    rsvpForm?.reset();
  };

  const showRsvpSuccess = () => {
    if (rsvpForm) rsvpForm.hidden = true;
    if (rsvpSuccess) rsvpSuccess.hidden = false;
    rsvpSuccess?.querySelector("[data-rsvp-close]")?.focus();
  };

  const openRsvpModal = () => {
    showRsvpForm();
    rsvpModal.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => rsvpModal.classList.add("is-visible"));
    rsvpForm?.querySelector("input")?.focus();
  };

  rsvpButton.addEventListener("click", openRsvpModal);
  rsvpCloseButtons.forEach((button) => button.addEventListener("click", closeRsvpModal));
  rsvpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(rsvpForm);
    const nombre = String(formData.get("nombre") || "").trim();
    const duerme = String(formData.get("duerme") || "").trim();

    if (!nombre || !duerme) {
      if (rsvpStatus) rsvpStatus.textContent = "Completa tu nombre y si te quedarás a dormir.";
      return;
    }

    setRsvpSubmitting(true);
    if (rsvpStatus) rsvpStatus.textContent = "Enviando confirmación...";

    try {
      await fetch(rsvpEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          nombre,
          duerme,
          pagina: window.location.href,
          enviadoEn: new Date().toISOString(),
        }),
      });
      showRsvpSuccess();
    } catch (error) {
      setRsvpSubmitting(false);
      if (rsvpStatus) rsvpStatus.textContent = "No se pudo enviar. Intenta otra vez.";
    }
  });
  rsvpModal.addEventListener("click", (event) => {
    if (event.target === rsvpModal) closeRsvpModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !rsvpModal.hidden) closeRsvpModal();
  });
}

if (countdown) {
  const target = new Date(countdown.dataset.countdown);
  const daysEl = countdown.querySelector("[data-countdown-days]");
  const hoursEl = countdown.querySelector("[data-countdown-hours]");
  const minutesEl = countdown.querySelector("[data-countdown-minutes]");
  const secondsEl = countdown.querySelector("[data-countdown-seconds]");
  const labelEl = countdown.querySelector(".countdown-label");
  const pad = (value) => String(value).padStart(2, "0");

  const updateCountdown = () => {
    const distance = target.getTime() - Date.now();

    if (distance <= 0) {
      if (labelEl) labelEl.textContent = "Hoy es el dia";
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(distance / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
}
