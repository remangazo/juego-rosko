import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- ÍCONOS (Simplificados para diagnóstico) ---
const CheckCircleIcon = () => <span>[✓]</span>;
const SkipForwardIcon = () => <span>{'[>>]'}</span>;
const ClipboardCopyIcon = () => <span>[Copiar]</span>;
const Volume2Icon = () => <span>[Vol]</span>;
const VolumeXIcon = () => <span>[Mute]</span>;


// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBWdo0D6nDOmAA-GWahXbPu0SYTOGwI4As",
  authDomain: "rosko-151a2.firebaseapp.com",
  projectId: "rosko-151a2",
  storageBucket: "rosko-151a2.appspot.com",
  messagingSenderId: "859017847050",
  appId: "1:859017847050:web:2b9fb2f86039823c085af3",
  measurementId: "G-LPXB4D3RG1"
};

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATOS DE PREGUNTAS ---
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const themes = ['Cultura General', 'Cine y Series', 'Historia', 'Ciencia', 'Geografía', 'Deportes', 'Música'];

// --- COMPONENTES DE LA UI (SIN ESTILOS) ---

const LetterCircle = ({ letter, status, style, isCurrent }) => {
    const statusColor = {
        correct: 'green',
        incorrect: 'red',
        passed: 'blue',
        unanswered: 'grey'
    };
    return (
        <div style={{...style, position: 'absolute', border: `2px solid ${statusColor[status]}`, padding: '10px', borderRadius: '50%', fontWeight: isCurrent ? 'bold' : 'normal' }}>
            {letter}
        </div>
    );
};

const RoscoWheel = ({ letters, currentLetterIndex }) => {
    const radius = 150;
    return (
        <div style={{ position: 'relative', width: '350px', height: '350px', border: '1px solid white', margin: '20px' }}>
            {letters.map((item, index) => {
                const angle = (index / letters.length) * 2 * Math.PI - Math.PI / 2;
                const x = `calc(50% + ${radius * Math.cos(angle)}px)`;
                const y = `calc(50% + ${radius * Math.sin(angle)}px)`;
                return <LetterCircle key={item.letter} letter={item.letter} status={item.status} isCurrent={index === currentLetterIndex} style={{ top: y, left: x, transform: 'translate(-50%, -50%)' }} />;
            })}
        </div>
    );
};

const QuestionPanel = ({ question, onAnswer, onPass, answer, setAnswer, isMyTurn = true, onToggleMute, isMuted }) => {
    const handleSubmit = (e) => { e.preventDefault(); onAnswer(); };
    return (
        <div style={{ border: '1px solid white', padding: '20px', margin: '10px', maxWidth: '600px', width: '100%' }}>
            {!isMyTurn && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20 }}><p>Esperando al otro jugador...</p></div>}
            <div>
                <p>{question}</p>
                <button onClick={onToggleMute}>{isMuted ? <VolumeXIcon /> : <Volume2Icon />}</button>
            </div>
            <form onSubmit={handleSubmit}>
                <input id="answer-input" name="answer" type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escribe tu respuesta..." disabled={!isMyTurn} />
                <button type="submit" disabled={!isMyTurn}><CheckCircleIcon /> Enviar</button>
                <button type="button" onClick={onPass} disabled={!isMyTurn}><SkipForwardIcon /> Pasapalabra</button>
            </form>
        </div>
    );
};

const GameUI = ({ letters, timeLeft, score, currentLetterIndex, question, onAnswer, onPass, answer, setAnswer, onToggleMute, isMuted, playerScores, isMyTurn }) => (
    <div>
        <div>
            {playerScores ? (
                <>
                    <div><p>Jugador 1</p><p>{playerScores.player1}</p></div>
                    <div><p>Tiempo</p><p>{Math.floor(timeLeft/60)}:{('0' + timeLeft % 60).slice(-2)}</p></div>
                    <div><p>Jugador 2</p><p>{playerScores.player2}</p></div>
                </>
            ) : (
                <>
                    <div><p>Aciertos</p><p>{score}</p></div>
                    <div><p>Tiempo</p><p>{Math.floor(timeLeft/60)}:{('0' + timeLeft % 60).slice(-2)}</p></div>
                    <div><p>Letra</p><p>{letters[currentLetterIndex]?.letter}</p></div>
                </>
            )}
        </div>
        <RoscoWheel letters={letters} currentLetterIndex={currentLetterIndex} />
        <div>
            <QuestionPanel question={question} onAnswer={onAnswer} onPass={onPass} answer={answer} setAnswer={setAnswer} onToggleMute={onToggleMute} isMuted={isMuted} isMyTurn={isMyTurn} />
            {playerScores && <div><h2>ID Partida: <span>{playerScores.gameId}</span></h2><button onClick={playerScores.onCopy}><ClipboardCopyIcon /></button></div>}
        </div>
    </div>
);

