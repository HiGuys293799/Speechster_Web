// Toast sound offsets (ms). Positive = play before toast, Negative = delay after toast
const TOAST_SOUND_LEADINS = {
  success: 930,  // 1s before toast
  warning: 100,   // 0.7s before toast
  info:    300,    // 0.3s before toast
  "critical error": 1500,
  "excellent!": 930,
  "you can do better!": 100,
};

// Toast sound sources (host locally in /sounds/toasts/)
const TOAST_SOUNDS = {
  success: "/sounds/toasts/success.mp3",
  "critical error":   "/sounds/toasts/error.mp3",
  warning: "/sounds/toasts/warning.mp3",
  info:    "/sounds/toasts/info.mp3",
  "excellent!": "/sounds/toasts/success.mp3",
  "you can do better!": "/sounds/toasts/warning.mp3",
};

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.AudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Add a constant to hold the silent audio element
const silenceAudio = document.getElementById("silence");

// Application State
const AppState = {
  currentScreen: 'auth-screen',
  isAuthenticated: false,
  user: null,
  selectedPatientId: null,
  debugMode: false,
  scores: {
    practice: 0,
    game1: 0,
    game2: 0,
  },
};

// Unlock audio on first interaction and start silent sound
["click", "touchstart", "keydown"].forEach(evt => {
  window.addEventListener(evt, () => {
    initAudioContext();
    if (silenceAudio) {
      silenceAudio.play();
    }
  }, { once: true });
});


// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4o7uIHSqRChe0k5LZOfnFDCr-vBWoqvY",
  authDomain: "speechster-1000.firebaseapp.com",
  databaseURL: "https://speechster-1000-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "speechster-1000",
  storageBucket: "speechster-1000.firebasestorage.app",
  messagingSenderId: "543492593404",
  appId: "1:543492593404:web:df0f06a3db1af716626979",
  measurementId: "G-RM7GFYFZB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Export to global scope for other scripts
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseModules = {
  ref,
  set,
  get,
  update,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  uploadFile,
  retrieveFile,
  writeToDB,
  writeToDB_DEPRICATED,
  handleLogout,
  selectPatient,
  unassignPatient,
  addEvaluation,
  increaseScore,
  saveDBData,
  AppState,
  connectToDevice,
};

