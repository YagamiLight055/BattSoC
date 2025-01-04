// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/scripts/service-worker.js').then((registration) => {
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
  event.preventDefault();
  deferredPrompt = event;

  installButton.style.display = 'block';
});

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

// Restore last visited page on load and set initial progress bar value to 0
window.onload = function () {
  const lastPage = localStorage.getItem("lastPage") || "home"; // Default to "home"
  navigateToPage(lastPage);

  // Set initial progress bar value to 0
  const progressBar = document.getElementById("progress-bar");
  progressBar.style.width = "0%"; // Set the progress bar to 0%
  progressBar.textContent = ""; // Clear any text in the progress bar

  // Restore input values from localStorage
  restoreInputValues();
};

function navigateToPage(pageId) {
  localStorage.setItem("lastPage", pageId);

  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => (page.style.display = "none"));

  const selectedPage = document.getElementById(pageId);
  if (selectedPage) {
    selectedPage.style.display = "block";
  }

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
  const voltageGroup = document.getElementById("voltage-group");
  const currentMaxVoltageGroup = document.getElementById("current-max-voltage-group");

  if (batteryType === "lithium") {
    cellCountGroup.style.display = "block";
    currentMaxVoltageGroup.style.display = "block";
    voltageGroup.style.display = "none";
  } else {
    cellCountGroup.style.display = "none";
    currentMaxVoltageGroup.style.display = "none";
    voltageGroup.style.display = "block";
  }
}

function updateTotalVoltage() {
  const cellCount = parseInt(document.getElementById("cell-count").value);

  if (isNaN(cellCount) || cellCount < 1) {
    document.getElementById("total-voltage").innerText = "Please enter a valid number of cells.";
    return;
  }

  const nominalVoltage = cellCount * 3.6;
  const maxVoltage = cellCount * 4.2;

  const totalVoltageDisplay = `Nominal Voltage: ${nominalVoltage.toFixed(1)}V | Max Voltage: ${maxVoltage.toFixed(1)}V`;
  document.getElementById("total-voltage").innerText = totalVoltageDisplay;

  console.log("Nominal Voltage: ", nominalVoltage);
  console.log("Max Voltage: ", maxVoltage);
}

// Reusable error-handling function
function handleError(condition, errorMessage, progressBar, resultElement) {
  if (condition) {
    resultElement.innerText = errorMessage;
    progressBar.style.width = "0%";  // Reset progress bar on error
    return true;  // Return true to indicate an error occurred
  }
  return false;  // Return false if no error
}

// Function to calculate degradation
function calculateDegradation(totalPeakVoltage, currentMaxVoltage, totalMinVoltage) {
  return ((totalPeakVoltage - currentMaxVoltage) / (totalPeakVoltage - totalMinVoltage)) * 100;
}

