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
  { genre: "Новости",       pattern: /news|вести.?fm|sputnik|говорит|коммерсант|solov|\bмаяк\b|business.?fm|бизнес.?fm/i },
  { genre: "Юмор",         pattern: /comedy|юмор/i },
  { genre: "Детское",      pattern: /kids|\bдет|baby|колыб|детский.?хор/i },
  { genre: "Религиозное",  pattern: /христиан|православ|\bвера\b|радонеж|благо|слово.?бож|dwg|молитв|церков/i },
  { genre: "Классика",     pattern: /\bclassic|орфей|оркестр|\badagio|адажио|neoclassical|splash.?class|swiss.?radio.?class/i },
  { genre: "Хард-рок",    pattern: /hard.?rock|\bmetal\b|металл|грайнд|хардкор/i },
  { genre: "Русский рок",  pattern: /русский.?рок|рок.атака|pirate.?rock|пиратское.?rock|калейдоскоп.?рок/i },
  { genre: "Рок",          pattern: /\brock\b|\bрок\b|maximum|ультра|fresh.?rock|anti.?radio|\bскала\b/i },
  { genre: "Хип-хоп",     pattern: /hip.?hop|hiphop|\brap\b|rnb\.fm|rusrap|breakbeat|street.?beat|phonk/i },
  { genre: "Транс",        pattern: /trance|\bтранс\b/i },
  { genre: "Хаус",         pattern: /\bhouse\b|deep.?house|soulful.?house|soho.?fm|soundpark.?deep|\bdeep.?fm\b|best.?deep/i },
  { genre: "Техно",        pattern: /techno|техно/i },
  { genre: "Диско",        pattern: /disco|disko|дискотека/i },
  { genre: "Электронная",  pattern: /\bedm\b|electronic|\bdnb\b|drum.?n.?bass|drumfunk|synth|electro|электростан/i },
  { genre: "Танцевальная", pattern: /\bdance\b|dancefloor|mixadance|party.?dance|\bтанц/i },
  { genre: "Джаз",         pattern: /jazz|джаз/i },
  { genre: "Блюз",         pattern: /blues|блюз/i },
  { genre: "R&B / Соул",   pattern: /\br.b\b|\bsoul\b|\bfunk\b|фанк|соул/i },
  { genre: "Чиллаут",      pattern: /chill|lounge|relax|costa.?del.?mar|\bibiza\b|cafe.?del.?mar|buddha|атмосфера|slow.?radio|yoga|\bspa\b/i },
  { genre: "Эмбиент",      pattern: /ambient|drone|whispering|new.?age|meditation|медитац/i },
  { genre: "Фолк",         pattern: /folk|народн|татар|казак|этниче|балалайк/i },
  { genre: "Регги",        pattern: /reggae|регги/i },
  { genre: "Шансон",       pattern: /шансон|душевн|наш.?шансон|бродяга/i },
  { genre: "Ретро",        pattern: /retro|ретро|oldies|nostalg|\b80s\b|\b90s\b|vintage|старое.?добр|ностальжи|советск|caroline.?flash/i },
  { genre: "Разговорное",  pattern: /\bкниг|литер|аудиокниг|модель.?для.?сборки|радиотеатр|старое.?радио|\bbook\b/i },
  { genre: "Спорт",        pattern: /sport|спорт|fitness/i },
  { genre: "Поп",          pattern: /\bpop\b|хит|европа|маруся|страна.?fm|радио.?7\b|nice.?fm|русское.?радио|like.?fm/i },
];

