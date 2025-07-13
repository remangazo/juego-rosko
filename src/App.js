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
const SpeakerIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);

// --- CONFIGURACIÓN DE FIREBASE ---
// Tu configuración personal de Firebase ha sido insertada aquí.
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


// --- DATOS DE PREGUNTAS LOCALES ---
const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const initialQuestions = {
    'A': { question: "CON LA A. Mamífero carnívoro doméstico de la familia de los félidos.", answer: "gato" },
    'B': { question: "CON LA B. Vehículo de dos ruedas.", answer: "bicicleta" },
    'C': { question: "CON LA C. Vivienda.", answer: "casa" },
    'D': { question: "CON LA D. Mejor amigo del hombre.", answer: "perro" },
    'E': { question: "CON LA E. Mamífero con trompa.", answer: "elefante" },
    'F': { question: "CON LA F. Fruto del naranjo.", answer: "naranja" },
    'G': { question: "CON LA G. Felino doméstico.", answer: "gato" },
    'H': { question: "CON LA H. Utensilio para comer con dientes.", answer: "tenedor" },
    'I': { question: "CON LA I. Territorio rodeado de agua.", answer: "isla" },
    'J': { question: "CON LA J. Juguete que gira.", answer: "peonza" },
    'K': { question: "CON LA K. Fruta verde con piel marrón.", answer: "kiwi" },
    'L': { question: "CON LA L. Astro rey.", answer: "sol" },
    'M': { question: "CON LA M. Fruto del manzano.", answer: "manzana" },
    'N': { question: "CON LA N. Órgano del olfato.", answer: "nariz" },
    'Ñ': { question: "CON LA Ñ. Mamífero de cuello largo.", answer: "jirafa" },
    'O': { question: "CON LA O. Mamífero plantígrado.", answer: "oso" },
    'P': { question: "CON LA P. Ave que no vuela.", answer: "pingüino" },
    'Q': { question: "CON LA Q. Derivado de la leche.", answer: "queso" },
    'R': { question: "CON LA R. Roedor de cola larga.", answer: "ratón" },
    'S': { question: "CON LA S. Reptil sin patas.", answer: "serpiente" },
    'T': { question: "CON LA T. Vehículo de cuatro ruedas.", answer: "coche" },
    'U': { question: "CON LA U. Fruto de la vid.", answer: "uva" },
    'V': { question: "CON LA V. Recipiente para beber.", answer: "vaso" },
    'W': { question: "CON LA W. Deporte acuático con tabla y vela.", answer: "windsurf" },
    'X': { question: "CON LA X. Instrumento musical de percusión.", answer: "xilófono" },
    'Y': { question: "CON LA Y. Embarcación de recreo.", answer: "yate" },
    'Z': { question: "CON LA Z. Calzado.", answer: "zapato" },
};

// --- COMPONENTES DE LA UI ---

const HomeScreen = ({ onJoinGame, onCreateGame, userId }) => {
    const [joinId, setJoinId] = useState('');
    const [error, setError] = useState('');

    const handleJoin = async () => {
        if (joinId.trim()) {
            const gameRef = doc(db, "games", joinId.trim().toUpperCase());
            const gameSnap = await getDoc(gameRef);

            if (gameSnap.exists()) {
                const gameData = gameSnap.data();
                if (gameData.players.player2) {
                    setError('Esta partida ya está llena.');
                } else {
                    await updateDoc(gameRef, { 'players.player2': userId });
                    onJoinGame(joinId.trim().toUpperCase());
                }
            } else {
                setError('No se encontró ninguna partida con ese ID.');
            }
        }
    };

    return (
        <div className="text-center p-8 bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-500/50 max-w-md z-10">
            <h1 className="text-5xl font-bold text-yellow-400 mb-2 font-['Poppins']">Rosco 3D Online</h1>
            <p className="text-gray-300 mb-8">Un juego de palabras multijugador</p>
            <div className="space-y-4">
                <button onClick={onCreateGame} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-purple-500/30">
                    Crear Nueva Partida
                </button>
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="mx-4 text-gray-400">o</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="Ingresa ID de Partida"
                        className="flex-grow bg-gray-900/80 text-white placeholder-gray-400 text-lg px-4 py-3 rounded-lg border-2 border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none transition"
                    />
                    <button onClick={handleJoin} className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-yellow-500/30">
                        Unirse
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    );
};

