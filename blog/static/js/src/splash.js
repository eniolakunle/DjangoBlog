const key = "eniolakunle_blog_key";

document.addEventListener("DOMContentLoaded", function () {
  // Ensure page fades in on load
  requestAnimationFrame(() => {
    document.body.style.opacity = "1";
  });

  // Check if user has been to site before, if not give em a splash...
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, Date.now());
    let splash = document.getElementById("splash");

    // Delay then fade out splash screen
    setTimeout(() => {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.style.display = "none";
        // mainContent.style.display = "block";
      }, 2500);
    }, 3500);

    const numberOfCrosses = 77; // Adjust the number of falling crosses

    for (let i = 0; i < numberOfCrosses; i++) {
      const cross = document.createElement("div");
      cross.classList.add("cross");
      cross.textContent = "✝"; // Cross symbol

      // Random horizontal positioning (between 0% and 100%)
      const randomLeft = Math.random() * 100;
      cross.style.left = `${randomLeft}vw`;

      // Random animation duration (between 5s and 12s for variation)
      const randomDuration = 4 + Math.random() * 6;
      cross.style.animationDuration = `${randomDuration}s`;

      // Random animation delay (prevents all crosses from starting at the same time)
      const randomDelay = Math.random() * 5;
      cross.style.animationDelay = `${randomDelay}s`;

      splash.appendChild(cross);
    }
  } else {
    document.getElementById("splash").style.display = "none";
  }
});
