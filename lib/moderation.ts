const BANNED_PATTERNS = [
  // Genitales
  'pito', 'polla', 'pene', 'verga', 'rabo', 'cipote', 'picha', 'nabo',
  'coño', 'chocho', 'vagina', 'concha', 'tetas', 'teta', 'culo', 'culos',
  'ano', 'anero', 'anus',
  // Actos sexuales
  'follar', 'folla', 'joder', 'coger', 'mamar', 'chupa', 'chupar', 'sexo',
  'porno', 'puta', 'putas', 'puto', 'puton', 'zorra', 'zorras', 'prostituta',
  'correrse', 'corrida',
  // Insultos graves
  'maricon', 'mariconazo', 'bollera', 'travelo',
  'hijo de puta', 'hijoputa', 'hdp', 'cabron', 'gilipollas',
  'idiota', 'imbecil', 'subnormal', 'retrasado', 'mongolo',
  // Excrementos
  'caca', 'mierda', 'mierdas', 'cagar', 'cago', 'pedo',
  // Variantes en inglés comunes
  'fuck', 'shit', 'bitch', 'cock', 'dick', 'ass', 'pussy', 'cunt', 'nigga',
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/[^a-z0-9\s]/g, '');   // strip symbols
}

export function containsBannedWord(name: string): boolean {
  const norm = normalize(name);
  return BANNED_PATTERNS.some((pattern) => norm.includes(normalize(pattern)));
}

export function getModerationError(name: string): string | null {
  if (containsBannedWord(name)) {
    return 'Ese nombre no está permitido. Elige otro nombre para continuar';
  }
  return null;
}
