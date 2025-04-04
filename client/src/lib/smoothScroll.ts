// Smooth scrolling for anchor links

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href')?.substring(1);
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      window.scrollTo({
        top: targetElement.offsetTop - 100, // Offset for header
        behavior: 'smooth'
      });
    });
  });
});

export {};
