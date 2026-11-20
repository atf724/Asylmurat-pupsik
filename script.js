"use strict";

const starCanvas = document.querySelector("#starfield");
const starContext = starCanvas.getContext("2d");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const starCount = Math.min(150, Math.floor((window.innerWidth * window.innerHeight) / 8500));
const stars = [];
const pointer = { x: -1000, y: -1000, active: false };
let canvasWidth = 0;
let canvasHeight = 0;
let pixelRatio = 1;

function resizeStarfield() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  starCanvas.width = Math.floor(canvasWidth * pixelRatio);
  starCanvas.height = Math.floor(canvasHeight * pixelRatio);
  starCanvas.style.width = `${canvasWidth}px`;
  starCanvas.style.height = `${canvasHeight}px`;
  starContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  stars.length = 0;
  for (let index = 0; index < starCount; index += 1) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: Math.random() * 1.15 + 0.25,
      alpha: Math.random() * 0.55 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.018 + 0.004,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08
    });
  }
}

function drawStarfield() {
  starContext.clearRect(0, 0, canvasWidth, canvasHeight);

  for (const star of stars) {
    if (!reducedMotion) {
      if (pointer.active) {
        const dx = star.x - pointer.x;
        const dy = star.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 130) {
          const force = (1 - distance / 130) * 0.018;
          star.vx += (dx / distance) * force;
          star.vy += (dy / distance) * force;
        }
      }

      star.x += star.vx;
      star.y += star.vy;
      star.vx *= 0.993;
      star.vy *= 0.993;
      star.phase += star.speed;

      if (star.x < -2) star.x = canvasWidth + 2;
      if (star.x > canvasWidth + 2) star.x = -2;
      if (star.y < -2) star.y = canvasHeight + 2;
      if (star.y > canvasHeight + 2) star.y = -2;
    }

    const twinkle = reducedMotion ? 1 : 0.65 + Math.sin(star.phase) * 0.35;
    starContext.beginPath();
    starContext.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    starContext.fillStyle = `rgba(242, 243, 248, ${star.alpha * twinkle})`;
    starContext.fill();
  }

  if (!reducedMotion) {
    window.requestAnimationFrame(drawStarfield);
  }
}

resizeStarfield();
drawStarfield();
window.addEventListener("resize", resizeStarfield);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

const birthDateUtc = Date.UTC(2011, 10, 4, 0, 0, 0);
const ageElements = {
  years: document.querySelector("#age-years"),
  days: document.querySelector("#age-days"),
  hours: document.querySelector("#age-hours"),
  minutes: document.querySelector("#age-minutes"),
  seconds: document.querySelector("#age-seconds")
};

function updateAge() {
  const now = new Date();
  const nowUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );
  let years = now.getUTCFullYear() - 2011;
  let anniversary = Date.UTC(now.getUTCFullYear(), 10, 4);

  if (nowUtc < anniversary) {
    years -= 1;
    anniversary = Date.UTC(now.getUTCFullYear() - 1, 10, 4);
  }

  let remainder = Math.max(0, nowUtc - Math.max(birthDateUtc, anniversary));
  const days = Math.floor(remainder / 86400000);
  remainder %= 86400000;
  const hours = Math.floor(remainder / 3600000);
  remainder %= 3600000;
  const minutes = Math.floor(remainder / 60000);
  const seconds = Math.floor((remainder % 60000) / 1000);

  ageElements.years.textContent = String(Math.max(0, years));
  ageElements.days.textContent = String(days);
  ageElements.hours.textContent = String(hours).padStart(2, "0");
  ageElements.minutes.textContent = String(minutes).padStart(2, "0");
  ageElements.seconds.textContent = String(seconds).padStart(2, "0");
}

function updateSchedule() {
  const now = new Date();
  const day = now.getDay();
  const names = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота"
  ];
  const todayName = document.querySelector("#today-name");
  const todayDate = document.querySelector("#today-date");
  const companion = day === 0 || day === 6 ? "Улжан" : "Бухар-Жырау";

  todayName.textContent = `Сегодня — ${names[day]}`;
  todayDate.textContent = `Сегодня он ходит с ${companion}`;
  document.querySelectorAll(".schedule-row").forEach((row) => {
    const isToday = Number(row.dataset.day) === day;
    row.classList.toggle("is-today", isToday);
    if (isToday) {
      row.setAttribute("aria-current", "date");
    } else {
      row.removeAttribute("aria-current");
    }
  });
}

updateAge();
window.setInterval(updateAge, 1000);
updateSchedule();
window.setInterval(updateSchedule, 60000);
document.querySelector("#current-year").textContent = String(new Date().getFullYear());

const secretButton = document.querySelector("#secret-button");
const secretResult = document.querySelector("#secret-result");
const secretCard = secretButton.closest(".secret-card");
const secretCounter = document.querySelector("#secret-counter");
const scrambleCharacters = "01▓▒░#%&@$";
const secretClicksRequired = 200;
let secretClickCount = 0;
let scrambleInterval;

secretButton.addEventListener("click", () => {
  if (secretButton.disabled) return;

  secretClickCount += 1;
  secretCounter.textContent = String(secretClicksRequired - secretClickCount);
  if (secretClickCount < secretClicksRequired) {
    return;
  }

  secretButton.disabled = true;
  secretButton.firstElementChild.textContent = "Идёт дешифровка...";
  secretCard.classList.add("is-unlocking");
  secretResult.hidden = false;
  secretResult.classList.add("is-hacking");
  const scramble = () => {
    secretResult.textContent = Array.from({ length: 28 }, () =>
      scrambleCharacters[Math.floor(Math.random() * scrambleCharacters.length)]
    ).join("");
  };
  scramble();
  scrambleInterval = window.setInterval(scramble, 90);

  window.setTimeout(() => {
    window.clearInterval(scrambleInterval);
    secretCard.classList.remove("is-unlocking");
    secretResult.classList.remove("is-hacking");
    secretResult.textContent = "Секретный факт удалён.";
    secretButton.firstElementChild.textContent = "Файл открыт";
  }, 1800);
});

const signalDialog = document.querySelector("#signal-dialog");
const openSignalButton = document.querySelector("#open-signal");
const closeSignalButton = document.querySelector("#close-signal");

openSignalButton.addEventListener("click", () => {
  signalDialog.showModal();
});

closeSignalButton.addEventListener("click", () => {
  signalDialog.close();
});

signalDialog.addEventListener("click", (event) => {
  if (event.target === signalDialog) {
    signalDialog.close();
  }
});

signalDialog.addEventListener("close", () => {
  openSignalButton.focus();
});
