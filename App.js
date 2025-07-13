import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- ÍCONOS (LUCIDE-REACT) ---
const CheckCircleIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const SkipForwardIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 4 15 12 5 20 5 4" />
        <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
);
const ClipboardCopyIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
);
const Volume2Icon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
);
const VolumeXIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

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

// --- COMPONENTES DE LA UI ---

const LetterCircle = ({ letter, status, style, isCurrent }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'correct': return 'bg-green-500/80 border-green-300 shadow-green-400/60';
            case 'incorrect': return 'bg-red-500/80 border-red-400 shadow-red-500/60';
            case 'passed': return 'bg-blue-500/80 border-blue-400 shadow-blue-500/60';
            default: return 'bg-gray-600/80 border-gray-500 shadow-black/50';
        }
    };
    const currentClass = isCurrent ? 'is-current' : '';
    return <div className={`absolute w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white border-2 transition-all duration-500 shadow-lg ${getStatusColor()} ${currentClass}`} style={style}>{letter}</div>;
};

const RoscoWheel = ({ letters, currentLetterIndex }) => {
    const radius = window.innerWidth > 768 ? 170 : 130;
    return (
        <div className="relative w-full h-[360px] md:h-[400px] flex items-center justify-center">
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
        <div className="holographic-panel relative w-full max-w-2xl p-6">
            {!isMyTurn && <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl z-20"><p className="text-2xl font-bold text-yellow-400 animate-pulse">Esperando al otro jugador...</p></div>}
            <div className="flex items-center justify-center mb-4">
                <p className="text-lg md:text-xl text-gray-200 font-light text-center flex-grow">{question}</p>
                <button onClick={onToggleMute} className="ml-4 text-gray-400 hover:text-cyan-300 transition-colors flex-shrink-0">{isMuted ? <VolumeXIcon className="w-7 h-7" /> : <Volume2Icon className="w-7 h-7" />}</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input id="answer-input" name="answer" type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escribe tu respuesta..." className="holographic-input flex-grow" autoFocus disabled={!isMyTurn} />
                <div className="flex gap-3">
                    <button type="submit" disabled={!isMyTurn} className="holographic-button w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"><CheckCircleIcon className="w-6 h-6" /><span>Enviar</span></button>
                    <button type="button" onClick={onPass} disabled={!isMyTurn} className="holographic-button w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"><SkipForwardIcon className="w-6 h-6" /><span>Pasapalabra</span></button>
                </div>
            </form>
        </div>
    );
};

const GameUI = ({ letters, timeLeft, score, currentLetterIndex, question, onAnswer, onPass, answer, setAnswer, onToggleMute, isMuted, playerScores, isMyTurn }) => (
    <div className="w-full flex flex-col items-center justify-between h-full py-6 px-4">
        <div className="holographic-panel w-full max-w-4xl p-3 flex justify-between items-center">
            {playerScores ? (
                <>
                    <div className="text-center px-4"><p className="font-bold text-blue-400 text-lg">Jugador 1</p><p className="text-3xl font-bold">{playerScores.player1}</p></div>
                    <div className="text-center border-x-2 border-cyan-400/20 px-4"><p className="font-bold text-white text-lg">Tiempo</p><p className="text-3xl font-bold text-yellow-400">{Math.floor(timeLeft/60)}:{('0' + timeLeft % 60).slice(-2)}</p></div>
                    <div className="text-center px-4"><p className="font-bold text-green-400 text-lg">Jugador 2</p><p className="text-3xl font-bold">{playerScores.player2}</p></div>
                </>
            ) : (
                <>
                    <div className="text-center px-4"><p className="font-bold text-green-400 text-lg">Aciertos</p><p className="text-3xl font-bold">{score}</p></div>
                    <div className="text-center border-x-2 border-cyan-400/20 px-4"><p className="font-bold text-white text-lg">Tiempo</p><p className="text-3xl font-bold text-yellow-400">{Math.floor(timeLeft/60)}:{('0' + timeLeft % 60).slice(-2)}</p></div>
                    <div className="text-center px-4"><p className="font-bold text-gray-400 text-lg">Letra</p><p className="text-3xl font-bold">{letters[currentLetterIndex]?.letter}</p></div>
                </>
            )}
        </div>
        <RoscoWheel letters={letters} currentLetterIndex={currentLetterIndex} />
        <div className="w-full flex flex-col items-center gap-4">
            <QuestionPanel question={question} onAnswer={onAnswer} onPass={onPass} answer={answer} setAnswer={setAnswer} onToggleMute={onToggleMute} isMuted={isMuted} isMyTurn={isMyTurn} />
            {playerScores && <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg"><h2 className="text-md font-bold text-gray-300">ID Partida: <span className="text-yellow-400">{playerScores.gameId}</span></h2><button onClick={playerScores.onCopy} className="text-gray-300 hover:text-cyan-300"><ClipboardCopyIcon className="w-5 h-5"/></button></div>}
        </div>
    </div>
);

// --- COMPONENTES DE LÓGICA Y ESTADO ---

const SinglePlayerGame = ({ initialLetters, onGameEnd }) => {
    const [letters, setLetters] = useState(initialLetters);
    const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
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
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            setAnswer('');
            setFeedback('');
            let nextIndex = findNextQuestion(currentLetterIndex, updatedLetters);
            if (nextIndex === -1) nextIndex = updatedLetters.findIndex(l => l.status === 'passed');
            if (nextIndex !== -1) setCurrentLetterIndex(nextIndex);
            else onGameEnd(updatedLetters.filter(l => l.status === 'correct').length);
        }, 1000);
    };

    return (
        <>
            <div className={`feedback-overlay ${feedback}`}></div>
            <GameUI
                letters={letters} timeLeft={timeLeft} score={letters.filter(l => l.status === 'correct').length}
                currentLetterIndex={currentLetterIndex} question={letters[currentLetterIndex]?.question}
                onAnswer={() => { const isCorrect = answer.toLowerCase().trim() === letters[currentLetterIndex].answer.toLowerCase().trim(); handleAnswerOrPass(isCorrect, false); }}
                onPass={() => handleAnswerOrPass(false, true)} answer={answer} setAnswer={setAnswer}
                onToggleMute={() => setIsMuted(!isMuted)} isMuted={isMuted}
            />
        </>
    );
};

