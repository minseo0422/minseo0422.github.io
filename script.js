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

function formatDateTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll(".modal-close[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

/* =========================================================
   0. 응원 멘트 저장소 (localStorage, 편집 가능)
========================================================= */
const MessageStore = (function () {
  const STORAGE_KEY = "study-room-messages";
  const DEFAULT_MESSAGES = [
    "오늘도 멋지게 해낼 줄 알았어!",
    "차근차근, 나만의 속도로 가보자.",
    "집중하는 모습이 세상에서 제일 멋져!",
    "조금씩 쌓이다 보면 엄청난 결과가 될 거야.",
    "지금 흘린 땀방울은 절대 배신하지 않아!",
    "한 걸음 한 걸음, 목적지가 가까워지고 있어.",
    "지금 이 순간에만 집중해 보자!",
    "시작이 반이야, 이미 절반이나 해낸 걸?",
    "너의 가능성을 믿어봐!",
    "포기하지 않는 네가 진짜 영웅이야.",
    "내가 옆에서 계속 응원하고 있을게!",
    "쓱싹쓱싹, 너랑 같이 공부하니까 너무 즐거워!",
    "힘들면 날 봐, 짠! (하트)",
    "오늘도 같이 화이팅해보자구!",
    "조금만 더 힘내자, 내가 스탬프 꾹 찍어줄게!",
    "네가 열심히 할 때마다 내 마음도 몽글몽글해져.",
    "내가 여기서 딱 기다리고 있을 테니 지치지 마!",
    "우와, 벌써 이렇게나 진행했어? 대단해!",
    "세상을 바꾸는 건 너의 이런 작은 습관이야.",
    "토닥토닥, 넌 이미 충분히 잘하고 있어.",
    "할 수 있다! 할 수 있다!",
    "오늘의 노력이 내일의 나를 만든다.",
    "집중력 폭발하는 시간! 🔥",
    "꿈을 향해 달리는 중…",
    "작지만 확실한 성공 쌓기!",
    "토마토 하나 더 완성해 볼까? 🍅",
    "흔들리지 않고 피는 꽃은 없어!",
    "나 자신을 뛰어넘는 순간!",
    "너의 노력을 언제나 응원해.",
    "오늘 하루도 수고했어, 조금만 더!",
  ];

  function getMessages() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {
      /* fallthrough */
    }
    return [...DEFAULT_MESSAGES];
  }

  function setMessages(list) {
    const cleaned = list.map((m) => m.trim()).filter(Boolean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }

  function resetMessages() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return { getMessages, setMessages, resetMessages, DEFAULT_MESSAGES };
})();

(function messageEditor() {
  const openBtn = document.getElementById("open-message-editor");
  const listEl = document.getElementById("message-edit-list");
  const addBtn = document.getElementById("add-message-btn");
  const resetBtn = document.getElementById("reset-messages-btn");

  function addRow(value = "") {
    const row = document.createElement("div");
    row.className = "message-edit-row";
    row.innerHTML = `
      <input type="text" value="${escapeHtml(value)}" placeholder="응원 멘트를 입력하세요">
      <button type="button" title="삭제">✕</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      row.remove();
      persist();
    });
    row.querySelector("input").addEventListener("input", persist);
    listEl.appendChild(row);
  }

  function persist() {
    const values = Array.from(listEl.querySelectorAll("input")).map((i) => i.value);
    MessageStore.setMessages(values);
  }

  function renderAll() {
    listEl.innerHTML = "";
    MessageStore.getMessages().forEach((m) => addRow(m));
  }

  openBtn.addEventListener("click", () => {
    renderAll();
    openModal("message-modal");
  });

  addBtn.addEventListener("click", () => {
    addRow("");
    persist();
  });

  resetBtn.addEventListener("click", () => {
    MessageStore.resetMessages();
    renderAll();
  });
})();

/* =========================================================
   1. 순공시간 (스톱워치, 초기화 없음 + 기록 + 수동 시간 조정)
========================================================= */
(function studyTimer() {
  const HISTORY_KEY = "study-room-history";

  const display = document.getElementById("stopwatch-display");
  const toggleBtn = document.getElementById("stopwatch-toggle");
  const historyBtn = document.getElementById("open-history");
  const historyList = document.getElementById("history-list");
  const historyEmpty = document.getElementById("history-empty");
  const historyClearBtn = document.getElementById("history-clear-btn");
  const editBtn = document.getElementById("open-time-edit");
  const editPopover = document.getElementById("time-edit-popover");

  let running = false;
  let startTime = 0;
  let sessionStart = 0;
  let elapsed = 0;
  let timerId = null;

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }

  function render() {
    const total = Math.max(elapsed + (running ? Date.now() - startTime : 0), 0);
    display.textContent = formatDuration(total);
  }

  toggleBtn.addEventListener("click", () => {
    running = !running;
    if (running) {
      startTime = Date.now();
      sessionStart = startTime;
      timerId = setInterval(render, 250);
      toggleBtn.textContent = "정지";
      toggleBtn.classList.add("active");
    } else {
      const now = Date.now();
      elapsed += now - startTime;
      clearInterval(timerId);
      toggleBtn.textContent = "시작";
      toggleBtn.classList.remove("active");

      const history = loadHistory();
      history.push({
        start: formatDateTime(sessionStart),
        end: formatDateTime(now),
        durationMs: now - sessionStart,
      });
      saveHistory(history);
    }
    render();
  });

  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    editPopover.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!editPopover.contains(e.target) && e.target !== editBtn) {
      editPopover.classList.add("hidden");
    }
  });
  editPopover.querySelectorAll("[data-delta]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number(btn.dataset.delta);
      elapsed = Math.max(elapsed + delta, 0);
      render();
    });
  });

  function renderHistory() {
    const history = loadHistory();
    historyList.innerHTML = "";
    historyEmpty.classList.toggle("hidden", history.length > 0);
    history
      .slice()
      .reverse()
      .forEach((entry) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(entry.start)}</td>
          <td>${escapeHtml(entry.end)}</td>
          <td>${formatDuration(entry.durationMs)}</td>
        `;
        historyList.appendChild(tr);
      });
  }

  historyBtn.addEventListener("click", () => {
    renderHistory();
    openModal("history-modal");
  });

  historyClearBtn.addEventListener("click", () => {
    saveHistory([]);
    renderHistory();
  });

  render();
})();