// --- COMPONENTES DE LÓGICA Y ESTADO ---

const SinglePlayerGame = ({ initialLetters, onGameEnd }) => {
    const [letters, setLetters] = useState(initialLetters);
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(240);
    const [isMuted, setIsMuted] = useState(false);
    
    const speak = useCallback((text) => {
        if (isMuted || !('speechSynthesis' in window) || !text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name === 'Google español de Argentina') || voices.find(v => v.name === 'Google español') || voices.find(v => v.lang === 'es-AR') || voices.find(v => v.name === 'Microsoft Helena - Spanish (Spain)') || voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es-'));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = 'es-AR';
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onGameEnd(letters.filter(l => l.status === 'correct').length);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onGameEnd, letters]);

    useEffect(() => {
        if (letters.length > 0) {
            const currentQuestion = letters[currentLetterIndex].question;
            setTimeout(() => speak(currentQuestion), 300);
        }
    }, [currentLetterIndex, letters, speak]);

    const findNextQuestion = (startIndex, currentLetters) => {
        let nextIndex = (startIndex + 1) % currentLetters.length;
        for (let i = 0; i < currentLetters.length; i++) {
            if (currentLetters[nextIndex].status === 'unanswered' || currentLetters[nextIndex].status === 'passed') return nextIndex;
            nextIndex = (nextIndex + 1) % currentLetters.length;
        }
        return -1;
    };

    const handleAnswerOrPass = (isCorrect, isPass) => {
        const updatedLetters = [...letters];
        updatedLetters[currentLetterIndex].status = isPass ? 'passed' : (isCorrect ? 'correct' : 'incorrect');
        setLetters(updatedLetters);

        setTimeout(() => {
            setAnswer('');
            let nextIndex = findNextQuestion(currentLetterIndex, updatedLetters);
            if (nextIndex === -1) nextIndex = updatedLetters.findIndex(l => l.status === 'passed');
            if (nextIndex !== -1) setCurrentLetterIndex(nextIndex);
            else onGameEnd(updatedLetters.filter(l => l.status === 'correct').length);
        }, 1000);
    };

    return (
        <GameUI
            letters={letters} timeLeft={timeLeft} score={letters.filter(l => l.status === 'correct').length}
            currentLetterIndex={currentLetterIndex} question={letters[currentLetterIndex]?.question}
            onAnswer={() => { const isCorrect = answer.toLowerCase().trim() === letters[currentLetterIndex].answer.toLowerCase().trim(); handleAnswerOrPass(isCorrect, false); }}
            onPass={() => handleAnswerOrPass(false, true)} answer={answer} setAnswer={setAnswer}
            onToggleMute={() => setIsMuted(!isMuted)} isMuted={isMuted}
        />
    );
};

