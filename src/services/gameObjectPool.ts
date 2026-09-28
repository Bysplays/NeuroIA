import type { GameConfig } from './difficulty.ts';

export interface GameObjectItem { symbol: string; name: string; category: string; tier: number }
// Symbols are artwork keys, not substitutes for the Spanish identity.
const rows = `
🍎|Manzana|food|1
🍌|Plátano|food|1
🥖|Pan|food|1
🥛|Vaso|kitchen|1
☕|Taza|kitchen|1
🥄|Cuchara|kitchen|1
🪑|Silla|furniture|1
🛏️|Cama|furniture|1
🚗|Coche|vehicles|1
🐶|Perro|animals|1
🐱|Gato|animals|1
🏠|Casa|places|1
📖|Libro|leisure|1
table|Mesa|furniture|1
towel|Toalla|hygiene|1
🧼|Jabón|hygiene|1
👕|Camisa|clothes|1
👖|Pantalón|clothes|1
🧦|Calcetines|clothes|1
🧢|Gorra|clothes|1
👟|Zapato|clothes|1
⏰|Reloj|household|1
🔑|Llave|household|1
🍐|Pera|food|1
🍊|Naranja|food|1
🍋|Limón|food|1
🍅|Tomate|food|1
🌻|Girasol|nature|2
🪟|Ventana|household|2
📱|Teléfono|household|2
👓|Gafas|personal|2
✂️|Tijeras|tools|2
🪥|Cepillo|hygiene|2
☂️|Paraguas|personal|2
🎸|Guitarra|leisure|2
💡|Lámpara|furniture|2
🚲|Bicicleta|vehicles|2
🍽️|Plato|kitchen|2
👒|Sombrero|clothes|2
📻|Radio|household|2
🍳|Sartén|kitchen|2
🍲|Olla|kitchen|2
soup|Sopa|food|2
🧽|Esponja|hygiene|2
🛋️|Sofá|furniture|2
🐴|Caballo|animals|2
🚌|Autobús|vehicles|2
✈️|Avión|vehicles|2
🍇|Uvas|food|2
🍓|Fresa|food|2
🍒|Cerezas|food|2
🍉|Sandía|food|2
🍑|Melocotón|food|3
🍍|Piña|food|3
🥝|Kiwi|food|3
🥑|Aguacate|food|3
🥥|Coco|food|3
🥕|Zanahoria|food|2
🌽|Maíz|food|3
🥦|Brócoli|food|3
🥔|Patata|food|2
🍆|Berenjena|food|3
🍄|Champiñón|food|3
🥐|Cruasán|food|3
🫒|Aceituna|food|3
🍈|Melón|food|3
🥾|Bota|clothes|2
🔨|Martillo|tools|2
🔧|Llave inglesa|tools|3
🪛|Destornillador|tools|3
🪚|Alicates|tools|3
🚆|Tren|vehicles|2
✋|Mano|body|1
👄|Boca|body|1
👁️|Ojo|body|1
💇|Pelo|body|1
🌙|Luna|nature|1
☀️|Sol|nature|1
💧|Agua|nature|1
🌸|Flor|nature|1
🌿|Rama|nature|2
🌊|Ola|nature|2`;
export const GAME_OBJECT_POOL: GameObjectItem[] = rows.trim().split('\n').map(row => {
  const [symbol, name, category, tier] = row.split('|');
  return { symbol, name, category, tier: Number(tier) };
});
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function selectPool(config: GameConfig, pool = GAME_OBJECT_POOL) {
  const maxTier = config.level <= 3 ? 1 : config.level <= 6 ? 2 : 3;
  const eligible = pool.filter(item => item.tier <= maxTier);
  // Advanced rounds always include demanding vocabulary, not merely a larger easy pool.
  const demanding = shuffle(eligible.filter(item => item.tier === maxTier));
  const quota = Math.min(demanding.length, Math.ceil(config.rounds * (config.level / 10)));
  const chosen = demanding.slice(0, quota);
  return shuffle([...chosen, ...shuffle(eligible.filter(item => !chosen.includes(item))).slice(0, config.rounds - quota)]);
}
export function plainWord(word: string) { return word.toUpperCase().replace(/[ÁÀ]/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/[ÚÜ]/g, 'U'); }
export function namingChoices(item: GameObjectItem, config: GameConfig) {
  // A specific name and its broader name can both describe the same drawing.
  const overlapping = [['Flor', 'Girasol'], ['Llave', 'Llave inglesa'], ['Agua', 'Ola']];
  const candidates = GAME_OBJECT_POOL.filter(other => other.name !== item.name
    && !overlapping.some(group => group.includes(item.name) && group.includes(other.name)));
  const word = plainWord(item.name);
  const similarity = (other: GameObjectItem) => {
    const text = plainWord(other.name);
    const common = [...new Set(word)].filter(char => text.includes(char)).length;
    return (other.category === item.category ? 10 : 0) + common - Math.abs(text.length - word.length) * .5;
  };
  const ordered = candidates.sort((a, b) => config.level >= 4 ? similarity(b) - similarity(a) : similarity(a) - similarity(b));
  return shuffle([item.name, ...ordered.slice(0, config.choices - 1).map(other => other.name)]);
}
export const CATEGORY_NAMES: Record<string, string> = {
  food: 'Alimentos', kitchen: 'Cocina', furniture: 'Muebles', vehicles: 'Transportes',
  animals: 'Animales', places: 'Lugares', leisure: 'Ocio', hygiene: 'Higiene y baño',
  clothes: 'Ropa', household: 'Objetos del hogar', personal: 'Uso personal',
  tools: 'Herramientas', body: 'Partes del cuerpo', nature: 'Naturaleza',
};
// Keep classification unambiguous: avoid overlapping broad household/personal groups.
export const CLASSIFICATION_POOL = GAME_OBJECT_POOL.filter(item => !['household', 'personal', 'places', 'leisure', 'nature', 'body'].includes(item.category));
export function categoryChoices(item: GameObjectItem, config: GameConfig) {
  const categories = [...new Set(CLASSIFICATION_POOL.map(other => other.category))];
  const related: Record<string, string[]> = { food: ['kitchen', 'hygiene'], kitchen: ['tools', 'hygiene'], hygiene: ['kitchen', 'clothes'], furniture: ['kitchen', 'tools'], tools: ['kitchen', 'furniture'], clothes: ['hygiene', 'animals'], animals: ['food', 'vehicles'], vehicles: ['tools', 'furniture'] };
  const distractors = config.level >= 4 ? [...(related[item.category] ?? []), ...shuffle(categories)] : shuffle(categories);
  return shuffle([item.category, ...[...new Set(distractors)].filter(id => id !== item.category).slice(0, config.choices - 1)]);
}
export function completionRound(item: GameObjectItem, config: GameConfig) {
  const word = plainWord(item.name);
  const positions = [...word].map((letter, index) => ({ letter, index })).filter(({ letter }) => /[A-ZÑ]/.test(letter));
  const preferred = positions.filter(({ letter, index }) => config.level <= 3 ? /[AEIOU]/.test(letter) : index > 0 && index < word.length - 1 && !/[AEIOU]/.test(letter));
  const missingIndex = shuffle(preferred.length ? preferred : positions)[0].index;
  const target = word[missingIndex];
  const group = ['AEIOU', 'BPDQ', 'MNÑ', 'CGJ', 'SZCX', 'RTF', 'VYW'].find(group => group.includes(target)) ?? 'BCDFGLMNPRST';
  const others = [...new Set([...(config.level >= 4 ? group : 'AEIOULMST'), ...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'])].filter(char => char !== target);
  return { word, missingIndex, distractorLetters: others.slice(0, config.choices - 1) };
}