const LetterCircle = ({ letter, status, style }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'correct': return 'bg-green-500 border-green-400 shadow-green-500/50';
            case 'incorrect': return 'bg-red-500 border-red-400 shadow-red-500/50';
            case 'passed': return 'bg-blue-500 border-blue-400 shadow-blue-500/50';
            default: return 'bg-gray-600 border-gray-500 shadow-black/50';
        }
    };

    return (
        <div 
            className={`absolute w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center 
                        font-bold text-2xl text-white border-2 transition-all duration-500 shadow-lg
                        ${getStatusColor()}`}
            style={style}
        >
            {letter}
        </div>
    );
};

const RoscoWheel = ({ letters, rotationAngle }) => {
    const wheelRadius = window.innerWidth > 768 ? 220 : 150;

    return (
        <div className="relative w-full h-[350px] md:h-[500px] flex items-center justify-center scene">
            <div className="wheel" style={{ transform: `rotateY(${rotationAngle}deg)` }}>
                {letters.map((item, index) => {
                    const angle = (index / letters.length) * 360;
                    const style = {
                        transform: `rotateY(${angle}deg) translateZ(${wheelRadius}px)`
                    };
                    return <LetterCircle key={item.letter} letter={item.letter} status={item.status} style={style} />;
                })}
            </div>
            <div className="pointer"></div>
        </div>
    );
};

const QuestionPanel = ({ question, onAnswer, onPass, answer, setAnswer, feedback, isMyTurn, onSpeak }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onAnswer();
    };

    return (
        <div className={`relative w-full max-w-2xl p-6 bg-black/30 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 ${feedback === 'incorrect' ? 'animate-shake' : ''}`}>
             {!isMyTurn && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl z-20">
                    <p className="text-2xl font-bold text-yellow-400">Esperando al otro jugador...</p>
                </div>
            )}
            <div className="flex items-center justify-center mb-4">
                <p className="text-lg md:text-xl text-gray-200 font-light text-center flex-grow">{question}</p>
                <button onClick={() => onSpeak(question)} className="ml-4 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                    <SpeakerIcon className="w-7 h-7" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escribe tu respuesta..." className="flex-grow bg-gray-900/80 text-white placeholder-gray-400 text-lg px-4 py-3 rounded-lg border-2 border-gray-600 focus:border-purple-500 focus:ring-purple-500 focus:outline-none transition" autoFocus disabled={!isMyTurn} />
                <div className="flex gap-3">
                    <button type="submit" disabled={!isMyTurn} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed shadow-lg shadow-green-500/30">
                        <CheckCircleIcon className="w-6 h-6" /><span>Enviar</span>
                    </button>
                    <button type="button" onClick={onPass} disabled={!isMyTurn} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30">
                         <SkipForwardIcon className="w-6 h-6" /><span>Pasapalabra</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const GameSummary = ({ gameData, onRestart, onGoHome }) => {
    const player1Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 1).length;
    const player2Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 2).length;
    const winner = player1Score > player2Score ? 'Jugador 1' : player2Score > player1Score ? 'Jugador 2' : 'Empate';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl text-white max-w-md w-full border border-purple-500">
                <h2 className="text-4xl font-bold text-center text-yellow-400 mb-6">¡Juego Terminado!</h2>
                {winner !== 'Empate' ? <h3 className="text-2xl text-center text-white mb-4">Ganador: <span className="text-green-400 font-bold">{winner}</span></h3> : <h3 className="text-2xl text-center text-white mb-4">¡Es un <span className="text-yellow-400 font-bold">Empate</span>!</h3>}
                <div className="space-y-4 text-lg">
                    <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg"><span className="font-semibold">Puntuación Jugador 1:</span><span className="font-bold text-2xl text-blue-400">{player1Score}</span></div>
                    <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg"><span className="font-semibold">Puntuación Jugador 2:</span><span className="font-bold text-2xl text-green-400">{player2Score}</span></div>
                </div>
                <div className="mt-8 flex flex-col gap-4">
                    <button onClick={onRestart} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">Jugar Revancha</button>
                    <button onClick={onGoHome} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">Volver al Inicio</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA APP ---
