import { Question } from './types';

export const questions: Question[] = [
  // GEOGRAPHY
  { id: 1, question: '¿Cuál es la capital de Francia?', options: ['Madrid', 'París', 'Roma', 'Berlín'], correctAnswer: 'París', category: 'geography', difficulty: 'easy' },
  { id: 2, question: '¿Cuál es el océano más grande del mundo?', options: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'], correctAnswer: 'Pacífico', category: 'geography', difficulty: 'easy' },
  { id: 3, question: '¿En qué continente se encuentra Egipto?', options: ['Asia', 'Europa', 'África', 'América'], correctAnswer: 'África', category: 'geography', difficulty: 'easy' },
  { id: 4, question: '¿Cuál es la capital de Australia?', options: ['Sídney', 'Melbourne', 'Canberra', 'Brisbane'], correctAnswer: 'Canberra', category: 'geography', difficulty: 'medium' },
  { id: 5, question: '¿Cuál es el país más poblado del mundo?', options: ['India', 'China', 'EE.UU.', 'Brasil'], correctAnswer: 'China', category: 'geography', difficulty: 'easy' },
  { id: 6, question: '¿Cuál es el río más largo del mundo?', options: ['Amazonas', 'Yangtsé', 'Misisipi', 'Nilo'], correctAnswer: 'Nilo', category: 'geography', difficulty: 'medium' },
  { id: 7, question: '¿Cuántos países forman América del Sur?', options: ['10', '12', '14', '16'], correctAnswer: '12', category: 'geography', difficulty: 'hard' },
  { id: 8, question: '¿Cuál es la montaña más alta del mundo?', options: ['K2', 'Everest', 'Kilimanjaro', 'Aconcagua'], correctAnswer: 'Everest', category: 'geography', difficulty: 'easy' },

  // SCIENCE
  { id: 9, question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Tierra', 'Marte', 'Mercurio'], correctAnswer: 'Mercurio', category: 'science', difficulty: 'easy' },
  { id: 10, question: '¿Cuál es la fórmula química del agua?', options: ['CO2', 'H2O', 'O2', 'NaCl'], correctAnswer: 'H2O', category: 'science', difficulty: 'easy' },
  { id: 11, question: '¿Cuál es el número atómico del oxígeno?', options: ['6', '7', '8', '9'], correctAnswer: '8', category: 'science', difficulty: 'medium' },
  { id: 12, question: '¿Cuál es el metal más ligero?', options: ['Aluminio', 'Titanio', 'Litio', 'Sodio'], correctAnswer: 'Litio', category: 'science', difficulty: 'hard' },
  { id: 13, question: '¿Qué gas es más abundante en la atmósfera terrestre?', options: ['Oxígeno', 'Dióxido de carbono', 'Nitrógeno', 'Argón'], correctAnswer: 'Nitrógeno', category: 'science', difficulty: 'medium' },
  { id: 14, question: '¿Cuál es la teoría científica más famosa de Einstein?', options: ['Cuántica', 'Relatividad', 'Big Bang', 'Evolución'], correctAnswer: 'Relatividad', category: 'science', difficulty: 'easy' },
  { id: 15, question: '¿Qué órgano produce la insulina?', options: ['Hígado', 'Riñón', 'Páncreas', 'Bazo'], correctAnswer: 'Páncreas', category: 'science', difficulty: 'medium' },
  { id: 16, question: '¿Cuántos huesos tiene el cuerpo humano adulto?', options: ['196', '206', '216', '226'], correctAnswer: '206', category: 'science', difficulty: 'medium' },

  // HISTORY
  { id: 17, question: '¿En qué año el hombre llegó a la Luna?', options: ['1965', '1967', '1969', '1971'], correctAnswer: '1969', category: 'history', difficulty: 'easy' },
  { id: 18, question: '¿En qué año comenzó la Segunda Guerra Mundial?', options: ['1935', '1937', '1939', '1941'], correctAnswer: '1939', category: 'history', difficulty: 'easy' },
  { id: 19, question: '¿Dónde se originaron los Juegos Olímpicos?', options: ['Roma', 'Egipto', 'Grecia', 'Persia'], correctAnswer: 'Grecia', category: 'history', difficulty: 'easy' },
  { id: 20, question: '¿En qué año cayó el Muro de Berlín?', options: ['1987', '1988', '1989', '1990'], correctAnswer: '1989', category: 'history', difficulty: 'medium' },

  // ART
  { id: 21, question: '¿Quién pintó la Mona Lisa?', options: ['Miguel Ángel', 'Rafael', 'Donatello', 'Leonardo da Vinci'], correctAnswer: 'Leonardo da Vinci', category: 'art', difficulty: 'easy' },
  { id: 22, question: '¿Quién escribió "Cien años de soledad"?', options: ['Pablo Neruda', 'Julio Cortázar', 'Gabriel García Márquez', 'Mario Vargas Llosa'], correctAnswer: 'Gabriel García Márquez', category: 'art', difficulty: 'medium' },
  { id: 23, question: '¿Cuál es el libro más vendido de la historia?', options: ['El Quijote', 'La Biblia', 'Harry Potter', 'El Señor de los Anillos'], correctAnswer: 'La Biblia', category: 'art', difficulty: 'easy' },

  // MATH
  { id: 24, question: '¿Cuánto es la raíz cuadrada de 144?', options: ['10', '11', '12', '13'], correctAnswer: '12', category: 'math', difficulty: 'easy' },
  { id: 25, question: '¿Cuántos grados tiene un triángulo?', options: ['90°', '180°', '270°', '360°'], correctAnswer: '180°', category: 'math', difficulty: 'easy' },
  { id: 26, question: '¿Cuánto es Pi aproximadamente?', options: ['3.14', '3.16', '3.12', '3.18'], correctAnswer: '3.14', category: 'math', difficulty: 'easy' },

  // NATURE
  { id: 27, question: '¿Cuál es el animal más rápido del mundo?', options: ['Águila', 'Guepardo', 'Halcón peregrino', 'León'], correctAnswer: 'Halcón peregrino', category: 'nature', difficulty: 'hard' },
  { id: 28, question: '¿Cuántas patas tiene una araña?', options: ['6', '8', '10', '12'], correctAnswer: '8', category: 'nature', difficulty: 'easy' },
  { id: 29, question: '¿La ballena es un mamífero?', options: ['Sí', 'No', 'Depende', 'Solo algunas'], correctAnswer: 'Sí', category: 'nature', difficulty: 'easy' },

  // TECHNOLOGY
  { id: 30, question: '¿En qué año se fundó Apple?', options: ['1974', '1975', '1976', '1977'], correctAnswer: '1976', category: 'technology', difficulty: 'medium' },
];

export const AVATARS = ['🧠', '🦊', '🐉', '🚀', '⚡', '🎯', '🔮', '👾', '🦁', '🐺', '🦅', '💎'];

export const CATEGORY_LABELS: Record<string, string> = {
  geography: 'Geografía',
  science: 'Ciencia',
  history: 'Historia',
  art: 'Arte y Cultura',
  sports: 'Deportes',
  technology: 'Tecnología',
  nature: 'Naturaleza',
  math: 'Matemáticas',
};

export const CATEGORY_ICONS: Record<string, string> = {
  geography: '🌍',
  science: '🔬',
  history: '📜',
  art: '🎨',
  sports: '⚽',
  technology: '💻',
  nature: '🌿',
  math: '📐',
};

export function getRandomQuestions(count: number = 15): Question[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
