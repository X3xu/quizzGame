const BANNED_PATTERNS = [
  // Genitales
  'pito', 'polla', 'pene', 'verga', 'rabo', 'cipote', 'picha', 'nabo',
  'coño', 'chocho', 'vagina', 'concha', 'tetas', 'teta', 'culo', 'culos',
  'ano', 'anero', 'anus',
  // Actos sexuales
  'follar', 'folla', 'joder', 'coger', 'mamar', 'chupa', 'chupar', 'sexo',
  'porno', 'puta', 'putas', 'putón', 'zorra', 'zorras', 'prostituta',
  'correrse', 'corrida',
  // Insultos graves
  'maricón', 'maricon', 'mariconazo', 'bollera', 'travelo',
  'hijo de puta', 'hijoputa', 'hdp', 'cabron', 'cabrón', 'gilipollas',
  'idiota', 'imbecil', 'imbécil', 'subnormal', 'retrasado', 'mongolo',
  // Excrementos
  'caca', 'mierda', 'mierdas', 'cagar', 'cago', 'pedo',
  // Variantes en inglés comunes
  'fuck', 'shit', 'bitch', 'cock', 'dick', 'ass', 'pussy', 'cunt', 'nigga',
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, '');    // strip symbols
}

export function containsBannedWord(name: string): boolean {
  const norm = normalize(name);
  return BANNED_PATTERNS.some((pattern) => {
    const normPattern = normalize(pattern);
    // Match as whole word or as substring (handles "polla123", "puto_amo", etc.)
    return norm.includes(normPattern);
  });
}

export function getModerationError(name: string): string | null {
  if (containsBannedWord(name)) {
    return 'Ese nombre no está permitido. Elige otro nombre para continuar';
  }
  return null;
}