/* =========================================================
   2. 뽀모도로 타이머 (50분 집중 / 10분 휴식 반복, 순공시간 아래 항상 표시)
========================================================= */
(function pomodoro() {
  const FOCUS_SEC = 50 * 60;
  const BREAK_SEC = 10 * 60;

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
   3. 체크리스트 (오른쪽 사이드 패널, localStorage 저장)
========================================================= */
(function checklist() {
  const STORAGE_KEY = "study-room-todos";

  const openBtn = document.getElementById("open-checklist");
  const closeBtn = document.getElementById("close-checklist");
  const panel = document.getElementById("checklist-panel");
  const backdrop = document.getElementById("checklist-backdrop");
  const form = document.getElementById("todo-form");
  const listEl = document.getElementById("todo-list");
  const emptyEl = document.getElementById("todo-empty");
  const sortSelect = document.getElementById("todo-sort");

  const subjectInput = document.getElementById("todo-subject");
  const contentInput = document.getElementById("todo-content");
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

  function sortTodos(list) {
    const copy = [...list];
    const rank = { 상: 0, 중: 1, 하: 2 };
    if (sortSelect.value === "deadline") {
      copy.sort((a, b) => (a.end || "9999-99-99").localeCompare(b.end || "9999-99-99"));
    } else {
      copy.sort((a, b) => {
        const diff = rank[a.importance] - rank[b.importance];
        if (diff !== 0) return diff;
        return (a.end || "9999-99-99").localeCompare(b.end || "9999-99-99");
      });
    }
    return copy;
  }

  function render() {
    listEl.innerHTML = "";
    emptyEl.classList.toggle("hidden", todos.length > 0);

    sortTodos(todos).forEach((todo) => {
      const tr = document.createElement("tr");
      if (todo.done) tr.classList.add("done");

      tr.innerHTML = `
        <td><input type="checkbox" ${todo.done ? "checked" : ""} data-action="toggle" data-id="${todo.id}"></td>
        <td>${escapeHtml(todo.subject)}</td>
        <td class="content-cell">${escapeHtml(todo.content)}</td>
        <td class="importance-${todo.importance}">${todo.importance}</td>
        <td>${escapeHtml(formatPeriod(todo.start, todo.end))}</td>
        <td>
          <input type="number" min="1" class="todo-duration-input" data-action="duration" data-id="${todo.id}"
            value="${todo.duration ?? ""}" placeholder="분" ${todo.done ? "" : "disabled"}>
        </td>
        <td><button class="todo-delete-btn" data-action="delete" data-id="${todo.id}" title="삭제">🗑</button></td>
      `;
      listEl.appendChild(tr);
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const todo = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      subject: subjectInput.value.trim(),
      content: contentInput.value.trim(),
      importance: importanceInput.value,
      start: startInput.value,
      end: endInput.value,
      duration: null,
      done: false,
    };
    if (!todo.subject || !todo.content) return;

    todos.push(todo);
    saveTodos();
    render();
    form.reset();
    importanceInput.value = "중";
    subjectInput.focus();
  });

  listEl.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target || target.dataset.action !== "delete") return;
    todos = todos.filter((t) => t.id !== target.dataset.id);
    saveTodos();
    render();
  });

  listEl.addEventListener("change", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const todo = todos.find((t) => t.id === target.dataset.id);
    if (!todo) return;

    if (target.dataset.action === "toggle") {
      todo.done = target.checked;
      saveTodos();
      render();
    } else if (target.dataset.action === "duration") {
      todo.duration = target.value ? Number(target.value) : null;
      saveTodos();
    }
  });

  sortSelect.addEventListener("change", render);

  function openPanel() {
    panel.classList.add("open");
    backdrop.classList.remove("hidden");
  }
  function closePanel() {
    panel.classList.remove("open");
    backdrop.classList.add("hidden");
  }

  openBtn.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  backdrop.addEventListener("click", closePanel);

  render();
})();

