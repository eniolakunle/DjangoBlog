document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");
    const overlay = document.querySelector(".transition-overlay");
  
    links.forEach(link => {
      link.addEventListener("click", (e) => {
        if (link.hostname === window.location.hostname && link.href !== window.location.href) {
          e.preventDefault(); // Prevent default action (navigation)
        
        let blogCard = link;
        while (blogCard){
            if (blogCard.classList.contains("floating-card")) {
                blogCard.classList.add("link-container");
                break;
            }
            blogCard = blogCard.parentElement;
        }
          // Show the overlay and trigger fade-out effect
          overlay.classList.add("transition-active");
  
          setTimeout(() => {
            window.location.href = link.href; // Navigate after fade-out
          }, 200); // Duration matches transition time
        }
      });
    });
  
    // After the page loads, fade in the content
    window.addEventListener("load", () => {
      document.body.classList.add("fade-in");
      setTimeout(() => {
        overlay.classList.remove("transition-active"); // Hide overlay after fade-in
      }, 300); // Fade-in duration
    });

    // **Fix Back Button Issue: Ensure Page Always Fades Back In**
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
            overlay.classList.remove("transition-active"); // Hide overlay after fade-in
        }
    });
  });
  