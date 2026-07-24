/* =========================================================
   공통 유틸
========================================================= */
function pad(num, len = 2) {
  return String(Math.floor(num)).padStart(len, "0");
}

function playBeep(freq = 880, duration = 0.18) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    /* 오디오 사용 불가 환경은 무시 */
  }
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll(".modal-close").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

/* =========================================================
   1. 스톱워치
========================================================= */
(function stopwatch() {
  const display = document.getElementById("stopwatch-display");
  const toggleBtn = document.getElementById("stopwatch-toggle");
  const resetBtn = document.getElementById("stopwatch-reset");

  let running = false;
  let startTime = 0;
  let elapsed = 0;
  let timerId = null;

  function render() {
    const total = elapsed + (running ? Date.now() - startTime : 0);
    const h = Math.floor(total / 3600000);
    const m = Math.floor((total % 3600000) / 60000);
    const s = Math.floor((total % 60000) / 1000);
    const cs = Math.floor((total % 1000) / 10);
    display.textContent = `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
  }

  toggleBtn.addEventListener("click", () => {
    running = !running;
    if (running) {
      startTime = Date.now();
      timerId = setInterval(render, 10);
      toggleBtn.textContent = "정지";
      toggleBtn.classList.add("active");
    } else {
      elapsed += Date.now() - startTime;
      clearInterval(timerId);
      toggleBtn.textContent = "시작";
      toggleBtn.classList.remove("active");
    }
  });

  resetBtn.addEventListener("click", () => {
    running = false;
    clearInterval(timerId);
    elapsed = 0;
    toggleBtn.textContent = "시작";
    toggleBtn.classList.remove("active");
    render();
  });

  render();
})();

/* =========================================================
   2. 뽀모도로 타이머 (50분 집중 / 10분 휴식 반복)
========================================================= */
(function pomodoro() {
  const FOCUS_SEC = 50 * 60;
  const BREAK_SEC = 10 * 60;

  const openBtn = document.getElementById("open-pomodoro");
  const phaseEl = document.getElementById("pomodoro-phase");
  const displayEl = document.getElementById("pomodoro-display");
  const cycleEl = document.getElementById("pomodoro-cycle");
  const toggleBtn = document.getElementById("pomodoro-toggle");
  const skipBtn = document.getElementById("pomodoro-skip");
  const resetBtn = document.getElementById("pomodoro-reset");

  let phase = "focus"; // 'focus' | 'break'
  let remaining = FOCUS_SEC;
  let running = false;
  let timerId = null;
  let completedCycles = 0;

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    displayEl.textContent = `${pad(m)}:${pad(s)}`;
    phaseEl.textContent = phase === "focus" ? "집중 시간" : "휴식 시간";
    phaseEl.style.color = phase === "focus" ? "#d9822b" : "#3cb371";
    cycleEl.textContent = `진행 횟수: ${completedCycles}회`;
  }

  function switchPhase() {
    if (phase === "focus") {
      completedCycles += 1;
      phase = "break";
      remaining = BREAK_SEC;
    } else {
      phase = "focus";
      remaining = FOCUS_SEC;
    }
    playBeep(phase === "focus" ? 880 : 523);
    render();
  }

  function tick() {
    remaining -= 1;
    if (remaining < 0) {
      switchPhase();
      return;
    }
    render();
  }

  function start() {
    if (running) return;
    running = true;
    timerId = setInterval(tick, 1000);
    toggleBtn.textContent = "일시정지";
  }

  function pause() {
    running = false;
    clearInterval(timerId);
    toggleBtn.textContent = "시작";
  }

  openBtn.addEventListener("click", () => openModal("pomodoro-modal"));

  toggleBtn.addEventListener("click", () => {
    running ? pause() : start();
  });

  skipBtn.addEventListener("click", () => {
    switchPhase();
  });

  resetBtn.addEventListener("click", () => {
    pause();
    phase = "focus";
    remaining = FOCUS_SEC;
    completedCycles = 0;
    render();
  });

  render();
})();

/* =========================================================
   3. 체크리스트 (할일 관리) - localStorage 저장
========================================================= */
(function checklist() {
  const STORAGE_KEY = "study-room-todos";

  const openBtn = document.getElementById("open-checklist");
  const form = document.getElementById("todo-form");
  const listEl = document.getElementById("todo-list");
  const emptyEl = document.getElementById("todo-empty");

  const subjectInput = document.getElementById("todo-subject");
  const contentInput = document.getElementById("todo-content");
  const durationInput = document.getElementById("todo-duration");
  const importanceInput = document.getElementById("todo-importance");
  const startInput = document.getElementById("todo-start");
  const endInput = document.getElementById("todo-end");

  let todos = loadTodos();

  function loadTodos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function formatPeriod(start, end) {
    if (!start && !end) return "-";
    if (start && end) return `${start} ~ ${end}`;
    return start || end;
  }

  function render() {
    listEl.innerHTML = "";
    emptyEl.classList.toggle("hidden", todos.length > 0);

    todos.forEach((todo) => {
      const tr = document.createElement("tr");
      if (todo.done) tr.classList.add("done");

      tr.innerHTML = `
        <td><input type="checkbox" ${todo.done ? "checked" : ""} data-action="toggle" data-id="${todo.id}"></td>
        <td>${escapeHtml(todo.subject)}</td>
        <td class="content-cell">${escapeHtml(todo.content)}</td>
        <td>${todo.duration}분</td>
        <td class="importance-${todo.importance}">${todo.importance}</td>
        <td>${escapeHtml(formatPeriod(todo.start, todo.end))}</td>
        <td><button class="todo-delete-btn" data-action="delete" data-id="${todo.id}" title="삭제">🗑</button></td>
      `;
      listEl.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const todo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      subject: subjectInput.value.trim(),
      content: contentInput.value.trim(),
      duration: Number(durationInput.value),
      importance: importanceInput.value,
      start: startInput.value,
      end: endInput.value,
      done: false,
    };
    if (!todo.subject || !todo.content || !todo.duration) return;

    todos.push(todo);
    saveTodos();
    render();
    form.reset();
    importanceInput.value = "중";
    subjectInput.focus();
  });

  listEl.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const id = target.dataset.id;

    if (target.dataset.action === "toggle") {
      const todo = todos.find((t) => t.id === id);
      if (todo) todo.done = target.checked;
      saveTodos();
      render();
    } else if (target.dataset.action === "delete") {
      todos = todos.filter((t) => t.id !== id);
      saveTodos();
      render();
    }
  });

  openBtn.addEventListener("click", () => openModal("checklist-modal"));

  render();
})();

/* =========================================================
   4. 방 안을 돌아다니는 업로드 사진
========================================================= */
(function wanderingPhotos() {
  const room = document.getElementById("room");
  const layer = document.getElementById("wander-layer");
  const fileInput = document.getElementById("photo-upload");
  const messageBox = document.getElementById("photo-message");

  const MESSAGES = [
    "오늘도 화이팅! 📚",
    "조금만 더 힘내자!",
    "잘하고 있어요 :)",
    "물 한 잔 마시고 계속해요!",
    "쉬는 것도 공부의 일부예요.",
    "목표까지 얼마 안 남았어요!",
    "집중력 최고! 👍",
    "스트레칭 한 번 어때요?",
  ];

  const photos = []; // { el, x, y, vx, vy }
  const SIZE = 90;
  const SPEED = 40; // px per second

  let lastTime = null;

  function randomVelocity() {
    const angle = Math.random() * Math.PI * 2;
    return { vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED };
  }

  function addPhoto(src) {
    const img = document.createElement("img");
    img.src = src;
    img.className = "wander-photo";
    layer.appendChild(img);

    const bounds = room.getBoundingClientRect();
    const x = Math.random() * Math.max(bounds.width - SIZE, 0);
    const y = Math.random() * Math.max(bounds.height - SIZE, 0);
    const { vx, vy } = randomVelocity();

    const photo = { el: img, x, y, vx, vy, dragging: false };
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    attachInteraction(photo);
    photos.push(photo);
  }

  function attachInteraction(photo) {
    const img = photo.el;
    let pointerStart = null;
    let moved = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    img.addEventListener("pointerdown", (e) => {
      img.setPointerCapture(e.pointerId);
      photo.dragging = true;
      moved = false;
      img.classList.add("dragging");
      const rect = room.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left - photo.x;
      dragOffsetY = e.clientY - rect.top - photo.y;
      pointerStart = { x: e.clientX, y: e.clientY };
    });

    img.addEventListener("pointermove", (e) => {
      if (!photo.dragging) return;
      if (pointerStart) {
        const dx = e.clientX - pointerStart.x;
        const dy = e.clientY - pointerStart.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      }
      const rect = room.getBoundingClientRect();
      let nx = e.clientX - rect.left - dragOffsetX;
      let ny = e.clientY - rect.top - dragOffsetY;
      nx = Math.min(Math.max(nx, 0), rect.width - SIZE);
      ny = Math.min(Math.max(ny, 0), rect.height - SIZE);
      photo.x = nx;
      photo.y = ny;
      img.style.left = `${nx}px`;
      img.style.top = `${ny}px`;
    });

    function endDrag(e) {
      if (!photo.dragging) return;
      photo.dragging = false;
      img.classList.remove("dragging");
      if (!moved) {
        showMessage();
      } else {
        const { vx, vy } = randomVelocity();
        photo.vx = vx;
        photo.vy = vy;
      }
    }

    img.addEventListener("pointerup", endDrag);
    img.addEventListener("pointercancel", endDrag);
  }

  let messageTimeout = null;
  function showMessage() {
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    messageBox.textContent = msg;
    messageBox.classList.remove("hidden");
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageBox.classList.add("hidden");
    }, 2200);
  }

  function step(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const bounds = room.getBoundingClientRect();
    const maxX = Math.max(bounds.width - SIZE, 0);
    const maxY = Math.max(bounds.height - SIZE, 0);

    photos.forEach((photo) => {
      if (photo.dragging) return;
      photo.x += photo.vx * dt;
      photo.y += photo.vy * dt;

      if (photo.x <= 0) {
        photo.x = 0;
        photo.vx *= -1;
      } else if (photo.x >= maxX) {
        photo.x = maxX;
        photo.vx *= -1;
      }
      if (photo.y <= 0) {
        photo.y = 0;
        photo.vy *= -1;
      } else if (photo.y >= maxY) {
        photo.y = maxY;
        photo.vy *= -1;
      }

      photo.el.style.left = `${photo.x}px`;
      photo.el.style.top = `${photo.y}px`;
    });

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => addPhoto(ev.target.result);
      reader.readAsDataURL(file);
    });
    fileInput.value = "";
  });
})();
