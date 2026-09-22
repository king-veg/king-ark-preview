const header = document.querySelector('.header');
const menu = document.querySelector('.menu');
const nav = document.querySelector('.nav');
const mobileQuery = matchMedia('(max-width: 820px)');
let lastFocused = null;

document.documentElement.classList.add('reveal-ready');

addEventListener('scroll', () => {
  header.classList.toggle('scrolled', scrollY > 40);
}, { passive: true });

function setMenu(open) {
  menu.classList.toggle('open', open);
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  nav.inert = mobileQuery.matches && !open;
  document.body.classList.toggle('menu-open', open);

  if (open) {
    lastFocused = document.activeElement;
    nav.querySelector('a')?.focus();
  } else if (lastFocused && mobileQuery.matches) {
    lastFocused.focus();
  }
}

menu.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
});

function syncMenuMode() {
  if (!mobileQuery.matches) {
    nav.inert = false;
    setMenu(false);
  } else {
    nav.inert = !menu.classList.contains('open');
  }
}

mobileQuery.addEventListener?.('change', syncMenuMode);
syncMenuMode();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}
