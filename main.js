// Get all necessary DOM elements
const appContainer = document.getElementById('app-container');
const connectionScreen = document.getElementById('connection-screen');
const modeSelectionScreen = document.getElementById('mode-selection-screen');
const practiceScreen = document.getElementById('practice-screen');
const gameScreen1 = document.getElementById('game-screen-1');
const gameScreen2 = document.getElementById('game-screen-2');

const connectButton = document.getElementById('connect-button');
const deviceLight = document.getElementById('device-light');
const connectionStatus = document.getElementById('connection-status');

const practiceBtn = document.getElementById('practice-mode-btn');
const gameBtn = document.getElementById('game-mode-btn');

const practiceCountDisplay = document.getElementById('practice-count');
const practiceFeedback = document.getElementById('practice-feedback');
const backToModesBtn = document.getElementById('back-to-modes-btn');

const game1ScoreDisplay = document.getElementById('game-1-score');
const game1TimerDisplay = document.getElementById('game-1-timer');
const game1Feedback = document.getElementById('game-1-feedback');
const readyBtn = document.getElementById('ready-btn');
const backToModesGame1 = document.getElementById('back-to-modes-game-1');

const game2ScoreDisplay = document.getElementById('game-2-score');
const game2TimerDisplay = document.getElementById('game-2-timer');
const game2Feedback = document.getElementById('game-2-feedback');
const startGame2Btn = document.getElementById('start-game-2');
const backToModesGame2 = document.getElementById('back-to-modes-game-2');
const currentWordDisplay = document.getElementById('current-word');

// State variables
let practiceCount = 0;
let game1Score = 0;
let game2Score = 0;
let timerInterval;

// Dummy data for Game 2 words
const words = ["hello", "world", "apple", "banana", "cat", "dog"];
let currentWordIndex = 0;

// --- Screen Transition Functions ---
function showScreen(screen) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// --- Connection Logic (Dummy) ---
connectButton.addEventListener('click', () => {
    // This is where you would implement Web Bluetooth API to connect to your device.
    // The code below simulates the connection process.
    connectionStatus.textContent = "Connecting...";
    deviceLight.classList.remove('red-light');
    deviceLight.classList.add('yellow-light');

    setTimeout(() => {
        // Simulates successful connection
        connectionStatus.textContent = "Connected! Ready to go.";
        deviceLight.classList.remove('yellow-light');
        deviceLight.classList.add('green-light');
        showScreen(modeSelectionScreen);
    }, 2000);
});

// --- Mode Selection Logic ---
practiceBtn.addEventListener('click', () => {
    showScreen(practiceScreen);
    resetPracticeMode();
});

gameBtn.addEventListener('click', () => {
    // Navigate to the first game screen
    showScreen(gameScreen1);
    resetGame1();
});

// --- Practice Mode Logic ---
let practiceModeClicks = 0;
document.addEventListener('keyup', (e) => {
    if (practiceScreen.classList.contains('active')) {
        // Simulating the sensor touch with the spacebar
        if (e.key === ' ' && practiceCount < 10) {
            practiceCount++;
            practiceCountDisplay.textContent = practiceCount;
            // This is where you would receive the signal from the device
            if (practiceCount === 10) {
                practiceFeedback.textContent = "Perfect, you are doing great!";
            }
        }
    }
});

function resetPracticeMode() {
    practiceCount = 0;
    practiceCountDisplay.textContent = 0;
    practiceFeedback.textContent = '';
}

backToModesBtn.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});

// --- Game Mode 1 Logic ---
readyBtn.addEventListener('click', () => {
    startTimer(180, game1TimerDisplay, () => {
        // Timer ends, provide feedback
        game1Feedback.textContent = getGame1Feedback(game1Score);
    });
    // This is where you would listen for the sensor on the roof of the mouth
    // The code below simulates the sensor trigger with a button press
    const simulateSensor = setInterval(() => {
        // This is a placeholder for receiving sensor data
        if (gameScreen1.classList.contains('active')) {
            // Placeholder: every 3 seconds, the score increases
            game1Score++;
            game1ScoreDisplay.textContent = game1Score;
        }
    }, 3000);

    setTimeout(() => {
        clearInterval(simulateSensor);
    }, 180000); // Stop after 3 minutes
});

function resetGame1() {
    game1Score = 0;
    game1ScoreDisplay.textContent = 0;
    game1TimerDisplay.textContent = "03:00";
    game1Feedback.textContent = "";
}

function getGame1Feedback(score) {
    if (score >= 60) {
        return "YOU ARE AN EXPERT NOW!";
    } else if (score >= 30) {
        return "Well done! Nice!";
    } else if (score >= 20) {
        return "Very well done! But still there is always room for improvement";
    } else if (score >= 10) {
        return "Not bad but you can improve!";
    } else {
        return "Keep practicing!";
    }
}

backToModesGame1.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});

// --- Game Mode 2 Logic ---
startGame2Btn.addEventListener('click', () => {
    startTimer(60, game2TimerDisplay, () => {
        // Timer ends, provide feedback
        game2Feedback.textContent = getGame2Feedback(game2Score);
    });
    // Placeholder for Web Speech API
    // This part is complex and requires browser support and user permission.
    // You would use SpeechRecognition and check if the recognized word
    // matches the current word in the 'words' array.
    // For this model, we'll simulate the logic.
    simulateSpeechRecognition();
});

function simulateSpeechRecognition() {
    // This is a placeholder for the actual speech recognition API.
    // In a real app, the API would listen for speech and call a callback.
    let recognizedWord = words[currentWordIndex]; // Simulating correct recognition
    
    // Check if the recognized word is correct
    setTimeout(() => {
        game2Score++;
        game2ScoreDisplay.textContent = game2Score;
        // Move to the next word
        currentWordIndex = (currentWordIndex + 1) % words.length;
        currentWordDisplay.textContent = words[currentWordIndex];
    }, 5000); // Simulates a 5-second interval for each word
}

function resetGame2() {
    game2Score = 0;
    game2ScoreDisplay.textContent = 0;
    game2TimerDisplay.textContent = "01:00";
    game2Feedback.textContent = "";
    currentWordIndex = 0;
    currentWordDisplay.textContent = words[currentWordIndex];
}

function getGame2Feedback(score) {
    if (score >= 10) {
        return "YOU ARE AN EXPERT NOW!";
    } else if (score >= 7) {
        return "Well done! Nice!";
    } else if (score >= 5) {
        return "Very well done!";
    } else if (score >= 3) {
        return "Not bad but you can improve!";
    } else {
        return "Keep practicing!";
    }
}

backToModesGame2.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});

// --- General Timer Function ---
function startTimer(duration, display, callback) {
    let timer = duration, minutes, seconds;
    clearInterval(timerInterval); // Clear any existing timer
    timerInterval = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(timerInterval);
            callback();
        }
    }, 1000);
}