// Main function to calculate SoC
function calculateSoC() {
  const batteryType = document.getElementById("battery-type").value;
  const resultElement = document.getElementById("result");
  const progressBar = document.getElementById("progress-bar");
  const voltageInput = document.getElementById("voltage");
  const batteryHealthElement = document.getElementById("battery-health");
  const degradationElement = document.getElementById("degradation");
  const batteryHealthValue = document.getElementById("battery-health-value");
  const replaceBatteryMessage = document.getElementById("replace-battery");

  // Clear previous output
  resultElement.innerText = "Enter details to calculate State of Charge.";
  progressBar.style.width = "0%";
  progressBar.setAttribute("data-critical", "false");
  progressBar.setAttribute("data-low", "false");
  voltageInput.disabled = false;
  degradationElement.style.display = "none"; // Hide degradation by default
  degradationElement.innerText = ""; // Clear any previous text
  batteryHealthValue.innerText = "";
  batteryHealthElement.style.display = "none";
  replaceBatteryMessage.innerText = "";

  // If no battery type is selected, show a message
  if (!batteryType) {
    resultElement.innerText = "Please select a battery type.";
    progressBar.style.width = "0%";
    return; // Exit function if no battery type is selected
  }

  if (batteryType === "lithium") {
    const cellCountInput = document.getElementById("cell-count");
    const cellCount = parseInt(cellCountInput.value);

    // Validate cell count
    if (handleError(isNaN(cellCount) || cellCount < 1, "Please enter a valid number of cells in series.", progressBar, resultElement)) return;

    const currentMaxVoltageInput = document.getElementById("current-max-voltage");
    const currentMaxVoltage = parseFloat(currentMaxVoltageInput.value);

    const cellMinVoltage = 3.0; // 0% SoC per cell
    const cellPeakVoltage = 4.2; // Peak voltage per cell (fully charged)
    const totalPeakVoltage = cellCount * cellPeakVoltage;
    const totalMinVoltage = cellCount * cellMinVoltage;

    // Validate current max voltage
    if (handleError(isNaN(currentMaxVoltage) || currentMaxVoltage > totalPeakVoltage, `Please enter a valid current max voltage. (Max: ${totalPeakVoltage.toFixed(1)}V)`, progressBar, resultElement)) return;

    // Handle replacement condition
    if (currentMaxVoltage <= totalMinVoltage) {
      resultElement.innerText = "Battery needs to be replaced.";
      progressBar.style.width = "0%";
      progressBar.setAttribute("data-critical", "true");

      // Display degradation
      const degradation = calculateDegradation(totalPeakVoltage, currentMaxVoltage, totalMinVoltage);
      degradationElement.style.display = "block"; // Show degradation when calculated
      degradationElement.innerText = `Battery Degradation: ${Math.min(degradation, 100).toFixed(2)}%`;

      voltageInput.disabled = true;
      return;
    }

    const remainingVoltage = parseFloat(voltageInput.value);

    // Validate remaining voltage
    if (handleError(isNaN(remainingVoltage) || remainingVoltage < totalMinVoltage || remainingVoltage > currentMaxVoltage, 
                    `Please enter a valid remaining battery voltage. (Min: ${totalMinVoltage.toFixed(1)}V - Max: ${currentMaxVoltage.toFixed(1)}V)`, progressBar, resultElement)) return;

    let soc = ((remainingVoltage - totalMinVoltage) / (currentMaxVoltage - totalMinVoltage)) * 100;
    progressBar.style.width = `${soc}%`;

    // Update progress bar color
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

    resultElement.innerText = `State of Charge: ${soc.toFixed(1)}%`;

    // Calculate degradation
    const degradation = calculateDegradation(totalPeakVoltage, currentMaxVoltage, totalMinVoltage);
    degradationElement.style.display = "block"; // Show degradation when calculated
    degradationElement.innerText = `Battery Degradation: ${Math.min(degradation, 100).toFixed(2)}%`;

    // Display "Remaining Battery Health" only after valid calculation
    const remainingHealth = 100 - degradation;
    if (!isNaN(remainingHealth)) {
      batteryHealthValue.innerText = `${remainingHealth.toFixed(2)}%`;
      batteryHealthElement.style.display = "block";

      // Show replacement message if degradation >= 40%
      if (degradation >= 40) {
        replaceBatteryMessage.innerText = "Consider replacing the battery.";
      }
    }
  } else if (batteryType === "lead-acid") {
    const voltageInput = document.getElementById("voltage");
    const remainingVoltage = parseFloat(voltageInput.value);

    const leadAcidMinVoltage = 11.5; // Lead acid 0% SoC (12V battery)
    const leadAcidMaxVoltage = 12.8; // Lead acid 100% SoC (12V battery)

    // Validate remaining voltage
    if (handleError(isNaN(remainingVoltage) || remainingVoltage < leadAcidMinVoltage || remainingVoltage > leadAcidMaxVoltage, 
                    `Please enter a valid remaining battery voltage. (Min: ${leadAcidMinVoltage.toFixed(1)}V - Max: ${leadAcidMaxVoltage.toFixed(1)}V)`, progressBar, resultElement)) return;

    let soc = ((remainingVoltage - leadAcidMinVoltage) / (leadAcidMaxVoltage - leadAcidMinVoltage)) * 100;
    progressBar.style.width = `${soc}%`;

    // Update progress bar color
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

    resultElement.innerText = `State of Charge: ${soc.toFixed(1)}%`;
    batteryHealthValue.innerText = `${(100 - soc).toFixed(2)}%`; // Display remaining health for lead acid
    batteryHealthElement.style.display = "block";

    // Show replacement message for lead-acid battery
    if (soc <= 20) {
      replaceBatteryMessage.innerText = "Consider replacing the battery.";
    } else {
      replaceBatteryMessage.innerText = "";
    }
  }

  // Save input values to localStorage
  saveInputValues();
}
// Restore input values from localStorage
function restoreInputValues() {
  const batteryType = localStorage.getItem("battery-type");
  const cellCount = localStorage.getItem("cell-count");
  const currentMaxVoltage = localStorage.getItem("current-max-voltage");
  const voltage = localStorage.getItem("voltage");

  if (batteryType) {
    document.getElementById("battery-type").value = batteryType;
    toggleCellInput(); // Update cell input visibility based on selected battery type
  }
  if (cellCount) {
    document.getElementById("cell-count").value = cellCount;
  }
  if (currentMaxVoltage) {
    document.getElementById("current-max-voltage").value = currentMaxVoltage;
  }
  if (voltage) {
    document.getElementById("voltage").value = voltage;
  }
}
