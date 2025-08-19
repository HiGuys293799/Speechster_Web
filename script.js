document.addEventListener('DOMContentLoaded', () => {
    // Select the body and root elements to toggle dark/light mode
    const root = document.documentElement;
    const body = document.body;

    // Get all necessary DOM elements
    const screens = document.querySelectorAll('.screen');
    const appContainer = document.getElementById('app-container');

    const connectButton = document.getElementById('connect-button');
    const deviceLight = document.getElementById('device-light');
    const bluetoothStatus = document.getElementById('bluetooth-status');

    const practiceCountDisplay = document.getElementById('practice-count');
    const practiceFeedback = document.getElementById('practice-feedback');

    const game1ScoreDisplay = document.getElementById('game-1-score');
    const game1TimerDisplay = document.getElementById('game-1-timer');
    const game1Feedback = document.getElementById('game-1-feedback');

    const game2ScoreDisplay = document.getElementById('game-2-score');
    const game2TimerDisplay = document.getElementById('game-2-timer');
    const game2Feedback = document.getElementById('game-2-feedback');
    const currentWordDisplay = document.getElementById('current-word');

    // Hardcoded heights for each screen for reliable resizing
    const screenHeights = {
        'mode-selection-screen': 500,
        'practice-screen': 455,
        'game-selection-screen': 400,
        'game-screen-1': 550,
        'game-screen-2': 630,
        'settings-screen': 300
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

    // State variable to track the current active screen
    let activeScreenId = 'mode-selection-screen';

    // === NEW CODE FOR MOUSE TRACKING ===
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        body.style.setProperty('--mouse-x', `${mouseX}px`);
        body.style.setProperty('--mouse-y', `${mouseY}px`);
    });

    // --- Helper Functions ---
    const showScreen = (screenId, isBack = false) => {
        const currentScreen = document.getElementById(activeScreenId);
        const newScreen = document.getElementById(screenId);

        if (!newScreen) {
            console.error(`Screen with ID "${screenId}" not found.`);
            return;
        }

        // Set the app container height based on the hardcoded value
        appContainer.style.height = `${screenHeights[screenId]}px`;

        if (currentScreen) {
            currentScreen.classList.remove('active');
            if (isBack) {
                currentScreen.classList.add('slide-out-back');
            } else {
                currentScreen.classList.add('slide-out');
            }
        }

        newScreen.classList.add('active');
        if (isBack) {
            newScreen.classList.add('slide-in-back');
        } else {
            newScreen.classList.add('slide-in');
        }

        if (currentScreen) {
            currentScreen.addEventListener('animationend', () => {
                currentScreen.classList.remove('slide-out', 'slide-out-back');
            }, { once: true });
        }
        
        newScreen.addEventListener('animationend', () => {
            newScreen.classList.remove('slide-in', 'slide-in-back');
        }, { once: true });

        activeScreenId = screenId;
    };

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

    function resetPracticeMode() {
        practiceCount = 0;
        if (practiceCountDisplay) practiceCountDisplay.textContent = 0;
        if (practiceFeedback) practiceFeedback.textContent = '';
    }

    function resetGame1() {
        clearInterval(timerInterval);
        clearInterval(game1ScoreInterval);
        game1Score = 0;
        if (game1ScoreDisplay) game1ScoreDisplay.textContent = 0;
        if (game1TimerDisplay) game1TimerDisplay.textContent = "03:00";
        if (game1Feedback) game1Feedback.textContent = "";
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
        if (game2ScoreDisplay) game2ScoreDisplay.textContent = 0;
        if (game2TimerDisplay) game2TimerDisplay.textContent = "01:00";
        if (game2Feedback) game2Feedback.textContent = "";
        currentWordIndex = 0;
        if (currentWordDisplay) currentWordDisplay.textContent = words[currentWordIndex];
    }

    function getGame2Feedback(score) {
        if (score >= 10) return "YOU ARE AN EXPERT NOW!";
        if (score >= 7) return "Well done! Nice!";
        if (score >= 5) return "Very well done!";
        if (score >= 3) return "Not bad but you can improve!";
        return "Keep practicing!";
    }

    // A reusable function to update the connection status
    const handleConnectionStatus = (status, lightClass, blinking = false) => {
        bluetoothStatus.textContent = status;
        deviceLight.classList.remove('red-light', 'yellow-light', 'green-light', 'blinking');
        deviceLight.classList.add(lightClass);
        if (blinking) {
            deviceLight.classList.add('blinking');
        }
    };

    // Main Bluetooth connection function
    const connectToDevice = async () => {

        // Check for Web Bluetooth support first
    if (!navigator.bluetooth) {
        handleConnectionStatus('Web Bluetooth is not supported in this browser.', 'dark-red-light');
        connectButton.disabled = false;
        return;
    }

    handleConnectionStatus('Connecting...', 'yellow-light', true);
    connectButton.disabled = true;

        handleConnectionStatus('Connecting...', 'yellow-light', true);
        connectButton.disabled = true;
        try {
            // Check if Web Bluetooth is supported
            if (!navigator.bluetooth) {
                throw new Error("Web Bluetooth is not supported in this browser.");
            }

            // Prompt the user to select a device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            });

            // Handle a successful connection
            handleConnectionStatus(`Connected to ${device.name}`, 'green-light');
            
        } catch (error) {
            // Handle connection errors or user cancellation
            console.error('Bluetooth connection failed:', error);
            handleConnectionStatus('Disconnected', 'red-light');
        } finally {
            connectButton.disabled = false;
        }
    };

    // --- Main App Logic ---

    // Set initial screen and container height on page load
    window.addEventListener('DOMContentLoaded', () => {
        appContainer.style.height = `${screenHeights[activeScreenId]}px`;
        document.getElementById(activeScreenId).classList.add('active');
    });

    // Use a single event listener on the app container to handle all button clicks
    appContainer.addEventListener('click', (event) => {
        const target = event.target;
        
        // Check if the clicked element has the "btn" class
        if (target.classList.contains('btn')) {
            const buttonId = target.id;
            
            // Handle menu buttons
            switch (buttonId) {
                case 'connect-button':
                    connectToDevice();
                    break;
                case 'practice-mode-btn':
                    showScreen('practice-screen');
                    resetPracticeMode();
                    break;
                case 'game-mode-btn-1':
                    showScreen('game-screen-1');
                    resetGame1();
                    break;
                case 'game-mode-btn-2':
                    showScreen('game-screen-2');
                    resetGame2();
                    break;
                case 'settings-btn':
                    showScreen('settings-screen');
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
                    showScreen('mode-selection-screen', true);
                    break;
                case 'game-1-back':
                    resetGame1();
                    showScreen('mode-selection-screen', true);
                    break;
                case 'game-2-back':
                    resetGame2();
                    showScreen('mode-selection-screen', true);
                    break;
                case 'settings-back':
                    showScreen('mode-selection-screen', true);
                    break;
            }
        }
    });
});