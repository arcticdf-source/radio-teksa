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
  { genre: "Новости",      pattern: /news|вести.?fm|sputnik|говорит|коммерсант|solov|\bмаяк\b|business.?fm|бизнес.?fm/i },
  { genre: "Юмор",        pattern: /comedy|юмор/i },
  { genre: "Детское",     pattern: /kids|\bдет|baby|колыб|детский.?хор/i },
  { genre: "Религиозное", pattern: /христиан|православ|\bвера\b|радонеж|благо|слово.?бож|dwg|молитв|церков|bhaкti/i },
  { genre: "Классика",    pattern: /\bclassic|орфей|оркестр|\badagio|адажио|filharmon|splash.?classical|swiss.?internet.?radio.?class|neoclassical/i },
  { genre: "Хард-рок",   pattern: /hard.?rock|\bmetal\b|металл|grindot|грайнд|хардкор/i },
  { genre: "Русский рок", pattern: /русский.?рок|рок.атака|pirate.?rock|пиратское.?rock|калейдоскоп.?рок|рок.канал/i },
  { genre: "Рок",         pattern: /\brock\b|\bрок\b|maximum|ультра|fresh.?rock|anti.?radio|\bскала\b/i },
  { genre: "Хип-хоп",    pattern: /hip.?hop|hiphop|\brap\b|rnb\.fm|rusrap|breakbeat|street.?beat|phonk/i },
  { genre: "Транс",       pattern: /trance|\bтранс\b/i },
  { genre: "Хаус",        pattern: /\bhouse\b|deep.?house|soulful.?house|soho.?fm|soundpark.?deep|\bdeep.?fm\b|best.?deep/i },
  { genre: "Техно",       pattern: /techno|техно/i },
  { genre: "Диско",       pattern: /disco|disko|дискотека/i },
  { genre: "Электронная", pattern: /\bedm\b|electronic|\bdnb\b|drum.?n.?bass|drumfunk|dj.?radio|synth|electro|электростан/i },
  { genre: "Танцевальная",pattern: /\bdance\b|dancefloor|mixadance|party.?dance|\bтанц|danceflo/i },
  { genre: "Джаз",        pattern: /jazz|джаз/i },
  { genre: "Блюз",        pattern: /blues|блюз/i },
  { genre: "R&B / Соул",  pattern: /\br.b\b|\bsoul\b|\bfunk\b|фанк|соул/i },
  { genre: "Чиллаут",     pattern: /chill|lounge|relax|costa.?del.?mar|\bibiza\b|cafe.?del.?mar|buddha|атмосфера|slow.?radio|yoga|\bspa\b|абсолют.?парк/i },
  { genre: "Эмбиент",     pattern: /ambient|drone|whispering|new.?age|meditation|медитац/i },
  { genre: "Фолк",        pattern: /folk|народн|татар|казак|этниче|celtic|балалайк/i },
  { genre: "Регги",       pattern: /reggae|регги/i },
  { genre: "Шансон",      pattern: /шансон|душевн|наш.?шансон|бродяга/i },
  { genre: "Ретро",       pattern: /retro|ретро|oldies|nostalg|\b80s\b|\b90s\b|vintage|старое.?добр|ностальжи|советск|caroline.?flash/i },
  { genre: "Разговорное", pattern: /\bкниг|литер|аудиокниг|модель.?для.?сборки|радиотеатр|старое.?радио|\bbook\b/i },
  { genre: "Спорт",       pattern: /sport|спорт|fitness/i },
  { genre: "Поп",         pattern: /\bpop\b|хит|европа.?плюс|маруся|страна.?fm|радио.?7\b|nice.?fm|русское.?радио|like.?fm/i },
];

