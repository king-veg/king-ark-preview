const menuButton = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');

if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
}

// Client photo replacement map.
// Replace any URL below with a supplied client image without changing layout markup.
const imageMap = {
  hero: '',
  interior: '',
  latte: '',
  iced: '',
  cake: '',
  counter: ''
};

document.querySelectorAll('[data-image-key]').forEach(slot => {
  const key = slot.dataset.imageKey;
  if (imageMap[key]) slot.style.backgroundImage = `url("${imageMap[key]}")`;
});


// Standard-tier reveal: deliberately restrained.
const softObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      softObserver.unobserve(entry.target);
    }
  });
}, { threshold: .14 });
document.querySelectorAll('.reveal-soft').forEach(el => softObserver.observe(el));


// Demo-only external links: keep prototype self-contained and explain replacement point.
document.querySelectorAll('.demo-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const msg = link.dataset.demoMessage || '実案件では正式URLに差し替えます';
    link.setAttribute('title', msg);
  });
});

// Keyboard polish for mobile navigation.
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.focus();
  }
});
