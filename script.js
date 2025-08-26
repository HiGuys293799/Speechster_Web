/*
 * Speechster 1000 - Main Application Logic
 * Version 2.0 - Fixed pathing for user folders
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

/**
 * @description A centralized function for writing data to the Firebase Realtime Database.
 * @param {string} fullPath - The complete path to the data location.
 * @param {object} dataToWrite - The content to write.
 */
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
// User Registration and Login
// ====================================================================

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
        await updateProfile(user, { displayName: username });
        await writeToDB(`users/${designation}s/${user.uid}`, {
            username: username,
            email: email,
            designation: designation
        });
        if (designation === 'patient') {
            await writeToDB(`users/${designation}s/${user.uid}/data`, {
                "Practice": { "placeholder": true },
                "Games": {
                    "Game1": { "placeholder": true },
                    "Game2": { "placeholder": true }
                },
                "Settings": { "placeholder": true }
            });
        }
        console.log("Registration successful!");
    } catch (error) {
        console.error("Error during registration:", error.message);
    }

    if (designation === 'patient'){window.location.href = "/patient/patient.html";};
};

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

        // Fetch user's designation to determine the correct path
        const userRef = ref(db, `users/patients/${user.uid}`);
        const userSnapshot = await get(userRef);
        let userData = userSnapshot.val();

        if (!userData) {
            const doctorRef = ref(db, `users/doctors/${user.uid}`);
            const doctorSnapshot = await get(doctorRef);
            userData = doctorSnapshot.val();
        }

        if (!userData) {
             throw new Error("User data not found in either patients or doctors collection.");
        }

        console.log("Login successful!");
        console.log(`User Logged In:`);
        console.log(`  - Username: ${userData.username}`);
        console.log(`  - Email: ${userData.email}`);
        console.log(`  - User UID: ${user.uid}`);
        console.log(`  - Designation: ${userData.designation}`);

        // Only create the data structure if the user is a patient AND the 'data' node doesn't exist
        if (userData.designation === 'patient') {
            const dataRef = ref(db, `users/patients/${user.uid}/data`);
            const dataSnapshot = await get(dataRef);
            if (!dataSnapshot.exists()) {
                console.log("[LOG] Creating patient data structure...");
                await writeToDB(`users/patients/${user.uid}/data`, {
                    "Practice": { "placeholder": true },
                    "Games": {
                        "Game1": { "placeholder": true },
                        "Game2": { "placeholder": true }
                    },
                    "Settings": { "placeholder": true }
                });
                console.log("[LOG] Patient data structure created successfully.");
            } else {
                console.log("[LOG] Patient data structure already exists.");
            }
            // Redirect patient to their specific dashboard
            window.location.href = "/patient/patient.html";
        }
        
    } catch (error) {
        console.error("Error during login:", error.message);
    }

    if (designation === 'patient'){window.location.href = "/patient/patient.html";};
};

window.logoutUser = async () => {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
        // Redirect to the login page or main index.
        window.location.href = "index.html"; 
    } catch (error) {
        console.error("Error during logout:", error.message);
    }
};

// ====================================================================
// Patient-Specific Functions
// ====================================================================
window.fetchAndDisplayPatientData = async () => {
    const patientDataContainer = document.getElementById('patient-info-container');
    patientDataContainer.innerHTML = '<h2>Loading Patient Data...</h2>';

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log(`[LOG] Authenticated as patient: ${user.uid}`);
            const dataPath = `users/patients/${user.uid}/data`;
            const dataRef = ref(db, dataPath);
            
            try {
                const snapshot = await get(dataRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log(`[LOG] Data retrieved successfully:`, data);
                    
                    patientDataContainer.innerHTML = '<h2>My Progress</h2><hr>';
                    for (const key in data) {
                        if (data.hasOwnProperty(key)) {
                            const section = document.createElement('div');
                            section.className = 'data-section';
                            
                            const heading = document.createElement('h3');
                            heading.textContent = key;
                            section.appendChild(heading);
                            
                            const ul = document.createElement('ul');
                            for (const subKey in data[key]) {
                                if (data[key].hasOwnProperty(subKey)) {
                                    const li = document.createElement('li');
                                    li.textContent = `${subKey}: ${JSON.stringify(data[key][subKey])}`;
                                    ul.appendChild(li);
                                }
                            }
                            section.appendChild(ul);
                            patientDataContainer.appendChild(section);
                        }
                    }
                } else {
                    console.warn(`[WARN] No data found at path: ${dataPath}`);
                    patientDataContainer.innerHTML = '<h2>No Data Found</h2><p>Looks like there is no progress data recorded yet. Please start practicing or playing games!</p>';
                }
            } catch (error) {
                console.error("[ERROR] Failed to fetch patient data:", error.message);
                patientDataContainer.innerHTML = '<h2>Error</h2><p>Failed to retrieve data. Please try again later.</p>';
            }
        } else {
            console.warn("[WARN] No user is authenticated. Redirecting to home.");
            patientDataContainer.innerHTML = '<h2>Unauthorized</h2><p>You must be logged in to view this page. Redirecting...</p>';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    });
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
    };

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
            mouseAttraction: 0.05,
            mouseFollowDamping: 0.7,
            randomness: 0.1,
            randomSpeed: 0.5,
        },
        particleShapes: ['shape-circle']
    };

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
        if(DOM.screens.modeSelection) DOM.screens.modeSelection.classList.add('active');
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
      } else {
        console.log("[WARN] Disconnected from Firebase Realtime Database.");
      }
    });

    console.log("[LOG] --- Speechester 1000 Initialization Complete ---");

    // Call fetchAndDisplayPatientData if on the patient page
    if(document.getElementById('patient-info-container')) {
        fetchAndDisplayPatientData();
    }
});

const sendDataOnUnload = (url, data) => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(url, blob);
        if (!success) console.warn("sendBeacon failed. Data may not have been sent.");
    } else {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(blob);
    }
};