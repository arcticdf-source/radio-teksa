const fallbackStations = [
  {
    id: "groove-salad",
    name: "Грув Салат",
    genre: "Чилаут",
    description: "Мягкая электроника, эмбиент и спокойный ритм для долгого прослушивания.",
    listeners: "Источник: каталог станций",
    stream: "https://ice2.somafm.com/groovesalad-128-mp3",
    tags: ["Эмбиент", "Фокус", "Поздний вечер"]
  }
];

function normalizeUiText(value) {
  return String(value ?? "")
    .replace(/Radiopotok/gi, "Радиопоток")
    .replace(/\bLive\b/gi, "Прямой эфир")
    .replace(/\bOnline\b/gi, "Онлайн")
    .replace(/\bTap to tune\b/gi, "Нажмите для прослушивания")
    .replace(/\bSaved\b/gi, "Сохранено")
    .trim();
}

function hasBrokenImportText(value) {
  return /[\u0000-\u001f�]|РЎС|РС|СЃС‚|С‚Р°|РёР·|РєР°/u.test(String(value ?? ""));
}

function normalizeImportedDescription(value) {
  const text = String(value ?? "").trim();

  if (!text || hasBrokenImportText(text) || /radio\s*potok/i.test(text)) {
    return "Станция из каталога Радиопоток.";
  }

  return normalizeUiText(text);
}

function normalizeImportedSource(value) {
  const text = String(value ?? "").trim();

  if (!text || hasBrokenImportText(text) || /radio\s*potok/i.test(text)) {
    return "Источник: Радиопоток";
  }

  return normalizeUiText(text);
}

const genreMatchers = [
  { genre: "Новости", pattern: /news|вести|sputnik|бизнес|маяк|solov|говорит/i },
  { genre: "Рок", pattern: /rock|рок|maximum|ультра|скала/i },
  { genre: "Джаз", pattern: /jazz|джаз|blues/i },
  { genre: "Ретро", pattern: /retro|ретро|носталь/i },
  { genre: "Поп", pattern: /pop|хит|radio 7|европа|маруся|русск|love|like|top/i },
  { genre: "Чилаут", pattern: /chill|deep|lounge|relax|атмосфера/i },
  { genre: "Шансон", pattern: /шансон|душевн/i },
  { genre: "Разговорное", pattern: /talk|book|книга|аудио/i }
];

function hashColor(seed) {
  let value = 0;

  for (const symbol of String(seed)) {
    value = (value * 31 + symbol.charCodeAt(0)) >>> 0;
  }

  const hue = value % 360;
  const nextHue = (hue + 38) % 360;
  return [`hsl(${hue} 80% 74%)`, `hsl(${nextHue} 88% 58%)`];
}

function buildBadge(name) {
  const letters = String(name)
    .replace(/[^0-9A-Za-zА-Яа-яЁё ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");

  return (letters.join("") || String(name).slice(0, 2)).toUpperCase();
}

function inferGenre(station) {
  const haystack = [station.name, station.description].join(" ");
  const match = genreMatchers.find((entry) => entry.pattern.test(haystack));
  return match?.genre ?? station.genre ?? "Радио";
}

function normalizeStation(station) {
  const normalizedName = String(station.name ?? "").trim();
  const tags = station.tags?.length ? station.tags.map((tag) => normalizeUiText(tag)) : ["Онлайн", "Радио"];

  return {
    ...station,
    name: normalizedName,
    badge: station.badge ?? buildBadge(normalizedName),
    color: station.color ?? hashColor(station.id ?? station.name),
    description: normalizeImportedDescription(station.description),
    listeners: normalizeImportedSource(station.listeners),
    tags,
    genre: inferGenre(station)
  };
}

const rawStations = [
  ...(window.YANDEX_STATIONS ?? []),
  ...(window.STATIONS?.length ? window.STATIONS : fallbackStations)
];
const stations = rawStations.map(normalizeStation);

const state = {
  currentId: (stations.find(s => s.id === "yx-nashe") ?? stations[0]).id,
  favorites: new Set(),
  genre: "Все",
  search: "",
  showSuggestions: false,
  isPlaying: false,
  sleepTimerId: null,
  visibleCount: 60,
  hls: null
};

const player = document.querySelector("#radio-player");
const searchInput = document.querySelector("#station-search");
const sleepTimer = document.querySelector("#sleep-timer");
const playToggle = document.querySelector("#play-toggle");
const nextStation = document.querySelector("#next-station");
const favoriteToggle = document.querySelector("#favorite-toggle");
const currentTitle = document.querySelector("#current-title");
const currentDescription = document.querySelector("#current-description");
const currentTags = document.querySelector("#current-tags");
const playState = document.querySelector("#play-state");
const stationBadge = document.querySelector("#station-badge");
const favoritesSummary = document.querySelector("#favorites-summary strong");
const queueList = document.querySelector("#queue-list");
const stationGrid = document.querySelector("#station-grid");
const genreFilters = document.querySelector("#genre-filters");
const searchSuggestions = document.querySelector("#search-suggestions");

const genres = ["Все", ...new Set(stations.map((station) => station.genre))];

// Автопереподключение при зависании потока
let reconnectTimer = null;
function scheduleReconnect() {
  if (!state.isPlaying) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (!state.isPlaying) return;
    updateStatus("Переподключение...");
    const station = getStation(state.currentId);
    if (!state.hls) {
      // Для обычных MP3/AAC потоков — перезагружаем src
      const src = player.src;
      player.src = "";
      player.load();
      player.src = src;
      player.play().catch(() => {});
    }
    // HLS.js восстанавливается сам через внутренний retry
  }, 4000);
}