// DOM Elements
const elements = {
  screens: document.querySelectorAll('.screen'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  loginMessage: document.getElementById('login-message'),
  registerMessage: document.getElementById('register-message'),
  logoutBtn: document.getElementById('logout-btn'),
  practiceCount: document.getElementById('practice-count'),
  practiceFeedback: document.getElementById('practice-feedback'),
  lightModeBtn: document.getElementById('light-mode-btn'),
  darkModeBtn: document.getElementById('dark-mode-btn'),
  practiceScreen: document.getElementById('practice-screen'),
  game1Screen: document.getElementById('game-screen-1'),
  game2Screen: document.getElementById('game-screen-2'),
  backgroundAudio: document.getElementById('background-audio'),
  soundSettings: document.getElementById('sound-settings'),
  soundSettingsBackBtn: document.getElementById('sound-settings-back'),
  practiceScoreDisplay: document.getElementById('practice-score'),
  game1ScoreDisplay: document.getElementById('game-1-score'),
  game2ScoreDisplay: document.getElementById('game-2-score'),
  connectBluetoothBtn: document.getElementById('bt-connect-btn'),
};

const backgroundAudio = document.getElementById("background-audio");

// --- Global Audio Amplification Setup ---
let audioCtx = new (window.AudioContext || window.AudioContext)();
const gainNode = audioCtx.createGain();
gainNode.gain.value = 1.0; // default = normal volume
gainNode.connect(audioCtx.destination);

// Unlock AudioContext on first user click (autoplay policy)
["click", "touchstart", "keydown"].forEach(evt => {
  window.addEventListener(evt, () => {
    if (audioCtx.state === "suspended") audioCtx.resume();
  }, { once: true });
});

// Connect background music through gainNode
const backgroundSource = audioCtx.createMediaElementSource(backgroundAudio);
backgroundSource.connect(gainNode);

// --- Volume Slider Integration ---
const volumeSlider = document.getElementById("volume-slider");
if (volumeSlider) {
  volumeSlider.min = 0;
  volumeSlider.max = 200;

  const savedVolume = localStorage.getItem("masterVolume");
  if (savedVolume !== null) {
    volumeSlider.value = savedVolume;
    gainNode.gain.value = savedVolume / 100;
  } else {
    volumeSlider.value = 100;
  }

  volumeSlider.addEventListener("input", (e) => {
    const value = e.target.value;
    gainNode.gain.value = value / 100; // 0–200 → 0.0–2.0
    localStorage.setItem("masterVolume", value);
  });
}


// Navigation Functions
// main.js

// In main.js, inside the navigateToScreen function
function navigateToScreen(screenId) {
  const appContainer = document.getElementById('app-container');
  const targetScreen = document.getElementById(screenId);

  // Hide all screens first
  elements.screens.forEach(screen => {
    screen.classList.remove('active');
  });

  // Wait for the DOM to update with the new screen's content
  requestAnimationFrame(() => {
    // Show the requested screen
    if (targetScreen) {
      targetScreen.classList.add('active');
      AppState.currentScreen = screenId;

      // Calculate and set the new height for the app container
      const contentHeight = targetScreen.scrollHeight + 40; // Add padding
      appContainer.style.height = `${contentHeight}px`;

      // Update browser history
      // window.history.pushState({ screen: screenId }, '', `#${screenId}`);
    }
  });
}

// Back button handlers
function setupBackButtons() {
  const backButtons = document.querySelectorAll('.back-btn');
  backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToScreen('mode-selection-screen');
    });
  });
}

// Message display utility
function showMessage(element, message, isError = true) {
  if (element) {
    element.textContent = message;
    element.style.color = isError ? '#e67c7c' : '#28a745';

    // Auto-clear success messages after 3 seconds
    if (!isError) {
      setTimeout(() => {
        element.textContent = '';
      }, 3000);
    }
  }
}

// File Storage Functions
/**
 * Reads a file and returns its data as a Base64 string.
 * @param {File} file The file to read.
 * @returns {Promise<string>} A promise that resolves with the Base64 string.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Uploads a file as a Base64 string to the Realtime Database.
 * @param {File} file The file to upload.
 * @param {string} filePath The path where the Base64 data will be stored (e.g., 'audio/user-id/recording').
 * @returns {Promise<void>}
 */
