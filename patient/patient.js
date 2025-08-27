// ====================================================================
// Firebase Imports for Auth State Management
// ====================================================================
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { get, ref } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth, db } from "../script.js";

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
