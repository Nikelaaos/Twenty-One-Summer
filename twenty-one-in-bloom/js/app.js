const navLinks = [...document.querySelectorAll("[data-nav]")];
const optionalImages = document.querySelectorAll("[data-optional-image]");
const currentPage = document.body.dataset.page;
const menuTabs = [...document.querySelectorAll("[data-menu-tab]")];
const menuPanels = [...document.querySelectorAll("[data-menu-panel]")];
const likeButton = document.querySelector("[data-like-button]");
const countdown = document.querySelector("[data-countdown]");
const rsvpButton = document.querySelector("[data-rsvp-button]");
const rsvpModal = document.querySelector("[data-rsvp-modal]");
const rsvpCloseButton = document.querySelector("[data-rsvp-close]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const openRsvpModal = () => {
    rsvpModal.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => rsvpModal.classList.add("is-visible"));
    rsvpCloseButton?.focus();
  };

  rsvpButton.addEventListener("click", openRsvpModal);
  rsvpCloseButton?.addEventListener("click", closeRsvpModal);
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