const MultiplayerGame = ({ gameId, userId, onGoHome }) => {
    const [gameData, setGameData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(240);
    const [isMuted, setIsMuted] = useState(false);

    const speak = useCallback((text) => {
        if (isMuted || !('speechSynthesis' in window) || !text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name === 'Google español de Argentina') || voices.find(v => v.name === 'Google español') || voices.find(v => v.lang === 'es-AR') || voices.find(v => v.name === 'Microsoft Helena - Spanish (Spain)') || voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es-'));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = 'es-AR';
        utterance.rate = 0.9;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }, [isMuted]);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "games", gameId), (doc) => {
            const data = doc.data();
            if (data) {
                setGameData(data);
                if (data.status === 'playing') {
                    const timeNow = Date.now();
                    const timeRemaining = Math.round((data.finishTime - timeNow) / 1000);
                    setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);
                }
            }
        });
        return () => unsub();
    }, [gameId]);

    useEffect(() => {
        if (gameData?.status === 'playing' && gameData.players[`player${gameData.currentPlayer}`] === userId && gameData.letters.length > 0) {
            const currentQuestion = gameData.letters[gameData.currentLetterIndex].question;
            setTimeout(() => speak(currentQuestion), 300);
        }
    }, [gameData?.currentLetterIndex, gameData?.currentPlayer, userId, gameData?.letters, speak]);
    
    const findNextQuestion = (startIndex, letters) => {
        let nextIndex = (startIndex + 1) % letters.length;
        for (let i = 0; i < letters.length; i++) {
            if (letters[nextIndex].status === 'unanswered' || letters[nextIndex].status === 'passed') return nextIndex;
            nextIndex = (nextIndex + 1) % letters.length;
        }
        return -1;
    };

    const handleAnswerOrPass = async (isCorrect, isPass) => {
        const gameRef = doc(db, "games", gameId);
        const currentData = { ...gameData };
        const { currentLetterIndex, letters } = currentData;
        const playerNumber = currentData.players.player1 === userId ? 1 : 2;

        if (isPass) letters[currentLetterIndex].status = 'passed';
        else {
            letters[currentLetterIndex].status = isCorrect ? 'correct' : 'incorrect';
            letters[currentLetterIndex].player = playerNumber;
        }

        const nextIndex = findNextQuestion(currentLetterIndex, letters);
        if (nextIndex !== -1) currentData.currentLetterIndex = nextIndex;
        else {
            const firstPassed = letters.findIndex(l => l.status === 'passed');
            if (firstPassed !== -1) currentData.currentLetterIndex = firstPassed;
            else currentData.status = 'finished';
        }
        currentData.currentPlayer = playerNumber === 1 ? 2 : 1;

        await updateDoc(gameRef, { letters: currentData.letters, currentLetterIndex: currentData.currentLetterIndex, currentPlayer: currentData.currentPlayer, status: currentData.status });
        setTimeout(() => { setAnswer(''); }, 1000);
    };

    const copyToClipboard = () => {
        const tempInput = document.createElement('input');
        tempInput.value = gameId;
        document.body.appendChild(tempInput);
        tempInput.select();
        try { document.execCommand('copy'); alert(`ID de partida "${gameId}" copiado.`); }
        catch (err) { alert('No se pudo copiar el ID.'); }
        document.body.removeChild(tempInput);
    };

    if (!gameData) return <div>Cargando partida...</div>;
    if (gameData.status === 'finished') return <GameSummaryMultiplayer gameData={gameData} onGoHome={onGoHome} />;

    const playerNumber = gameData.players.player1 === userId ? 1 : 2;
    const isMyTurn = gameData.currentPlayer === playerNumber;
    const player1Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 1).length;
    const player2Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 2).length;

    if (!gameData.players.player2) {
        return (
            <div style={{ border: '1px solid white', padding: '20px' }}>
                <h2>¡Partida Creada!</h2>
                <p>Comparte este ID con otro jugador:</p>
                <div>
                    <span>{gameId}</span>
                    <button onClick={copyToClipboard}><ClipboardCopyIcon /></button>
                </div>
                <p>Esperando al Jugador 2...</p>
            </div>
        )
    }

    return (
        <GameUI
            letters={gameData.letters} timeLeft={timeLeft} currentLetterIndex={gameData.currentLetterIndex}
            question={gameData.letters[gameData.currentLetterIndex]?.question}
            onAnswer={() => { const isCorrect = answer.toLowerCase().trim() === gameData.letters[gameData.currentLetterIndex].answer.toLowerCase().trim(); handleAnswerOrPass(isCorrect, false); }}
            onPass={() => handleAnswerOrPass(false, true)} answer={answer} setAnswer={setAnswer}
            onToggleMute={() => setIsMuted(!isMuted)} isMuted={isMuted}
            playerScores={{ player1: player1Score, player2: player2Score, gameId, onCopy: copyToClipboard }}
            isMyTurn={isMyTurn}
        />
    );
};