const cityMatchers = [
  { city: "Москва",           pattern: /москв|\bmoscow\b|говорит.?москв|\bnfm\b|\bmfm\b|\bdj.?radio.?russia\b/i },
  { city: "Санкт-Петербург",  pattern: /санкт.петерб|\bспб\b|питер|\bspb|петербург|\bнева\b|\bпетр\b.радио|\bgrad.petrov\b|град.петров/i },
  { city: "Екатеринбург",     pattern: /екатеринбург/i },
  { city: "Новосибирск",      pattern: /новосибирск|\bнск\b|nsk54/i },
  { city: "Красноярск",       pattern: /красноярск/i },
  { city: "Краснодар",        pattern: /краснодар/i },
  { city: "Казань",           pattern: /казань|казан/i },
  { city: "Ростов-на-Дону",   pattern: /ростов/i },
  { city: "Нижний Новгород",  pattern: /нижний.?новгород|н\.новгород|\bр52\b/i },
  { city: "Самара",           pattern: /\bсамар/i },
  { city: "Уфа",              pattern: /\bуфа\b/i },
  { city: "Омск",             pattern: /\bомск/i },
  { city: "Пермь",            pattern: /\bпермь\b|\bperm\b/i },
  { city: "Барнаул",          pattern: /барнаул/i },
  { city: "Иркутск",          pattern: /иркутск/i },
  { city: "Волгоград",        pattern: /волгоград/i },
  { city: "Орск",             pattern: /\bорск\b/i },
  { city: "Брянск",           pattern: /брянск/i },
  { city: "Владивосток",      pattern: /владивосток|лемма/i },
  { city: "Камчатка",         pattern: /kamchatka|камчатка/i },
  { city: "Хабаровск",        pattern: /хабаровск/i },
  { city: "Ставрополь",       pattern: /ставрополь/i },
  { city: "Кисловодск",       pattern: /кисловодск/i },
  { city: "Челябинск",        pattern: /челябинск|интерволна/i },
  { city: "Воронеж",          pattern: /воронеж/i },
  { city: "Орёл",             pattern: /орёл|\bорел\b/i },
  { city: "Абакан",           pattern: /абакан|хакасия/i },
  { city: "Владимир",         pattern: /\bвладимир\b/i },
  { city: "Саратов",          pattern: /саратов/i },
  { city: "Ижевск",           pattern: /ижевск/i },
  { city: "Тверь",            pattern: /\bтверь\b/i },
  { city: "Вологда",          pattern: /вологда/i },
  { city: "Липецк",           pattern: /липецк/i },
  { city: "Новочеркасск",     pattern: /новочеркасск/i },
  { city: "Севастополь",      pattern: /севастополь/i },
  { city: "Киров",            pattern: /\bкиров\b/i },
  { city: "Чайковский",       pattern: /чайковский.?г|г\.чайковский/i },
  { city: "Кудрово",          pattern: /кудрово/i },
  { city: "Анапа",            pattern: /анап/i },
  { city: "Магадан",          pattern: /колыма/i },
  { city: "Северо-Уральск",   pattern: /североуральск/i },
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
  const haystack = [station.name, station.description, ...(station.tags ?? [])].join(" ");
  const match = genreMatchers.find((entry) => entry.pattern.test(haystack));
  return match?.genre ?? station.genre ?? "Радио";
}

function inferCity(station) {
  const haystack = [station.name, station.description, ...(station.tags ?? [])].join(" ");
  const match = cityMatchers.find((entry) => entry.pattern.test(haystack));
  return match?.city ?? null;
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
    genre: inferGenre(station),
    city: station.city ?? inferCity(station)
  };
}

const rawStations = [
  ...(window.YANDEX_STATIONS ?? []),
  ...(window.STATIONS?.length ? window.STATIONS : fallbackStations)
];
const stations = rawStations.map(normalizeStation);

const genres = ["Все", ...new Set(stations.map((s) => s.genre))];
const cities = ["Все", ...[
  "Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Красноярск",
  "Краснодар", "Казань", "Ростов-на-Дону", "Нижний Новгород", "Самара",
  "Уфа", "Омск", "Пермь", "Барнаул", "Иркутск", "Волгоград", "Орск",
  "Брянск", "Владивосток", "Камчатка", "Хабаровск", "Ставрополь", "Кисловодск",
  "Челябинск", "Воронеж", "Орёл", "Абакан", "Владимир", "Саратов", "Ижевск",
  "Тверь", "Вологда", "Липецк", "Новочеркасск", "Севастополь", "Киров",
  "Чайковский", "Кудрово", "Анапа", "Магадан", "Северо-Уральск"
].filter((c) => stations.some((s) => s.city === c))];

