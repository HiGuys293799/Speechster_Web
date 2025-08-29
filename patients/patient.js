document.addEventListener("DOMContentLoaded", () => {
  const infoContainer = document.getElementById("patient-info-container");

  // -----------------------
  // Load Patient Data
  // -----------------------
  async function loadPatientData() {
    try {
      const { getDatabase, ref, get } = window.firebaseModules;
      const db = getDatabase();
      const userId = "123"; // TODO: replace with actual logged-in UID
      const snapshot = await get(ref(db, "patients/" + userId));

      if (snapshot.exists()) {
        renderPatientData(snapshot.val());
      } else {
        infoContainer.innerHTML = "<p>No data available.</p>";
      }
    } catch (err) {
      console.error("Error fetching patient data:", err);
      infoContainer.innerHTML = "<p class='error'>Failed to load data.</p>";
    }
  }

  // -----------------------
  // Render Patient Data
  // -----------------------
  function renderPatientData(data) {
    infoContainer.innerHTML = "";
    for (const [section, values] of Object.entries(data)) {
      const sectionDiv = document.createElement("div");
      sectionDiv.classList.add("data-section");
      sectionDiv.innerHTML = `<h3>${section}</h3>`;

      const ul = document.createElement("ul");
      for (const [k, v] of Object.entries(values)) {
        const li = document.createElement("li");
        li.textContent = `${k}: ${v}`;
        ul.appendChild(li);
      }

      sectionDiv.appendChild(ul);
      infoContainer.appendChild(sectionDiv);
    }
  }

  // -----------------------
  // Logout Handler
  // -----------------------
  document.getElementById("logout-btn")?.addEventListener("click", handleLogout());

  // Load data on start
  loadPatientData();
});
