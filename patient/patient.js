/*
 * Speechster 1000 - Patient Dashboard Logic
 * This file handles all patient-specific functionality.
 */

// ====================================================================
// Firebase SDK and Auth Imports
// ====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ====================================================================
// Firebase Configuration and Initialization
// (Note: This is repeated in patient.js for standalone functionality)
// ====================================================================
const firebaseConfig = {
    apiKey: "AIzaSyC4o7uIHSqRChe0k5LZOfnFDCr-vBWoqvY",
    authDomain: "speechster-1000.firebaseapp.com",
    projectId: "speechster-1000",
    storageBucket: "speechster-1000.appspot.com",
    messagingSenderId: "543492593404",
    appId: "1:543492593404:web:df0f06a3861c8340d85a1a",
    databaseURL: "https://speechster-1000-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM references for the patient dashboard
const DOM = {
    buttons: {
        dashboardBack: document.getElementById('dashboard-back-btn')
    },
    dashboard: {
        username: document.getElementById('dashboard-username'),
        email: document.getElementById('dashboard-email'),
        designation: document.getElementById('dashboard-designation'),
        testData: document.getElementById('test-data-display')
    }
};

/**
 * @description Fetches and displays patient data from Firebase Realtime Database.
 * This function uses a real-time listener (onValue) to update automatically.
 */
const getPatientData = (user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                DOM.dashboard.username.textContent = data.username || 'N/A';
                DOM.dashboard.email.textContent = data.email || 'N/A';
                DOM.dashboard.designation.textContent = data.designation || 'N/A';
                
                // Displaying test data if it exists
                const testData = data.Test_Write || 'No test data found.';
                DOM.dashboard.testData.textContent = testData;

                console.log("Patient data updated in real-time:", data);
            } else {
                console.warn("No user data available for this UID.");
                DOM.dashboard.username.textContent = 'N/A';
                DOM.dashboard.email.textContent = 'N/A';
                DOM.dashboard.designation.textContent = 'N/A';
                DOM.dashboard.testData.textContent = 'No test data found.';
            }
        });
    } else {
        // Clear data if no user is logged in
        DOM.dashboard.username.textContent = 'N/A';
        DOM.dashboard.email.textContent = 'N/A';
        DOM.dashboard.designation.textContent = 'N/A';
        DOM.dashboard.testData.textContent = 'Please log in to see data.';
        console.log("User is not logged in. Patient data not displayed.");
    }
};

// ====================================================================
// Event Listeners for Patient Module
// ====================================================================

// Listener for the back button
DOM.buttons.dashboardBack.addEventListener('click', () => {
    window.location.href = '../index.html';
});

// Use the Firebase auth state change observer to load data
onAuthStateChanged(auth, (user) => {
    getPatientData(user);
});

console.log("[LOG] Patient Dashboard script initialized.");