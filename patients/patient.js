// patient.js
// ====================================================================
// Patient-Specific Functions
// ====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// Helper function to format a timestamp into a readable date string
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp));
    return date.toLocaleString();
}

// Function to render the Games data
function renderGamesData(gamesData) {
    let gamesHtml = '';
    for (const gameKey in gamesData) {
        if (gamesData.hasOwnProperty(gameKey) && gameKey !== 'placeholder') {
            const game = gamesData[gameKey];
            if (game.sessions && Object.keys(game.sessions).length > 0) {
                gamesHtml += `<h3>Game: ${gameKey}</h3><hr><div class="data-section">`;
                for (const sessionKey in game.sessions) {
                    const session = game.sessions[sessionKey];
                    const sessionTimestamp = formatTimestamp(sessionKey);
                    gamesHtml += `<div class="session-entry">
                                    <p><strong>Session Started:</strong> ${sessionTimestamp}</p>
                                    <p><strong>Duration:</strong> ${session.duration_s ? session.duration_s.toFixed(2) : 'N/A'} seconds</p>
                                    <p><strong>Final Score:</strong> ${session.finalScore || 'N/A'}</p>`;
                                    
                    if (session.wordList && session.wordList.length > 0) {
                         const correctWords = session.wordList.filter(item => item.outcome === 'success').length;
                         const totalWords = session.wordList.length;
                         gamesHtml += `<p><strong>Words Correct:</strong> ${correctWords} of ${totalWords}</p>`;
                    }
                    if (session.attempts && session.attempts.length > 0) {
                        const finalScore = session.attempts[session.attempts.length-1].scoreAtTime;
                        gamesHtml += `<p><strong>Score:</strong> ${finalScore}</p>`;
                    }
                    gamesHtml += `</div>`;
                }
                gamesHtml += `</div>`;
            }
        }
    }
    
    return gamesHtml;
}

// Function to render the Practice data
function renderPracticeData(practiceData) {
    if (!practiceData || !practiceData.sessions || Object.keys(practiceData.sessions).length === 0) {
        return '';
    }

    let html = `<h3>Practice</h3><hr><div class="data-section">
                <p><strong>Total Practice Count:</strong> ${practiceData.practiceCount || 0}</p>`;
    
    for (const sessionKey in practiceData.sessions) {
        const session = practiceData.sessions[sessionKey];
        const sessionTimestamp = formatTimestamp(sessionKey);
        html += `<div class="session-entry">
                    <p><strong>Session Started:</strong> ${sessionTimestamp}</p>
                    <p><strong>Correct Attempts:</strong> ${session.correctAttempts || 0}</p>
                    <p><strong>Duration:</strong> ${session.duration_s ? session.duration_s.toFixed(2) : 'N/A'} seconds</p>
                </div>`;
    }
    html += `</div>`;
    return html;
}

// Function to fetch and display patient data

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
                const data = snapshot.exists() ? snapshot.val() : {};
                
                let contentHtml = '<h2>My Progress</h2>';
                let hasContent = false;
                
                const gamesHtml = renderGamesData(data.Games);
                if (gamesHtml) {
                    contentHtml += gamesHtml;
                    hasContent = true;
                }
                
                const practiceHtml = renderPracticeData(data.Practice);
                if (practiceHtml) {
                    contentHtml += practiceHtml;
                    hasContent = true;
                }
                
                // NEW: Generate the settings container and use a new class to hide it
                const settingsVisibilityClass = hasContent ? 'hidden-content' : '';
                const settingsContent = (data.Settings && data.Settings.placeholder) ? '<p>Settings data is a placeholder for future features.</p>' : '';
                contentHtml += `<div class="data-section ${settingsVisibilityClass}"><h3>Settings</h3><hr>${settingsContent}</div>`;
                
                // If no actual data exists, provide a friendly message and a new class
                if (!hasContent) {
                    patientDataContainer.innerHTML = '<h2>No Data Found</h2><p>Looks like there is no progress data recorded yet. Please start practicing or playing games!</p>';
                } else {
                    patientDataContainer.innerHTML = contentHtml;
                }
                
            } catch (error) {
                console.error("[ERROR] Failed to fetch patient data:", error.message);
                patientDataContainer.innerHTML = '<h2>Error</h2><p>Failed to retrieve data. Please try again later.</p>';
            }
        } else {
            console.warn("[WARN] No user is authenticated. Redirecting to home.");
            patientDataContainer.innerHTML = '<h2>Unauthorized</h2><p>You must be logged in to view this page. Redirecting...</p>';
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 3000);
        }
    });
};

fetchAndDisplayPatientData();

// Function to handle logout, making it available globally
window.logoutUser = async () => {
    try {
        await signOut(auth);
        console.log("User logged out successfully.");
        // Redirect to the login page after logout
        window.location.href = '../index.html';
    } catch (error) {
        console.error("Error during logout:", error.message);
    }
};