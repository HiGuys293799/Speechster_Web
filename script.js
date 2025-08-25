/*
 * Speechster 1000 - Main Application Logic
 * Optimized, modular, and debug-friendly JavaScript.
 */

// ====================================================================
// Firebase SDK and Auth Imports
// These MUST be at the very top of the file.
// ====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    onValue, // Import the onValue function
    set 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


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
        },
        particleSettings: {
            count: 10,
            sizeRange: [10, 10],
            mouseAttraction: 0.03, // Controls the "pull" of particles towards the mouse
            mouseFollowDamping: 0.7, // Controls the "drag" or friction of the motion
            randomness: 0.1, // Dictates how erratic the random motion is
            randomSpeed: 0.5, // Controls the speed of the random motion
        },
        particleShapes: ['shape-circle']
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
    class BluetoothManager {
        /**
         * @param {object} elements - The DOM elements to update for status display.
         */
        constructor(elements) {
            this.statusLight = elements.deviceLight;
            this.statusText = elements.bluetoothStatus;
            this.connectButton = elements.connect;
            this.device = null;
        }

        /**
         * @description Updates the visual status of the device connection light and text.
         * @param {string} text - The text to display.
         * @param {string} lightClass - The class for the device light (e.g., 'green-light').
         * @param {boolean} [blinking=false] - Whether the light should blink.
         */
        updateStatus(text, lightClass, blinking = false) {
            this.statusText.textContent = text;
            this.statusLight.className = '';
            this.statusLight.classList.add(lightClass);
            if (blinking) {
                this.statusLight.classList.add('blinking');
            }
        }

        /**
         * @description Handles the Web Bluetooth connection process with service and characteristic filters.
         */
        async connect() {
            console.log("[LOG] Attempting to connect to a Bluetooth device...");

            if (!navigator.bluetooth) {
                this.updateStatus('Web Bluetooth is not supported in this browser.', 'dark-red-light');
                this.connectButton.disabled = false;
                console.error("[ERROR] Web Bluetooth is not supported.");
                return;
            }

            this.updateStatus('Connecting...', 'yellow-light', true);
            this.connectButton.disabled = true;

            const serviceUUID = 'd53c18a6-3116-417f-a81e-14325f75c174'; // REPLACE WITH YOUR SERVICE UUID
            const characteristicUUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'; // REPLACE WITH YOUR CHARACTERISTIC UUID

            try {
                this.device = await navigator.bluetooth.requestDevice({
                    filters: [{
                        services: [serviceUUID]
                    }],
                    optionalServices: [serviceUUID]
                });

                // For future functionality, you would get the service and characteristic here
                // const server = await this.device.gatt.connect();
                // const service = await server.getPrimaryService(serviceUUID);
                // const characteristic = await service.getCharacteristic(characteristicUUID);

                console.log(`[LOG] Successfully found device: ${this.device.name}`);
                this.updateStatus(`Connected to ${this.device.name}`, 'green-light');
                
            } catch (error) {
                console.error(`[ERROR] Bluetooth connection failed:`, error);
                this.updateStatus('Disconnected', 'red-light');
            } finally {
                this.connectButton.disabled = false;
            }
        }
    } // End of BluetoothManager class
    
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
                    bluetoothManager.connect();
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

    // Initialize the Bluetooth Manager
    const bluetoothManager = new BluetoothManager({
        deviceLight: DOM.status.deviceLight,
        bluetoothStatus: DOM.status.bluetoothStatus,
        connect: DOM.buttons.connect
    });

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
                originalShape: randomShape // Store the original shape
            };

            appState.particles.push(particleData);
            DOM.particleContainer.appendChild(particle);
        } // End of for loop
    }; // End of createParticles function

    /**
     * @description Checks if a particle is colliding with the app container and applies a blur class.
     */
    const checkParticleCollision = () => {
        const appRect = DOM.appContainer.getBoundingClientRect();
        appState.particles.forEach(p => {
            // Get the particle's current screen position
            const particleRect = p.element.getBoundingClientRect();

            // Check for collision using AABB (Axis-Aligned Bounding Box) method
            if (
                particleRect.x < appRect.x + appRect.width &&
                particleRect.x + particleRect.width > appRect.x &&
                particleRect.y < appRect.y + appRect.height &&
                particleRect.y + particleRect.height > appRect.y
            ) {
                p.element.classList.add('particle-blur');
            } else {
                p.element.classList.remove('particle-blur');
            }
        });
    };

    const animateParticles = () => {
        const targetX = appState.mouse.x;
        const targetY = appState.mouse.y;

        appState.particles.forEach(p => {
            // Apply random motion
            p.vx += (Math.random() - 0.5) * appState.particleSettings.randomness * appState.particleSettings.randomSpeed;
            p.vy += (Math.random() - 0.5) * appState.particleSettings.randomness * appState.particleSettings.randomSpeed;

            // Calculate spring force towards mouse or snapped button
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            
            p.vx += dx * appState.particleSettings.mouseAttraction;
            p.vy += dy * appState.particleSettings.mouseAttraction;
            
            // Apply damping (friction)
            p.vx *= appState.particleSettings.mouseFollowDamping;
            p.vy *= appState.particleSettings.mouseFollowDamping;

            // Update particle position
            p.x += p.vx;
            p.y += p.vy;

            // Wrap particles around the screen
            if (p.x < -10) p.x = window.innerWidth + 10;
            if (p.x > window.innerWidth + 10) p.x = -10;
            if (p.y < -10) p.y = window.innerHeight + 10;
            if (p.y > window.innerHeight + 10) p.y = -10;

            // Apply transform for performance
            // The use of translateZ(0) helps force hardware acceleration.
            p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
            
        }); // End of forEach loop

        // Check for collision on every animation frame
        checkParticleCollision();

        requestAnimationFrame(animateParticles);
    }; // End of animateParticles function

    window.addEventListener('mousemove', (e) => {
        appState.mouse.x = e.clientX;
        appState.mouse.y = e.clientY;
    });

    createParticles();
    animateParticles();

    // ====================================================================
    // Firebase Listeners - Moved inside DOMContentLoaded
    // ====================================================================
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log("[LOG] Successfully connected to Firebase Realtime Database.");
        DOM.status.deviceLight.classList.remove('red-light');
        DOM.status.deviceLight.classList.add('green-light');
        DOM.status.bluetoothStatus.textContent = 'Connected';
      } else {
        console.warn("[WARN] Disconnected from Firebase Realtime Database.");
        DOM.status.deviceLight.classList.remove('green-light');
        DOM.status.deviceLight.classList.add('red-light');
        DOM.status.bluetoothStatus.textContent = 'Disconnected';
      }
    });

    console.log("[LOG] --- Speechester 1000 Initialization Complete ---");

}); // End of DOMContentLoaded event listener

