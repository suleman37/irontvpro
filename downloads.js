// Copie en 1 clic des codes (compatible avec tes pages)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.copy[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-copy');
      const el = document.querySelector(sel);
      const text = el ? el.textContent.trim() : '';
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const old = btn.textContent;
        btn.textContent = 'Copié !';
        setTimeout(() => (btn.textContent = old), 1200);
      });
    });
  });
});
