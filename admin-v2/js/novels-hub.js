"use strict";
(()=>{
  function ensure(){
    const tabs=document.querySelector(".admin-content-tabs");
    if(!tabs)return;
    let button=tabs.querySelector('[data-admin-tab="novels"]');
    if(!button){
      button=document.createElement("button");button.type="button";button.dataset.adminTab="novels";
      button.innerHTML='<i class="fa-solid fa-feather-pointed"></i><span>Novels</span><small>1</small>';
      tabs.appendChild(button);
    }
    if(button.dataset.novelsReady)return;
    button.dataset.novelsReady="1";
    button.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();location.href="./novels.html"},true);
  }
  const observer=new MutationObserver(ensure);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
})();
