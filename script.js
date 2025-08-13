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
const correctBtn = document.getElementById('correct-btn');

const game1ScoreDisplay = document.getElementById('game-1-score');
const game1TimerDisplay = document.getElementById('game-1-timer');
const game1Feedback = document.getElementById('game-1-feedback');
const readyBtn = document.getElementById('ready-btn');

const game2ScoreDisplay = document.getElementById('game-2-score');
const game2TimerDisplay = document.getElementById('game-2-timer');
const game2Feedback = document.getElementById('game-2-feedback');
const startGame2Btn = document.getElementById('start-game-2');
const currentWordDisplay = document.getElementById('current-word');

const lightModeBtn = document.getElementById('light-mode-btn');
const darkModeBtn = document.getElementById('dark-mode-btn');

// Hardcoded heights for each screen in separate variables for easier modification
const menuScreenHeight = 500;
const practiceScreenHeight = 455;
const gameScreen1Height = 550;
const gameScreen2Height = 600;
const settingsScreenHeight = 300;

// Hardcoded back button positions for each screen
const backButtonPositions = {
    'mode-selection-screen': '5px',
    'practice-screen': '5px',
    'game-screen-1': '5px',
    'game-screen-2': '5px',
    'settings-screen': '5px'
};

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
function showScreen(nextScreen, isBack = false) {
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

    // Update the back button's position for the new screen
    document.documentElement.style.setProperty('--back-btn-top-position', backButtonPositions[nextScreen.id]);
    
    // Update container height if it needs to change
    if (Math.round(appContainer.clientHeight) !== Math.round(finalHeight)) {
        appContainer.style.height = `${finalHeight}px`;
    }
    
    // Animate the transition between screens
    if (currentScreen) {
        // Handle screen transitions based on whether it's a "back" action
        if (isBack) {
            currentScreen.classList.add('slide-out-back');
            nextScreen.classList.add('active', 'slide-in-back');
        } else {
            currentScreen.classList.add('slide-out');
            nextScreen.classList.add('active', 'slide-in');
        }
        
        currentScreen.addEventListener('animationend', () => {
            currentScreen.classList.remove('active', 'slide-out', 'slide-out-back');
        }, { once: true });
        
        nextScreen.addEventListener('animationend', () => {
            nextScreen.classList.remove('slide-in', 'slide-in-back');
        }, { once: true });
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

// Set initial screen and container height on page load
window.addEventListener('DOMContentLoaded', () => {
    appContainer.style.height = `${menuScreenHeight}px`;
    modeSelectionScreen.classList.add('active');
    document.documentElement.style.setProperty('--back-btn-top-position', backButtonPositions[modeSelectionScreen.id]);
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
        bluetoothStatus.textContent = "CRITICAL ERROR: BLUETOOTH UNAVAIL";
        connectButton.disabled = false;
        deviceLight.classList.remove('yellow-light');
        deviceLight.classList.remove('blinking');
        deviceLight.classList.add('dark-red-light');
    }, randomDelay);
});

// Use a single event listener on the app container to handle all button clicks
appContainer.addEventListener('click', (event) => {
    const target = event.target;
    
    // Check if the clicked element has the "btn" class
    if (target.classList.contains('btn')) {
        const buttonId = target.id;
        
        // Handle menu buttons
        switch (buttonId) {
            case 'practice-mode-btn':
                showScreen(practiceScreen);
                resetPracticeMode();
                break;
            case 'game-mode-btn-1':
                showScreen(gameScreen1);
                resetGame1();
                break;
            case 'game-mode-btn-2':
                showScreen(gameScreen2);
                resetGame2();
                break;
            case 'settings-btn':
                showScreen(settingsScreen);
                break;
            case 'correct-btn':
                if (practiceCount < 10) {
                    practiceCount++;
                    practiceCountDisplay.textContent = practiceCount;
                    if (practiceCount === 10) {
                        practiceFeedback.textContent = "Perfect, you are doing great!";
                    }
                }
                break;
            case 'ready-btn':
                startTimer(180, game1TimerDisplay, () => {
                    clearInterval(game1ScoreInterval);
                    game1Feedback.textContent = getGame1Feedback(game1Score);
                });
                clearInterval(game1ScoreInterval);
                game1ScoreInterval = setInterval(() => {
                    game1Score++;
                    game1ScoreDisplay.textContent = game1Score;
                }, 1000);
                break;
            case 'start-game-2':
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
                break;
            case 'light-mode-btn':
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                break;
            case 'dark-mode-btn':
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
                break;
        }
    }
    
    // Check if the clicked element has the "back-btn" class
    if (target.classList.contains('back-btn')) {
        const buttonId = target.id;
        switch (buttonId) {
            case 'practice-back':
                showScreen(modeSelectionScreen, true);
                break;
            case 'game-1-back':
                resetGame1();
                showScreen(modeSelectionScreen, true);
                break;
            case 'game-2-back':
                resetGame2();
                showScreen(modeSelectionScreen, true);
                break;
            case 'settings-back':
                showScreen(modeSelectionScreen, true);
                break;
        }
    }
});

function resetPracticeMode() {
    practiceCount = 0;
    practiceCountDisplay.textContent = 0;
    practiceFeedback.textContent = '';
}

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