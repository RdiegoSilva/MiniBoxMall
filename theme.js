/* Tema claro/escuro — compartilhado por index.html e tutorial.html */
(function(){
  var K="pesacerto-theme", root=document.documentElement;
  var mq=window.matchMedia("(prefers-color-scheme: dark)");
  function saved(){ try{ return localStorage.getItem(K); }catch(e){ return null; } }
  function apply(t){
    root.setAttribute("data-theme",t);
    var b=document.querySelectorAll("[data-theme-set]");
    for(var i=0;i<b.length;i++) b[i].setAttribute("aria-pressed", String(b[i].getAttribute("data-theme-set")===t));
  }
  apply(saved()||(mq.matches?"dark":"light"));
  var f=function(e){ if(!saved()) apply(e.matches?"dark":"light"); };
  if(mq.addEventListener) mq.addEventListener("change",f);
  document.addEventListener("DOMContentLoaded",function(){
    apply(root.getAttribute("data-theme"));
    document.querySelectorAll("[data-theme-set]").forEach(function(btn){
      btn.addEventListener("click",function(){
        var t=btn.getAttribute("data-theme-set");
        root.classList.add("theme-anim"); apply(t);
        try{ localStorage.setItem(K,t); }catch(e){}
        setTimeout(function(){ root.classList.remove("theme-anim"); },500);
      });
    });
  });
})();
