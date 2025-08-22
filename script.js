/*
 * Speechster 1000 - Main Application Logic
 * Optimized, modular, and debug-friendly JavaScript.
 */

console.log("[LOG] --- Speechester 1000 Booting Up ---");

document.addEventListener('DOMContentLoaded', () => {

    console.log("[LOG] DOM Content Loaded. Initializing app...");

    // ====================================================================
    // 1. DOM Element References
    // ====================================================================
    // Centralized access to all key HTML elements.
    const DOM = {
        appContainer: document.getElementById('app-container'),
        body: document.body,
        particleContainer: document.getElementById('particle-container'),
        screens: {
            modeSelection: document.getElementById('mode-selection-screen'),
            practice: document.getElementById('practice-screen'),
            game1: document.getElementById('game-screen-1'),
            game2: document.getElementById('game-screen-2'),
            settings: document.getElementById('settings-screen')
        },
        buttons: {
            connect: document.getElementById('connect-button'),
            practiceMode: document.getElementById('practice-mode-btn'),
            game1: document.getElementById('game-mode-btn-1'),
            game2: document.getElementById('game-mode-btn-2'),
            settings: document.getElementById('settings-btn'),
            lightMode: document.getElementById('light-mode-btn'),
            darkMode: document.getElementById('dark-mode-btn'),
            correct: document.getElementById('correct-btn'),
            game1Start: document.getElementById('ready-btn'),
            game2Start: document.getElementById('start-game-2')
        },
        backButtons: {
            practice: document.getElementById('practice-back'),
            game1: document.getElementById('game-1-back'),
            game2: document.getElementById('game-2-back'),
            settings: document.getElementById('settings-back')
        },
        status: {
            deviceLight: document.getElementById('device-light'),
            bluetoothStatus: document.getElementById('bluetooth-status')
        },
        displays: {
            practiceCount: document.getElementById('practice-count'),
            practiceFeedback: document.getElementById('practice-feedback'),
            game1Score: document.getElementById('game-1-score'),
            game1Timer: document.getElementById('game-1-timer'),
            game1Feedback: document.getElementById('game-1-feedback'),
            game2Score: document.getElementById('game-2-score'),
            game2Timer: document.getElementById('game-2-timer'),
            game2Feedback: document.getElementById('game-2-feedback'),
            currentWord: document.getElementById('current-word')
        }
    }; // End of DOM object

    // ====================================================================
    // 2. State and Configuration
    // ====================================================================
    // All dynamic state variables are managed here.
    let appState = {
        activeScreenId: 'mode-selection-screen',
        practiceCount: 0,
        game1Score: 0,
        game2Score: 0,
        currentWordIndex: 0,
        timerInterval: null,
        game1ScoreInterval: null,
        game2WordInterval: null,
        screenHeights: {
            'mode-selection-screen': 500,
            'practice-screen': 455,
            'game-screen-1': 550,
            'game-screen-2': 630,
            'settings-screen': 300
        },
        words: ["hello", "world", "apple", "banana", "cat", "dog"],
        particles: [],
        mouse: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            prevX: window.innerWidth / 2,
            prevY: window.innerHeight / 2,
            vx: 0,
            vy: 0
        },
        particleSettings: {
            count: 130,
            sizeRange: [0.001, 6],
            mouseSensitivity: 0.01, // NEW: Control the sensitivity of particles to mouse movement
        },
        particleShapes: ['shape-circle', 'shape-square', 'shape-triangle']
    }; // End of appState object

    // ====================================================================
    // 3. Utility Functions
    // ====================================================================

    /**
     * @description Formats time from seconds into a MM:SS string.
     * @param {number} totalSeconds - The total number of seconds.
     * @returns {string} The formatted time string.
     */
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        return `${paddedMinutes}:${paddedSeconds}`;
    }; // End of formatTime function
    
    // Game/Mode Reset Functions
    const resetPracticeMode = () => {
        console.log("[DEBUG] Resetting Practice Mode...");
        appState.practiceCount = 0;
        DOM.displays.practiceCount.textContent = 0;
        DOM.displays.practiceFeedback.textContent = '';
    }; // End of resetPracticeMode function

    const resetGame1 = () => {
        console.log("[DEBUG] Resetting Game 1...");
        clearInterval(appState.timerInterval);
        clearInterval(appState.game1ScoreInterval);
        appState.game1Score = 0;
        DOM.displays.game1Score.textContent = 0;
        DOM.displays.game1Timer.textContent = formatTime(180);
        DOM.displays.game1Feedback.textContent = "";
    }; // End of resetGame1 function

    const resetGame2 = () => {
        console.log("[DEBUG] Resetting Game 2...");
        clearInterval(appState.timerInterval);
        clearInterval(appState.game2WordInterval);
        appState.game2Score = 0;
        DOM.displays.game2Score.textContent = 0;
        DOM.displays.game2Timer.textContent = formatTime(60);
        DOM.displays.game2Feedback.textContent = "";
        appState.currentWordIndex = 0;
        DOM.displays.currentWord.textContent = appState.words[appState.currentWordIndex];
    }; // End of resetGame2 function

    // Feedback Functions
    const getGame1Feedback = (score) => {
        if (score >= 60) return "YOU ARE AN EXPERT NOW!";
        if (score >= 30) return "Well done! Nice!";
        if (score >= 20) return "Very well done! But still there is always room for improvement";
        if (score >= 10) return "Not bad but you can improve!";
        return "Keep practicing!";
    }; // End of getGame1Feedback function

    const getGame2Feedback = (score) => {
        if (score >= 10) return "YOU ARE AN EXPERT NOW!";
        if (score >= 7) return "Well done! Nice!";
        if (score >= 5) return "Very well done!";
        if (score >= 3) return "Not bad but you can improve!";
        return "Keep practicing!";
    }; // End of getGame2Feedback function

    // ====================================================================
    // 4. Core Application Logic
    // ====================================================================

    /**
     * @description Handles screen transitions and updates the app container height.
     * @param {string} newScreenId - The ID of the screen to show.
     * @param {boolean} [isBack=false] - True if this is a "back" transition.
     */
    const showScreen = (newScreenId, isBack = false) => {
        console.log(`[LOG] Switching screen from '${appState.activeScreenId}' to '${newScreenId}'...`);
        
        const currentScreen = document.getElementById(appState.activeScreenId);
        const newScreen = document.getElementById(newScreenId);

        if (!newScreen) {
            console.error(`[ERROR] Screen with ID "${newScreenId}" not found. Please check your HTML and JavaScript for a mismatch.`);
            return;
        }

        DOM.appContainer.style.height = `${appState.screenHeights[newScreenId]}px`;

        if (currentScreen) {
            currentScreen.classList.remove('active');
            if (isBack) {
                currentScreen.classList.add('slide-out-back');
                newScreen.classList.add('slide-in-back');
            } else {
                currentScreen.classList.add('slide-out');
                newScreen.classList.add('slide-in');
            }
        }
        
        // Use a timeout to ensure the classes are applied for the transition
        setTimeout(() => {
            newScreen.classList.add('active');
        }, 10);

        // Clean up animation classes after they finish
        currentScreen.addEventListener('animationend', () => {
            currentScreen.classList.remove('slide-out', 'slide-out-back');
        }, { once: true });

        newScreen.addEventListener('animationend', () => {
            newScreen.classList.remove('slide-in', 'slide-in-back');
        }, { once: true });

        appState.activeScreenId = newScreenId;
    }; // End of showScreen function
    
    /**
     * @description Starts a countdown timer and executes a callback when it finishes.
     * @param {number} duration - The duration in seconds.
     * @param {HTMLElement} display - The display element for the timer.
     * @param {Function} callback - The function to call when the timer reaches zero.
     */
    const startTimer = (duration, display, callback) => {
        let timer = duration;
        clearInterval(appState.timerInterval);
        appState.timerInterval = setInterval(() => {
            display.textContent = formatTime(timer);
            if (--timer < 0) {
                clearInterval(appState.timerInterval);
                callback();
            }
        }, 1000);
    }; // End of startTimer function
    
    // ====================================================================
    // 5. Bluetooth/Connectivity Logic
    // ====================================================================

    /**
     * @description Updates the visual status of the device connection light and text.
     * @param {string} statusText - The text to display.
     * @param {string} lightClass - The class for the device light (e.g., 'green-light').
     * @param {boolean} [blinking=false] - Whether the light should blink.
     */
    const updateConnectionStatus = (statusText, lightClass, blinking = false) => {
        DOM.status.bluetoothStatus.textContent = statusText;
        DOM.status.deviceLight.className = '';
        DOM.status.deviceLight.classList.add(lightClass);
        if (blinking) {
            DOM.status.deviceLight.classList.add('blinking');
        }
    }; // End of updateConnectionStatus function

    /**
     * @description Handles the Web Bluetooth connection process.
     */
    const connectToDevice = async () => {
        console.log("[LOG] Attempting to connect to a Bluetooth device...");

        if (!navigator.bluetooth) {
            updateConnectionStatus('Web Bluetooth is not supported in this browser.', 'dark-red-light');
            DOM.buttons.connect.disabled = false;
            console.error("[ERROR] Web Bluetooth is not supported.");
            return;
        }

        updateConnectionStatus('Connecting...', 'yellow-light', true);
        DOM.buttons.connect.disabled = true;

        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            });

            console.log(`[LOG] Successfully found device: ${device.name}`);
            updateConnectionStatus(`Connected to ${device.name}`, 'green-light');
            
        } catch (error) {
            console.error(`[ERROR] Bluetooth connection failed:`, error);
            updateConnectionStatus('Disconnected', 'red-light');
        } finally {
            DOM.buttons.connect.disabled = false;
        }
    }; // End of connectToDevice function
    
    // ====================================================================
    // 6. Event Handlers
    // ====================================================================

    /**
     * @description Handles the click event for all buttons.
     * @param {Event} event - The click event object.
     */
    const handleButtonClick = (event) => {
        const target = event.target;
        const buttonId = target.id;
        
        console.log(`[DEBUG] Button clicked: ${buttonId}`);

        if (target.classList.contains('btn')) {
            switch (buttonId) {
                case DOM.buttons.connect.id:
                    connectToDevice();
                    break;
                case DOM.buttons.practiceMode.id:
                    showScreen(DOM.screens.practice.id);
                    resetPracticeMode();
                    break;
                case DOM.buttons.game1.id:
                    showScreen(DOM.screens.game1.id);
                    resetGame1();
                    break;
                case DOM.buttons.game2.id:
                    showScreen(DOM.screens.game2.id);
                    resetGame2();
                    break;
                case DOM.buttons.settings.id:
                    showScreen(DOM.screens.settings.id);
                    break;
                case DOM.buttons.correct.id:
                    if (appState.practiceCount < 10) {
                        appState.practiceCount++;
                        DOM.displays.practiceCount.textContent = appState.practiceCount;
                        if (appState.practiceCount === 10) {
                            DOM.displays.practiceFeedback.textContent = "Perfect, you are doing great!";
                        }
                    }
                    break;
                case DOM.buttons.game1Start.id:
                    startTimer(180, DOM.displays.game1Timer, () => {
                        clearInterval(appState.game1ScoreInterval);
                        DOM.displays.game1Feedback.textContent = getGame1Feedback(appState.game1Score);
                    });
                    clearInterval(appState.game1ScoreInterval);
                    appState.game1ScoreInterval = setInterval(() => {
                        appState.game1Score++;
                        DOM.displays.game1Score.textContent = appState.game1Score;
                    }, 1000);
                    break;
                case DOM.buttons.game2Start.id:
                    startTimer(60, DOM.displays.game2Timer, () => {
                        clearInterval(appState.game2WordInterval);
                        DOM.displays.game2Feedback.textContent = getGame2Feedback(appState.game2Score);
                    });
                    clearInterval(appState.game2WordInterval);
                    appState.game2WordInterval = setInterval(() => {
                        appState.game2Score++;
                        DOM.displays.game2Score.textContent = appState.game2Score;
                        appState.currentWordIndex = (appState.currentWordIndex + 1) % appState.words.length;
                        DOM.displays.currentWord.textContent = appState.words[appState.currentWordIndex];
                    }, 5000);
                    break;
                case DOM.buttons.lightMode.id:
                    DOM.body.classList.remove('dark-mode');
                    DOM.body.classList.add('light-mode');
                    break;
                case DOM.buttons.darkMode.id:
                    DOM.body.classList.remove('light-mode');
                    DOM.body.classList.add('dark-mode');
                    break;
            } // End of switch
        } // End of if
        
        // Handle back button clicks
        if (target.classList.contains('back-btn')) {
            switch (target.id) {
                case DOM.backButtons.practice.id:
                case DOM.backButtons.game1.id:
                case DOM.backButtons.game2.id:
                case DOM.backButtons.settings.id:
                    showScreen(DOM.screens.modeSelection.id, true);
                    break;
            } // End of switch
        } // End of if
    }; // End of handleButtonClick function
    
    // ====================================================================
    // 7. Initial Setup and Event Listeners
    // ====================================================================

    // Set initial screen and container height on page load.
    DOM.appContainer.style.height = `${appState.screenHeights[appState.activeScreenId]}px`;
    DOM.screens.modeSelection.classList.add('active');

    // Centralized event listener for all button clicks.
    DOM.appContainer.addEventListener('click', handleButtonClick);

    // Particle background animation logic
    const createParticles = () => {
        for (let i = 0; i < appState.particleSettings.count; i++) {
            const particle = document.createElement('span');
            
            // Add a common particle class and a random shape class
            const randomShape = appState.particleShapes[Math.floor(Math.random() * appState.particleShapes.length)];
            particle.classList.add('particle', randomShape);
            
            // Randomize size within the defined range
            const size = Math.random() * (appState.particleSettings.sizeRange[1] - appState.particleSettings.sizeRange[0]) + appState.particleSettings.sizeRange[0];

            // Conditionally apply sizing based on the shape
            if (randomShape === 'shape-triangle') {
                // For triangles, we use borders to create the shape and size
                // Set the border-bottom width to the particle's size
                const color = window.getComputedStyle(particle).getPropertyValue('background-color');
                const halfSize = size / 2;
                particle.style.borderLeft = `${halfSize}px solid transparent`;
                particle.style.borderRight = `${halfSize}px solid transparent`;
                particle.style.borderBottom = `${size}px solid ${color}`;
            } else {
                // For other shapes, use width and height as normal
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            }

            // Randomize position within the screen
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            
            // Give each particle a slight, random initial velocity
            const vx = (Math.random() - 0.5) * 0.5;
            const vy = (Math.random() - 0.5) * 0.5;

            const particleData = {
                element: particle,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
            };

            appState.particles.push(particleData);
            DOM.particleContainer.appendChild(particle);
        } // End of for loop
    }; // End of createParticles function

    const animateParticles = () => {
        // Debounce mouse movement to calculate acceleration
        const dx = appState.mouse.x - appState.mouse.prevX;
        const dy = appState.mouse.y - appState.mouse.prevY;
        appState.mouse.prevX = appState.mouse.x;
        appState.mouse.prevY = appState.mouse.y;

        const accelerationX = dx * appState.particleSettings.mouseSensitivity;
        const accelerationY = dy * appState.particleSettings.mouseSensitivity;
        
        appState.particles.forEach(p => {
            // Apply acceleration to velocity
            p.vx += accelerationX;
            p.vy += accelerationY;

            // Dampen velocity over time
            p.vx *= 0.98;
            p.vy *= 0.98;

            // Update particle position
            p.x += p.vx;
            p.y += p.vy;

            // Wrap particles around the screen
            if (p.x < -10) p.x = window.innerWidth + 10;
            if (p.x > window.innerWidth + 10) p.x = -10;
            if (p.y < -10) p.y = window.innerHeight + 10;
            if (p.y > window.innerHeight + 10) p.y = -10;

            // Apply transform for performance
            p.element.style.transform = `translate(${p.x}px, ${p.y}px)`;
        }); // End of forEach loop

        requestAnimationFrame(animateParticles);
    }; // End of animateParticles function

    window.addEventListener('mousemove', (e) => {
        appState.mouse.x = e.clientX;
        appState.mouse.y = e.clientY;
    });

    createParticles();
    animateParticles();

    console.log("[LOG] --- Speechester 1000 Initialization Complete ---");

}); // End of DOMContentLoaded event listener