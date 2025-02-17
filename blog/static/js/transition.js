function linkHandler(link, overlay) {
  const transitionLink = (e) => {
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
  };
  return transitionLink;
}

document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("a");
    const overlay = document.querySelector(".transition-overlay");
  
    links.forEach(link => {
      link.addEventListener("click", linkHandler(link, overlay));
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


// endless scrolling is in below listener
document.addEventListener('DOMContentLoaded', function() {
  const sentinel = document.getElementById('sentinel');
  
  if (!sentinel)
    return;
  
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadMore();
      }
    });
  });

  observer.observe(sentinel);

  let loading = false;

  function loadMore() {
    if (loading) return;

    const nextPageLink = document.getElementById('next-page-link');
    if (!nextPageLink) {
      observer.unobserve(sentinel);  // No more pages to load
      return;
    }
    loading = true;
    const url = nextPageLink.getAttribute('href');
    
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(response => response.text())
      .then(html => {
        // Create a temporary element to hold the new HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Append new items from the response to the container
        const newItems = tempDiv.querySelectorAll('.item');
        const container = document.getElementById('item-container');
        const overlay = document.querySelector(".transition-overlay");

        newItems.forEach(item => {
          link = item.querySelector(".blog-card-link");
          // ensure new articles added will transition smoothly if clicked
          link.addEventListener("click", linkHandler(link, overlay));
          container.appendChild(item);
      });
        
        // Update the next-page link (if any)
        const newNextPageLink = tempDiv.querySelector('#next-page-link');
        if (newNextPageLink) {
          nextPageLink.setAttribute('href', newNextPageLink.getAttribute('href'));
        } else {
          // No next page; remove the link and unobserve the sentinel
          nextPageLink.remove();
          observer.unobserve(sentinel);
        }
        loading = false;
      })
      .catch(error => {
        console.error('Error loading more items:', error);
        loading = false;
      });
  }
});

  