async function uploadFile(file, filePath) {
  try {
    const base64Data = await fileToBase64(file);
    await window.firebaseModules.writeToDB(filePath, base64Data);
    console.log("File uploaded successfully to Realtime Database.");
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Retrieves a file's Base64 string from the Realtime Database.
 * @param {string} filePath The path of the file to retrieve.
 * @returns {Promise<string|null>} A promise that resolves with the Base64 string or null if not found.
 */
async function retrieveFile(filePath) {
  try {
    const fileRef = ref(window.firebaseDB, filePath);
    const snapshot = await get(fileRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No data found at path:", filePath);
      return null;
    }
  } catch (error) {
    console.error("Error retrieving file:", error);
    throw error;
  }
}

// Data Writing Functions

/**
 * Writes data to the database for a specific patient. Only callable by a doctor.
 * @param {string} patientId The ID of the patient.
 * @param {string} folderPath The path of the folder relative to the patient's data node.
 * @param {boolean} isDirectory If true, creates a folder.
 * @param {string} [fileName] The name of the file (required if isDirectory is false).
 * @param {any} [fileContents] The contents to save (required if isDirectory is false).
 */
async function writeToDB_DEPRICATED(patientId, folderPath, isDirectory, fileName, fileContents) {
  // Wait for AppState.user to be populated before running this check
  if (!AppState.user || AppState.user.designation !== 'doctor') {
    console.error('Permission denied: Only doctors can write data to patient profiles.');
    return;
  }

  const { ref, set } = window.firebaseModules;
  const basePath = `users/patients/${patientId}/${folderPath}`;

  if (isDirectory) {
    const folderRef = ref(window.firebaseDB, basePath);
    await set(folderRef, { 'ignore': true });
    console.log(`Folder created at: ${basePath}`);
  } else {
    if (!fileName || typeof fileContents === 'undefined') {
      console.error('Error: fileName and fileContents are required for writing a file.');
      return;
    }
    const fileRef = ref(window.firebaseDB, `${basePath}/${fileName}`);
    await set(fileRef, fileContents);
    console.log(`File '${fileName}' written to: ${basePath}`);
  }
}

/**
 * Writes data to the database at a specified path. Can perform single-path sets or multi-path updates.
 * @param {string} path The full database path (e.g., 'users/patients/patient123/data').
 * @param {any} data The data to be written. Can be a value for a set or an object for a multi-path update.
 */
async function writeToDB(path, data) {
  const { ref, set, update } = window.firebaseModules;

  if (typeof path !== 'string' || !path) {
    console.error('Error: A valid path string is required for writing to the database.');
    return;
  }

  try {
    const dataRef = ref(window.firebaseDB, path);
    if (typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length > 1) {
      // If the data object has multiple keys, treat it as a multi-path update
      await update(dataRef, data);
      console.log(`Data updated successfully at path: ${path}`);
    } else {
      // Otherwise, perform a simple set operation
      await set(dataRef, data);
      console.log(`Data set successfully at path: ${path}`);
    }
  } catch (error) {
    console.error(`Error writing data to path '${path}':`, error);
    throw error;
  }
}

/**
 * Saves game score data to the Firebase Realtime Database.
 * @param {string} mode - The game mode to save: 'practice', 'game1', or 'game2'.
 */
async function saveDBData(mode) {
  // Check for a valid patient ID
  if (!AppState.selectedPatientId) {
    showToast("warning", "No patient selected. Cannot save data.");
    return;
  }
  
  // Check if the mode is valid and has an associated score
  if (!AppState.scores.hasOwnProperty(mode)) {
    showToast("error", `Invalid mode provided: ${mode}. Cannot save data.`);
    return;
  }

  const patientId = AppState.selectedPatientId;
  const sessionId = `session-${new Date().getTime()}`;
  const path = `users/patients/${patientId}/data/${mode}/${sessionId}`;

  if (mode === "practice") {
    try {
      const payload = {
      "successSpoken": AppState.scores[mode],
      }

      await writeToDB(path, payload);
      showToast("success", `Data saved for ${mode} (session ${sessionId})`);

  } catch (error) {
      console.error("Failed to save data:", error);
      showToast("error", "Failed to save data. See console for details.");
    }

  } else if (mode === "game1") {
    try {
      const payload = {
      "successTouch": AppState.scores[mode],
      }

      await writeToDB(path, payload);
      showToast("success", `Data saved for ${mode} (session ${sessionId})`);

  } catch (error) {
      console.error("Failed to save data:", error);
      showToast("error", "Failed to save data. See console for details.");
    }
  } else if (mode === "game2") {
    try {
      const payload = {
      "successSpoken": AppState.scores[mode],
      }

      await writeToDB(path, payload);
      showToast("success", `Data saved for ${mode} (${sessionId})`);

  } catch (error) {
      console.error("Failed to save data:", error);
      showToast("error", "Failed to save data. See console for details.");
    }
  }

/**  try {
    const patientId = AppState.selectedPatientId;
    const sessionId = `session-${new Date().getTime()}`;
    
    const path = `users/patients/${patientId}/data/${mode}/${sessionId}`;
    
    // Corrected payload to use 'successTouches'
    const payload = {
      "successTouches": AppState.scores[mode],
    };

    // Use the existing writeToDB function to save the data
    await writeToDB(path, payload);
    showToast("success", `Data saved for ${mode} (session ${sessionId})`);
  } catch (error) {
    console.error("Failed to save data:", error);
    showToast("error", "Failed to save data. See console for details.");
  } */
} 


// Authentication Functions
async function handleLogin(email, password) {
  try {
    const { signInWithEmailAndPassword } = window.firebaseModules;
    await signInWithEmailAndPassword(window.firebaseAuth, email, password);
    showToast('success',`Logged In as ${email}`)
    console.log("Logged in as", email)
    return true;
  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Login failed. Please try again.';
    if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    }

    showToast('warning',errorMessage)
    return false;
  }
}

async function handleRegistration(username, email, password, designation) {
  try {
    const { createUserWithEmailAndPassword } = window.firebaseModules;
    const userCredential = await createUserWithEmailAndPassword(
      window.firebaseAuth, email, password,
    );

    // Save user data to the correct, designation-specific path using writeToDB
    const userPath = `users/${designation}s/${userCredential.user.uid}`;
    await window.firebaseModules.writeToDB(userPath, {
      username,
      email,
      designation,
      createdAt: Date.now()
    });

    // If the new user is a patient, create their base data folders
    if (designation === 'patient') {
      const patientDataPath = `users/patients/${userCredential.user.uid}/data`;
      await window.firebaseModules.writeToDB(`${patientDataPath}/Games/Game1`, { 'placeholder': true });
      await window.firebaseModules.writeToDB(`${patientDataPath}/Games/Game2`, { 'placeholder': true });
      await window.firebaseModules.writeToDB(`${patientDataPath}/Practice`, { 'placeholder': true });
      await window.firebaseModules.writeToDB(`${patientDataPath}/Settings`, { 'placeholder': true });
    }

    await handleLogin(email, password);
    showToast('success','Registration successful! Redirecting...');
    // showMessage(elements.registerMessage, 'Registration successful! Redirecting...', false);


    return true;

  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    }

    showMessage(elements.registerMessage, errorMessage);
    return false;
  }
}