const cityMatchers = [
  { city: "Москва",            pattern: /москв|\bmoscow\b|говорит.?москв|\bnfm\b|\bmfm\b/i },
  { city: "Санкт-Петербург",   pattern: /санкт.петерб|\bспб\b|питер.?fm|\bspb|петербург|град.?петров/i },
  { city: "Екатеринбург",      pattern: /екатеринбург/i },
  { city: "Новосибирск",       pattern: /новосибирск|nsk54/i },
  { city: "Красноярск",        pattern: /красноярск/i },
  { city: "Краснодар",         pattern: /краснодар/i },
  { city: "Казань",            pattern: /казань|казан/i },
  { city: "Ростов-на-Дону",    pattern: /ростов/i },
  { city: "Нижний Новгород",   pattern: /нижний.?новгород|\bр52\b/i },
  { city: "Самара",            pattern: /\bсамар/i },
  { city: "Уфа",               pattern: /\bуфа\b/i },
  { city: "Омск",              pattern: /\bомск/i },
  { city: "Пермь",             pattern: /\bпермь\b|\bperm\b/i },
  { city: "Барнаул",           pattern: /барнаул/i },
  { city: "Иркутск",           pattern: /иркутск/i },
  { city: "Волгоград",         pattern: /волгоград/i },
  { city: "Орск",              pattern: /\bорск\b/i },
  { city: "Брянск",            pattern: /брянск/i },
  { city: "Владивосток",       pattern: /владивосток|лемма/i },
  { city: "Камчатка",          pattern: /kamchatka|камчатка/i },
  { city: "Хабаровск",         pattern: /хабаровск/i },
  { city: "Ставрополь",        pattern: /ставрополь/i },
  { city: "Кисловодск",        pattern: /кисловодск/i },
  { city: "Челябинск",         pattern: /челябинск|интерволна/i },
  { city: "Воронеж",           pattern: /воронеж/i },
  { city: "Орёл",              pattern: /орёл|\bорел\b/i },
  { city: "Абакан",            pattern: /абакан|хакасия/i },
  { city: "Саратов",           pattern: /саратов/i },
  { city: "Ижевск",            pattern: /ижевск/i },
  { city: "Чайковский",        pattern: /чайковский/i },
  { city: "Магадан",           pattern: /колыма/i },
  { city: "Анапа",             pattern: /анап/i },
  { city: "Севастополь",       pattern: /севастополь/i },
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
const resolvedStreamStorageKey = "radio-resolved-streams-v1";

function loadResolvedStreamCache() {
  try {
    const raw = window.localStorage.getItem(resolvedStreamStorageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

const resolvedStreamCache = loadResolvedStreamCache();

function persistResolvedStreamCache() {
  try {
    window.localStorage.setItem(
      resolvedStreamStorageKey,
      JSON.stringify(Object.fromEntries(resolvedStreamCache.entries()))
    );
  } catch {
    // ignore storage failures
  }
}

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
  hls: null,
  activeStream: null
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
const vinylDisc = document.querySelector("#vinyl-disc");
const vinylLabel = document.querySelector("#vinyl-label");
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

const cyrillicToLatinMap = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sh",
  ъ: "", ы: "y", ь: "", э: "e", ю: "u", я: "a"
};

function canonicalizeLatinSpellings(value) {
  return String(value ?? "")
    .replace(/shch/g, "sh")
    .replace(/sch/g, "sh")
    .replace(/ph/g, "f")
    .replace(/jo/g, "e")
    .replace(/yo/g, "e")
    .replace(/ju/g, "u")
    .replace(/yu/g, "u")
    .replace(/ja/g, "a")
    .replace(/ya/g, "a")
    .replace(/x/g, "ks")
    .replace(/q/g, "k")
    .replace(/w/g, "v")
    .replace(/c/g, "k");
}

function transliterateCyrillicToLatin(value) {
  return Array.from(String(value ?? "").toLowerCase(), (symbol) => cyrillicToLatinMap[symbol] ?? symbol).join("");
}

function getStationSearchAliases(station) {
  const aliases = new Set();
  const transliteratedName = transliterateCyrillicToLatin(station.name);
  const transliteratedGenre = transliterateCyrillicToLatin(station.genre);
  const transliteratedTags = (station.tags ?? []).map((tag) => transliterateCyrillicToLatin(tag)).join(" ");
  const normalizedId = String(station.id ?? "").replace(/^(yx|rp)-/i, "").replace(/[-_]+/g, " ").trim();

  if (transliteratedName) {
    aliases.add(transliteratedName);
  }

  if (transliteratedGenre) {
    aliases.add(transliteratedGenre);
  }

  if (transliteratedTags) {
    aliases.add(transliteratedTags);
  }

  if (normalizedId) {
    aliases.add(normalizedId);
  }

  try {
    const sourceUrl = new URL(station.sourceUrl);
    const lastPathSegment = sourceUrl.pathname.split("/").filter(Boolean).at(-1);
    if (lastPathSegment) {
      aliases.add(lastPathSegment.replace(/[-_]+/g, " "));
    }
  } catch {
    // ignore invalid URLs in aliases
  }

  return Array.from(aliases).join(" ");
}

function destroyActiveHls() {
  if (state.hls) {
    state.hls.destroy();
    state.hls = null;
  }
}

function isHlsStream(stream) {
  return /\.m3u8(\?|$)/i.test(String(stream ?? ""));
}

function getCachedStream(station) {
  return station.resolvedStream ?? resolvedStreamCache.get(station.id) ?? null;
}

function rememberResolvedStream(station, stream) {
  if (!stream) {
    return;
  }

  station.resolvedStream = stream;
  resolvedStreamCache.set(station.id, stream);
  persistResolvedStreamCache();
}

function getStreamCandidates(station) {
  return Array.from(new Set([
    getCachedStream(station),
    station.stream,
    ...(station.fallbackStreams ?? [])
  ].filter(Boolean)));
}

function buildStationQueries(station) {
  const variants = new Set();
  const rawName = String(station.name ?? "").trim();
  const compactName = rawName
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*[\/|].*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (rawName) {
    variants.add(rawName);
  }

  if (compactName) {
    variants.add(compactName);
  }

  return Array.from(variants);
}

async function fetchRadioBrowserCandidates(station) {
  const queries = buildStationQueries(station);
  const candidates = [];

  for (const query of queries) {
    try {
      const response = await fetch(`https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(query)}`);
      const rows = await response.json();

      for (const row of rows) {
        const url = row.url_resolved || row.url;
        if (!url || !/^https:/i.test(url)) {
          continue;
        }

        candidates.push(url);
      }
    } catch {
      continue;
    }
  }

  return Array.from(new Set(candidates));
}

async function probeStream(stream, timeoutMs = 9000) {
  const audio = document.createElement("audio");
  audio.preload = "none";
  let hls = null;

  return await new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      if (hls) {
        try {
          hls.destroy();
        } catch {
          // ignore cleanup failures
        }
        hls = null;
      }

      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      cleanup();
      resolve(result);
    };

    const onLoadedMetadata = () => finish(true);
    const onCanPlay = () => finish(true);
    const onError = () => finish(false);
    const onHlsError = (event, data) => {
      if (data?.fatal) {
        finish(false);
      }
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);

    audio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    audio.addEventListener("canplay", onCanPlay, { once: true });
    audio.addEventListener("error", onError, { once: true });

    try {
      if (isHlsStream(stream) && typeof Hls !== "undefined" && Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          fragLoadingTimeOut: timeoutMs,
          manifestLoadingTimeOut: timeoutMs,
        });
        hls.on(Hls.Events.ERROR, onHlsError);
        hls.loadSource(stream);
        hls.attachMedia(audio);
      } else {
        audio.src = stream;
        audio.load();
      }
    } catch {
      finish(false);
    }
  });
}