const state = {
  currentId: (stations.find(s => s.id === "yx-nashe") ?? stations[0]).id,
  favorites: new Set(),
  view: "stations",
  genre: "Все",
  city: "Все",
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
const topbarNav = document.querySelector("#topbar-nav");
const mainLayout = document.querySelector("#main-layout");
const genreView = document.querySelector("#genre-view");
const cityView = document.querySelector("#city-view");

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
    const genreOk = state.genre === "Все" || station.genre === state.genre;
    const cityOk  = state.city  === "Все" || station.city  === state.city;
    return genreOk && cityOk;
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

const GENRE_ICONS = {
  "\u041f\u043e\u043f": "\ud83c\udfb5", "\u0420\u043e\u043a": "\ud83c\udfb8", "\u0420\u0443\u0441\u0441\u043a\u0438\u0439 \u0440\u043e\u043a": "\ud83c\udfb8", "\u0425\u0438\u043f-\u0445\u043e\u043f": "\ud83c\udfb9", "\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f": "\ud83d\udd0c",
  "\u0422\u0440\u0430\u043d\u0441": "\ud83d\udc7e", "\u0425\u0430\u0443\u0441": "\ud83c\udfe0", "\u0422\u0435\u0445\u043d\u043e": "\ud83e\udd16", "\u0414\u0438\u0441\u043a\u043e": "\ud83d\udd7a", "\u0422\u0430\u043d\u0446\u0435\u0432\u0430\u043b\u044c\u043d\u0430\u044f": "\ud83d\udc83",
  "\u0414\u0436\u0430\u0437": "\ud83c\udfb7", "\u0411\u043b\u044e\u0437": "\ud83c\udfb6", "R&B / \u0421\u043e\u0443\u043b": "\ud83c\udfa4", "\u0427\u0438\u043b\u043b\u0430\u0443\u0442": "\ud83c\udf0a", "\u042d\u043c\u0431\u0438\u0435\u043d\u0442": "\ud83c\udf1f",
  "\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430": "\ud83c\udfbb", "\u0428\u0430\u043d\u0441\u043e\u043d": "\ud83c\udfa9", "\u0420\u0435\u0442\u0440\u043e": "\ud83d\udce1", "\u0424\u043e\u043b\u043a": "\ud83c\udf31", "\u0420\u0435\u0433\u0433\u0438": "\u26a1",
  "\u0425\u0430\u0440\u0434-\u0440\u043e\u043a": "\ud83e\udd18", "\u0414\u0435\u0442\u0441\u043a\u043e\u0435": "\ud83d\udc76", "\u042e\u043c\u043e\u0440": "\ud83d\ude02", "\u0420\u0430\u0437\u0433\u043e\u0432\u043e\u0440\u043d\u043e\u0435": "\ud83d\udcac",
  "\u041d\u043e\u0432\u043e\u0441\u0442\u0438": "\ud83d\udcf0", "\u0421\u043f\u043e\u0440\u0442": "\u26bd", "\u0420\u0435\u043b\u0438\u0433\u0438\u043e\u0437\u043d\u043e\u0435": "\u271d\ufe0f", "\u0420\u0430\u0434\u0438\u043e": "\ud83d\udce1"
};

function renderGenreView() {
  const tiles = genres.filter(g => g !== "\u0412\u0441\u0435").map((genre) => {
    const count = stations.filter(s => s.genre === genre).length;
    const icon = GENRE_ICONS[genre] ?? "\ud83c\udfa7";
    const [c1, c2] = hashColor(genre);
    return `
      <button class="browse-tile" data-select-genre="${genre}" type="button" style="--c1:${c1};--c2:${c2}">
        <span class="browse-tile-icon">${icon}</span>
        <span class="browse-tile-name">${genre}</span>
        <span class="browse-tile-count">${count} \u0441\u0442\u0430\u043d\u0446\u0438\u0439</span>
      </button>`;
  });
  genreView.innerHTML = `<div class="tiles-grid">${tiles.join("")}</div>`;
}

function renderCityView() {
  const tiles = cities.filter(c => c !== "\u0412\u0441\u0435").map((city) => {
    const count = stations.filter(s => s.city === city).length;
    const [c1, c2] = hashColor(city);
    return `
      <button class="browse-tile" data-select-city="${city}" type="button" style="--c1:${c1};--c2:${c2}">
        <span class="browse-tile-icon">\ud83d\udccd</span>
        <span class="browse-tile-name">${city}</span>
        <span class="browse-tile-count">${count} \u0441\u0442\u0430\u043d\u0446\u0438\u0439</span>
      </button>`;
  });
  cityView.innerHTML = `<div class="tiles-grid">${tiles.join("")}</div>`;
}

function setView(view) {
  state.view = view;

  mainLayout.hidden = view !== "stations";
  genreView.hidden  = view !== "genres";
  cityView.hidden   = view !== "cities";

  topbarNav.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "genres")   renderGenreView();
  if (view === "cities")   renderCityView();
  if (view === "stations") render();
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

// Навигация: Все станции / Жанры / Города
topbarNav.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-view]");
  if (!btn) return;
  setView(btn.dataset.view);
});

// Клик по жанровому тайлу
genreView.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-select-genre]");
  if (!tile) return;
  state.genre = tile.dataset.selectGenre;
  state.city = "\u0412\u0441\u0435";
  state.visibleCount = 60;
  setView("stations");
});

// Клик по городскому тайлу
cityView.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-select-city]");
  if (!tile) return;
  state.city = tile.dataset.selectCity;
  state.genre = "\u0412\u0441\u0435";
  state.visibleCount = 60;
  setView("stations");
});

render();