player.addEventListener("waiting", () => {
  if (state.isPlaying) updateStatus("Буферизация...");
  scheduleReconnect();
});
player.addEventListener("stalled", scheduleReconnect);
player.addEventListener("error", () => {
  if (state.isPlaying) scheduleReconnect();
});
player.addEventListener("playing", () => {
  clearTimeout(reconnectTimer);
  const station = getStation(state.currentId);
  updateStatus(`Сейчас играет: ${station.name}`);
});

function renderLogo(station, className = "station-logo") {
  if (station.logoUrl) {
    return `<div class="${className}"><img src="${station.logoUrl}" alt="${station.name}" loading="lazy" /></div>`;
  }

  return `<div class="${className}" style="background: linear-gradient(135deg, ${station.color[0]}, ${station.color[1]})">${station.badge}</div>`;
}

function getStation(id) {
  return stations.find((station) => station.id === id) ?? stations[0];
}

function normalizeSearchTerm(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^0-9a-zа-яё]+/gi, " ")
    .trim();
}

function buildSearchIndex(station) {
  return normalizeSearchTerm([
    station.name,
    station.genre,
    station.description,
    station.tags.join(" ")
  ].join(" "));
}

function getSearchMatches(term, limit = stations.length) {
  const normalizedTerm = normalizeSearchTerm(term);

  if (!normalizedTerm) {
    return [];
  }

  return stations
    .map((station) => {
      const name = normalizeSearchTerm(station.name);
      const haystack = buildSearchIndex(station);
      let score = -1;

      if (name.startsWith(normalizedTerm)) {
        score = 0;
      } else if (name.includes(normalizedTerm)) {
        score = 1;
      } else if (haystack.includes(normalizedTerm)) {
        score = 2;
      }

      return { station, score };
    })
    .filter((item) => item.score >= 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      return left.station.name.localeCompare(right.station.name, "ru");
    })
    .slice(0, limit)
    .map((item) => item.station);
}

function filteredStations() {
  const term = state.search.trim();

  if (term) {
    return getSearchMatches(term);
  }

  return stations.filter((station) => {
    return state.genre === "Все" || station.genre === state.genre;
  });
}

function setGradient(element, [start, end]) {
  element.style.background = `linear-gradient(135deg, ${start}, ${end})`;
}

function renderHero() {
  const station = getStation(state.currentId);

  currentTitle.textContent = station.name;
  currentDescription.textContent = station.description;
  if (station.logoUrl) {
    stationBadge.innerHTML = `<img src="${station.logoUrl}" alt="${station.name}" />`;
  } else {
    stationBadge.textContent = station.badge;
    setGradient(stationBadge, station.color);
  }

  currentTags.innerHTML = station.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  favoriteToggle.textContent = state.favorites.has(station.id) ? "★" : "☆";
  favoriteToggle.classList.toggle("active", state.favorites.has(station.id));
  playToggle.textContent = state.isPlaying ? "Пауза" : "Слушать";
}