async function handleLogout() {
  try {
    const { signOut } = window.firebaseModules;
    await signOut(window.firebaseAuth);
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please try again.');
  }
}


/**
 * Saves an evaluation session for the selected patient.
 * @param {string} sessionId A unique ID for this session (e.g., 'session1').
 * @param {number} score The evaluation score.
 * @param {string} extraInfo Additional notes from the doctor.
 */
async function addEvaluation(sessionId, score, extraInfo) {
  if (!AppState.user || AppState.user.designation !== 'doctor') {
    console.error('Current user is not a doctor or not authenticated.');
    return;
  }

  if (!AppState.selectedPatientId) {
    console.error('No patient selected. Use selectPatient(patientId) first.');
    return;
  }

  const doctorId = AppState.user.uid;
  const patientId = AppState.selectedPatientId;

  try {
    const path = `patientData/${patientId}/sessions/${sessionId}`;
    const sessionData = {
      score,
      extraInfo,
      by: doctorId,
      timestamp: serverTimestamp()
    };

    await window.firebaseModules.writeToDB(path, sessionData);
    console.log(`Evaluation saved for patient ${patientId}, session ${sessionId}`);
  } catch (error) {
    console.error('Error saving evaluation:', error);
    alert('Failed to save evaluation. Please try again.');
  }
}

// Theme Management
function setupThemeSwitcher() {
  if (elements.lightModeBtn) {
    elements.lightModeBtn.addEventListener('click', () => {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light-mode');
    });
  }

  if (elements.darkModeBtn) {
    elements.darkModeBtn.addEventListener('click', () => {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark-mode');
    });
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.classList.add(savedTheme);
  }
}

