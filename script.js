document.addEventListener('DOMContentLoaded', () => {
  const HEADER_OFFSET = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-h')
  ) || 76;

  /* ===== MENU BURGER / PANNEAU MOBILE (auto-close) ===== */
  const burger = document.getElementById('burger');
  const mainNav = document.querySelector('.main-nav');
  const mobilePanel = document.getElementById('mobile-menu');

  // Backdrop pour clic dehors
  const backdrop = document.getElementById('menu-backdrop') || (() => {
    const el = document.createElement('div');
    el.id = 'menu-backdrop';
    el.setAttribute('hidden', '');
    document.body.appendChild(el);
    return el;
  })();

  function buildMobileMenuOnce() {
    if (!mainNav || !mobilePanel) return;
    if (mobilePanel.querySelector('ul')) return; // déjà cloné
    const desktopList = mainNav.querySelector('ul');
    if (desktopList) {
      mobilePanel.innerHTML = '';
      const cloned = desktopList.cloneNode(true);
      mobilePanel.appendChild(cloned);
      // Ferme le menu si on clique un lien
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

    // Focus UX
    const firstFocusable = mobilePanel.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
    (firstFocusable || burger)?.focus();
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

  // Clic/tap en dehors du panneau = fermer
  document.addEventListener('pointerdown', (e) => {
    if (!mobilePanel.classList.contains('open')) return;
    const t = e.target;
    if (!mobilePanel.contains(t) && !burger?.contains(t)) {
      closeMobileMenu();
    }
  }, { passive: true });

  // ESC = fermer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobilePanel.classList.contains('open')) {
      closeMobileMenu();
    }
  });

  // Scroll/resize/hash = fermer si ouvert
  window.addEventListener('scroll', () => {
    if (mobilePanel.classList.contains('open')) closeMobileMenu();
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1000 && mobilePanel.classList.contains('open')) {
      closeMobileMenu();
    }
  });
  window.addEventListener('hashchange', closeMobileMenu);

  /* ===== SCROLL INTERNE AVEC OFFSET HEADER (délégué) ===== */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

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

    if (mobilePanel?.classList.contains('open')) closeMobileMenu();
  });

  /* ===== POPUP COMMANDE ===== */
  const orderButtons = document.querySelectorAll('.order-btn');
  const popupOverlay = document.getElementById('popupOverlay');
  const popupClose = document.getElementById('popupClose');
  const orderForm = document.getElementById('orderForm');

  const pkgDisplay   = document.getElementById('packageDisplay');
  const pkgPrice     = document.getElementById('packagePrice');
  const pkgDuration  = document.getElementById('packageDuration');

  const pkgInput     = document.getElementById('package');
  const priceInput   = document.getElementById('price');
  const durationInput= document.getElementById('duration');

  const orderFormMessage =
    document.querySelector('#popupOverlay .form-message') ||
    document.getElementById('orderFormMessage') ||
    null;

  const paymentLinks = {
    "1": "https://t.co/LsYgkO0Jbb",
    "2": "https://t.co/JXsB6ie3ZI",
    "3": "https://t.co/9EYMjcYOHv",
    "4": "https://t.co/gP8prG9r2i",
    "5": "https://t.co/9EYMjcYOHv",
    "6": "https://t.co/VPGZwj4Daf",
    "7": "https://t.co/LFao5MdHzx",
    "8": "https://t.co/VPGZwj4Daf",
    "9": "https://t.co/LFao5MdHzx",
    "10": "https://t.co/wAXrrx1B4V"
  };

  const openPopup = () => {
    if (!popupOverlay) return;
    popupOverlay.removeAttribute('hidden');
    popupOverlay.style.display = 'flex';
    orderForm?.querySelector('#name')?.focus();

    const after = getComputedStyle(popupOverlay).display;
    if (after === 'none') {
      popupOverlay.classList.add('force-open');
    }

    const escHandler = e => { if (e.key === 'Escape') closePopup(); };
    document.addEventListener('keydown', escHandler, { once: true });
  };

  const closePopup = () => {
    if (!popupOverlay) return;
    popupOverlay.setAttribute('hidden', '');
    popupOverlay.style.display = 'none';
    popupOverlay.classList.remove('force-open');
    if (orderFormMessage) orderFormMessage.textContent = '';
  };

  orderButtons.forEach(button => {
    button.addEventListener('click', e => {
      e.preventDefault();
      const card = button.closest('.card');
      if (!card || !orderForm) return;

      const packageId = card.getAttribute('data-package-id') || '';
      const packageName = (card.querySelector('h4')?.textContent || '').trim();
      const packagePriceValue = (card.querySelector('.price')?.textContent || '').trim();
      const packageDurationValue = (card.querySelector('.duration')?.textContent || '').trim();

      orderForm.reset();
      if (orderFormMessage) orderFormMessage.textContent = '';

      if (pkgDisplay)  pkgDisplay.textContent  = `Vous avez sélectionné : ${packageName}`;
      if (pkgPrice)    pkgPrice.textContent    = `Prix : ${packagePriceValue}`;
      if (pkgDuration) pkgDuration.textContent = `Durée : ${packageDurationValue}`;

      if (pkgInput)      pkgInput.value = packageId;
      if (priceInput)    priceInput.value = packagePriceValue;
      if (durationInput) durationInput.value = packageDurationValue;

      openPopup();
      popupOverlay?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  popupClose?.addEventListener('click', closePopup);
  popupOverlay?.addEventListener('click', e => { if (e.target === popupOverlay) closePopup(); });

  orderForm?.addEventListener('submit', e => {
    e.preventDefault();
    if (!orderForm) return;

    const packageId = (orderForm.package?.value || '').trim();
    const formData = {
      Nom: orderForm.name?.value.trim(),
      Téléphone: orderForm.phone?.value.trim(),
      Email: orderForm.email?.value.trim(),
      Offre: packageId,
      Prix: orderForm.price?.value.trim(),
      Durée: orderForm.duration?.value.trim(),
      DateCommande: new Date().toLocaleString()
    };

    if (orderFormMessage) {
      orderFormMessage.style.color = '#00a36f';
      orderFormMessage.textContent = 'Commande en cours d’enregistrement...';
    }

    fetch('https://script.google.com/macros/s/AKfycbzhGpcaGGExXpdX-BhdvPLd02wEi3Uk94HsSmR5N2QMhDaYSzjiR2nwGpmmM9_tWwV9OA/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(() => {
      if (orderFormMessage) {
        orderFormMessage.style.color = '#00a36f';
        orderFormMessage.textContent = 'Commande enregistrée ! Redirection vers le paiement...';
      }
      setTimeout(() => {
        const paymentUrl = paymentLinks[packageId];
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else if (orderFormMessage) {
          orderFormMessage.style.color = '#ff4d4d';
          orderFormMessage.textContent = 'Erreur : lien de paiement introuvable.';
          console.error('Aucun lien pour offre:', packageId);
        }
      }, 1200);
    })
    .catch(() => {
      if (orderFormMessage) {
        orderFormMessage.style.color = '#ff4d4d';
        orderFormMessage.textContent = 'Erreur lors de l’enregistrement. Veuillez réessayer.';
      }
    });
  });

  /* ===== ÉTAPES : 1→2→3 à chaque entrée ===== */
  (function(){
    const stepsSection = document.querySelector('.steps');
    const steps = document.querySelectorAll('.step');
    if (!stepsSection || !steps.length) return;

    const STEP_INTERVAL = 650;
    let isPlaying = false;
    let timers = [];

    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const resetSteps = () => {
      clearTimers();
      steps.forEach(s => s.classList.remove('active'));
      isPlaying = false;
    };
    const playSequence = () => {
      resetSteps();
      isPlaying = true;
      steps.forEach((step, i) => {
        timers.push(setTimeout(() => step.classList.add('active'), i * STEP_INTERVAL));
      });
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isPlaying) {
          playSequence();
        } else if (!entry.isIntersecting && isPlaying) {
          resetSteps();
        }
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

    io.observe(stepsSection);
  })();

  /* ===== FADE-IN AU SCROLL ===== */
  const faders = document.querySelectorAll('.fade-in-up');
  const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
  faders.forEach(el => appearOnScroll.observe(el));

  /* ===== CONTACT : Google Sheets + WhatsApp + Mail ===== */
  const GOOGLE_SHEET_WEBAPP = 'https://script.google.com/macros/s/AKfycbzbBPBXU6D4-Wk3g5fc8_CIgjuvmUCo9XBNMt6VSP9-uHE_k5kbDND5NpxSFY-5g0LeMw/exec';
  const contactForm = document.getElementById('contactForm');

  const contactMsg =
    document.querySelector('#contact .form-message') ||
    document.getElementById('contactFormMessage') ||
    document.getElementById('formMessage');

  const waBtn =
    document.getElementById('whatsappBtn') ||
    document.querySelector('.contact-buttons .whatsapp-btn');

  const mailBtn =
    document.getElementById('mailBtn') ||
    document.querySelector('.contact-buttons .mail-btn');

  const WA_NUMBER = '212668618410';
  const EMAIL_TO = 'contact@ironpro.ma';

  function getContactPayload() {
    if (!contactForm) return {};
    const fd = new FormData(contactForm);
    return {
      Nom: (fd.get('nom') || '').trim(),
      Telephone: (fd.get('telephone') || '').trim(),
      Email: (fd.get('mail') || '').trim(),
      Type: fd.get('type_demande') || '',
      Message: (fd.get('message') || '').trim(),
      Page: location.href,
      Timestamp: new Date().toISOString()
    };
  }

  function formatMessage(p) {
    return (
      `Bonjour, je souhaite vous contacter.\n\n` +
      `Nom : ${p.Nom || ''}\n` +
      `Téléphone : ${p.Telephone || ''}\n` +
      `Email : ${p.Email || ''}\n` +
      `Type : ${p.Type || ''}\n` +
      `Message : ${p.Message || ''}\n\n` +
      `— via ironpro.ma`
    );
  }

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = getContactPayload();

    if (contactMsg) {
      contactMsg.style.color = '#6c5ce7';
      contactMsg.textContent = 'Envoi en cours...';
    }

    try {
      await fetch(GOOGLE_SHEET_WEBAPP, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (contactMsg) {
        contactMsg.style.color = '#00a36f';
        contactMsg.textContent = 'Merci ! Votre message a été envoyé.';
      }
      contactForm.reset();
    } catch (error) {
      if (contactMsg) {
        contactMsg.style.color = '#ff4444';
        contactMsg.textContent = 'Erreur, veuillez réessayer plus tard.';
      }
      console.error(error);
    }
  });

  waBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const p = contactForm ? getContactPayload() : {};
    const text = formatMessage(p);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });

  mailBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const p = contactForm ? getContactPayload() : {};
    const subject = 'Contact via ironpro.ma';
    const body = formatMessage(p);
    window.location.href = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});

// UX : spinner + disabled pendant l’envoi du formulaire de contact
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  const sendBtn = document.getElementById('sendBtn');

  if (!contactForm || !sendBtn) return;

  contactForm.addEventListener('submit', () => {
    sendBtn.classList.add('loading');
    sendBtn.setAttribute('disabled', 'true');
    // Petit filet de sécurité : réactive après 6s si rien ne répond
    setTimeout(() => {
      if (sendBtn.classList.contains('loading')) {
        sendBtn.classList.remove('loading');
        sendBtn.removeAttribute('disabled');
      }
    }, 6000);
  });

  // Si ton code met un message de succès/erreur, tu peux appeler ceci à la fin :
  //  sendBtn.classList.remove('loading'); sendBtn.removeAttribute('disabled');
});
