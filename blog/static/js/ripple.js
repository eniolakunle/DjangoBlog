document.querySelectorAll('.floating-ripple-card').forEach(card => {
    card.addEventListener('pointerdown', function (e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
  
      // Get the click/tap position relative to the card
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
  
      this.appendChild(ripple);
  
      // Remove ripple after animation ends
      setTimeout(() => ripple.remove(), 600);
    });
  });
  