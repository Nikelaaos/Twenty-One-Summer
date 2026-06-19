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
  document.body.appendChild(canvasLayer);

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const randomBetween = (min, max) => Math.random() * (max - min) + min;
  const flowers = [];
  let flowerImages = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let flowerCount = 28;
  let minFrameInterval = 1 / 30;
  let lastFrame = 0;
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

  const recycleFlower = (flower = {}, startOnScreen = false) => {
    const size = randomBetween(22, Math.min(48, width * 0.13));
    const x = randomBetween(size * 0.5, width - size * 0.5);

    flower.image = flowerImages[Math.floor(Math.random() * flowerImages.length)];
    flower.baseX = x;
    flower.x = x;
    flower.y = startOnScreen ? randomBetween(-height, height) : randomBetween(-height * 0.45, -size);
    flower.size = size;
    flower.speedY = randomBetween(38, 82);
    flower.sway = randomBetween(8, 24);
    flower.swaySpeed = randomBetween(0.65, 1.35);
    flower.phase = randomBetween(0, Math.PI * 2);
    flower.rotation = randomBetween(-Math.PI, Math.PI);
    flower.rotationSpeed = randomBetween(-0.32, 0.32);
    flower.opacity = randomBetween(0.34, 0.64);

    return flower;
  };

  const resizeCanvas = () => {
    const nextWidth = Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth));
    const nextHeight = Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight));
    if (nextWidth === width && nextHeight === height) return;

    width = nextWidth;
    height = nextHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, width <= 430 ? 1.15 : 1.25);
    flowerCount = prefersReducedMotion ? 10 : width <= 430 ? 26 : 34;
    minFrameInterval = prefersReducedMotion ? 1 / 16 : width <= 430 ? 1 / 28 : 1 / 32;

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "low";

    flowers.length = 0;
    if (flowerImages.length) {
      for (let index = 0; index < flowerCount; index += 1) {
        flowers.push(recycleFlower({}, true));
      }
    }
    lastFrame = 0;
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

    animationFrame = window.requestAnimationFrame(render);

    if (!lastFrame) {
      lastFrame = now;
      return;
    }

    const elapsedSinceFrame = (now - lastFrame) / 1000;
    if (elapsedSinceFrame < minFrameInterval) return;

    const elapsed = Math.min(elapsedSinceFrame, 0.12);
    lastFrame = now;

    context.clearRect(0, 0, width, height);

    flowers.forEach((flower) => {
      flower.phase += flower.swaySpeed * elapsed;
      flower.y += flower.speedY * elapsed;
      flower.x = flower.baseX + Math.sin(flower.phase) * flower.sway;
      flower.rotation += flower.rotationSpeed * elapsed;

      if (flower.y - flower.size > height) recycleFlower(flower);
      drawFlower(flower);
    });
  };

  const handleResize = () => {
    if (!isRunning) return;
    window.cancelAnimationFrame(animationFrame);
    resizeCanvas();
    if (!isReady) return;
    animationFrame = window.requestAnimationFrame(render);
  };

  Promise.all(flowerSources.map(loadImage)).then((images) => {
    flowerImages = images.filter(Boolean);
    if (!flowerImages.length) return;

    isReady = true;
    resizeCanvas();
    animationFrame = window.requestAnimationFrame(render);
  });

  window.addEventListener("resize", handleResize, { passive: true });
  window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
  document.addEventListener("visibilitychange", () => { lastFrame = 0; }, { passive: true });
  window.addEventListener(
    "pagehide",
    () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
      flowers.length = 0;
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
