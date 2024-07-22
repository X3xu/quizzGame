import { useState, useEffect } from 'react';
import './QuizzGame.css';

// Datos de las preguntas y respuestas
const questions = [
  { id: 1, question: '¿Cuál es la capital de Francia?', options: ['Roma', 'Londres', 'París', 'Madrid'], correctAnswer: 'París' },
  { id: 2, question: '¿Cuál es el resultado de 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4' },
  { id: 3, question: '¿Qué color se obtiene al mezclar azul y amarillo?', options: ['Verde', 'Morado', 'Rojo', 'Naranja'], correctAnswer: 'Verde' },
  { id: 4, question: '¿Cuál es el océano más grande del mundo?', options: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], correctAnswer: 'Pacífico' },
  { id: 5, question: '¿Qué animal es conocido como el "rey de la selva"?', options: ['Elefante', 'León', 'Tigre', 'Jirafa'], correctAnswer: 'León' },
  { id: 6, question: '¿Cuál es el planeta más cercano al Sol?', options: ['Venus', 'Marte', 'Mercurio', 'Júpiter'], correctAnswer: 'Mercurio' },
  { id: 7, question: '¿En qué continente se encuentra Egipto?', options: ['Europa', 'Asia', 'África', 'América'], correctAnswer: 'África' },
  { id: 8, question: '¿Qué instrumento se utiliza para medir la temperatura?', options: ['Barómetro', 'Higrómetro', 'Termómetro', 'Anemómetro'], correctAnswer: 'Termómetro' },
  { id: 9, question: '¿Cuál es el metal más ligero?', options: ['Hierro', 'Plomo', 'Oro', 'Litio'], correctAnswer: 'Litio' },
  { id: 10, question: '¿En qué año llegó el hombre a la Luna por primera vez?', options: ['1965', '1969', '1972', '1980'], correctAnswer: '1969' },
  { id: 11, question: '¿Quién pintó la Mona Lisa?', options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'], correctAnswer: 'Leonardo da Vinci' },
  { id: 12, question: '¿Cuál es el río más largo del mundo?', options: ['Amazonas', 'Nilo', 'Yangtsé', 'Misisipi'], correctAnswer: 'Nilo' },
  { id: 13, question: '¿Cuál es la fórmula química del agua?', options: ['H2O', 'CO2', 'O2', 'H2'], correctAnswer: 'H2O' },
  { id: 14, question: '¿Qué país tiene la mayor población del mundo?', options: ['India', 'Estados Unidos', 'Indonesia', 'China'], correctAnswer: 'China' },
  { id: 15, question: '¿Cuál es el número atómico del oxígeno?', options: ['6', '7', '8', '9'], correctAnswer: '8' },
  { id: 16, question: '¿Quién escribió "Cien años de soledad"?', options: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Jorge Luis Borges'], correctAnswer: 'Gabriel García Márquez' },
  { id: 17, question: '¿Cuál es la capital de Australia?', options: ['Sídney', 'Melbourne', 'Brisbane', 'Canberra'], correctAnswer: 'Canberra' },
  { id: 18, question: '¿En qué país se originaron los Juegos Olímpicos?', options: ['Italia', 'Grecia', 'Egipto', 'Japón'], correctAnswer: 'Grecia' },
  { id: 19, question: '¿Cuál es el gas más abundante en la atmósfera terrestre?', options: ['Oxígeno', 'Hidrógeno', 'Dióxido de carbono', 'Nitrógeno'], correctAnswer: 'Nitrógeno' },
  { id: 20, question: '¿Qué tipo de animal es la ballena?', options: ['Pez', 'Anfibio', 'Reptil', 'Mamífero'], correctAnswer: 'Mamífero' },
  { id: 21, question: '¿Cuál es el idioma oficial de Brasil?', options: ['Español', 'Inglés', 'Francés', 'Portugués'], correctAnswer: 'Portugués' },
  { id: 22, question: '¿Cuál es el libro más vendido del mundo?', options: ['El Quijote', 'La Biblia', 'Harry Potter', 'El Principito'], correctAnswer: 'La Biblia' },
  { id: 23, question: '¿Qué órgano del cuerpo humano produce insulina?', options: ['Hígado', 'Páncreas', 'Riñón', 'Corazón'], correctAnswer: 'Páncreas' },
  { id: 24, question: '¿Qué teoría formuló Albert Einstein?', options: ['Teoría de la Evolución', 'Teoría de la Relatividad', 'Teoría del Big Bang', 'Teoría Cuántica'], correctAnswer: 'Teoría de la Relatividad' },
  { id: 25, question: '¿En qué año comenzó la Segunda Guerra Mundial?', options: ['1937', '1938', '1939', '1941'], correctAnswer: '1939' }
];

const QuizGame = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    const scoreGuardado = localStorage.getItem('score');
    if (scoreGuardado) {
      setScore(parseInt(scoreGuardado));
    }
  }, []);

  useEffect(() => {
   localStorage.setItem('score', score);
  }, [score]);

  const handleIncrementarScore = () => {
    setScore((prevScore) => prevScore + 1);
  };

  const handleAnswerClick = (selectedAnswer) => {
    setSelectedAnswer(selectedAnswer);
    setAnswerStatus(null);
    // Verificar si la respuesta es correcta
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      // Incrementar el puntaje si la respuesta es correcta
      if(!score > 5){
        setScore(score + 1);  
      }
      handleIncrementarScore();
      setAnswerStatus('correct');
    } else {
      setAnswerStatus('incorrect');
    }

    // Pasar a la siguiente pregunta después de un breve retraso
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setAnswerStatus(null);
      } else {
        // Mostrar el puntaje final si no hay más preguntas
        setShowScore(true);
      }
    }, 1000); // Espera 1 segundo antes de pasar a la siguiente pregunta
  };

  return (
    <div className="quiz-container">
      {showScore ? (
        <div className="score-section">
          <h2>Tu puntación: {score} de {questions.length}</h2>
        </div>
      ) : (
        <>
          <div className="question-section">
            <div className="question-count">
              <span>Pregunta {currentQuestion + 1}</span>/{questions.length}
            </div>
            <div className="question-text">{questions[currentQuestion].question}</div>
          </div>
          <div className="answer-section">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerClick(option)}
                className={selectedAnswer === option ? answerStatus : ''}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default QuizGame;
