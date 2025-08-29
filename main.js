// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
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
  projectId: "speechster-1000",
  storageBucket: "speechster-1000.appspot.com",
  messagingSenderId: "543492593404",
  appId: "1:543492593404:web:df0f06a3db1af716626979",
  databaseURL: "https://speechster-1000-default-rtdb.europe-west1.firebasedatabase.app"
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
  writeToDbOLD,
};

// Application State
const AppState = {
  currentScreen: 'auth-screen',
  practiceCount: 0,
  isAuthenticated: false,
  user: null,
  selectedPatientId: null
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
  correctBtn: document.getElementById('correct-btn'),
  lightModeBtn: document.getElementById('light-mode-btn'),
  darkModeBtn: document.getElementById('dark-mode-btn')
};

// Navigation Functions
function navigateToScreen(screenId) {
  // Hide all screens
  elements.screens.forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show the requested screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    AppState.currentScreen = screenId;
    
    // Update browser history
    window.history.pushState({ screen: screenId }, '', `#${screenId}`);
  }
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
async function writeToDbOLD(patientId, folderPath, isDirectory, fileName, fileContents) {
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


// Authentication Functions
async function handleLogin(email, password) {
  try {
    const { signInWithEmailAndPassword } = window.firebaseModules;
    await signInWithEmailAndPassword(window.firebaseAuth, email, password);
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
    
    showMessage(elements.loginMessage, errorMessage);
    return false;
  }
}

async function handleRegistration(username, email, password, designation) {
  try {
    const { createUserWithEmailAndPassword } = window.firebaseModules;
    const userCredential = await createUserWithEmailAndPassword(
      window.firebaseAuth, email, password
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

    showMessage(elements.registerMessage, 'Registration successful! Redirecting...', false);
    
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

// Doctor-specific functions
/**
 * Assigns a patient to the currently logged-in doctor.
 * @param {string} patientId The ID of the patient to assign.
 */
async function assignPatient(patientId) {
  if (!AppState.user || AppState.user.designation !== 'doctor') {
    console.error('Current user is not a doctor or not authenticated.');
    return;
  }

  const doctorId = AppState.user.uid;
  
  try {
    // Prepare updates for both doctor and patient paths
    const updates = {};
    updates[`users/doctors/${doctorId}/assignedPatients/${patientId}`] = true;
    updates[`users/patients/${patientId}/assignedTo`] = doctorId;
    
    // Use the new writeToDB to perform the multi-path update
    await window.firebaseModules.writeToDB('', updates);
    console.log(`Patient ${patientId} successfully assigned to doctor ${doctorId}`);
    
  } catch (error) {
    console.error('Error assigning patient:', error);
    alert('Failed to assign patient. Please try again.');
  }
}

/**
 * Sets the selected patient in the application's state.
 * @param {string} patientId The ID of the patient to select.
 */
function selectPatient(patientId) {
  AppState.selectedPatientId = patientId;
  console.log(`Selected patient set to: ${patientId}`);
  // You would typically navigate to a patient-specific screen or load their data here.
}

// Practice Mode Functions
function setupPracticeMode() {
  if (elements.correctBtn) {
    elements.correctBtn.addEventListener('click', async () => {
      AppState.practiceCount++;
      if (elements.practiceCount) {
        elements.practiceCount.textContent = AppState.practiceCount;
      }
      if (elements.practiceFeedback) {
        elements.practiceFeedback.textContent = 'Correct! 🎉';
        
        // Flash green effect
        document.body.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 300);
      }
      
      // Save practice data using the new function
      if (AppState.isAuthenticated && AppState.user.designation === 'patient') {
        const patientId = AppState.user.uid;
        const now = new Date();
        const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeKey = now.toLocaleTimeString('en-GB').replace(/:/g, '-'); // HH-MM-SS
        
        const practicePath = `users/patients/${patientId}/data/Practice/practice-log-${dateKey}.json`;
        
        await window.firebaseModules.writeToDB(
          practicePath,
          {
            count: AppState.practiceCount,
            lastUpdated: now.toISOString()
          }
        );
      }
    });
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
  const game1Btn = document.getElementById('game-mode-btn-1');
  const game2Btn = document.getElementById('game-mode-btn-2');
  const settingsBtn = document.getElementById('settings-btn');
  
  if (practiceBtn) {
    practiceBtn.addEventListener('click', () => navigateToScreen('practice-screen'));
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
}

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
  setupPracticeMode();
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);