const MultiplayerGame = ({ gameId, userId, onGoHome }) => {
    const [gameData, setGameData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
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
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        const nextIndex = findNextQuestion(currentLetterIndex, letters);
        if (nextIndex !== -1) currentData.currentLetterIndex = nextIndex;
        else {
            const firstPassed = letters.findIndex(l => l.status === 'passed');
            if (firstPassed !== -1) currentData.currentLetterIndex = firstPassed;
            else currentData.status = 'finished';
        }
        currentData.currentPlayer = playerNumber === 1 ? 2 : 1;

        await updateDoc(gameRef, { letters: currentData.letters, currentLetterIndex: currentData.currentLetterIndex, currentPlayer: currentData.currentPlayer, status: currentData.status });
        setTimeout(() => { setAnswer(''); setFeedback(''); }, 1000);
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

    if (!gameData) return <div className="text-white text-2xl">Cargando partida...</div>;
    if (gameData.status === 'finished') return <GameSummaryMultiplayer gameData={gameData} onGoHome={onGoHome} />;

    const playerNumber = gameData.players.player1 === userId ? 1 : 2;
    const isMyTurn = gameData.currentPlayer === playerNumber;
    const player1Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 1).length;
    const player2Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 2).length;

    if (!gameData.players.player2) {
        return (
            <div className="holographic-panel text-center p-8">
                <h2 className="text-3xl font-bold text-cyan-300 mb-4">¡Partida Creada!</h2>
                <p className="text-xl text-gray-300 mb-6">Comparte este ID con otro jugador:</p>
                <div className="flex items-center justify-center gap-4 p-4 bg-black/50 rounded-lg">
                    <span className="text-4xl font-bold tracking-widest text-white">{gameId}</span>
                    <button onClick={copyToClipboard} className="text-gray-300 hover:text-cyan-300"><ClipboardCopyIcon className="w-8 h-8"/></button>
                </div>
                <p className="mt-8 text-lg animate-pulse">Esperando al Jugador 2...</p>
            </div>
        )
    }

    return (
        <>
            <div className={`feedback-overlay ${feedback}`}></div>
            <GameUI
                letters={gameData.letters} timeLeft={timeLeft} currentLetterIndex={gameData.currentLetterIndex}
                question={gameData.letters[gameData.currentLetterIndex]?.question}
                onAnswer={() => { const isCorrect = answer.toLowerCase().trim() === gameData.letters[gameData.currentLetterIndex].answer.toLowerCase().trim(); handleAnswerOrPass(isCorrect, false); }}
                onPass={() => handleAnswerOrPass(false, true)} answer={answer} setAnswer={setAnswer}
                onToggleMute={() => setIsMuted(!isMuted)} isMuted={isMuted}
                playerScores={{ player1: player1Score, player2: player2Score, gameId, onCopy: copyToClipboard }}
                isMyTurn={isMyTurn}
            />
        </>
    );
};