// ====================================================================
// Firebase Login/Registration Functions
// Add this block to your script.js file
// ====================================================================

// This is where your Firebase project's configuration will go.
// YOU MUST REPLACE ALL "YOUR_..." PLACEHOLDERS WITH YOUR ACTUAL VALUES.
const firebaseConfig = {
    apiKey: "BIzaSyC4o7uIHSqRChe0k5LZOfnFDCr-vBWoqvY.",
    authDomain: "speechster-1000.firebaseapp.com",
    projectId: "speechster-1000",
    storageBucket: "speechster-1000.appspot.com",
    messagingSenderId: "543492593404",
    appId: "1:543492593404:web:df0f06a3db1af716626979",
    databaseURL: "https://speechster-1000.asia-south2.firebasedatabase.app/"
};

// Initialize Firebase App and get Auth service
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/**
 * @description Prompts the user for credentials and registers them with Firebase.
 * This function should be called from the browser's console.
 * It's a simple, non-UI-based registration process.
 */
window.registerUser = async () => {
    const email = prompt("Please enter your email:");
    const password = prompt("Please enter your password:");
    const username = prompt("Please enter your username:");
    const designation = prompt("Are you a 'doctor' or a 'patient'?");

    if (!email || !password || !username || (designation !== 'doctor' && designation !== 'patient')) {
        console.error("Registration aborted. All fields are required and designation must be 'doctor' or 'patient'.");
        return;
    }

    try {
        console.log(`Attempting to register user: ${email}`);
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save username and designation to Firebase Auth
        await updateProfile(user, {
            displayName: username
        });

        // Save designation and username to Firebase Realtime Database
        await set(ref(db, 'users/' + user.uid), {
            username: username,
            email: email,
            designation: designation
        });

        console.log("Registration successful!");
        console.log("User:", user);

    } catch (error) {
        console.error("Error during registration:", error.message);
    }
};

/**
 * @description Prompts the user for credentials and logs them in with Firebase.
 * This function should also be called from the browser's console.
 */
window.loginUser = async () => {
    const email = prompt("Please enter your email:");
    const password = prompt("Please enter your password:");

    if (!email || !password) {
        console.error("Login aborted. Both email and password are required.");
        return;
    }

    try {
        console.log(`Attempting to log in user: ${email}`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("Login successful!");
        // Added console logs to print user details
        console.log(`User Logged In:`);
        console.log(`  - Username: ${user.displayName}`);
        console.log(`  - Email: ${user.email}`);

    } catch (error) {
        console.error("Error during login:", error.message);
    }
};