function renderQueue() {
  const nextStations = stations
    .filter((station) => station.id !== state.currentId)
    .slice(0, 5);

  queueList.innerHTML = nextStations
    .map((station, index) => `
      <button class="queue-item ${station.id === state.currentId ? "active" : ""}" data-station-id="${station.id}" type="button">
        ${renderLogo(station)}
        <div class="queue-meta">
          <strong>${station.name}</strong>
          <small>${station.genre}</small>
        </div>
        <span class="queue-count">0${index + 1}</span>
      </button>
    `)
    .join("");

  favoritesSummary.textContent = `${state.favorites.size} сохранено`;
}

function renderGenres() {
  genreFilters.innerHTML = genres
    .map((genre) => `
      <button class="filter-pill ${genre === state.genre ? "active" : ""}" data-genre="${genre}" type="button">
        ${genre}
      </button>
    `)
    .join("");
}

function renderGrid() {
  const stationsToShow = filteredStations();
  const visibleStations = stationsToShow.slice(0, state.visibleCount);

  if (!stationsToShow.length) {
    stationGrid.innerHTML = '<div class="empty-state">Ничего не найдено. Попробуйте другой жанр или запрос.</div>';
    return;
  }

  stationGrid.innerHTML = visibleStations
    .map((station) => `
      <article class="station-card ${station.id === state.currentId ? "active" : ""}" data-station-id="${station.id}">
        <div class="station-card-top">
          ${renderLogo(station)}
          <span class="tag">${station.genre}</span>
        </div>
        <div class="station-meta">
          <strong>${station.name}</strong>
        </div>
        <p>${station.description}</p>
        <div class="station-card-footer">
          <span>${station.tags[0]} / ${station.tags[1]}</span>
          <span>${state.favorites.has(station.id) ? "Сохранено" : "Нажмите для прослушивания"}</span>
        </div>
      </article>
    `)
    .join("");

  if (stationsToShow.length > visibleStations.length) {
    stationGrid.insertAdjacentHTML(
      "beforeend",
      `<div class="load-more-card"><button type="button" data-action="load-more">Показать еще ${Math.min(60, stationsToShow.length - visibleStations.length)}</button></div>`
    );
  }
}

function renderSearchSuggestions() {
  const suggestions = getSearchMatches(state.search, 8);

  if (!state.showSuggestions || !state.search.trim() || !suggestions.length) {
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    return;
  }

  searchSuggestions.innerHTML = suggestions
    .map((station, index) => `
      <button class="search-suggestion ${index === 0 ? "active" : ""}" type="button" data-station-id="${station.id}">
        ${renderLogo(station)}
        <span class="search-suggestion-meta">
          <strong>${station.name}</strong>
          <small>${station.genre}</small>
        </span>
      </button>
    `)
    .join("");

  searchSuggestions.hidden = false;
}

function render() {
  renderHero();
  renderQueue();
  renderGenres();
  renderGrid();
  renderSearchSuggestions();
}

function updateStatus(message) {
  playState.textContent = message;
}

async function playCurrentStation() {
  const station = getStation(state.currentId);

  if (player.src !== station.stream) {
    // Очищаем HLS если был активен
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }

    if (station.stream.includes('.m3u8')) {
      // HLS поток
      if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          liveSyncDurationCount: 4,
          liveMaxLatencyDurationCount: 12,
          lowLatencyMode: false,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
        });
        hls.loadSource(station.stream);
        hls.attachMedia(player);
        state.hls = hls;
      } else {
        // Safari поддерживает HLS нативно
        player.src = station.stream;
      }
    } else {
      player.src = station.stream;
    }
  }

  try {
    await player.play();
    state.isPlaying = true;
    updateStatus(`Сейчас играет: ${station.name}`);
  } catch (error) {
    if (error.name === "AbortError") {
      // src изменился — браузер прервал предыдущий play(), повторяем
      try {
        await player.play();
        state.isPlaying = true;
        updateStatus(`Сейчас играет: ${station.name}`);
      } catch (retryError) {
        state.isPlaying = false;
        updateStatus("Воспроизведение заблокировано. Нажмите кнопку еще раз.");
      }
    } else {
      state.isPlaying = false;
      updateStatus("Воспроизведение заблокировано. Нажмите кнопку еще раз.");
    }
  }

  render();
}