/* =========================================================
   4. 배경 업로드 (기본: 회색)
========================================================= */
(function roomBackground() {
  const roomBg = document.getElementById("room-bg");
  const bgUpload = document.getElementById("bg-upload");
  const bgReset = document.getElementById("bg-reset-btn");

  bgUpload.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      roomBg.style.backgroundImage = `url(${ev.target.result})`;
    };
    reader.readAsDataURL(file);
    bgUpload.value = "";
  });

  bgReset.addEventListener("click", () => {
    roomBg.style.backgroundImage = "none";
  });
})();

/* =========================================================
   5. 방 안을 돌아다니는 업로드 사진 (원본 비율 유지, 속도 조절, 드래그, 말풍선)
========================================================= */
(function wanderingPhotos() {
  const room = document.getElementById("room");
  const layer = document.getElementById("wander-layer");
  const fileInput = document.getElementById("photo-upload");
  const messageBox = document.getElementById("photo-message");
  const speedSlider = document.getElementById("speed-slider");

  const photos = []; // { el, x, y, vx, vy, width, height, dragging, paused }
  const MAX_DIM = 100;
  let currentSpeed = Number(speedSlider.value);
  let lastTime = null;
  let messageTimeout = null;
  let activeMessagePhoto = null;

  function randomVelocity(speed) {
    const angle = Math.random() * Math.PI * 2;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }

  function addPhoto(src) {
    const probe = new Image();
    probe.onload = () => {
      let w = probe.naturalWidth || MAX_DIM;
      let h = probe.naturalHeight || MAX_DIM;
      if (w >= h) {
        h = h * (MAX_DIM / w);
        w = MAX_DIM;
      } else {
        w = w * (MAX_DIM / h);
        h = MAX_DIM;
      }
      createPhotoElement(src, w, h);
    };
    probe.src = src;
  }

  function createPhotoElement(src, w, h) {
    const img = document.createElement("img");
    img.src = src;
    img.className = "wander-photo";
    img.draggable = false;
    img.style.width = `${w}px`;
    img.style.height = `${h}px`;
    img.addEventListener("dragstart", (e) => e.preventDefault());
    layer.appendChild(img);

    const bounds = room.getBoundingClientRect();
    const x = Math.random() * Math.max(bounds.width - w, 0);
    const y = Math.random() * Math.max(bounds.height - h, 0);
    const { vx, vy } = randomVelocity(currentSpeed);

    const photo = { el: img, x, y, vx, vy, width: w, height: h, dragging: false, paused: false };
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
      e.preventDefault();
      img.setPointerCapture(e.pointerId);
      photo.dragging = true;
      photo.paused = false;
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
      nx = Math.min(Math.max(nx, 0), rect.width - photo.width);
      ny = Math.min(Math.max(ny, 0), rect.height - photo.height);
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
        showMessageForPhoto(photo);
      } else {
        const { vx, vy } = randomVelocity(currentSpeed);
        photo.vx = vx;
        photo.vy = vy;
      }
    }

    img.addEventListener("pointerup", endDrag);
    img.addEventListener("pointercancel", endDrag);
  }

  function positionBubble(photo) {
    messageBox.style.left = `${photo.x + photo.width / 2}px`;
    messageBox.style.top = `${photo.y - 10}px`;
  }

  function showMessageForPhoto(photo) {
    if (activeMessagePhoto && activeMessagePhoto !== photo) {
      activeMessagePhoto.paused = false;
    }
    clearTimeout(messageTimeout);
    activeMessagePhoto = photo;
    photo.paused = true;

    const messages = MessageStore.getMessages();
    const msg = messages[Math.floor(Math.random() * messages.length)] || "오늘도 화이팅!";
    messageBox.textContent = msg;
    positionBubble(photo);
    messageBox.classList.remove("hidden");

    messageTimeout = setTimeout(() => {
      messageBox.classList.add("hidden");
      photo.paused = false;
      activeMessagePhoto = null;
    }, 2600);
  }

  function step(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const bounds = room.getBoundingClientRect();

    photos.forEach((photo) => {
      if (photo.dragging || photo.paused) return;

      const maxX = Math.max(bounds.width - photo.width, 0);
      const maxY = Math.max(bounds.height - photo.height, 0);

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

      if (photo === activeMessagePhoto) positionBubble(photo);
    });

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  speedSlider.addEventListener("input", () => {
    currentSpeed = Number(speedSlider.value);
    photos.forEach((photo) => {
      const angle = Math.atan2(photo.vy, photo.vx);
      photo.vx = Math.cos(angle) * currentSpeed;
      photo.vy = Math.sin(angle) * currentSpeed;
    });
  });

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
