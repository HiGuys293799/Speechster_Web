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
  get
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
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};

// Application State
const AppState = {
  currentScreen: 'auth-screen',
  practiceCount: 0,
  isAuthenticated: false,
  user: null
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
    const { createUserWithEmailAndPassword, ref, set } = window.firebaseModules;
    const userCredential = await createUserWithEmailAndPassword(
      window.firebaseAuth, email, password
    );
    
    // Save user data to the correct, designation-specific path
    const userRef = ref(window.firebaseDB, `users/${designation}s/${userCredential.user.uid}`);
    await set(userRef, {
      username,
      email,
      designation,
      createdAt: Date.now()
    });

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

// Practice Mode Functions
function setupPracticeMode() {
  if (elements.correctBtn) {
    elements.correctBtn.addEventListener('click', () => {
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
      AppState.isAuthenticated = true;
      AppState.user = user;
      
      let userRef;
      let snapshot;
      let userData;

      // Try to get user data from the 'patients' path
      userRef = ref(window.firebaseDB, `users/patients/${user.uid}`);
      snapshot = await get(userRef);
      if (snapshot.exists()) {
        userData = snapshot.val();
        if (userData.designation === 'patient') {
          window.location.href = 'patients/patient.html';
          return;
        }
      }

      // If not found in 'patients', try the 'doctors' path
      userRef = ref(window.firebaseDB, `users/doctors/${user.uid}`);
      snapshot = await get(userRef);
      if (snapshot.exists()) {
        userData = snapshot.val();
        if (userData.designation === 'doctor') {
          navigateToScreen('mode-selection-screen');
          return;
        }
      }
      
      // If user data is still not found, handle as a generic user
      navigateToScreen('mode-selection-screen');

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