function pausePlayback() {
  player.pause();
  if (state.hls) {
    state.hls.destroy();
    state.hls = null;
  }
  state.isPlaying = false;
  updateStatus("Пауза");
  render();
}

function togglePlayback() {
  if (state.isPlaying) {
    pausePlayback();
    return;
  }

  playCurrentStation();
}

function selectStation(id, autoplay = true) {
  state.currentId = id;
  render();

  if (autoplay) {
    if (typeof ym === 'function') ym(108990669, 'reachGoal', 'play_station', { station: id });
    playCurrentStation();
  }
}

function pickRandomStation() {
  const pool = stations.filter((station) => station.id !== state.currentId);
  const randomStation = pool[Math.floor(Math.random() * pool.length)] ?? stations[0];
  selectStation(randomStation.id, true);
}

function toggleFavorite() {
  if (state.favorites.has(state.currentId)) {
    state.favorites.delete(state.currentId);
  } else {
    state.favorites.add(state.currentId);
  }

  render();
}

function handleSleepTimer(minutes) {
  if (state.sleepTimerId) {
    clearTimeout(state.sleepTimerId);
    state.sleepTimerId = null;
  }

  if (!minutes) {
    updateStatus(state.isPlaying ? `Сейчас играет: ${getStation(state.currentId).name}` : "Таймер сна выключен");
    return;
  }

  updateStatus(`Таймер сна: ${minutes} мин.`);
  state.sleepTimerId = window.setTimeout(() => {
    pausePlayback();
    updateStatus("Таймер сна завершен");
    sleepTimer.value = "0";
  }, minutes * 60 * 1000);
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  state.showSuggestions = true;
  state.visibleCount = 60;
  if (state.search.length === 3 && typeof ym === 'function') ym(108990669, 'reachGoal', 'search');
  renderSearchSuggestions();
  renderGrid();
});

searchInput.addEventListener("focus", () => {
  state.showSuggestions = true;
  renderSearchSuggestions();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  const [firstMatch] = getSearchMatches(state.search, 1);

  if (!firstMatch) {
    return;
  }

  event.preventDefault();
  state.search = firstMatch.name;
  state.showSuggestions = false;
  searchInput.value = firstMatch.name;
  searchSuggestions.hidden = true;
  selectStation(firstMatch.id, true);
});

sleepTimer.addEventListener("change", (event) => {
  handleSleepTimer(Number(event.target.value));
});

playToggle.addEventListener("click", togglePlayback);
nextStation.addEventListener("click", pickRandomStation);
favoriteToggle.addEventListener("click", toggleFavorite);

queueList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-station-id]");

  if (!item) {
    return;
  }

  selectStation(item.dataset.stationId, true);
});

stationGrid.addEventListener("click", (event) => {
  const loadMoreButton = event.target.closest("[data-action='load-more']");

  if (loadMoreButton) {
    state.visibleCount += 60;
    renderGrid();
    return;
  }

  const card = event.target.closest("[data-station-id]");

  if (!card) {
    return;
  }

  selectStation(card.dataset.stationId, true);
});

searchSuggestions.addEventListener("click", (event) => {
  const suggestion = event.target.closest("[data-station-id]");

  if (!suggestion) {
    return;
  }

  const station = getStation(suggestion.dataset.stationId);
  state.search = station.name;
  state.showSuggestions = false;
  searchInput.value = station.name;
  searchSuggestions.hidden = true;
  selectStation(station.id, true);
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".search-wrap")) {
    return;
  }

  state.showSuggestions = false;
  searchSuggestions.hidden = true;
});

genreFilters.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-genre]");

  if (!filter) {
    return;
  }

  state.genre = filter.dataset.genre;
  state.visibleCount = 60;
  renderGenres();
  renderGrid();
});

player.addEventListener("playing", () => {
  state.isPlaying = true;
  updateStatus(`Сейчас играет: ${getStation(state.currentId).name}`);
  render();
});

player.addEventListener("pause", () => {
  if (!player.ended) {
    state.isPlaying = false;
    render();
  }
});

player.addEventListener("error", () => {
  state.isPlaying = false;
  updateStatus("Поток недоступен. Попробуйте другую станцию.");
  render();
});

render();