const GameSummarySinglePlayer = ({ score, onRestart }) => (
    <div style={{ border: '1px solid white', padding: '20px' }}>
        <h2>¡Juego Terminado!</h2>
        <div>
            <p>Puntuación Final:</p>
            <p>{score} Aciertos</p>
        </div>
        <button onClick={onRestart}>Jugar de Nuevo</button>
    </div>
);

const GameSummaryMultiplayer = ({ gameData, onGoHome }) => {
    const player1Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 1).length;
    const player2Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 2).length;
    const winner = player1Score > player2Score ? 'Jugador 1' : player2Score > player1Score ? 'Jugador 2' : 'Empate';
    return (
        <div style={{ border: '1px solid white', padding: '20px' }}>
            <h2>¡Partida Terminada!</h2>
            <h3>{winner !== 'Empate' ? `Ganador: ${winner}` : '¡Es un Empate!'}</h3>
            <div>
                <p>Puntuación Jugador 1: {player1Score}</p>
                <p>Puntuación Jugador 2: {player2Score}</p>
            </div>
            <button onClick={onGoHome}>Volver al Inicio</button>
        </div>
    );
};

const ThemeSelector = ({ onThemeSelect, onBack }) => (
    <div style={{ border: '1px solid white', padding: '20px' }}>
        <h2>Elige una Temática</h2>
        <div>
            {themes.map(theme => (
                <button key={theme} onClick={() => onThemeSelect(theme)}>
                    {theme}
                </button>
            ))}
        </div>
        <button onClick={onBack}>Volver</button>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function App() {
    const [page, setPage] = useState('loading');
    const [user, setUser] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [finalScore, setFinalScore] = useState(0);
    const [initialLetters, setInitialLetters] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        onAuthStateChanged(auth, currentUser => {
            if (currentUser) {
                setUser(currentUser);
                setPage('home');
            } else {
                signInAnonymously(auth).catch(error => console.error("Error en login anónimo", error));
            }
        });
    }, []);

    const generateQuestionsWithAI = async (theme) => {
        setPage('generating');
        const prompt = `Genera un conjunto de 27 preguntas y respuestas para un juego de rosco en español, una para cada letra del abecedario (A-Z, incluyendo Ñ). La temática es "${theme}". Regla CRÍTICA: Para cada letra, la respuesta DEBE empezar con esa letra, o si no es posible, contenerla. La pregunta debe reflejar esto, empezando con "CON LA X. " (si la respuesta empieza con X) o "CONTIENE LA X. " (si la respuesta contiene X). La respuesta debe ser una sola palabra o un nombre propio corto. Devuelve el resultado como un array de objetos JSON.`;
        
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            letter: { type: "STRING" },
                            question: { type: "STRING" },
                            answer: { type: "STRING" },
                        },
                        required: ["letter", "question", "answer"]
                    }
                }
            }
        };

        try {
            const apiKey = ""; // Dejar vacío, el entorno lo proveerá
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Error de la API: ${response.statusText}`);
            }

            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;
            const generatedQuestions = JSON.parse(text);

            const questionMap = generatedQuestions.reduce((acc, q) => {
                acc[q.letter.toUpperCase()] = { question: q.question, answer: q.answer };
                return acc;
            }, {});

            return ALPHABET.map(char => ({
                letter: char,
                status: 'unanswered',
                question: questionMap[char]?.question || `Pregunta para la ${char}...`,
                answer: questionMap[char]?.answer || `respuesta`
            }));
        } catch (error) {
            console.error("Error generando preguntas con IA:", error);
            setErrorMessage("No se pudieron generar las preguntas. Intenta de nuevo.");
            setPage('home');
            return null;
        }
    };

    const handleSelectTheme = async (theme, mode) => {
        const letters = await generateQuestionsWithAI(theme);
        if (letters) {
            if (mode === 'single') {
                setInitialLetters(letters);
                setPage('single-player');
            } else if (mode === 'multi') {
                await handleCreateMultiplayerGame(theme, letters);
            }
        }
    };

    const handleCreateMultiplayerGame = async (theme, letters) => {
        const newGameId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const finishTime = Date.now() + 240 * 1000;
        const newGameData = { id: newGameId, theme, letters, currentLetterIndex: 0, currentPlayer: 1, status: 'playing', players: { player1: user.uid, player2: null }, finishTime };
        await setDoc(doc(db, "games", newGameId), newGameData);
        setGameId(newGameId);
        setPage('multi-playing');
    };
    
    const handleJoinMultiplayerGame = (id) => { setGameId(id); setPage('multi-playing'); };
    const handleGameEnd = (score) => { setFinalScore(score); setPage('finished'); };
    const handleGoHome = () => { setGameId(null); setPage('home'); };

    const renderPage = () => {
        if (errorMessage) {
            return (
                <div style={{ border: '1px solid white', padding: '20px', color: 'red' }}>
                    <h2>{errorMessage}</h2>
                    <button onClick={() => { setErrorMessage(''); setPage('home'); }}>Volver</button>
                </div>
            );
        }

        switch (page) {
            case 'single-player':
                return <SinglePlayerGame initialLetters={initialLetters} onGameEnd={handleGameEnd} />;
            case 'theme-selection-single':
                return <ThemeSelector onThemeSelect={(theme) => handleSelectTheme(theme, 'single')} onBack={handleGoHome} />;
            case 'multi-lobby':
                return (
                    <div style={{ border: '1px solid white', padding: '20px' }}>
                        <h1>Modo Multijugador</h1>
                        <MultiplayerLobby onCreateGame={() => setPage('theme-selection-multi')} onJoinGame={handleJoinMultiplayerGame} userId={user.uid} />
                        <button onClick={handleGoHome}>Volver</button>
                    </div>
                );
            case 'theme-selection-multi':
                return <ThemeSelector onThemeSelect={(theme) => handleSelectTheme(theme, 'multi')} onBack={() => setPage('multi-lobby')} />;
            case 'multi-playing':
                return <MultiplayerGame gameId={gameId} userId={user.uid} onGoHome={handleGoHome} />;
            case 'finished':
                return <GameSummarySinglePlayer score={finalScore} onRestart={handleGoHome} />;
            case 'generating':
                return <div><h2 style={{color: 'cyan'}}>La IA está creando un rosco único para ti...</h2></div>;
            case 'home':
                return (
                    <div style={{ border: '1px solid white', padding: '20px', textAlign: 'center' }}>
                        <h1>ROSCO 3D</h1>
                        <p>Elige tu modo de juego</p>
                        <div>
                            <button onClick={() => setPage('theme-selection-single')}>Modo Un Jugador</button>
                            <button onClick={() => setPage('multi-lobby')}>Modo Multijugador</button>
                        </div>
                    </div>
                );
            case 'loading':
            default:
                return <div>Conectando...</div>;
        }
    };

    return (
        <main style={{ backgroundColor: 'white', color: 'black' }}>
            <div style={{ border: '2px solid red', padding: '10px' }}>
                {renderPage()}
            </div>
        </main>
    );
}

const MultiplayerLobby = ({ onCreateGame, onJoinGame, userId }) => {
    const [joinId, setJoinId] = useState('');
    const [error, setError] = useState('');

    const handleJoin = async () => {
        if (joinId.trim()) {
            const gameRef = doc(db, "games", joinId.trim().toUpperCase());
            const gameSnap = await getDoc(gameRef);
            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                if (gameData.players.player2 && gameData.players.player2 !== userId) {
                    setError('Esta partida ya está llena.');
                } else {
                    if(!gameData.players.player2) {
                        await updateDoc(gameRef, { 'players.player2': userId });
                    }
                    onJoinGame(joinId.trim().toUpperCase());
                }
            } else {
                setError('No se encontró ninguna partida con ese ID.');
            }
        }
    };

    return (
        <div>
            <button onClick={onCreateGame}>Crear Partida Online</button>
            <p>o</p>
            <div>
                <input id="join-id-input" name="joinId" type="text" value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Ingresa ID de Partida" />
                <button onClick={handleJoin}>Unirse</button>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};