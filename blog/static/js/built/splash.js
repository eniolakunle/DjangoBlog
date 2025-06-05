var key = "eniolakunle_blog_key";
document.addEventListener("DOMContentLoaded", function () {
    // Ensure page fades in on load
    requestAnimationFrame(function () {
        document.body.style.opacity = "1";
    });
    // Check if user has been to site before, if not give em a splash...
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, Date.now());
        var splash_1 = document.getElementById("splash");
        // Delay then fade out splash screen
        setTimeout(function () {
            splash_1.style.opacity = "0";
            setTimeout(function () {
                splash_1.style.display = "none";
                // mainContent.style.display = "block";
            }, 2500);
        }, 3500);
        var numberOfCrosses = 77; // Adjust the number of falling crosses
        for (var i = 0; i < numberOfCrosses; i++) {
            var cross = document.createElement("div");
            cross.classList.add("cross");
            cross.textContent = "✝"; // Cross symbol
            // Random horizontal positioning (between 0% and 100%)
            var randomLeft = Math.random() * 100;
            cross.style.left = "".concat(randomLeft, "vw");
            // Random animation duration (between 5s and 12s for variation)
            var randomDuration = 4 + Math.random() * 6;
            cross.style.animationDuration = "".concat(randomDuration, "s");
            // Random animation delay (prevents all crosses from starting at the same time)
            var randomDelay = Math.random() * 5;
            cross.style.animationDelay = "".concat(randomDelay, "s");
            splash_1.appendChild(cross);
        }
    }
    else {
        document.getElementById("splash").style.display = "none";
    }
});
