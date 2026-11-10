// shared.js - used by every page: footer clock + highlighting the current nav link
(function(){
  function pad(n){return String(n).padStart(2,'0')}
  function renderDateTime(){
    const now=new Date();
    const text=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    document.querySelectorAll('[data-current-datetime]').forEach(el=>{el.textContent=text});
  }
  function markActive(){
    const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('.site-nav a').forEach(a=>{
      const href=(a.getAttribute('href')||'').toLowerCase();
      if(href===page)a.classList.add('active');
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{markActive();renderDateTime();setInterval(renderDateTime,1000)});
})();
