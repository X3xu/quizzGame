import { useState } from 'react';
import './QuizzGame.css';

// Datos de las preguntas y respuestas
const questions = [
  { id: 1, question: '¿Cuál es la capital de Francia?', options: ['Roma', 'Londres', 'París', 'Madrid'], correctAnswer: 'París' },
  { id: 2, question: '¿Cuál es el resultado de 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4' },
  { id: 3, question: '¿Qué color se obtiene al mezclar azul y amarillo?', options: ['Verde', 'Morado', 'Rojo', 'Naranja'], correctAnswer: 'Verde' },

];

const QuizGame = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [answerStatus, setAnswerStatus] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

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
