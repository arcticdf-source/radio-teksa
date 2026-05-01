global.window = {};
require("../yandex-stations.js");
require("../stations-data.js");

const stations = [...(window.YANDEX_STATIONS || []), ...(window.STATIONS || [])]
  .filter((s) => s && s.name && s.stream);

const rules = [
  ["Новости", /news|вести.?fm|sputnik|говорит|коммерсант|solov|\bмаяк\b|business.?fm|бизнес.?fm/i],
  ["Юмор", /comedy|юмор/i],
  ["Детское", /kids|\bдет|baby|колыб|детский.?хор/i],
  ["Религиозное", /христиан|православ|\bвера\b|радонеж|благо|слово.?бож|dwg|молитв|церков/i],
  ["Классика", /\bclassic|орфей|оркестр|\badagio|адажио|neoclassical|splash.?class|swiss.?radio.?class/i],
  ["Хард-рок", /hard.?rock|\bmetal\b|металл|грайнд|хардкор/i],
  ["Русский рок", /русский.?рок|рок.атака|pirate.?rock|пиратское.?rock|калейдоскоп.?рок/i],
  ["Рок", /\brock\b|\bрок\b|maximum|ультра|fresh.?rock|anti.?radio|\bскала\b/i],
  ["Хип-хоп", /hip.?hop|hiphop|\brap\b|rnb\.fm|rusrap|breakbeat|street.?beat|phonk/i],
  ["Транс", /trance|\bтранс\b/i],
  ["Хаус", /\bhouse\b|deep.?house|soulful.?house|soho.?fm|soundpark.?deep|\bdeep.?fm\b|best.?deep/i],
  ["Техно", /techno|техно/i],
  ["Диско", /disco|disko|дискотека/i],
  ["Электронная", /\bedm\b|electronic|\bdnb\b|drum.?n.?bass|drumfunk|synth|electro|электростан/i],
  ["Танцевальная", /\bdance\b|dancefloor|mixadance|party.?dance|\bтанц/i],
  ["Джаз", /jazz|джаз/i],
  ["Блюз", /blues|блюз/i],
  ["R&B / Соул", /\br.b\b|\bsoul\b|\bfunk\b|фанк|соул/i],
  ["Лаунж", /chill|lounge|relax|costa.?del.?mar|\bibiza\b|cafe.?del.?mar|buddha|атмосфера|slow.?radio|yoga|\bspa\b/i],
  ["Эмбиент", /ambient|drone|whispering|new.?age|meditation|медитац/i],
  ["Фолк", /folk|народн|татар|казак|этниче|балалайк|қазақ/i],
  ["Регги", /reggae|регги/i],
  ["Шансон", /шансон|душевн|наш.?шансон|бродяга/i],
  ["Ретро", /retro|ретро|oldies|nostalg|\b80s\b|\b90s\b|vintage|старое.?добр|ностальжи|советск|caroline.?flash/i],
  ["Разговорное", /\bкниг|литер|аудиокниг|модель.?для.?сборки|радиотеатр|старое.?радио|\bbook\b/i],
  ["Спорт", /sport|спорт|fitness/i],
  ["Поп", /\bpop\b|хит|европа|маруся|страна.?fm|радио.?7\b|nice.?fm|русское.?радио|like.?fm|love.?radio|energy.?fm|авторадио/i],
];

function hasBrokenImportText(value) {
  return /[�]|РЎС|РС|СЃС‚|С‚Р°|РёР·|РєР°/u.test(String(value || ""));
}

function normalizeExplicitGenre(value) {
  const text = String(value || "").trim();
  if (!text || hasBrokenImportText(text)) return "";
  if (/^radio$|^радио$|^online$|^live$/i.test(text)) return "";

  const firstPart = text.split(",")[0].trim();
  if (!firstPart || /разное|misc|various|другое/i.test(firstPart)) return "";
  if (/популярная/i.test(firstPart)) return "Поп";
  if (/танцевальная/i.test(firstPart)) return "Танцевальная";
  if (/классическая/i.test(firstPart)) return "Классика";
  if (/релакс|lounge|лаунж/i.test(firstPart)) return "Лаунж";
  if (/хиты|hit/i.test(firstPart)) return "Поп";
  return firstPart;
}

function inferGenre(station) {
  const explicit = normalizeExplicitGenre(station.genre);
  if (explicit) return explicit;

  const haystack = [station.name, station.description, station.genre, ...(station.tags || [])]
    .join(" ")
    .toLowerCase();

  const match = rules.find((entry) => entry[1].test(haystack));
  return match ? match[0] : "Разное";
}

const unresolved = [];
const tokenMap = new Map();
for (const station of stations) {
  const genre = inferGenre(station);
  if (genre !== "Разное") continue;

  unresolved.push(station.name);
  const tokens = String(station.name)
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 3);

  for (const token of tokens) {
    tokenMap.set(token, (tokenMap.get(token) || 0) + 1);
  }
}

console.log(`Total: ${stations.length}`);
console.log(`Unresolved: ${unresolved.length}`);
console.log("Top unresolved tokens:");
for (const [token, count] of [...tokenMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 120)) {
  console.log(`${token} ${count}`);
}
