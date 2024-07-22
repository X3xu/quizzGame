import { useState } from 'react'
import QuizGame from './QuizzGame'
import './App.css'

function App() {

  const [nombre, setNombre] = useState('');
  const [comenzado, setComenzado] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleComenzar = () => {
    if (nombre.trim() !== '') {
      setComenzado(true);
      setErrorMessage('');
    } else {
      setErrorMessage('Por favor, ingresa tu nombre para comenzar.');
    }
  };

  const onEnter = (event) => {
    if (event.key === 'Enter') {
      handleComenzar();
    } 
  }

  return (
    <>
     {/* Input para ingresar el nombre */}
          {!comenzado && (
        <div className="start-screen">
          <h1>¡Bienvenido a QuizzGame! </h1>
          <div className="container-input">
            <input
              placeholder='Ingrese su nombre: '
              type="text"
              id="nombre"
              value={nombre}
              onKeyDown={onEnter}
              onChange={(e) => setNombre(e.target.value)}
            />
            <button className="buttonStart" onClick={handleComenzar}>Comenzar</button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
        </div>
      )}

       {comenzado && (
          <div>
            <h1>¡Bienvenido, {nombre}!</h1>
            <QuizGame></QuizGame>
          </div>
      )}

    </>
  )
}

export default App
