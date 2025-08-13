// Get all necessary DOM elements
const modeSelectionScreen = document.getElementById('mode-selection-screen');
const practiceScreen = document.getElementById('practice-screen');
const gameScreen1 = document.getElementById('game-screen-1');
const gameScreen2 = document.getElementById('game-screen-2');
const settingsScreen = document.getElementById('settings-screen');
const appContainer = document.getElementById('app-container');

const connectButton = document.getElementById('connect-button');
const deviceLight = document.getElementById('device-light');
const bluetoothStatus = document.getElementById('bluetooth-status');

const practiceBtn = document.getElementById('practice-mode-btn');
const gameBtn1 = document.getElementById('game-mode-btn-1');
const gameBtn2 = document.getElementById('game-mode-btn-2');
const settingsBtn = document.getElementById('settings-btn');

const practiceCountDisplay = document.getElementById('practice-count');
const practiceFeedback = document.getElementById('practice-feedback');
const practiceBackBtn = document.getElementById('practice-back');
const correctBtn = document.getElementById('correct-btn');

const game1ScoreDisplay = document.getElementById('game-1-score');
const game1TimerDisplay = document.getElementById('game-1-timer');
const game1Feedback = document.getElementById('game-1-feedback');
const readyBtn = document.getElementById('ready-btn');
const game1BackBtn = document.getElementById('game-1-back');

const game2ScoreDisplay = document.getElementById('game-2-score');
const game2TimerDisplay = document.getElementById('game-2-timer');
const game2Feedback = document.getElementById('game-2-feedback');
const startGame2Btn = document.getElementById('start-game-2');
const game2BackBtn = document.getElementById('game-2-back');
const currentWordDisplay = document.getElementById('current-word');

const lightModeBtn = document.getElementById('light-mode-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');
const settingsBackBtn = document.getElementById('settings-back');

// Hardcoded heights for each screen in separate variables for easier modification
const menuScreenHeight = 570;
const practiceScreenHeight = 455;
const gameScreen1Height = 510;
const gameScreen2Height = 510;
const settingsScreenHeight = 300;

// State variables
let practiceCount = 0;
let game1Score = 0;
let game2Score = 0;
let timerInterval;
let game1ScoreInterval;
let game2WordInterval;

// Dummy data for Game 2 words
const words = ["hello", "world", "apple", "banana", "cat", "dog"];
let currentWordIndex = 0;

// --- Helper Functions ---
function showScreen(nextScreen) {
    const currentScreen = document.querySelector('.screen.active');
    
    // Determine the hardcoded height based on the next screen's ID
    let finalHeight;
    switch (nextScreen.id) {
        case 'mode-selection-screen':
            finalHeight = menuScreenHeight;
            break;
        case 'practice-screen':
            finalHeight = practiceScreenHeight;
            break;
        case 'game-screen-1':
            finalHeight = gameScreen1Height;
            break;
        case 'game-screen-2':
            finalHeight = gameScreen2Height;
            break;
        case 'settings-screen':
            finalHeight = settingsScreenHeight;
            break;
        default:
            finalHeight = 400; // A default fallback height
    }
    
    if (currentScreen) {
        if (Math.round(appContainer.clientHeight) !== Math.round(finalHeight)) {
            appContainer.style.height = `${finalHeight}px`;
        }
        
        // Handle screen transitions
        currentScreen.classList.remove('active');
        currentScreen.classList.add('slide-out');
        
        currentScreen.addEventListener('animationend', () => {
            currentScreen.classList.remove('slide-out');
            nextScreen.classList.add('active');
            nextScreen.classList.add('slide-in');
            
            nextScreen.addEventListener('animationend', () => {
                nextScreen.classList.remove('slide-in');
            }, { once: true });
        }, { once: true });
    } else {
        // Handle initial screen on first load
        appContainer.style.height = `${finalHeight}px`;
        nextScreen.classList.add('active');
    }
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

// Set initial screen and container height
window.addEventListener('DOMContentLoaded', () => {
    showScreen(modeSelectionScreen);
});

// Connect Button Logic (Placeholder)
connectButton.addEventListener('click', () => {
    bluetoothStatus.textContent = "Connecting...";
    connectButton.disabled = true;
    deviceLight.classList.remove('red-light');
    deviceLight.classList.add('yellow-light');
    deviceLight.classList.add('blinking');

    const randomDelay = Math.random() * 4000 + 1000;

    setTimeout(() => {
        bluetoothStatus.textContent = "Bluetooth Not Functional Yet";
        connectButton.disabled = false;
        deviceLight.classList.remove('yellow-light');
        deviceLight.classList.remove('blinking');
        deviceLight.classList.add('red-light');
    }, randomDelay);
});

// Mode Selection Logic
practiceBtn.addEventListener('click', () => {
    showScreen(practiceScreen);
    resetPracticeMode();
});

gameBtn1.addEventListener('click', () => {
    showScreen(gameScreen1);
    resetGame1();
});

gameBtn2.addEventListener('click', () => {
    showScreen(gameScreen2);
    resetGame2();
});

// Settings Button Logic
settingsBtn.addEventListener('click', () => {
    showScreen(settingsScreen);
});

lightModeBtn.addEventListener('click', () => {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
});

darkModeBtn.addEventListener('click', () => {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
});

settingsBackBtn.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});

// Practice Mode Logic
correctBtn.addEventListener('click', () => {
    if (practiceCount < 10) {
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

practiceBackBtn.addEventListener('click', () => {
    showScreen(modeSelectionScreen);
});

// Game Mode 1 Logic
readyBtn.addEventListener('click', () => {
    startTimer(180, game1TimerDisplay, () => {
        clearInterval(game1ScoreInterval);
        game1Feedback.textContent = getGame1Feedback(game1Score);
    });

    clearInterval(game1ScoreInterval);
    game1ScoreInterval = setInterval(() => {
        game1Score++;
        game1ScoreDisplay.textContent = game1Score;
    }, 1000);
});

function resetGame1() {
    clearInterval(timerInterval);
    clearInterval(game1ScoreInterval);
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

game1BackBtn.addEventListener('click', () => {
    resetGame1();
    showScreen(modeSelectionScreen);
});

// Game Mode 2 Logic
startGame2Btn.addEventListener('click', () => {
    startTimer(60, game2TimerDisplay, () => {
        clearInterval(game2WordInterval);
        game2Feedback.textContent = getGame2Feedback(game2Score);
    });
    
    clearInterval(game2WordInterval);
    game2WordInterval = setInterval(() => {
        game2Score++;
        game2ScoreDisplay.textContent = game2Score;
        
        currentWordIndex = (currentWordIndex + 1) % words.length;
        currentWordDisplay.textContent = words[currentWordIndex];
    }, 5000);
});

function resetGame2() {
    clearInterval(timerInterval);
    clearInterval(game2WordInterval);
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

game2BackBtn.addEventListener('click', () => {
    resetGame2();
    showScreen(modeSelectionScreen);
});