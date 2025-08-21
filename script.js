console.log("[....] Booting Up....")

console.log("[....] Load DOM")

document.addEventListener('DOMContentLoaded', () => {
    // Select the body and root elements to toggle dark/light mode
    const root = document.documentElement;
    const body = document.body;

    // Get all necessary DOM elements
    const screens = document.querySelectorAll('.screen');

    const connectButton = document.getElementById('connect-button');
    const deviceLight = document.getElementById('device-light');
    const bluetoothStatus = document.getElementById('bluetooth-status');

    const practiceCountDisplay = document.getElementById('practice-count');
    const practiceFeedback = document.getElementById('practice-feedback');
    const practiceWordInput = document.getElementById('practice-word-input');

    const game1ScoreDisplay = document.getElementById('game-1-score');
    const game1TimerDisplay = document.getElementById('game-1-timer');
    const game1Feedback = document.getElementById('game-1-feedback');

    const game2ScoreDisplay = document.getElementById('game-2-score');
    const game2TimerDisplay = document.getElementById('game-2-timer');
    const game2Feedback = document.getElementById('game-2-feedback');
    const currentWordDisplay = document.getElementById('current-word');

    console.log("[DONE] Load DOM")

    console.log("[....] Hardcode screenHeights")

    // Hardcoded heights for each screen for reliable resizing
    const screenHeights = {
        'mode-selection-screen': 500,
        'practice-screen': 455,
        'game-selection-screen': 400,
        'game-screen-1': 550,
        'game-screen-2': 630,
        'settings-screen': 330
    };

    console.log("[DONE] Hardcode screenHeights", screenHeights)

    console.log("[....] Init Bluetooth")


    // Bluetooth Variables
    let device;
    let rxCharacteristic;
    const BLE_SERVICE_UUID = 'd53c18a6-3116-417f-a81e-14325f75c174';
    const BLE_RX_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
    let isConnected = false;

    console.log("[DONE] Init Bluetooth", BLE_SERVICE_UUID, BLE_RX_CHARACTERISTIC_UUID)

    console.log("[....] Init Game Variables")
    // Game 1 Variables
    let game1TimerInterval;
    let game1Score = 0;
    const game1Duration = 3 * 60; // 3 minutes in seconds
    let game1TimeRemaining = game1Duration;

    console.log("[DONE] Init Game 1 Variables", game1Duration)

    // Game 2 Variables
    let game2TimerInterval;
    let game2Score = 0;
    const game2Duration = 1 * 60; // 1 minute in seconds
    let game2TimeRemaining = game2Duration;
    const words = ['apple', 'banana', 'cherry', 'grape', 'kiwi', 'lemon', 'mango', 'orange', 'pear', 'plum'];
    let currentWordIndex = 0;
    let lastSignalTime = 0;

    console.log("[DONE] Init Game 2 Variables", game2Duration, words)
    console.log("[DONE] Init Variables")

    // Functions

    console.log("[....] Init Functions")

    function showScreen(screenId, animate = false) {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) {
            activeScreen.classList.add('active');
            adjustContainerHeight(screenId, animate);
        }
    }

    function adjustContainerHeight(screenId, animate) {
        const height = screenHeights[screenId];
        if (height) {
            const container = document.getElementById('app-container');
            if (container) {
                if (animate) {
                    container.style.transition = 'height 0.3s ease';
                } else {
                    container.style.transition = 'none';
                }
                container.style.height = `${height}px`;
            }
        }
    }

    console.log("[....] Init BT Functions")

    // Bluetooth Functions
    const connectBluetooth = () => {
    // Check if the browser supports Web Bluetooth
    if (!navigator.bluetooth) {
        bluetoothStatus.textContent = 'Web Bluetooth not supported.';
        deviceLight.classList.remove('green-light');
        deviceLight.classList.add('red-light');
        console.error('Web Bluetooth is not supported in this browser.');
        return; // Exit the function if not supported
    }

    console.log("Starting Bluetooth Device Scan....")
    console.log("[DEBUG] Scanning for devices with serviceUUID", BLE_SERVICE_UUID)
    bluetoothStatus.textContent = 'Connecting...';
    // This part of the code should only run if the browser is compatible
    navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
        .then(device => {
            console.log('Device selected:', device.name);
            bluetoothStatus.textContent = 'Connected!';
            deviceLight.classList.remove('red-light');
            deviceLight.classList.add('green-light');
            // ... rest of your connection logic
        })
        .catch(error => {
            console.error('Connection failed:', error);
            bluetoothStatus.textContent = 'Disconnected';
            deviceLight.classList.remove('green-light');
            deviceLight.classList.add('red-light');
        });
};


    async function disconnectBluetooth() {
        if (device && device.gatt.connected) {
            device.gatt.disconnect();
        }
        isConnected = false;
        deviceLight.classList.remove('green-light');
        deviceLight.classList.add('red-light');
        bluetoothStatus.textContent = 'Disconnected';
        connectButton.textContent = 'Connect';
        console.log('Bluetooth device disconnected.');
    }

    function onDisconnected(event) {
        const disconnectedDevice = event.target;
        console.log(`Device ${disconnectedDevice.name} is disconnected.`);
        isConnected = false;
        deviceLight.classList.remove('green-light');
        deviceLight.classList.add('red-light');
        bluetoothStatus.textContent = 'Disconnected';
        connectButton.textContent = 'Connect';
    }

    function handleNotifications(event) {
        let value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const decodedValue = decoder.decode(value);
        console.log('Received: ' + decodedValue);

        // Process the received data
        const [mode, command] = decodedValue.split(',');
        console.log(`Mode: ${mode}, Command: ${command}`);

        if (mode === 'P') {
            // Handle Practice Mode commands
            if (command === '1') { // Assuming '1' means a key press
                practiceCountDisplay.textContent = parseInt(practiceCountDisplay.textContent) + 1;
                practiceFeedback.textContent = 'Correct!';
            }
        } else if (mode === 'G1') {
            // Handle Game 1 commands
            if (command === '1') {
                game1Score += 1;
                game1ScoreDisplay.textContent = game1Score;
                game1Feedback.textContent = 'Touch!';
            }
        } else if (mode === 'G2') {
            // Handle Game 2 commands
            if (command.startsWith('w')) {
                const word = command.substring(1);
                const expectedWord = words[currentWordIndex];
                if (word === expectedWord) {
                    game2Score += 1;
                    game2ScoreDisplay.textContent = game2Score;
                    game2Feedback.textContent = 'Word Recognized!';
                    currentWordIndex = (currentWordIndex + 1) % words.length;
                    currentWordDisplay.textContent = words[currentWordIndex];
                } else {
                    game2Feedback.textContent = 'Incorrect word!';
                }
            }
        }
    }

    console.log("[DONE] Init BT Functions")

    // Game 1 Timer
    function startGame1Timer() {
        game1TimeRemaining = game1Duration;
        game1Score = 0;
        game1ScoreDisplay.textContent = game1Score;
        game1TimerDisplay.textContent = formatTime(game1TimeRemaining);
        game1Feedback.textContent = '';
        game1TimerInterval = setInterval(() => {
            game1TimeRemaining--;
            game1TimerDisplay.textContent = formatTime(game1TimeRemaining);
            if (game1TimeRemaining <= 0) {
                clearInterval(game1TimerInterval);
                game1Feedback.textContent = `Game Over! Final Score: ${game1Score}`;
                game1TimeRemaining = game1Duration;
                game1TimerDisplay.textContent = formatTime(game1TimeRemaining);
            }
        }, 1000);
    }

    // Game 2 Timer
    function startGame2Timer() {
        game2TimeRemaining = game2Duration;
        game2Score = 0;
        game2ScoreDisplay.textContent = game2Score;
        currentWordIndex = 0;
        currentWordDisplay.textContent = words[currentWordIndex];
        game2TimerDisplay.textContent = formatTime(game2TimeRemaining);
        game2Feedback.textContent = '';
        game2TimerInterval = setInterval(() => {
            game2TimeRemaining--;
            game2TimerDisplay.textContent = formatTime(game2TimeRemaining);
            if (game2TimeRemaining <= 0) {
                clearInterval(game2TimerInterval);
                game2Feedback.textContent = `Game Over! Final Score: ${game2Score}`;
                game2TimeRemaining = game2Duration;
                game2TimerDisplay.textContent = formatTime(game2TimeRemaining);
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    console.log("[DONE] Init Fuctions")

    // Event Listeners
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn')) {
            const buttonId = target.id;
            switch (buttonId) {
                case 'connect-button':
                    if (isConnected) {
                        disconnectBluetooth();
                    } else {
                        connectBluetooth();
                    }
                    break;
                case 'practice-mode-btn':
                    showScreen('practice-screen', true);
                    break;
                case 'game-mode-btn-1':
                    showScreen('game-screen-1', true);
                    break;
                case 'game-mode-btn-2':
                    showScreen('game-screen-2', true);
                    break;
                case 'settings-btn':
                    showScreen('settings-screen', true);
                    break;
                case 'ready-btn':
                    startGame1Timer();
                    break;
                case 'start-game-2':
                    startGame2Timer();
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
                    // Assuming you have a resetGame1 function
                    // resetGame1();
                    clearInterval(game1TimerInterval);
                    game1TimeRemaining = game1Duration;
                    game1TimerDisplay.textContent = formatTime(game1TimeRemaining);
                    game1Feedback.textContent = '';
                    showScreen('mode-selection-screen', true);
                    break;
                case 'game-2-back':
                    // Assuming you have a resetGame2 function
                    // resetGame2();
                    clearInterval(game2TimerInterval);
                    game2TimeRemaining = game2Duration;
                    game2TimerDisplay.textContent = formatTime(game2TimeRemaining);
                    game2Feedback.textContent = '';
                    showScreen('mode-selection-screen', true);
                    break;
                case 'settings-back':
                    showScreen('mode-selection-screen', true);
                    break;
            }
        }
    });

    // Initial setup
    showScreen('mode-selection-screen');

    // Add this to handle the initial state of the app
    // No login functions added, so the app is always visible
    const appContainer = document.getElementById('app-container');
    appContainer.style.display = 'block';
    
    console.log("[DONE] Boothing Up")
});

