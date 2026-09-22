const menuBtn=document.querySelector('.menu-toggle');
const drawer=document.querySelector('[data-drawer]');
if(menuBtn&&drawer){
  menuBtn.addEventListener('click',()=>{
    const open=menuBtn.getAttribute('aria-expanded')==='true';
    menuBtn.setAttribute('aria-expanded',String(!open));
    drawer.hidden=open;
    document.body.classList.toggle('drawer-open',!open);
  });
  drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    drawer.hidden=true;menuBtn.setAttribute('aria-expanded','false');document.body.classList.remove('drawer-open');
  }));
}
const els=[...document.querySelectorAll('.reveal')];
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -4%'});
  els.forEach(el=>io.observe(el));
}else{els.forEach(el=>el.classList.add('is-visible'))}