const GameSummarySinglePlayer = ({ score, onRestart }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="holographic-panel p-8 text-center">
            <h2 className="text-4xl font-bold text-cyan-300 mb-6">¡Juego Terminado!</h2>
            <div className="space-y-4 text-lg">
                <div className="p-3 bg-green-500/20 rounded-lg">
                    <span className="font-semibold text-xl">Puntuación Final:</span>
                    <span className="font-bold text-3xl text-green-400 block mt-2">{score} Aciertos</span>
                </div>
            </div>
            <div className="mt-8">
                <button onClick={onRestart} className="holographic-button bg-purple-600 hover:bg-purple-700 w-full">Jugar de Nuevo</button>
            </div>
        </div>
    </div>
);

const GameSummaryMultiplayer = ({ gameData, onGoHome }) => {
    const player1Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 1).length;
    const player2Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 2).length;
    const winner = player1Score > player2Score ? 'Jugador 1' : player2Score > player1Score ? 'Jugador 2' : 'Empate';
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="holographic-panel p-8 text-center">
                <h2 className="text-4xl font-bold text-cyan-300 mb-6">¡Partida Terminada!</h2>
                {winner !== 'Empate' ? <h3 className="text-2xl text-center text-white mb-4">Ganador: <span className="text-green-400 font-bold">{winner}</span></h3> : <h3 className="text-2xl text-center text-white mb-4">¡Es un <span className="text-yellow-400 font-bold">Empate</span>!</h3>}
                <div className="space-y-4 text-lg">
                    <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg"><span className="font-semibold">Puntuación Jugador 1:</span><span className="font-bold text-2xl text-blue-400">{player1Score}</span></div>
                    <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg"><span className="font-semibold">Puntuación Jugador 2:</span><span className="font-bold text-2xl text-green-400">{player2Score}</span></div>
                </div>
                <div className="mt-8">
                    <button onClick={onGoHome} className="holographic-button bg-gray-600 hover:bg-gray-700 w-full">Volver al Inicio</button>
                </div>
            </div>
        </div>
    );
};

