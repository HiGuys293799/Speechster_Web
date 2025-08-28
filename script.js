/*
 * Speechster 1000 - Main Application Logic
 * Version 3.1 - Enhanced Login with Patient Redirection
 */

// ====================================================================
// Firebase SDK and Auth Imports
// ====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    onValue,
    set,
    get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

console.log("[LOG] --- Speechester 1000 Booting Up ---");

// ====================================================================
// Firebase Configuration and Initialization
// ====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyC4o7uIHSqRChe0k5LZOfnFDCr-vBWoqvY",
    authDomain: "speechster-1000.firebaseapp.com",
    projectId: "speechster-1000",
    storageBucket: "speechster-1000.appspot.com",
    messagingSenderId: "543492593404",
    appId: "1:543492593404:web:df0f06a3db1af716626979",
    databaseURL: "https://speechster-1000-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ====================================================================
// Core Database Write Function
// ====================================================================
const writeToDB = async (fullPath, dataToWrite) => {
    try {
        await set(ref(db, fullPath), dataToWrite);
        console.log(`[LOG] Successfully wrote data to path: ${fullPath}`);
    } catch (error) {
        console.error(`[ERROR] Failed to write data to database at path: ${fullPath}`, error.message);
        throw error;
    }
};

// ====================================================================
// Main Application Logic - Inside DOMContentLoaded
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("[LOG] DOM Content Loaded. Initializing app...");

    const DOM = {
        appContainer: document.getElementById('app-container'),
        body: document.body,
        particleContainer: document.getElementById('particle-container'),
        screens: {
            auth: document.getElementById('auth-screen'),
            modeSelection: document.getElementById('mode-selection-screen'),
            practice: document.getElementById('practice-screen'),
            game1: document.getElementById('game-screen-1'),
            game2: document.getElementById('game-screen-2'),
            settings: document.getElementById('settings-screen')
        },
        forms: {
            login: document.getElementById('login-form'),
            register: document.getElementById('register-form')
        },
        messages: {
            login: document.getElementById('login-message'),
            register: document.getElementById('register-message')
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
    };

    let appState = {
        activeScreenId: 'auth-screen',
        practiceCount: 0,
        game1Score: 0,
        game2Score: 0,
        currentWordIndex: 0,
        timerInterval: null,
        game1ScoreInterval: null,
        game2WordInterval: null,
        screenHeights: {
            'auth-screen': 500,
            'mode-selection-screen': 500,
            'practice-screen': 455,
            'game-screen-1': 550,
            'game-screen-2': 630,
            'settings-screen': 300
        },
        words: ["hello", "world", "apple", "banana", "cat", "dog"],
        particles: [],
        mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        particleSettings: {
            count: 10,
            sizeRange: [10, 10],
            mouseAttraction: 0.03,
            mouseFollowDamping: 0.7,
            randomness: 0.1,
            randomSpeed: 0.5,
        },
        particleShapes: ['shape-circle']
    };

    // New function to update the app's view based on authentication state
    const updateView = async (user) => {
        if (user) {
            try {
                // Fetch user's designation from the database
                const usersRef = ref(db, `users`);
                const snapshot = await get(usersRef);

                if (snapshot.exists()) {
                    let userDesignation = null;
                    const usersData = snapshot.val();
                    if (usersData.patients && usersData.patients[user.uid]) {
                        userDesignation = 'patient';
                    } else if (usersData.doctors && usersData.doctors[user.uid]) {
                        userDesignation = 'doctor';
                    }
                    
                    if (userDesignation === 'patient') {
                        // Redirect to the patient dashboard
                        window.location.href = 'patients/patient.html';
                    } else {
                        // User is a doctor or designation is unknown, show the main app interface
                        showScreen('mode-selection-screen');
                    }
                } else {
                    console.error("[ERROR] User data not found in database.");
                    showScreen('mode-selection-screen');
                }
            } catch (error) {
                console.error("[ERROR] Failed to fetch user designation:", error.message);
                showScreen('mode-selection-screen');
            }
        } else {
            // User is signed out, show the auth screen
            showScreen('auth-screen');
        }
    };

    // Firebase Authentication State Listener
    onAuthStateChanged(auth, (user) => {
        updateView(user);
    });

    // Handle Login Form Submission
    if (DOM.forms.login) {
        DOM.forms.login.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = DOM.forms.login.querySelector('#login-email').value;
            const password = DOM.forms.login.querySelector('#login-password').value;
            try {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful!");
                DOM.messages.login.textContent = ''; // Clear message on success
                // Redirection will be handled by the onAuthStateChanged listener
            } catch (error) {
                console.error("Error during login:", error.message);
                DOM.messages.login.textContent = error.message;
            }
        });
    }

    // Handle Registration Form Submission
    if (DOM.forms.register) {
        DOM.forms.register.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = DOM.forms.register.querySelector('#register-username').value;
            const email = DOM.forms.register.querySelector('#register-email').value;
            const password = DOM.forms.register.querySelector('#register-password').value;
            const designation = DOM.forms.register.querySelector('#register-designation').value;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: username });
                await writeToDB(`users/${designation}s/${user.uid}`, {
                    username: username,
                    email: email,
                    designation: designation
                });
                if (designation === 'patient') {
                    await writeToDB(`users/${designation}s/${user.uid}/data`, {
                        "Practice": { "placeholder": true },
                        "Games": { "Game1": { "placeholder": true }, "Game2": { "placeholder": true } },
                        "Settings": { "placeholder": true }
                    });
                }
                console.log("Registration successful!");
                DOM.messages.register.textContent = 'Registration successful! You can now log in.';
                // Redirection will be handled by the onAuthStateChanged listener
            } catch (error) {
                console.error("Error during registration:", error.message);
                DOM.messages.register.textContent = error.message;
            }
        });
    }

    // Function to handle logout
    window.logoutUser = async () => {
        try {
            await signOut(auth);
            console.log("User logged out successfully.");
            // View will update automatically due to onAuthStateChanged
        } catch (error) {
            console.error("Error during logout:", error.message);
        }
    };

    const showScreen = (newScreenId, isBack = false) => {
        const currentScreen = document.getElementById(appState.activeScreenId);
        const newScreen = document.getElementById(newScreenId);
        if (!newScreen) return;
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
        setTimeout(() => newScreen.classList.add('active'), 10);
        currentScreen.addEventListener('animationend', () => currentScreen.classList.remove('slide-out', 'slide-out-back'), { once: true });
        newScreen.addEventListener('animationend', () => newScreen.classList.remove('slide-in', 'slide-in-back'), { once: true });
        appState.activeScreenId = newScreenId;
    };
    // The rest of the script.js file (game logic, particle effects, etc.) remains the same.
    // ... (rest of the code from script.js) ...
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const resetPracticeMode = () => {
        appState.practiceCount = 0;
        if(DOM.displays.practiceCount) DOM.displays.practiceCount.textContent = 0;
        if(DOM.displays.practiceFeedback) DOM.displays.practiceFeedback.textContent = '';
    };

    const resetGame1 = () => {
        clearInterval(appState.timerInterval);
        clearInterval(appState.game1ScoreInterval);
        appState.game1Score = 0;
        if(DOM.displays.game1Score) DOM.displays.game1Score.textContent = 0;
        if(DOM.displays.game1Timer) DOM.displays.game1Timer.textContent = formatTime(180);
        if(DOM.displays.game1Feedback) DOM.displays.game1Feedback.textContent = "";
    };

    const resetGame2 = () => {
        clearInterval(appState.timerInterval);
        clearInterval(appState.game2WordInterval);
        appState.game2Score = 0;
        if(DOM.displays.game2Score) DOM.displays.game2Score.textContent = 0;
        if(DOM.displays.game2Timer) DOM.displays.game2Timer.textContent = formatTime(60);
        if(DOM.displays.game2Feedback) DOM.displays.game2Feedback.textContent = "";
        appState.currentWordIndex = 0;
        if(DOM.displays.currentWord) DOM.displays.currentWord.textContent = appState.words[appState.currentWordIndex];
    };

    const getGame1Feedback = (score) => {
        if (score >= 60) return "YOU ARE AN EXPERT NOW!";
        if (score >= 30) return "Well done! Nice!";
        if (score >= 20) return "Very well done! But still there is always room for improvement";
        if (score >= 10) return "Not bad but you can improve!";
        return "Keep practicing!";
    };

    const getGame2Feedback = (score) => {
        if (score >= 10) return "YOU ARE AN EXPERT NOW!";
        if (score >= 7) return "Well done! Nice!";
        if (score >= 5) return "Very well done!";
        if (score >= 3) return "Not bad but you can improve!";
        return "Keep practicing!";
    };

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
    };

    class BluetoothManager {
        constructor(elements) {
            this.statusLight = elements.deviceLight;
            this.statusText = elements.bluetoothStatus;
            this.connectButton = elements.connect;
            this.device = null;
        }
        updateStatus(text, lightClass, blinking = false) {
            this.statusText.textContent = text;
            this.statusLight.className = '';
            this.statusLight.classList.add(lightClass);
            if (blinking) this.statusLight.classList.add('blinking');
        }
        async connect() {
            if (!navigator.bluetooth) {
                this.updateStatus('Web Bluetooth is not supported in this browser.', 'dark-red-light');
                this.connectButton.disabled = false;
                return;
            }
            this.updateStatus('Connecting...', 'yellow-light', true);
            this.connectButton.disabled = true;
            const serviceUUID = 'd53c18a6-3116-417f-a81e-14325f75c174';
            try {
                this.device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: [serviceUUID] }],
                    optionalServices: [serviceUUID]
                });
                this.updateStatus(`Connected to ${this.device.name}`, 'green-light');
            } catch (error) {
                this.updateStatus('Disconnected', 'red-light');
            } finally {
                this.connectButton.disabled = false;
            }
        }
    }

    const handleButtonClick = (event) => {
        const target = event.target;
        const buttonId = target.id;
        if (target.classList.contains('btn')) {
            switch (buttonId) {
                case DOM.buttons.connect?.id: bluetoothManager.connect(); break;
                case DOM.buttons.practiceMode?.id: showScreen(DOM.screens.practice.id); resetPracticeMode(); break;
                case DOM.buttons.game1?.id: showScreen(DOM.screens.game1.id); resetGame1(); break;
                case DOM.buttons.game2?.id: showScreen(DOM.screens.game2.id); resetGame2(); break;
                case DOM.buttons.settings?.id: showScreen(DOM.screens.settings.id); break;
                case DOM.buttons.correct?.id:
                    if (appState.practiceCount < 10) {
                        appState.practiceCount++;
                        if(DOM.displays.practiceCount) DOM.displays.practiceCount.textContent = appState.practiceCount;
                        if (appState.practiceCount === 10 && DOM.displays.practiceFeedback) DOM.displays.practiceFeedback.textContent = "Perfect, you are doing great!";
                    }
                    break;
                case DOM.buttons.game1Start?.id:
                    startTimer(180, DOM.displays.game1Timer, () => {
                        clearInterval(appState.game1ScoreInterval);
                        if(DOM.displays.game1Feedback) DOM.displays.game1Feedback.textContent = getGame1Feedback(appState.game1Score);
                    });
                    clearInterval(appState.game1ScoreInterval);
                    appState.game1ScoreInterval = setInterval(() => {
                        appState.game1Score++;
                        if(DOM.displays.game1Score) DOM.displays.game1Score.textContent = appState.game1Score;
                    }, 1000);
                    break;
                case DOM.buttons.game2Start?.id:
                    startTimer(60, DOM.displays.game2Timer, () => {
                        clearInterval(appState.game2WordInterval);
                        if(DOM.displays.game2Feedback) DOM.displays.game2Feedback.textContent = getGame2Feedback(appState.game2Score);
                    });
                    clearInterval(appState.game2WordInterval);
                    appState.game2WordInterval = setInterval(() => {
                        appState.game2Score++;
                        if(DOM.displays.game2Score) DOM.displays.game2Score.textContent = appState.game2Score;
                        appState.currentWordIndex = (appState.currentWordIndex + 1) % appState.words.length;
                        if(DOM.displays.currentWord) DOM.displays.currentWord.textContent = appState.words[appState.currentWordIndex];
                    }, 5000);
                    break;
                case DOM.buttons.lightMode?.id: DOM.body.classList.remove('dark-mode'); DOM.body.classList.add('light-mode'); break;
                case DOM.buttons.darkMode?.id: DOM.body.classList.remove('light-mode'); DOM.body.classList.add('dark-mode'); break;
            }
        }
        if (target.classList.contains('back-btn')) {
            switch (target.id) {
                case DOM.backButtons.practice?.id:
                case DOM.backButtons.game1?.id:
                case DOM.backButtons.game2?.id:
                case DOM.backButtons.settings?.id:
                    showScreen(DOM.screens.modeSelection.id, true);
                    break;
            }
        }
    };

    if(DOM.appContainer) {
        DOM.appContainer.style.height = `${appState.screenHeights[appState.activeScreenId]}px`;
        if(DOM.screens.auth) DOM.screens.auth.classList.add('active');
    }

    const bluetoothManager = new BluetoothManager({
        deviceLight: DOM.status.deviceLight,
        bluetoothStatus: DOM.status.bluetoothStatus,
        connect: DOM.buttons.connect
    });

    if(DOM.appContainer) DOM.appContainer.addEventListener('click', handleButtonClick);

    const createParticles = () => {
        for (let i = 0; i < appState.particleSettings.count; i++) {
            const particle = document.createElement('span');
            const randomShape = appState.particleShapes[Math.floor(Math.random() * appState.particleShapes.length)];
            particle.classList.add('particle', randomShape);
            const size = Math.random() * (appState.particleSettings.sizeRange[1] - appState.particleSettings.sizeRange[0]) + appState.particleSettings.sizeRange[0];
            if (randomShape === 'shape-triangle') {
                const color = window.getComputedStyle(particle).getPropertyValue('background-color');
                const halfSize = size / 2;
                particle.style.borderLeft = `${halfSize}px solid transparent`;
                particle.style.borderRight = `${halfSize}px solid transparent`;
                particle.style.borderBottom = `${size}px solid ${color}`;
            } else {
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            }
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const vx = (Math.random() - 0.5) * 0.5;
            const vy = (Math.random() - 0.5) * 0.5;
            const particleData = {
                element: particle,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                originalShape: randomShape
            };
            appState.particles.push(particleData);
            if(DOM.particleContainer) DOM.particleContainer.appendChild(particle);
        }
    };

    const checkParticleCollision = () => {
        if(!DOM.appContainer) return;
        const appRect = DOM.appContainer.getBoundingClientRect();
        appState.particles.forEach(p => {
            const particleRect = p.element.getBoundingClientRect();
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
            p.vx += (Math.random() - 0.5) * appState.particleSettings.randomness * appState.particleSettings.randomSpeed;
            p.vy += (Math.random() - 0.5) * appState.particleSettings.randomness * appState.particleSettings.randomSpeed;
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            p.vx += dx * appState.particleSettings.mouseAttraction;
            p.vy += dy * appState.particleSettings.mouseAttraction;
            p.vx *= appState.particleSettings.mouseFollowDamping;
            p.vy *= appState.particleSettings.mouseFollowDamping;
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < -10) p.x = window.innerWidth + 10;
            if (p.x > window.innerWidth + 10) p.x = -10;
            if (p.y < -10) p.y = window.innerHeight + 10;
            if (p.y > window.innerHeight + 10) p.y = -10;
            p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        });
        checkParticleCollision();
        requestAnimationFrame(animateParticles);
    };

    window.addEventListener('mousemove', (e) => {
        appState.mouse.x = e.clientX;
        appState.mouse.y = e.clientY;
    });

    createParticles();
    animateParticles();

    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log("[LOG] Successfully connected to Firebase Realtime Database.");
        if(DOM.status.deviceLight) {
            DOM.status.deviceLight.classList.remove('red-light');
            DOM.status.deviceLight.classList.add('green-light');
        }
        if(DOM.status.bluetoothStatus) DOM.status.bluetoothStatus.textContent = 'Connected';
      } else {
        console.warn("[WARN] Disconnected from Firebase Realtime Database.");
        if(DOM.status.deviceLight) {
            DOM.status.deviceLight.classList.remove('green-light');
            DOM.status.deviceLight.classList.add('red-light');
        }
        if(DOM.status.bluetoothStatus) DOM.status.bluetoothStatus.textContent = 'Disconnected';
      }
    });

    console.log("[LOG] --- Speechester 1000 Initialization Complete ---");

    // Call fetchAndDisplayPatientData if on the patient page
    if(document.getElementById('patient-info-container')) {
        fetchAndDisplayPatientData();
    }
});