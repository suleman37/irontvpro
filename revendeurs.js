document.addEventListener('DOMContentLoaded', () => {
  /* ===== Scroll interne offset (aligné sur index/script.js) ===== */
  const HEADER_OFFSET = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-h')
  ) || 76;

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(absoluteTop - HEADER_OFFSET - 8, 0),
        behavior: 'smooth'
      });
      document.querySelector('nav')?.classList.remove('open');
      document.getElementById('burger')?.classList.remove('open');
    });
  });

  /* ===== MENU BURGER / PANNEAU MOBILE (auto-close) ===== */
  const burger = document.getElementById('burger');
  const mainNav = document.querySelector('.main-nav');
  const mobilePanel = document.getElementById('mobile-menu');

  const backdrop = document.getElementById('menu-backdrop') || (() => {
    const el = document.createElement('div');
    el.id = 'menu-backdrop';
    el.setAttribute('hidden', '');
    document.body.appendChild(el);
    return el;
  })();

  function buildMobileMenuOnce() {
    if (!mainNav || !mobilePanel) return;
    if (mobilePanel.querySelector('ul')) return;
    const desktopList = mainNav.querySelector('ul');
    if (desktopList) {
      mobilePanel.innerHTML = '';
      const cloned = desktopList.cloneNode(true);
      mobilePanel.appendChild(cloned);
      mobilePanel.querySelectorAll('a[href]').forEach(a => {
        a.addEventListener('click', closeMobileMenu, { passive: true });
      });
    }
  }

  function openMobileMenu() {
    buildMobileMenuOnce();
    mobilePanel.classList.add('open');
    mobilePanel.removeAttribute('hidden');
    backdrop.classList.add('open');
    backdrop.removeAttribute('hidden');
    burger?.classList.add('open');
    burger?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    (mobilePanel.querySelector('a, button, [tabindex]:not([tabindex="-1"])') || burger)?.focus();
  }

  function closeMobileMenu() {
    mobilePanel.classList.remove('open');
    mobilePanel.setAttribute('hidden', '');
    backdrop.classList.remove('open');
    backdrop.setAttribute('hidden', '');
    burger?.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function toggleMobileMenu() {
    if (mobilePanel.classList.contains('open')) closeMobileMenu();
    else openMobileMenu();
  }

  burger?.addEventListener('click', toggleMobileMenu);
  backdrop.addEventListener('click', closeMobileMenu);

  document.addEventListener('pointerdown', (e) => {
    if (!mobilePanel.classList.contains('open')) return;
    const t = e.target;
    if (!mobilePanel.contains(t) && !burger?.contains(t)) closeMobileMenu();
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobilePanel.classList.contains('open')) closeMobileMenu();
  });
  window.addEventListener('scroll', () => { if (mobilePanel.classList.contains('open')) closeMobileMenu(); }, { passive: true });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1000 && mobilePanel.classList.contains('open')) closeMobileMenu(); });
  window.addEventListener('hashchange', closeMobileMenu);

  /* ===== POPUP COMMANDE REVENDEURS ===== */
  const orderButtons   = document.querySelectorAll('.order-btn');
  const popupOverlay   = document.getElementById('popupOverlay');
  const popupClose     = document.getElementById('popupClose');
  const orderForm      = document.getElementById('orderForm');

  const pkgDisplay     = document.getElementById('packageDisplay');
  const pkgPrice       = document.getElementById('packagePrice');
  const pkgDuration    = document.getElementById('packageDuration');

  const pkgInput       = document.getElementById('package');
  const priceInput     = document.getElementById('price');
  const durationInput  = document.getElementById('duration');

  const orderFormMessage = document.getElementById('orderFormMessage');

  // Remplace ces URLs par tes vrais liens de paiement
  const paymentLinks = {
    'RV-STD': 'https://t.co/X2pYPIhjxV',
    'RV-EXP': 'http://t.co/OqcAhWoSql',
    'RV-PRM': 'https://t.co/Umf9F8Jo3f'
  };

  const openPopup = () => {
    if (!popupOverlay) return;
    popupOverlay.removeAttribute('hidden');
    popupOverlay.style.display = 'flex';
    orderForm?.querySelector('#name')?.focus();
    const after = getComputedStyle(popupOverlay).display;
    if (after === 'none') popupOverlay.classList.add('force-open');
    const escHandler = (e) => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', escHandler, { once: true });
  };

  const closePopup = () => {
    if (!popupOverlay) return;
    popupOverlay.setAttribute('hidden', '');
    popupOverlay.style.display = 'none';
    popupOverlay.classList.remove('force-open');
    if (orderFormMessage) orderFormMessage.textContent = '';
  };

  orderButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.card');
      if (!card || !orderForm) return;

      const packageId   = card.getAttribute('data-package-id') || '';
      const packageName = (card.querySelector('h4')?.textContent || '').trim();
      const priceText   = (card.querySelector('.price')?.textContent || '').trim();
      const durationTxt = (card.querySelector('.duration')?.textContent || '').trim();

      orderForm.reset();
      if (orderFormMessage){ orderFormMessage.textContent = ''; orderFormMessage.style.color = '#6c5ce7'; }

      if (pkgDisplay)  pkgDisplay.textContent  = `Vous avez sélectionné : ${packageName}`;
      if (pkgPrice)    pkgPrice.textContent    = `Prix : ${priceText || '—'}`;
      if (pkgDuration) pkgDuration.textContent = `Détails : ${durationTxt}`;

      if (pkgInput)      pkgInput.value = packageId;
      if (priceInput)    priceInput.value = priceText;
      if (durationInput) durationInput.value = durationTxt;

      openPopup();
      popupOverlay?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  popupClose?.addEventListener('click', closePopup);
  popupOverlay?.addEventListener('click', (e) => { if (e.target === popupOverlay) closePopup(); });

  // Soumission : optionnel log + redirige paiement
  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const packageId = (orderForm.package?.value || '').trim();

    const RESELLER_SHEET_WEBAPP = ''; // ex: 'https://script.google.com/macros/s/xxxx/exec'
    const payload = {
      TypeCommande: 'Revendeur',
      Offre: packageId,
      Prix: orderForm.price?.value || '',
      Details: orderForm.duration?.value || '',
      Nom: orderForm.name?.value?.trim() || '',
      Telephone: orderForm.phone?.value?.trim() || '',
      Email: orderForm.email?.value?.trim() || '',
      Page: location.href,
      Timestamp: new Date().toISOString()
    };

    if (RESELLER_SHEET_WEBAPP){
      try{
        await fetch(RESELLER_SHEET_WEBAPP, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }catch(err){ console.warn('Log revendeur échoué (OK si non utilisé).', err); }
    }

    if (orderFormMessage) {
      orderFormMessage.style.color = '#00a36f';
      orderFormMessage.textContent = 'Redirection vers le paiement...';
    }

    setTimeout(() => {
      const pay = paymentLinks[packageId];
      if (pay && pay !== '#') {
        window.location.href = pay;
      } else {
        if (orderFormMessage) {
          orderFormMessage.style.color = '#ff4d4d';
          orderFormMessage.textContent = 'Lien de paiement indisponible. Contactez-nous.';
        }
      }
    }, 900);
  });
});