async function resolvePlayableStream(station) {
  const checked = new Set();

  for (const candidate of getStreamCandidates(station)) {
    checked.add(candidate);
    if (await probeStream(candidate)) {
      rememberResolvedStream(station, candidate);
      return candidate;
    }
  }

  const radioBrowserCandidates = await fetchRadioBrowserCandidates(station);

  for (const candidate of radioBrowserCandidates) {
    if (checked.has(candidate)) {
      continue;
    }

    if (await probeStream(candidate)) {
      rememberResolvedStream(station, candidate);
      return candidate;
    }
  }

  return null;
}

async function attachStreamToPlayer(stream) {
  destroyActiveHls();

  if (isHlsStream(stream)) {
    if (typeof Hls !== "undefined" && Hls.isSupported()) {
      await new Promise((resolve, reject) => {
        const hls = new Hls({
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          liveSyncDurationCount: 4,
          liveMaxLatencyDurationCount: 12,
          lowLatencyMode: false,
          fragLoadingTimeOut: 20000,
          manifestLoadingTimeOut: 20000,
        });

        const cleanupListeners = () => {
          hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
          hls.off(Hls.Events.ERROR, onError);
        };

        const onManifestParsed = () => {
          cleanupListeners();
          resolve();
        };

        const onError = (event, data) => {
          if (!data?.fatal) {
            return;
          }

          cleanupListeners();
          try {
            hls.destroy();
          } catch {
            // ignore cleanup failures
          }
          reject(new Error(data.details || "HLS attach failed"));
        };

        hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        hls.on(Hls.Events.ERROR, onError);
        hls.loadSource(stream);
        hls.attachMedia(player);
        state.hls = hls;
      });
    } else {
      player.src = stream;
    }
  } else {
    player.src = stream;
  }

  state.activeStream = stream;
}