// Mode Selection Handlers
function setupModeSelection() {
  const practiceBtn = document.getElementById('practice-mode-btn');
  const gameBtn = document.getElementById('game-mode-btn');
  const game1Btn = document.getElementById('game-mode-btn-1');
  const game2Btn = document.getElementById('game-mode-btn-2');
  const settingsBtn = document.getElementById('settings-btn');
  const soundSettingsBtn = document.getElementById('sound-settings-btn')

  if (practiceBtn) {
    practiceBtn.addEventListener('click', () => navigateToScreen('practice-screen'));
  }

  if (gameBtn) {
    gameBtn.addEventListener('click', () => navigateToScreen('game-selection-screen'));
  }

  if (game1Btn) {
    game1Btn.addEventListener('click', () => navigateToScreen('game-screen-1'));
  }

  if (game2Btn) {
    game2Btn.addEventListener('click', () => navigateToScreen('game-screen-2'));
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => navigateToScreen('settings-screen'));
  }

  if (soundSettingsBtn) {
    soundSettingsBtn.addEventListener('click', () => navigateToScreen('sound-settings'))
  }

  // New Timer Logic for Games
  const game1StartBtn = document.getElementById('ready-btn');
  const game1TimerDisplay = document.getElementById('game-1-timer');
  const game2StartBtn = document.getElementById('start-game-2');
  const game2TimerDisplay = document.getElementById('game-2-timer');

  if (game1StartBtn) {
    game1StartBtn.addEventListener('click', () => {
      // Game 1 Timer: 3 minutes (180 seconds)
      startTimer(180, game1TimerDisplay);
    });
  }

  if (game2StartBtn) {
    game2StartBtn.addEventListener('click', () => {
      // Game 2 Timer: 1 minute (60 seconds)
      startTimer(60, game2TimerDisplay);
    });
  }
}

function startTimer(duration, display) {
  let timer = duration;
  let minutes, seconds;
  const gameInterval = setInterval(() => {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      clearInterval(gameInterval);
      display.textContent = "00:00";
      console.log("Time's up!");
      // Add any end-of-game logic here
    }
  }, 1000);
}

// Debug Mode

function createDebugButton(text) {
  const button = document.createElement('button');
  button.textContent = text;
  button.classList.add('btn', 'debug-btn');
  return button;
}

window.enableDebugMode = function() {
  if (AppState.debugMode) {
    console.log("Debug mode is already enabled.");
    return;
  }
  AppState.debugMode = true;
  console.log("Debug mode enabled. 'Increase Score' buttons should appear on Practice, Game 1, and Game 2 screens.");

  const practiceScoreDisplay = document.getElementById('practice-count');
  const game1ScoreDisplay = document.getElementById('game-1-score');
  const game2ScoreDisplay = document.getElementById('game-2-score');

  // Add "Increase Score" button to Practice Mode
  const practiceDebugBtn = createDebugButton("Increase Score");
  elements.practiceScreen.querySelector('.button-container').appendChild(practiceDebugBtn);
  practiceDebugBtn.addEventListener('click', async () => {
    const sessionId = `session-${Date.now()}`;
    if (AppState.selectedPatientId && sessionId) {
      const scoreRef = ref(window.firebaseDB, `users/patients/${AppState.selectedPatientId}/data/practice/sessions/${sessionId}/correctAttemps`);
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : 0;
      const path = `users/patients/${AppState.selectedPatientId}/data/practice/sessions/${sessionId}`;
      const data = { correctAttemps: currentScore + 10 };
      await writeToDB(path, data);
      practiceScoreDisplay.textContent = (parseInt(practiceScoreDisplay.textContent, 10) || 0) + 10;
      console.log(`Score increased for Practice Mode. New score: ${parseInt(practiceScoreDisplay.textContent, 10)}`);
    }
  });

  // Add "Increase Score" button to Game 1
  const game1DebugBtn = createDebugButton("Increase Score");
  elements.game1Screen.querySelector('.button-container').appendChild(game1DebugBtn);
  game1DebugBtn.addEventListener('click', async () => {
    const sessionId = `session-${Date.now()}`;
    if (AppState.selectedPatientId && sessionId) {
      const scoreRef = ref(window.firebaseDB, `users/patients/${AppState.selectedPatientId}/data/games/game1/sessions/${sessionId}/finalScore`);
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : 0;
      const path = `users/patients/${AppState.selectedPatientId}/data/games/game1/sessions/${sessionId}`;
      const data = { finalScore: currentScore + 10 };
      await writeToDB(path, data);
      game1ScoreDisplay.textContent = (parseInt(game1ScoreDisplay.textContent, 10) || 0) + 10;
      console.log(`Score increased for Game 1. New score: ${parseInt(game1ScoreDisplay.textContent, 10)}`);
    }
  });

  // Add "Increase Score" button to Game 2
  const game2DebugBtn = createDebugButton("Increase Score");
  elements.game2Screen.querySelector('.button-container').appendChild(game2DebugBtn);
  game2DebugBtn.addEventListener('click', async () => {
    const sessionId = `session-${Date.now()}`;
    if (AppState.selectedPatientId && sessionId) {
      const scoreRef = ref(window.firebaseDB, `users/patients/${AppState.selectedPatientId}/data/games/game2/sessions/${sessionId}/finalScore`);
      const snapshot = await get(scoreRef);
      const currentScore = snapshot.exists() ? snapshot.val() : 0;
      const path = `users/patients/${AppState.selectedPatientId}/data/games/game2/sessions/${sessionId}`;
      const data = { finalScore: currentScore + 10 };
      await writeToDB(path, data);
      game2ScoreDisplay.textContent = (parseInt(game2ScoreDisplay.textContent, 10) || 0) + 10;
      console.log(`Score increased for Game 2. New score: ${parseInt(game2ScoreDisplay.textContent, 10)}`);
    }
  });
};


