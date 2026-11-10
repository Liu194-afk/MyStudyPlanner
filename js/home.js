// home.js - image carousel for the home page (prev/next + auto cycle)
document.addEventListener('DOMContentLoaded',()=>{
  const img=document.querySelector('#carousel-image');
  const status=document.querySelector('#carousel-status');
  const prev=document.querySelector('#carousel-prev');
  const next=document.querySelector('#carousel-next');
  const toggle=document.querySelector('#carousel-toggle');
  if(!img||!status||!prev||!next||!toggle)return;
  const slides=[
    {src:'images/study-planner.png',alt:'Drawing of a calendar with marked days next to a checklist'},
    {src:'images/focus-session.png',alt:'Drawing of a clock next to a target with an arrow'},
    {src:'images/deadline-map.png',alt:'Drawing of a timeline with three deadline flags'}
  ];
  let i=0,timer=null;
  function show(n){
    // note: plain n % length breaks for n=-1 (see blog, bug 3), so add length first
    i=(n+slides.length)%slides.length;
    img.src=slides[i].src; img.alt=slides[i].alt;
    status.textContent=`Image ${i+1} of ${slides.length}: ${slides[i].alt}`;
  }
  function play(){ if(timer)return; timer=setInterval(()=>show(i+1),3500); toggle.textContent='Pause cycling'; toggle.setAttribute('aria-pressed','true'); }
  function pause(){ clearInterval(timer); timer=null; toggle.textContent='Start cycling'; toggle.setAttribute('aria-pressed','false'); }
  prev.addEventListener('click',()=>{pause();show(i-1)});
  next.addEventListener('click',()=>{pause();show(i+1)});
  toggle.addEventListener('click',()=>timer?pause():play());
  show(0); play();
});
