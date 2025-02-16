document.addEventListener('DOMContentLoaded', function() {
    const sentinel = document.getElementById('sentinel');
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
          newItems.forEach(item => container.appendChild(item));
          
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