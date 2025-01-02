// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
  });
}

// Handle Install Prompt
let deferredPrompt;
const installButton = document.getElementById('install-btn');

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent the default browser install prompt
  event.preventDefault();
  deferredPrompt = event;

  // Show the custom install button
  installButton.style.display = 'block';

  // When the user clicks the install button, trigger the install prompt
  installButton.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  });
});

// Restore last visited page on load
window.onload = function () {
  const lastPage = localStorage.getItem("lastPage") || "home"; // Default to "home"
  navigateToPage(lastPage);
};

function navigateToPage(pageId) {
  // Save the current page to localStorage
  localStorage.setItem("lastPage", pageId);

  // Hide all pages
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => (page.style.display = "none"));

  // Show the selected page
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) {
    selectedPage.style.display = "block";
  }

  // Update navigation buttons (optional: add active styling)
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((btn) => btn.classList.remove("active"));

  const activeButton = document.querySelector(
    `button[onclick="navigateToPage('${pageId}')"]`
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function toggleCellInput() {
  const batteryType = document.getElementById("battery-type").value;
  const cellCountGroup = document.getElementById("cell-count-group");

  if (batteryType === "lithium") {
    cellCountGroup.style.display = "block";
  } else {
    cellCountGroup.style.display = "none";
  }
}

function updateTotalVoltage() {
  const cellCount = parseInt(document.getElementById("cell-count").value);
  
  if (isNaN(cellCount) || cellCount < 1) {
    document.getElementById("total-voltage").innerText = "Please enter a valid number of cells.";
    return;
  }

  const nominalVoltage = cellCount * 3.6;  // Nominal voltage per cell for Lithium-Ion is 3.6V
  const maxVoltage = cellCount * 4.2;      // Maximum voltage per cell for Lithium-Ion is 4.2V

  // Display total nominal and max voltage
  document.getElementById("total-voltage").innerText = 
    `Nominal Voltage: ${nominalVoltage.toFixed(1)}V | Max Voltage: ${maxVoltage.toFixed(1)}V`;
}

function calculateSoC() {
  const voltage = parseFloat(document.getElementById("voltage").value);
  const batteryType = document.getElementById("battery-type").value;

  let minVoltage, maxVoltage;

  if (batteryType === "lithium") {
    const cellCountInput = document.getElementById("cell-count");
    const cellCount = parseInt(cellCountInput.value);

    if (isNaN(cellCount) || cellCount < 1) {
      document.getElementById("result").innerText = "Please enter a valid number of cells in series.";
      document.getElementById("progress-bar").style.width = "0%";
      return;
    }

    localStorage.setItem("cellCount", cellCount);

    const cellMinVoltage = 3.0; // 0% SoC per cell
    const cellMaxVoltage = 4.2; // 100% SoC per cell

    minVoltage = cellCount * cellMinVoltage;
    maxVoltage = cellCount * cellMaxVoltage;
  } else if (batteryType === "lead-acid") {
    minVoltage = 10.5;
    maxVoltage = 12.8;
  } else {
    document.getElementById("result").innerText = "Invalid battery type.";
    return;
  }

  if (isNaN(voltage) || voltage < minVoltage || voltage > maxVoltage) {
    document.getElementById("result").innerText = `Please enter a valid voltage (${minVoltage.toFixed(1)} - ${maxVoltage.toFixed(1)}V).`;
    document.getElementById("progress-bar").style.width = "0%";
    return;
  }

  const soc = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;

  const progressBar = document.getElementById("progress-bar");
  progressBar.style.width = `${soc}%`;

  if (soc <= 20) {
    progressBar.setAttribute("data-critical", "true");
    progressBar.setAttribute("data-low", "false");
  } else if (soc <= 50) {
    progressBar.setAttribute("data-critical", "false");
    progressBar.setAttribute("data-low", "true");
  } else {
    progressBar.setAttribute("data-critical", "false");
    progressBar.setAttribute("data-low", "false");
  }

  document.getElementById("result").innerText = `State of Charge: ${soc.toFixed(1)}%`;
}