function normalizeSearchTerm(value) {
  return canonicalizeLatinSpellings(
    String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^0-9a-zа-яё]+/gi, " ")
    .trim()
  );
}

function buildSearchIndex(station) {
  return normalizeSearchTerm([
    station.name,
    station.genre,
    station.description,
    station.tags.join(" "),
    getStationSearchAliases(station)
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

  // Update vinyl label
  if (vinylLabel) {
    if (station.logoUrl) {
      vinylLabel.innerHTML = `<img src="${station.logoUrl}" alt="${station.name}" />`;
    } else {
      vinylLabel.innerHTML = station.badge;
      vinylLabel.style.background = `linear-gradient(135deg, ${station.color[0]}, ${station.color[1]})`;
    }
  }
  if (vinylDisc) {
    vinylDisc.classList.toggle("playing", state.isPlaying);
  }
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
  "Поп":"🎵","Рок":"🎸","Русский рок":"🎸","Хип-хоп":"🎹","Электронная":"🔌",
  "Транс":"👾","Хаус":"🏠","Техно":"🤖","Диско":"🕺","Танцевальная":"💃",
  "Джаз":"🎷","Блюз":"🎶","R&B / Соул":"🎤","Чиллаут":"🌊","Эмбиент":"🌟",
  "Классика":"🎻","Шансон":"🎩","Ретро":"📡","Фолк":"🌱","Регги":"⚡",
  "Хард-рок":"🤘","Детское":"👶","Юмор":"😂","Разговорное":"💬",
  "Новости":"📰","Спорт":"⚽","Религиозное":"✝️","Радио":"📡"
};

function renderGenreView() {
  const tiles = genres.filter(g => g !== "Все").map((genre) => {
    const count = stations.filter(s => s.genre === genre).length;
    const icon = GENRE_ICONS[genre] ?? "🎧";
    const [c1, c2] = hashColor(genre);
    return `<button class="browse-tile" data-select-genre="${genre}" type="button" style="--c1:${c1};--c2:${c2}">
      <span class="browse-tile-icon">${icon}</span>
      <span class="browse-tile-name">${genre}</span>
      <span class="browse-tile-count">${count} станций</span>
    </button>`;
  });
  genreView.innerHTML = `<div class="tiles-grid">${tiles.join("")}</div>`;
}

function renderCityView() {
  const tiles = cities.filter(c => c !== "Все").map((city) => {
    const count = stations.filter(s => s.city === city).length;
    const [c1, c2] = hashColor(city);
    return `<button class="browse-tile" data-select-city="${city}" type="button" style="--c1:${c1};--c2:${c2}">
      <span class="browse-tile-icon">📍</span>
      <span class="browse-tile-name">${city}</span>
      <span class="browse-tile-count">${count} станций</span>
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

  updateStatus(`Подключаем ${station.name}...`);
  const playableStream = await resolvePlayableStream(station);

  if (!playableStream) {
    state.isPlaying = false;
    state.activeStream = null;
    updateStatus(`Не удалось найти рабочий поток для ${station.name}.`);
    render();
    return;
  }

  if (state.activeStream !== playableStream) {
    try {
      await attachStreamToPlayer(playableStream);
    } catch {
      state.isPlaying = false;
      state.activeStream = null;
      updateStatus(`Не удалось подключить поток ${station.name}.`);
      render();
      return;
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
  destroyActiveHls();
  state.isPlaying = false;
  state.activeStream = null;
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
if (vinylDisc) vinylDisc.addEventListener("click", togglePlayback);

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

// Навигация
topbarNav.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-view]");
  if (!btn) return;
  setView(btn.dataset.view);
});

genreView.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-select-genre]");
  if (!tile) return;
  state.genre = tile.dataset.selectGenre;
  state.city = "Все";
  state.visibleCount = 60;
  setView("stations");
});

cityView.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-select-city]");
  if (!tile) return;
  state.city = tile.dataset.selectCity;
  state.genre = "Все";
  state.visibleCount = 60;
  setView("stations");
});

render();