// Initialize the application
function initApp() {
  // Set up event listeners
  if (elements.loginForm) {
    elements.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      await handleLogin(email, password);
    });

  // Is Bluetooth Supported?
  isBluetoothSupported();
  }

  if (elements.registerForm) {
    elements.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const designation = document.getElementById('register-designation').value;
      await handleRegistration(username, email, password, designation);
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }

  // Set up navigation
  setupBackButtons();
  setupModeSelection();
  setupThemeSwitcher();

  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screen) {
      navigateToScreen(event.state.screen);
    }
  });

  // Check initial hash for deep linking
  const initialHash = window.location.hash.substring(1);
  if (initialHash && document.getElementById(initialHash)) {
    navigateToScreen(initialHash);
  }

  // Monitor auth state
  const { onAuthStateChanged, ref, get } = window.firebaseModules;

  onAuthStateChanged(window.firebaseAuth, async (user) => {
    if (user) {
      // First, set the user object. We don't have the designation yet.
      AppState.isAuthenticated = true;
      AppState.user = { uid: user.uid, email: user.email }; // Basic user info

      // Now, get the designation from the database
      let userRef;
      let snapshot;
      let userData;

      // Try to get user data from the 'patients' path
      userRef = ref(window.firebaseDB, `users/patients/${user.uid}`);
      snapshot = await get(userRef);
      if (snapshot.exists()) {
        userData = snapshot.val();
        // Update AppState.user with the full data
        AppState.user = { ...AppState.user, ...userData };
        if (AppState.user.designation === 'patient') {
          window.location.href = 'patients/patient.html';
          return;
        }
      }

      // If not found in 'patients', try the 'doctors' path
      if (!userData) {
        userRef = ref(window.firebaseDB, `users/doctors/${user.uid}`);
        snapshot = await get(userRef);
        if (snapshot.exists()) {
          userData = snapshot.val();
          // Update AppState.user with the full data
          AppState.user = { ...AppState.user, ...userData };
          if (AppState.user.designation === 'doctor') {
            navigateToScreen('mode-selection-screen');
            return;
          }
        }
      }

      // If user data is still not found, handle as a generic user
      if (!userData) {
        navigateToScreen('mode-selection-screen');
      }

    } else {
      AppState.isAuthenticated = false;
      AppState.user = null;
      if (AppState.currentScreen !== 'auth-screen') {
        navigateToScreen('auth-screen');
      }
    }
  });

  if (elements.connectBluetoothBtn) {
    elements.connectBluetoothBtn.addEventListener('click', () => {
      connectToDevice();
    });

}}

