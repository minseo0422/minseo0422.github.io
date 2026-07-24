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
    closeModal("settings-modal");
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
   1. 순공시간 / 뽀모도로 페이지 전환 탭
========================================================= */
(function pageTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const track = document.getElementById("pages-track");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      track.classList.toggle("show-1", tab.dataset.page === "1");
    });
  });
})();

/* =========================================================
   2. 순공시간 저장소 (날짜별 누적, 새벽 5시 기준)
========================================================= */
const StudyStore = (function () {
  const DAILY_KEY = "study-room-daily";
  const DAY_START_HOUR = 5;

  function getStudyDayKey(ts) {
    const d = new Date(ts);
    if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function loadDaily() {
    try {
      return JSON.parse(localStorage.getItem(DAILY_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveDaily(map) {
    localStorage.setItem(DAILY_KEY, JSON.stringify(map));
  }

  function addToDaily(key, ms) {
    const map = loadDaily();
    map[key] = Math.max((map[key] || 0) + ms, 0);
    saveDaily(map);
  }

  return { getStudyDayKey, loadDaily, saveDaily, addToDaily, DAY_START_HOUR };
})();

/* =========================================================
   3. 순공시간 (스톱워치, 새벽 5시 자동 초기화 + 기록 + 수동 시간 조정)
========================================================= */
(function studyTimer() {
  const HISTORY_KEY = "study-room-history";

  const display = document.getElementById("stopwatch-display");
  const toggleBtn = document.getElementById("stopwatch-toggle");
  const historyBtn = document.getElementById("open-history");
  const historyList = document.getElementById("history-list");
  const historyEmpty = document.getElementById("history-empty");
  const editBtn = document.getElementById("open-time-edit");
  const editPopover = document.getElementById("time-edit-popover");

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
  function pushHistory(entry) {
    const history = loadHistory();
    history.push(entry);
    saveHistory(history);
  }
  function purgeOldHistory() {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    const history = loadHistory();
    const fresh = history.filter((entry) => entry.createdAt >= cutoff);
    if (fresh.length !== history.length) saveHistory(fresh);
    return fresh;
  }

  let running = false;
  let startTime = 0;
  let currentDayKey = StudyStore.getStudyDayKey(Date.now());
  let timerId = null;

  function currentTotal() {
    const base = StudyStore.loadDaily()[currentDayKey] || 0;
    return base + (running ? Date.now() - startTime : 0);
  }

  function render() {
    const nowKey = StudyStore.getStudyDayKey(Date.now());
    if (nowKey !== currentDayKey && running) {
      const now = Date.now();
      const segMs = now - startTime;
      StudyStore.addToDaily(currentDayKey, segMs);
      pushHistory({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        start: formatDateTime(startTime),
        end: formatDateTime(now),
        durationMs: segMs,
        createdAt: now,
      });
      startTime = now;
      currentDayKey = nowKey;
    } else if (nowKey !== currentDayKey) {
      currentDayKey = nowKey;
    }
    display.textContent = formatDuration(currentTotal());
  }

  toggleBtn.addEventListener("click", () => {
    running = !running;
    if (running) {
      startTime = Date.now();
      currentDayKey = StudyStore.getStudyDayKey(startTime);
      timerId = setInterval(render, 250);
      toggleBtn.textContent = "정지";
      toggleBtn.classList.add("active");
    } else {
      const now = Date.now();
      const segMs = now - startTime;
      StudyStore.addToDaily(currentDayKey, segMs);
      clearInterval(timerId);
      toggleBtn.textContent = "시작";
      toggleBtn.classList.remove("active");

      pushHistory({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        start: formatDateTime(startTime),
        end: formatDateTime(now),
        durationMs: segMs,
        createdAt: now,
      });
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
      StudyStore.addToDaily(currentDayKey, delta);
      render();
    });
  });

  function renderHistory() {
    const history = purgeOldHistory().slice().reverse();
    historyList.innerHTML = "";
    historyEmpty.classList.toggle("hidden", history.length > 0);
    history.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(entry.start)}</td>
        <td>${escapeHtml(entry.end)}</td>
        <td>${formatDuration(entry.durationMs)}</td>
        <td><button class="history-delete-btn" data-id="${entry.id}" title="삭제">🗑</button></td>
      `;
      historyList.appendChild(tr);
    });
  }

  historyList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (!btn) return;
    const remaining = loadHistory().filter((h) => h.id !== btn.dataset.id);
    saveHistory(remaining);
    renderHistory();
  });

  historyBtn.addEventListener("click", () => {
    renderHistory();
    openModal("history-modal");
  });

  setInterval(purgeOldHistory, 60000);

  render();
})();

/* =========================================================
   4. 달력 (날짜별 순공시간 시각화: 검정 ~ 진한 주황)
========================================================= */
(function calendarModule() {
  const openBtn = document.getElementById("open-calendar");
  const grid = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("cal-month-label");
  const prevBtn = document.getElementById("cal-prev");
  const nextBtn = document.getElementById("cal-next");
  const detail = document.getElementById("calendar-detail");

  const CAP_MINUTES = 360; // 6시간 이상이면 가장 진한 색

  let viewYear = 0;
  let viewMonth = 0; // 0-indexed
  let selectedKey = null;

  function colorForMinutes(min) {
    if (min <= 0) return "#f2f2f2";
    const ratio = Math.min(min / CAP_MINUTES, 1);
    const from = { r: 26, g: 26, b: 26 };
    const to = { r: 179, g: 64, b: 10 };
    const r = Math.round(from.r + (to.r - from.r) * ratio);
    const g = Math.round(from.g + (to.g - from.g) * ratio);
    const b = Math.round(from.b + (to.b - from.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function dateKey(y, m, d) {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  }

  function showDetail(key, minutes) {
    detail.textContent = `${key} · 순공시간 ${Math.floor(minutes / 60)}시간 ${minutes % 60}분`;
  }

  function render() {
    const daily = StudyStore.loadDaily();
    monthLabel.textContent = `${viewYear}년 ${viewMonth + 1}월`;
    grid.innerHTML = "";

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-cell empty";
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(viewYear, viewMonth, d);
      const minutes = Math.floor((daily[key] || 0) / 60000);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-cell";
      btn.textContent = d;
      btn.style.background = colorForMinutes(minutes);
      btn.style.color = minutes > 0 ? "#fff" : "#333";
      if (key === selectedKey) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        selectedKey = key;
        showDetail(key, minutes);
        render();
      });
      grid.appendChild(btn);
    }
  }

  openBtn.addEventListener("click", () => {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    selectedKey = StudyStore.getStudyDayKey(Date.now());
    const minutes = Math.floor((StudyStore.loadDaily()[selectedKey] || 0) / 60000);
    showDetail(selectedKey, minutes);
    render();
    openModal("calendar-modal");
  });

  prevBtn.addEventListener("click", () => {
    viewMonth -= 1;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    render();
  });

  nextBtn.addEventListener("click", () => {
    viewMonth += 1;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    render();
  });
})();

/* =========================================================
   5. 뽀모도로 타이머 (50분 집중 / 10분 휴식 반복)
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
   6. 체크리스트 (오른쪽으로 화면을 밀어내는 사이드 패널, localStorage 저장)
========================================================= */
(function checklist() {
  const STORAGE_KEY = "study-room-todos";

  const openBtn = document.getElementById("open-checklist");
  const closeBtn = document.getElementById("close-checklist");
  const panel = document.getElementById("checklist-panel");
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
          <div class="duration-cell">
            <input type="number" min="0" class="todo-duration-input no-spin" data-action="duration-h" data-id="${todo.id}"
              value="${todo.durationHours ?? ""}" placeholder="0" ${todo.done ? "" : "disabled"}>시간
            <input type="number" min="0" max="59" class="todo-duration-input no-spin" data-action="duration-m" data-id="${todo.id}"
              value="${todo.durationMinutes ?? ""}" placeholder="0" ${todo.done ? "" : "disabled"}>분
          </div>
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
      durationHours: null,
      durationMinutes: null,
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
    } else if (target.dataset.action === "duration-h") {
      todo.durationHours = target.value ? Number(target.value) : null;
      saveTodos();
    } else if (target.dataset.action === "duration-m") {
      todo.durationMinutes = target.value ? Number(target.value) : null;
      saveTodos();
    }
  });

  sortSelect.addEventListener("change", render);

  openBtn.addEventListener("click", () => panel.classList.add("open"));
  closeBtn.addEventListener("click", () => panel.classList.remove("open"));

  render();
})();

/* =========================================================
   7. 배경 업로드 (기본: 회색)
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
   8. 설정 창 열기
========================================================= */
(function settingsModal() {
  document.getElementById("open-settings").addEventListener("click", () => {
    openModal("settings-modal");
  });
})();

/* =========================================================
   9. 방 안을 돌아다니는 업로드 사진
      - 원본 비율 유지 / 속도·크기 조절 / 드래그 / 말풍선(움직임 유지)
      - 격정적으로 움직이기, 벽 충돌 시 좌우반전(개별 설정 가능)
========================================================= */
(function wanderingPhotos() {
  const room = document.getElementById("room");
  const layer = document.getElementById("wander-layer");
  const fileInput = document.getElementById("photo-upload");
  const messageBox = document.getElementById("photo-message");
  const flipIndicator = document.getElementById("flip-indicator");
  const speedSlider = document.getElementById("speed-slider");
  const sizeSlider = document.getElementById("size-slider");
  const turbulentToggle = document.getElementById("turbulent-toggle");
  const flipToggle = document.getElementById("flip-toggle");

  const photos = []; // { el, x, y, vx, vy, width, height, aspect, dragging, flipOverride, flipped, clickTimer }
  let currentSpeed = Number(speedSlider.value);
  let currentMaxDim = Number(sizeSlider.value);
  let turbulent = turbulentToggle.checked;
  let globalFlip = flipToggle.checked;
  let lastTime = null;
  let messageTimeout = null;
  let activeMessagePhoto = null;
  let flipIndicatorTimeout = null;

  function randomVelocity(speed) {
    const angle = Math.random() * Math.PI * 2;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  }

  function computeSize(aspect, maxDim) {
    if (aspect >= 1) return { w: maxDim, h: maxDim / aspect };
    return { w: maxDim * aspect, h: maxDim };
  }

  function addPhoto(src) {
    const probe = new Image();
    probe.onload = () => {
      const aspect = (probe.naturalWidth || 1) / (probe.naturalHeight || 1);
      const { w, h } = computeSize(aspect, currentMaxDim);
      createPhotoElement(src, w, h, aspect);
    };
    probe.src = src;
  }

  function createPhotoElement(src, w, h, aspect) {
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

    const photo = {
      el: img,
      x,
      y,
      vx,
      vy,
      width: w,
      height: h,
      aspect,
      dragging: false,
      flipOverride: null, // null: 기본 설정 따름, true: 항상 반전, false: 항상 유지
      flipped: false,
      clickTimer: null,
    };
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    attachInteraction(photo);
    photos.push(photo);
  }

  function effectiveFlip(photo) {
    return photo.flipOverride === null ? globalFlip : photo.flipOverride;
  }

  function applyFlipTransform(photo) {
    photo.el.style.transform = photo.flipped ? "scaleX(-1)" : "scaleX(1)";
  }

  function showFlipIndicator(photo, text) {
    clearTimeout(flipIndicatorTimeout);
    flipIndicator.textContent = text;
    flipIndicator.style.left = `${photo.x + photo.width / 2}px`;
    flipIndicator.style.top = `${photo.y - 10}px`;
    flipIndicator.classList.remove("hidden");
    flipIndicatorTimeout = setTimeout(() => flipIndicator.classList.add("hidden"), 1200);
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

    function endDrag() {
      if (!photo.dragging) return;
      photo.dragging = false;
      img.classList.remove("dragging");
      if (!moved) {
        clearTimeout(photo.clickTimer);
        photo.clickTimer = setTimeout(() => showMessageForPhoto(photo), 220);
      } else {
        const { vx, vy } = randomVelocity(currentSpeed);
        photo.vx = vx;
        photo.vy = vy;
      }
    }

    img.addEventListener("pointerup", endDrag);
    img.addEventListener("pointercancel", endDrag);

    img.addEventListener("dblclick", (e) => {
      e.preventDefault();
      clearTimeout(photo.clickTimer);
      if (photo.flipOverride === null) {
        photo.flipOverride = true;
        showFlipIndicator(photo, "이 사진: 반전 항상 켜짐");
      } else if (photo.flipOverride === true) {
        photo.flipOverride = false;
        showFlipIndicator(photo, "이 사진: 반전 항상 꺼짐");
      } else {
        photo.flipOverride = null;
        showFlipIndicator(photo, "이 사진: 기본 설정 따름");
      }
    });
  }

  function positionBubble(photo) {
    messageBox.style.left = `${photo.x + photo.width / 2}px`;
    messageBox.style.top = `${photo.y - 10}px`;
  }

  function showMessageForPhoto(photo) {
    activeMessagePhoto = photo;
    clearTimeout(messageTimeout);

    const messages = MessageStore.getMessages();
    const msg = messages[Math.floor(Math.random() * messages.length)] || "오늘도 화이팅!";
    messageBox.textContent = msg;
    positionBubble(photo);
    messageBox.classList.remove("hidden");

    messageTimeout = setTimeout(() => {
      messageBox.classList.add("hidden");
      activeMessagePhoto = null;
    }, 2600);
  }

  function step(time) {
    if (lastTime === null) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const bounds = room.getBoundingClientRect();

    photos.forEach((photo) => {
      if (photo.dragging) return;

      if (turbulent && currentSpeed > 0) {
        const jitter = currentSpeed * 1.6 * dt * 3;
        photo.vx += (Math.random() - 0.5) * jitter;
        photo.vy += (Math.random() - 0.5) * jitter;
        const mag = Math.hypot(photo.vx, photo.vy) || 1;
        photo.vx = (photo.vx / mag) * currentSpeed;
        photo.vy = (photo.vy / mag) * currentSpeed;
      }

      const maxX = Math.max(bounds.width - photo.width, 0);
      const maxY = Math.max(bounds.height - photo.height, 0);

      photo.x += photo.vx * dt;
      photo.y += photo.vy * dt;

      if (photo.x <= 0) {
        photo.x = 0;
        photo.vx *= -1;
        if (effectiveFlip(photo)) {
          photo.flipped = !photo.flipped;
          applyFlipTransform(photo);
        }
      } else if (photo.x >= maxX) {
        photo.x = maxX;
        photo.vx *= -1;
        if (effectiveFlip(photo)) {
          photo.flipped = !photo.flipped;
          applyFlipTransform(photo);
        }
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

  sizeSlider.addEventListener("input", () => {
    currentMaxDim = Number(sizeSlider.value);
    const bounds = room.getBoundingClientRect();
    photos.forEach((photo) => {
      const { w, h } = computeSize(photo.aspect, currentMaxDim);
      photo.width = w;
      photo.height = h;
      photo.el.style.width = `${w}px`;
      photo.el.style.height = `${h}px`;
      photo.x = Math.min(photo.x, Math.max(bounds.width - w, 0));
      photo.y = Math.min(photo.y, Math.max(bounds.height - h, 0));
      photo.el.style.left = `${photo.x}px`;
      photo.el.style.top = `${photo.y}px`;
    });
  });

  turbulentToggle.addEventListener("change", () => {
    turbulent = turbulentToggle.checked;
  });

  flipToggle.addEventListener("change", () => {
    globalFlip = flipToggle.checked;
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