const ThemeSelector = ({ onThemeSelect, onBack }) => (
    <div className="holographic-panel p-8 text-center max-w-2xl w-full">
        <h2 className="text-4xl font-bold text-cyan-300 mb-6">Elige una Temática</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {themes.map(theme => (
                <button key={theme} onClick={() => onThemeSelect(theme)} className="holographic-button bg-cyan-800/50 hover:bg-cyan-700/70 text-lg">
                    {theme}
                </button>
            ))}
        </div>
        <button onClick={onBack} className="holographic-button bg-gray-600 hover:bg-gray-700 w-full mt-6">Volver</button>
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
                <div className="holographic-panel text-center p-8">
                    <h2 className="text-2xl text-red-400">{errorMessage}</h2>
                    <button onClick={() => { setErrorMessage(''); setPage('home'); }} className="holographic-button bg-gray-600 hover:bg-gray-700 w-full mt-4">Volver</button>
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
                    <div className="holographic-panel text-center p-8 z-10">
                        <h1 className="text-4xl font-bold text-cyan-300 mb-6">Modo Multijugador</h1>
                        <MultiplayerLobby onCreateGame={() => setPage('theme-selection-multi')} onJoinGame={handleJoinMultiplayerGame} userId={user.uid} />
                        <button onClick={handleGoHome} className="holographic-button bg-gray-600 hover:bg-gray-700 w-full mt-4">Volver</button>
                    </div>
                );
            case 'theme-selection-multi':
                return <ThemeSelector onThemeSelect={(theme) => handleSelectTheme(theme, 'multi')} onBack={() => setPage('multi-lobby')} />;
            case 'multi-playing':
                return <MultiplayerGame gameId={gameId} userId={user.uid} onGoHome={handleGoHome} />;
            case 'finished':
                return <GameSummarySinglePlayer score={finalScore} onRestart={handleGoHome} />;
            case 'generating':
                return <div className="holographic-panel text-center p-8"><h2 className="text-2xl text-cyan-300 animate-pulse">La IA está creando un rosco único para ti...</h2></div>;
            case 'home':
                return (
                    <div className="holographic-panel text-center p-8 z-10">
                        <h1 className="text-5xl font-bold text-cyan-300 mb-2 font-['Poppins'] tracking-wider">ROSCO 3D</h1>
                        <p className="text-gray-300 mb-8 text-lg">Elige tu modo de juego</p>
                        <div className="space-y-4">
                            <button onClick={() => setPage('theme-selection-single')} className="holographic-button w-full bg-purple-600 hover:bg-purple-700">Modo Un Jugador</button>
                            <button onClick={() => setPage('multi-lobby')} className="holographic-button w-full bg-cyan-600 hover:bg-cyan-700">Modo Multijugador</button>
                        </div>
                    </div>
                );
            case 'loading':
            default:
                return <div className="text-white text-2xl animate-pulse">Conectando...</div>;
        }
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center font-['Poppins'] text-white overflow-hidden bg-gray-900">
            <div className="z-10 w-full h-full flex items-center justify-center p-4">{renderPage()}</div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap');
                :root { --glow-cyan: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff; }
                .holographic-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 16px; box-shadow: 0 0 20px rgba(0, 255, 255, 0.1); }
                .holographic-button { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; transition: all 0.3s ease; border: 1px solid transparent; position: relative; overflow: hidden; }
                .holographic-button:before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(120deg, transparent, rgba(0, 255, 255, 0.4), transparent); transition: all 0.5s; }
                .holographic-button:hover:before { left: 100%; }
                .holographic-button:hover { box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); border-color: rgba(0, 255, 255, 0.4); }
                .holographic-input { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 8px; padding: 0.75rem 1rem; color: white; font-size: 1.125rem; transition: all 0.3s ease; }
                .holographic-input:focus { outline: none; border-color: rgba(0, 255, 255, 0.6); box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); }
                .is-current { transform: translate(-50%, -50%) scale(1.25) !important; box-shadow: 0 0 25px #0ff, 0 0 35px #0ff; z-index: 10; border-color: #0ff; animation: pulse-current 2s infinite; }
                @keyframes pulse-current { 50% { transform: translate(-50%, -50%) scale(1.3); box-shadow: 0 0 35px #0ff, 0 0 45px #0ff; } }
                .feedback-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999; pointer-events: none; opacity: 0; }
                .feedback-overlay.correct { animation: flash-green 0.8s ease-out; }
                .feedback-overlay.incorrect { animation: flash-red 0.8s ease-out; }
                @keyframes flash-green { 0% { opacity: 0; } 50% { opacity: 1; box-shadow: inset 0 0 100px 50px rgba(0, 255, 150, 0.4); } 100% { opacity: 0; } }
                @keyframes flash-red { 0% { opacity: 0; } 50% { opacity: 1; box-shadow: inset 0 0 100px 50px rgba(255, 0, 100, 0.4); } 100% { opacity: 0; } }
            `}</style>
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
        <div className="space-y-4 w-full max-w-sm">
            <button onClick={onCreateGame} className="holographic-button w-full bg-purple-600 hover:bg-purple-700">Crear Partida Online</button>
            <div className="flex items-center"><div className="flex-grow border-t border-cyan-400/30"></div><span className="mx-4 text-cyan-300/80">o</span><div className="flex-grow border-t border-cyan-400/30"></div></div>
            <div className="flex flex-col sm:flex-row gap-3">
                <input id="join-id-input" name="joinId" type="text" value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Ingresa ID de Partida" className="holographic-input flex-grow" />
                <button onClick={handleJoin} className="holographic-button w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700">Unirse</button>
            </div>
            {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
    );
};