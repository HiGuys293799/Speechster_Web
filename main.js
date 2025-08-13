// Get all necessary DOM elements
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
const backToModesGame2 = document = document.getElementById('back-to-modes-game-2');
const currentWordDisplay = document.getElementById('current-word');

// State variables
let practiceCount = 0;
let game1Score = 0;
let game2Score = 0;
let timerInterval;

// Dummy data for Game 2 words
const words = ["hello", "world", "apple", "banana", "cat", "dog"];
let currentWordIndex = 0;

// --- Helper Functions ---
function showScreen(screen) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function startTimer(duration, display, callback) {
    let timer = duration, minutes, seconds;
    clearInterval(timerInterval);
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

// --- Main App Logic ---

// Connection Screen Logic
connectButton.addEventListener('click', async () => {
    // **TODO: REPLACE WITH ACTUAL BLUETOOTH API LOGIC**
    // This is a placeholder. You need to implement the Web Bluetooth API here.
    // The following code simulates the connection status changes.

    connectionStatus.textContent = "Connecting...";
    deviceLight.classList.remove('red-light');
    deviceLight.classList.add('yellow-light');

    try {
        // await connectToDevice(); // This is the real call you'll make
        setTimeout(() => { // Simulating the connection process
            connectionStatus.textContent = "Connected! Ready to go.";
            deviceLight.classList.remove('yellow-light');
            deviceLight.classList.add('green-light');
            showScreen(modeSelectionScreen);
        }, 2000);
    } catch (error) {
        connectionStatus.textContent = "Connection failed. Please try again.";
        deviceLight.classList.remove('yellow-light');
        deviceLight.classList.add('red-light');
        console.error("Bluetooth connection error:", error);
    }
});

// Mode Selection Logic
practiceBtn.addEventListener('click', () => {
    showScreen(practiceScreen);
    resetPracticeMode();
});

gameBtn.addEventListener('click', () => {
    showScreen(gameScreen1);
    resetGame1();
});

// Practice Mode Logic
let startButtonPresses = 0;
document.addEventListener('click', (e) => {
    // This part of the logic is based on the number of button presses
    if (e.target.id === 'connect-button') {
        startButtonPresses++;
        if (startButtonPresses === 2) {
            showScreen(practiceScreen);
            resetPracticeMode();
        } else if (startButtonPresses === 3) {
            showScreen(gameScreen1); // Assuming game mode starts with Game 1
            resetGame1();
        }
        setTimeout(() => startButtonPresses = 0, 1500); // Reset count after a short delay
    }
});

// **TODO: ADD YOUR DEVICE SENSOR LOGIC FOR PRACTICE MODE**
// This is where you would listen for the device's signal that the tongue
// has touched the lip/tongue. The code below simulates this with a spacebar keypress.
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && practiceScreen.classList.contains('active')) {
        practiceCount++;
        practiceCountDisplay.textContent = practiceCount;
        if (practiceCount === 10) {
            practiceFeedback.textContent = "Perfect, you are doing great!";
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

// Game Mode 1 Logic
readyBtn.addEventListener('click', () => {
    startTimer(180, game1TimerDisplay, () => {
        game1Feedback.textContent = getGame1Feedback(game1Score);
    });

    // **TODO: ADD YOUR DEVICE SENSOR LOGIC FOR GAME 1**
    // This is where you'll listen for the sensor on the roof of the mouth.
    // The following code simulates this with a timer that increases the score.
    const simulateSensor = setInterval(() => {
        if (gameScreen1.classList.contains('active')) {
            game1Score++;
            game1ScoreDisplay.textContent = game1Score;
        }
    }, 1000); // Simulates 1 point per second

    setTimeout(() => {
        clearInterval(simulateSensor);
    }, 180000);
});

function resetGame1() {
    game1Score = 0;
    game1ScoreDisplay.textContent = 0;
    game1TimerDisplay.textContent = "03:00";
    game1Feedback.textContent = "";
}

function getGame1Feedback(score) {
    if (score >= 60) return "YOU ARE AN EXPERT NOW!";
    if (score >= 30) return "Well done! Nice!";
    if (score >= 20) return "Very well done! But still there is always room for improvement";
    if (score >= 10) return "Not bad but you can improve!";
    return "Keep practicing!";
}

backToModesGame1.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});

// Game Mode 2 Logic
startGame2Btn.addEventListener('click', () => {
    startTimer(60, game2TimerDisplay, () => {
        game2Feedback.textContent = getGame2Feedback(game2Score);
    });
    
    // **TODO: ADD YOUR WEB SPEECH API LOGIC FOR GAME 2**
    // This is where you will use a speech recognition API to listen to the user.
    // The code below simulates this by cycling through words and adding points.
    simulateSpeechRecognition();
});

function simulateSpeechRecognition() {
    let wordInterval = setInterval(() => {
        // Simulating the recognition of a word and adding a point
        game2Score++;
        game2ScoreDisplay.textContent = game2Score;
        
        currentWordIndex = (currentWordIndex + 1) % words.length;
        currentWordDisplay.textContent = words[currentWordIndex];
    }, 5000); // Change word every 5 seconds

    setTimeout(() => {
        clearInterval(wordInterval);
    }, 60000);
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
    if (score >= 10) return "YOU ARE AN EXPERT NOW!";
    if (score >= 7) return "Well done! Nice!";
    if (score >= 5) return "Very well done!";
    if (score >= 3) return "Not bad but you can improve!";
    return "Keep practicing!";
}

backToModesGame2.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});