export default function App() {
    const [page, setPage] = useState('loading');
    const [user, setUser] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [timeLeft, setTimeLeft] = useState(240);
    const [voices, setVoices] = useState([]);
    const [rotationAngle, setRotationAngle] = useState(0);

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

    useEffect(() => {
        const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const speak = useCallback((text) => {
        if ('speechSynthesis' in window && text) {
            const utterance = new SpeechSynthesisUtterance(text);
            let spanishVoice = voices.find(v => v.lang === 'es-AR') || voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es-'));
            if (spanishVoice) utterance.voice = spanishVoice;
            utterance.lang = 'es-AR';
            utterance.rate = 0.9;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    }, [voices]);

    useEffect(() => {
        if (!gameId) return;
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
        if (gameData?.status === 'playing' && gameData.players[`player${gameData.currentPlayer}`] === user?.uid && gameData.letters.length > 0) {
            const currentQuestion = gameData.letters[gameData.currentLetterIndex].question;
            setTimeout(() => speak(currentQuestion), 300);
            
            const anglePerLetter = 360 / gameData.letters.length;
            const targetAngle = -gameData.currentLetterIndex * anglePerLetter;
            
            const currentRotation = rotationAngle % 360;
            const targetRotation = targetAngle % 360;
            let diff = targetRotation - currentRotation;
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;
            setRotationAngle(rotationAngle + diff);
        }
    }, [gameData?.currentLetterIndex, gameData?.currentPlayer, user?.uid]);

    const createNewGame = async () => {
        const newGameId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const letters = ALPHABET.map(char => ({
            letter: char, status: 'unanswered', question: initialQuestions[char]?.question,
            answer: initialQuestions[char]?.answer, player: null
        }));
        const finishTime = Date.now() + 240 * 1000;
        const newGameData = {
            id: newGameId, letters, currentLetterIndex: 0, currentPlayer: 1, status: 'playing',
            players: { player1: user.uid, player2: null }, finishTime
        };
        await setDoc(doc(db, "games", newGameId), newGameData);
        setGameId(newGameId);
    };

    const joinGame = (id) => setGameId(id);

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
        const playerNumber = currentData.players.player1 === user.uid ? 1 : 2;

        if (isPass) letters[currentLetterIndex].status = 'passed';
        else {
            letters[currentLetterIndex].status = isCorrect ? 'correct' : 'incorrect';
            letters[currentLetterIndex].player = playerNumber;
        }
        setFeedback(isCorrect ? 'correct' : isPass ? '' : 'incorrect');

        const nextIndex = findNextQuestion(currentLetterIndex, letters);
        if (nextIndex !== -1) currentData.currentLetterIndex = nextIndex;
        else {
            const firstPassed = letters.findIndex(l => l.status === 'passed');
            if (firstPassed !== -1) currentData.currentLetterIndex = firstPassed;
            else currentData.status = 'finished';
        }
        currentData.currentPlayer = playerNumber === 1 ? 2 : 1;

        await updateDoc(gameRef, {
            letters: currentData.letters,
            currentLetterIndex: currentData.currentLetterIndex,
            currentPlayer: currentData.currentPlayer,
            status: currentData.status,
        });

        setTimeout(() => { setAnswer(''); setFeedback(''); }, 800);
    };

    const handleGoHome = () => { setGameId(null); setGameData(null); };

    const copyToClipboard = () => {
        const tempInput = document.createElement('input');
        tempInput.value = gameId;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            alert(`ID de partida "${gameId}" copiado al portapapeles.`);
        } catch (err) {
            alert('No se pudo copiar el ID.');
        }
        document.body.removeChild(tempInput);
    };

    const renderPage = () => {
        if (page === 'loading' || !user) return <div className="text-white text-2xl">Conectando...</div>;
        if (!gameId) return <HomeScreen onCreateGame={createNewGame} onJoinGame={joinGame} userId={user.uid} />;
        if (!gameData) return <div className="text-white text-2xl">Cargando partida...</div>;
        
        if (gameData.status === 'finished') return <GameSummary gameData={gameData} onRestart={createNewGame} onGoHome={handleGoHome} />;

        const playerNumber = gameData.players.player1 === user.uid ? 1 : 2;
        const isMyTurn = gameData.currentPlayer === playerNumber;
        const player1Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 1).length;
        const player2Score = gameData.letters.filter(l => l.status === 'correct' && l.player === 2).length;

        if (!gameData.players.player2) {
            return (
                <div className="text-center p-8 bg-gray-900/80 rounded-2xl shadow-lg">
                    <h2 className="text-3xl font-bold text-yellow-400 mb-4">¡Partida Creada!</h2>
                    <p className="text-xl text-gray-300 mb-6">Comparte este ID con otro jugador:</p>
                    <div className="flex items-center justify-center gap-4 p-4 bg-black/50 rounded-lg">
                        <span className="text-4xl font-bold tracking-widest text-white">{gameId}</span>
                        <button onClick={copyToClipboard} className="text-gray-300 hover:text-white"><ClipboardCopyIcon className="w-8 h-8"/></button>
                    </div>
                    <p className="mt-8 text-lg animate-pulse">Esperando al Jugador 2...</p>
                </div>
            )
        }

        return (
            <div className="w-full flex flex-col items-center justify-between h-full py-6 px-4">
                <div className="w-full max-w-4xl bg-black/30 backdrop-blur-md p-3 rounded-xl border border-white/10 flex justify-between items-center shadow-lg">
                    <div className="text-center px-4"><p className="font-bold text-blue-400 text-lg">Jugador 1</p><p className="text-3xl font-bold">{player1Score}</p></div>
                    <div className="text-center border-x-2 border-white/10 px-4"><p className="font-bold text-white text-lg">Tiempo</p><p className="text-3xl font-bold text-yellow-400">{Math.floor(timeLeft/60)}:{('0' + timeLeft % 60).slice(-2)}</p></div>
                    <div className="text-center px-4"><p className="font-bold text-green-400 text-lg">Jugador 2</p><p className="text-3xl font-bold">{player2Score}</p></div>
                </div>
                <RoscoWheel letters={gameData.letters} rotationAngle={rotationAngle} />
                <div className="w-full flex flex-col items-center gap-4">
                    <QuestionPanel question={gameData.letters[gameData.currentLetterIndex]?.question} onAnswer={() => { const isCorrect = answer.toLowerCase().trim() === gameData.letters[gameData.currentLetterIndex].answer.toLowerCase().trim(); handleAnswerOrPass(isCorrect, false); }} onPass={() => handleAnswerOrPass(false, true)} answer={answer} setAnswer={setAnswer} feedback={feedback} isMyTurn={isMyTurn} onSpeak={speak} />
                    <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg"><h2 className="text-md font-bold text-gray-300">ID Partida: <span className="text-yellow-400">{gameId}</span></h2><button onClick={copyToClipboard} className="text-gray-300 hover:text-white"><ClipboardCopyIcon className="w-5 h-5"/></button></div>
                </div>
            </div>
        );
    };

    return (
        <main className="bg-gray-900 bg-gradient-to-br from-gray-900 to-purple-900 min-h-screen w-full flex items-center justify-center font-['Poppins'] text-white overflow-hidden">
            <div className="stars"></div><div className="twinkling"></div>
            <div className="z-10 w-full h-full flex items-center justify-center">{renderPage()}</div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;700&display=swap');
                .scene { perspective: 1000px; }
                .wheel { position: relative; width: 10px; height: 10px; transform-style: preserve-3d; transition: transform 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
                .wheel > div { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .pointer { width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid #fbbf24; position: absolute; top: 0px; left: 50%; transform: translateX(-50%); z-index: 10; filter: drop-shadow(0 0 10px #fbbf24); }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); } }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                @keyframes move-twink-back { from {background-position:0 0;} to {background-position:-10000px 5000px;} }
                .stars, .twinkling { position:absolute; top:0; left:0; right:0; bottom:0; width:100%; height:100%; display:block; z-index: 0; }
                .stars { background:#000 url(https://www.script-tutorials.com/demos/360/images/stars.png) repeat top center; }
                .twinkling{ background:transparent url(https://www.script-tutorials.com/demos/360/images/twinkling.png) repeat top center; animation:move-twink-back 200s linear infinite; }
            `}</style>
        </main>
    );
}