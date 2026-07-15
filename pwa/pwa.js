// pwa/pwa.js
let mySavedInstallPromptEvent = null;
let myWaitingWorker = null;

// Register the service worker using async/await
async function myRegisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      // Automatically extracts the repository name (e.g., "/ollama-gemma4-12b-pwa/")
      const myRepoScope = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

      const myRegistration = await navigator.serviceWorker.register(`${myRepoScope}sw.js`, {
        scope: myRepoScope
      });
      console.log("Dynamic PWA registered on scope:", myRegistration.scope);

      // If a worker is already waiting when we register (e.g. tab was open
      // during a previous deploy), surface the banner right away.
      if (myRegistration.waiting) {
        myShowUpdateBanner(myRegistration.waiting);
      }

      // Fires whenever the browser finds a new sw.js on the network.
      myRegistration.addEventListener("updatefound", () => {
        const myNewWorker = myRegistration.installing;
        if (!myNewWorker) return;

        myNewWorker.addEventListener("statechange", () => {
          // "installed" + an existing controller means this is an UPDATE,
          // not the very first install — that's the case we want to prompt for.
          if (myNewWorker.state === "installed" && navigator.serviceWorker.controller) {
            myShowUpdateBanner(myNewWorker);
          }
        });
      });

      // When the new worker takes control, reload once to pick up fresh assets.
      let myHasReloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (myHasReloaded) return;
        myHasReloaded = true;
        window.location.reload();
      });

      // Optional: check for updates whenever the tab regains focus,
      // since GitHub Pages content can change without the user reopening the PWA.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          myRegistration.update();
        }
      });

    } catch (myError) {
      console.error("PWA registration failed:", myError);
    }
  }
}

// Show a small dismissible "update available" banner.
function myShowUpdateBanner(myWorker) {
  myWaitingWorker = myWorker;

  if (document.getElementById("myPwaUpdateBanner")) {
    return; // already showing
  }

  const myBanner = document.createElement("div");
  myBanner.id = "myPwaUpdateBanner";
  myBanner.style.cssText = `
    position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
    background: #222; color: #fff; padding: 12px 16px; border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35); z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    font-family: system-ui, sans-serif; font-size: 0.85rem;
  `;
  myBanner.innerHTML = `
    <span>A new version is available.</span>
    <button id="myPwaUpdateBtn" style="background:#4a9; color:#fff; border:none; border-radius:6px; padding:6px 12px; cursor:pointer;">Update</button>
    <button id="myPwaDismissBtn" style="background:transparent; color:#bbb; border:none; cursor:pointer;">Dismiss</button>
  `;
  document.body.appendChild(myBanner);

  document.getElementById("myPwaUpdateBtn").addEventListener("click", () => {
    if (myWaitingWorker) {
      myWaitingWorker.postMessage("SKIP_WAITING");
    }
    myBanner.remove();
  });

  document.getElementById("myPwaDismissBtn").addEventListener("click", () => {
    // User declines — banner goes away, but the waiting worker stays queued
    // and will activate next time they load the page fresh (or click Update later).
    myBanner.remove();
  });
}

// Listen for the native browser install availability prompt
window.addEventListener("beforeinstallprompt", (myEvent) => {
  myEvent.preventDefault();
  mySavedInstallPromptEvent = myEvent;
  const myInstallButton = document.getElementById("myPwaInstallButton");
  if (myInstallButton) {
    myInstallButton.style.display = "inline-block";
  }
});

// Triggered via inline onclick handler from index.html
async function myHandleInstallButtonClick() {
  if (!mySavedInstallPromptEvent) {
    return;
  }
  mySavedInstallPromptEvent.prompt();
  const myUserChoice = await mySavedInstallPromptEvent.userChoice;
  console.log("User installation choice outcome:", myUserChoice.outcome);
  mySavedInstallPromptEvent = null;
  const myInstallButton = document.getElementById("myPwaInstallButton");
  if (myInstallButton) {
    myInstallButton.style.display = "none";
  }
}

// Reset if already installed
window.addEventListener("appinstalled", () => {
  console.log("Application successfully installed!");
  mySavedInstallPromptEvent = null;
  const myInstallButton = document.getElementById("myPwaInstallButton");
  if (myInstallButton) {
    myInstallButton.style.display = "none";
  }
});

// Execute registration
myRegisterServiceWorker();
