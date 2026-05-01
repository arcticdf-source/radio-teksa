(function () {
  const mode = document.body.dataset.browseMode;
  const filtersRoot = document.querySelector("#browse-filters");
  const gridRoot = document.querySelector("#browse-station-grid");
  const counterRoot = document.querySelector("#browse-counter");
  const searchInput = document.querySelector("#browse-search");

  if (!mode || !filtersRoot || !gridRoot || !counterRoot) {
    return;
  }

  const rawStations = [
    ...(window.YANDEX_STATIONS ?? []),
    ...(window.STATIONS ?? [])
  ];

  const genreMatchers = [
    { genre: "Новости", pattern: /news|вести.?fm|sputnik|говорит|коммерсант|solov|\bмаяк\b|business.?fm|бизнес.?fm/i },
    { genre: "Юмор", pattern: /comedy|юмор/i },
    { genre: "Детское", pattern: /kids|\bдет|baby|колыб|детский.?хор/i },
    { genre: "Религиозное", pattern: /христиан|православ|\bвера\b|радонеж|благо|слово.?бож|dwg|молитв|церков/i },
    { genre: "Классика", pattern: /\bclassic|орфей|оркестр|\badagio|адажио|neoclassical|splash.?class|swiss.?radio.?class/i },
    { genre: "Хард-рок", pattern: /hard.?rock|\bmetal\b|металл|грайнд|хардкор/i },
    { genre: "Русский рок", pattern: /русский.?рок|рок.атака|pirate.?rock|пиратское.?rock|калейдоскоп.?рок/i },
    { genre: "Рок", pattern: /\brock\b|\bрок\b|maximum|ультра|fresh.?rock|anti.?radio|\bскала\b/i },
    { genre: "Хип-хоп", pattern: /hip.?hop|hiphop|\brap\b|rnb\.fm|rusrap|breakbeat|street.?beat|phonk/i },
    { genre: "Транс", pattern: /trance|\bтранс\b/i },
    { genre: "Хаус", pattern: /\bhouse\b|deep.?house|soulful.?house|soho.?fm|soundpark.?deep|\bdeep.?fm\b|best.?deep/i },
    { genre: "Техно", pattern: /techno|техно/i },
    { genre: "Диско", pattern: /disco|disko|дискотека/i },
    { genre: "Электронная", pattern: /\bedm\b|electronic|\bdnb\b|drum.?n.?bass|drumfunk|synth|electro|электростан/i },
    { genre: "Танцевальная", pattern: /\bdance\b|dancefloor|mixadance|party.?dance|\bтанц/i },
    { genre: "Джаз", pattern: /jazz|джаз/i },
    { genre: "Блюз", pattern: /blues|блюз/i },
    { genre: "R&B / Соул", pattern: /\br.b\b|\bsoul\b|\bfunk\b|фанк|соул/i },
    { genre: "Лаунж", pattern: /chill|lounge|relax|costa.?del.?mar|\bibiza\b|cafe.?del.?mar|buddha|атмосфера|slow.?radio|yoga|\bspa\b/i },
    { genre: "Эмбиент", pattern: /ambient|drone|whispering|new.?age|meditation|медитац/i },
    { genre: "Фолк", pattern: /folk|народн|татар|казак|этниче|балалайк|қазақ/i },
    { genre: "Регги", pattern: /reggae|регги/i },
    { genre: "Шансон", pattern: /шансон|душевн|наш.?шансон|бродяга/i },
    { genre: "Ретро", pattern: /retro|ретро|oldies|nostalg|\b80s\b|\b90s\b|vintage|старое.?добр|ностальжи|советск|caroline.?flash/i },
    { genre: "Разговорное", pattern: /\bкниг|литер|аудиокниг|модель.?для.?сборки|радиотеатр|старое.?радио|\bbook\b/i },
    { genre: "Спорт", pattern: /sport|спорт|fitness/i },
    { genre: "Поп", pattern: /\bpop\b|хит|европа|маруся|страна.?fm|радио.?7\b|nice.?fm|русское.?радио|like.?fm|love.?radio|energy.?fm|авторадио/i }
  ];

  const stations = rawStations
    .filter((station) => station && station.name && station.stream)
    .map((station) => {
      const genre = inferGenre(station);
      const country = resolveCountry(station);
      return {
        id: String(station.id || "").trim(),
        name: String(station.name).trim(),
        stream: String(station.stream).trim(),
        genre,
        country,
        logoUrl: String(station.logoUrl || "").trim() || null,
        badge: String(station.badge || buildBadge(station.name)).trim(),
        color: Array.isArray(station.color) && station.color.length >= 2
          ? station.color
          : hashColor(String(station.id || station.name || "radio"))
      };
    });

  const options = getOptions(stations, mode);
  const queryName = mode === "genres" ? "genre" : "country";
  const queryValue = new URLSearchParams(window.location.search).get(queryName);
  const selected = options.includes(queryValue) ? queryValue : "Все";

  const state = {
    selected,
    search: ""
  };

  renderFilters();
  renderGrid();

  filtersRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");

    if (!button) {
      return;
    }

    state.selected = button.dataset.filter;
    updateUrlQuery(queryName, state.selected);
    renderFilters();
    renderGrid();
  });

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.search = String(event.target.value || "").trim().toLowerCase();
      renderGrid();
    });
  }

  gridRoot.addEventListener("click", (event) => {
    const card = event.target.closest("[data-station-id]");

    if (!card) {
      return;
    }

    const stationId = card.dataset.stationId;

    if (!stationId) {
      return;
    }

    const nextUrl = new URL("./index.html", window.location.href);
    nextUrl.searchParams.set("station", stationId);
    nextUrl.searchParams.set("autoplay", "1");
    window.location.href = nextUrl.toString();
  });

  function resolveCountry(station) {
    const city = String(station.city || "").trim();
    const badge = String(station.badge || "").toUpperCase();
    const tags = Array.isArray(station.tags) ? station.tags.map((item) => String(item).toLowerCase()) : [];
    const haystack = [station.name, station.description, station.city, ...(station.tags || [])].join(" ").toLowerCase();

    if (badge === "KZ" || city === "Казахстан" || tags.some((tag) => tag.includes("казахстан")) || haystack.includes("казахстан")) {
      return "Казахстан";
    }

    if (tags.some((tag) => tag.includes("беларус")) || haystack.includes("беларус")) {
      return "Беларусь";
    }

    if (tags.some((tag) => tag.includes("украин")) || haystack.includes("украин")) {
      return "Украина";
    }

    if (tags.some((tag) => tag.includes("узбекистан")) || haystack.includes("узбекистан") || badge === "UZ") {
      return "Узбекистан";
    }

    if (tags.some((tag) => tag.includes("армени")) || haystack.includes("армени") || badge === "AM") {
      return "Армения";
    }

    return "Россия";
  }

  function inferGenre(station) {
    const explicitGenre = String(station.genre || "").trim();
    const normalizedExplicitGenre = normalizeExplicitGenre(explicitGenre);
    const haystack = [
      station.name,
      station.description,
      station.genre,
      ...(Array.isArray(station.tags) ? station.tags : [])
    ].join(" ").toLowerCase();

    if (normalizedExplicitGenre) {
      return normalizedExplicitGenre;
    }

    const matchedByRules = genreMatchers.find((entry) => entry.pattern.test(haystack));
    if (matchedByRules) {
      return matchedByRules.genre;
    }

    const fallbackGenre = inferFallbackGenre(haystack);
    if (fallbackGenre) {
      return fallbackGenre;
    }

    return "Поп";
  }

  function inferFallbackGenre(haystack) {
    if (/hits?|best|top|music|radio|fm|песни|музыка|русские|русская|русский|russian/i.test(haystack)) {
      return "Поп";
    }

    if (/deep|club|remix|edm|electro|house|techno|trance|dance/i.test(haystack)) {
      return "Электронная";
    }

    if (/gold|retro|oldies|nostalg|носталь|ретро|vintage/i.test(haystack)) {
      return "Ретро";
    }

    if (/city|город|region|волна|голос|news|talk|говорит/i.test(haystack)) {
      return "Разговорное";
    }

    return "";
  }

  function normalizeExplicitGenre(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }

    if (hasBrokenImportText(text)) {
      return "";
    }

    if (/^radio$|^радио$|^online$|^live$/i.test(text)) {
      return "";
    }

    const firstPart = text.split(",")[0].trim();
    if (!firstPart) {
      return "";
    }

    if (/разное|misc|various|другое/i.test(firstPart)) {
      return "";
    }

    if (/популярная/i.test(firstPart)) {
      return "Поп";
    }

    if (/танцевальная/i.test(firstPart)) {
      return "Танцевальная";
    }

    if (/классическая/i.test(firstPart)) {
      return "Классика";
    }

    if (/релакс|lounge|лаунж/i.test(firstPart)) {
      return "Лаунж";
    }

    if (/хиты|hit/i.test(firstPart)) {
      return "Поп";
    }

    return firstPart;
  }

  function hasBrokenImportText(value) {
    return /[�]|РЎС|РС|СЃС‚|С‚Р°|РёР·|РєР°/u.test(String(value || ""));
  }

  function getOptions(list, currentMode) {
    const source = currentMode === "genres"
      ? list.map((item) => item.genre)
      : list.map((item) => item.country);

    const unique = Array.from(new Set(source.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ru"));
    return ["Все", ...unique];
  }

  function filterStations() {
    let base = stations;

    if (state.selected !== "Все") {
      base = mode === "genres"
        ? base.filter((station) => station.genre === state.selected)
        : base.filter((station) => station.country === state.selected);
    }

    if (!state.search) {
      return base;
    }

    return base.filter((station) => station.name.toLowerCase().includes(state.search));
  }

  function renderFilters() {
    filtersRoot.innerHTML = options
      .map((option) => {
        const isActive = option === state.selected;
        const count = option === "Все"
          ? stations.length
          : filterCount(option);

        return `<button class="browse-filter-btn ${isActive ? "active" : ""}" data-filter="${escapeHtml(option)}" type="button">${escapeHtml(option)} <span>${count}</span></button>`;
      })
      .join("");
  }

  function filterCount(option) {
    if (mode === "genres") {
      return stations.filter((station) => station.genre === option).length;
    }

    return stations.filter((station) => station.country === option).length;
  }

  function renderGrid() {
    const filtered = filterStations();
    counterRoot.textContent = `Показано ${filtered.length} из ${stations.length}`;

    if (!filtered.length) {
      gridRoot.innerHTML = '<div class="empty-state">Станции не найдены для выбранного фильтра.</div>';
      return;
    }

    gridRoot.innerHTML = filtered
      .map((station) => {
        const stationId = escapeHtml(station.id);
        const title = escapeHtml(station.name);
        const genre = escapeHtml(station.genre);
        const country = escapeHtml(station.country);
        const logo = renderLogo(station);

        return `<article class="station-card browse-station-card" data-station-id="${stationId}"><div class="station-card-top">${logo}</div><div class="station-meta"><strong>${title}</strong></div><p>${country} · ${genre}</p><div class="browse-card-hint">Нажмите, чтобы слушать на главной</div></article>`;
      })
      .join("");
  }

  function renderLogo(station) {
    if (station.logoUrl) {
      return `<div class="station-logo"><img src="${escapeHtml(station.logoUrl)}" alt="${escapeHtml(station.name)}" loading="lazy" /></div>`;
    }

    return `<div class="station-logo" style="background: linear-gradient(135deg, ${station.color[0]}, ${station.color[1]})">${escapeHtml(station.badge)}</div>`;
  }

  function hashColor(seed) {
    let value = 0;

    for (const symbol of String(seed || "")) {
      value = (value * 31 + symbol.charCodeAt(0)) >>> 0;
    }

    const hue = value % 360;
    const nextHue = (hue + 38) % 360;
    return [`hsl(${hue} 80% 74%)`, `hsl(${nextHue} 88% 58%)`];
  }

  function buildBadge(name) {
    const letters = String(name || "")
      .replace(/[^0-9A-Za-zА-Яа-яЁё ]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "");

    return (letters.join("") || String(name || "").slice(0, 2)).toUpperCase();
  }

  function updateUrlQuery(paramName, value) {
    const url = new URL(window.location.href);

    if (!value || value === "Все") {
      url.searchParams.delete(paramName);
    } else {
      url.searchParams.set(paramName, value);
    }

    window.history.replaceState({}, "", url);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