/**
 * Plays an audio element or URL through the global gainNode.
 * @param {HTMLAudioElement|string} input - Audio element or URL.
 */
function playSound(input) {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (typeof input === "string") {
    // Play sound from URL
    fetch(input)
      .then(r => r.arrayBuffer())
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(buffer => {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);
        source.start(0);
      })
      .catch(err => console.error("Error loading sound:", err));
  } else if (input instanceof HTMLMediaElement) {
    // Play <audio> element
    input.play().catch(err => console.error("Error playing media element:", err));
  }
}


// ---------------------------
// Toast Notification System
// ---------------------------

function playToastSound(type) {
  const url = TOAST_SOUNDS[type];
  if (!url) return;

  if (!audioCtx) {
    // fallback for browsers that don’t need unlock
    playSound(url);
    return;
  }

  fetch(url)
    .then(r => r.arrayBuffer())
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(buffer => {
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNode);
      source.start(0);
    });
}


function showToast(type, message) {
  const container = document.getElementById("toast-container");

  // Create toast element (but don’t attach yet!)
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error")   icon = "❌";
  if (type === "warning") icon = "⚠️";
  if (type === "Critical Error") icon = "❗";
 
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div>
      <div class="toast-header">${type.toUpperCase()}</div>
      <div class="toast-body">${message}</div>
    </div>
  `;

  const leadIn = TOAST_SOUND_LEADINS[type] ?? 0;

  if (leadIn < 0) {
    // 🔊 Play sound *before* toast
    playToastSound(type);
    setTimeout(() => container.appendChild(toast), Math.abs(leadIn));
  } else {
    // ⏱️ Delay toast until after sound
    setTimeout(() => {
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 5500);
    }, leadIn);
    playToastSound(type);
  }
}

// -----------------
// Background Sound
// -----------------

elements.backgroundAudio.volume = 0.5;

document.addEventListener('click', function() {
  playSound(backgroundAudio);
});

// ---------------------------
// Doctor High-Level Commands
// ---------------------------
async function assignPatient(patientId) {
  if (!AppState.user || AppState.user.designation !== 'doctor') {
    showToast("critical error", "Only doctors can assign patients.");
    return {
      success: false,
      message: 'Not authorized'
    };
  }
  try {
    const doctorId = AppState.user.uid;
    await writeToDB(`users/doctors/${doctorId}/assignedPatients/${patientId}`, true);
    await writeToDB(`users/patients/${patientId}/data/assignedTo`, doctorId);
    showToast("success", `Patient ${patientId} assigned`);
    AppState.selectedPatientId = patientId; // Corrected line
    return {
      success: true,
      doctorId,
      patientId
    };
  } catch (err) {
    console.error(err);
    showToast("critical error", "Failed to assign patient (check Console Logs!)");
    return {
      success: false,
      message: err.message
    };
  }
}

async function unassignPatient(patientId) {
  if (!AppState.user || AppState.user.designation !== 'doctor') {
    showToast("error", "Only doctors can unassign patients.");
    return { success: false, message: 'Not authorized' };
  }
  try {
    const doctorId = AppState.user.uid;
    const updates = {};
    updates[`users/doctors/${doctorId}/assignedPatients/${patientId}`] = null;
    updates[`users/patients/${patientId}/data/assignedTo`] = null;
    await writeToDB('/', updates);
    showToast(`✅ Patient ${patientId} unassigned.`, "success");
    return { success: true, doctorId, patientId };
  } catch (err) {
    console.error(err);
    showToast("error", "Failed to unassign patient.");
    return { success: false, message: err.message };
  }
}

function selectPatient(patientId) {
  AppState.selectedPatientId = patientId;
  showToast("info", `📌 Selected patient: ${patientId}`);
  return { success: true, patientId };
}

async function saveDataCommand(score, extraInfo = "") {
  if (!AppState.user || AppState.user.designation !== 'doctor') {
    showToast("error", "Only doctors can save data.");
    return { success: false, message: 'Not authorized' };
  }
  if (!AppState.selectedPatientId) {
    showToast("error", "No patient selected.");
    return { success: false, message: 'No patient selected' };
  }
  try {
    const doctorId = AppState.user.uid;
    const patientId = AppState.selectedPatientId;
    const sessionId = `session-${Date.now()}`;
    const path = `patientData/${patientId}/sessions/${sessionId}`;
    const payload = {
      score,
      extraInfo,
      by: doctorId,
      timestamp: serverTimestamp()
    };
    await writeToDB(path, payload);
    showToast("success", `Data saved for ${patientId} (session ${sessionId})`);
    return { success: true, patientId, sessionId, data: payload };
  } catch (err) {
    console.error(err);
    showToast("error", "Failed to save data.");
    return { success: false, message: err.message };
  }
}

// --------------------------
// New game scoring functions
// --------------------------

function updateScoreDisplay() {
  elements.practiceScoreDisplay.textContent = AppState.scores.practice;
  elements.game1ScoreDisplay.textContent = AppState.scores.game1;
  elements.game2ScoreDisplay.textContent = AppState.scores.game2;
}

/**
 * Increases the score for a specific game mode, provided it's currently active.
 * @param {string} gamemode - The game mode for which to increase the score.
 */
function increaseScore(gamemode) {
    AppState.scores[gamemode]++;
    updateScoreDisplay();
    if (AppState.scores[gamemode]%10 == 0) {
      showToast("success", `Score for ${gamemode} is now: ${AppState.scores[gamemode]}, a multiple of 10!`);
      return;
    }

    showToast("info", `Score for ${gamemode} is now: ${AppState.scores[gamemode]}`);
}

/**
 * Checks if the Web Bluetooth API is supported by the browser.
 * @returns {boolean} True if supported, false otherwise.
 */
function isBluetoothSupported() {
  console.log("Checking BT Support")
  if (!('bluetooth' in navigator)) {
    showToast("Critical Error", "Chrome with Web Bluetooth API Enabled is REQUIRED to use Bluetooth-based services.")
    console.log("BT Unsupported.")
    return;
  }
  console.log("BT Avail")
}

/**
 * Connects to a Bluetooth device and reads a characteristic's value.
 */
async function connectToDevice() {

  // These lines caused the error and have been removed
  // because the HTML elements do not exist.
  // elements.bluetoothStatus.textContent = "Scanning for devices...";
  
  try {
    // 1. Request the Bluetooth device
    const device = await navigator.bluetooth.requestDevice({acceptAllDevices: true});
    
    // This line caused the error and has been removed
    // elements.bluetoothStatus.textContent = `Connecting to "${device.name}"...`;
    
    // 2. Connect to the GATT server
    const server = await device.gatt.connect();
    
    // 3. Get the service
    // const service = await server.getPrimaryService('battery_service');
    
    // 4. Get the characteristic
    // const characteristic = await service.getCharacteristic('battery_level');
    
    // 5. Read the value from the characteristic
    const value = await characteristic.readValue();
    const batteryLevel = value.getUint8(0);
    
    // These lines caused the error and have been removed.
    // Use console.log for debugging instead.
    // elements.bluetoothStatus.textContent = `Connected! Device: ${device.name}`;
    // elements.bluetoothDataDisplay.textContent = `Battery Level: ${batteryLevel}%`;
    
    showToast("success", `Successfully connected to ${device.name}. Battery: ${batteryLevel}%`);
    console.log(`Connected to device: ${device.name}. Battery Level: ${batteryLevel}%`);
    
  } catch (error) {
    showToast("critical error", "Bluetooth connection failed. See console.");
    console.error("Bluetooth connection error:", error);
  }
}


// ---------------------------
// Add commands to global scope
// ---------------------------
Object.assign(window.firebaseModules, {
  assignPatient,
  unassignPatient,
  selectPatient,
  saveDataCommand,
  showToast,
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp)