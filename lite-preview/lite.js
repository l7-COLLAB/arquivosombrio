(function(){
var root=document.documentElement,body=document.body;
function get(k){try{return localStorage.getItem("as-lite-"+k)}catch(e){return null}}
function put(k,v){try{localStorage.setItem("as-lite-"+k,v)}catch(e){}}
function apply(){var theme=get("theme")==="paper"?"paper":"dark",size=get("size")||"normal";body.className=body.className.replace(/\b(paper|large|small)\b/g,"").replace(/\s+/g," ")+" "+(theme==="paper"?"paper ":"")+(size==="large"?"large":size==="small"?"small":"");}
function init(){apply();var buttons=document.querySelectorAll("[data-lite-setting]");for(var i=0;i<buttons.length;i++){buttons[i].onclick=function(){var k=this.getAttribute("data-lite-setting");if(k==="theme")put("theme",get("theme")==="paper"?"dark":"paper");if(k==="size"){var s=get("size")||"normal";put("size",s==="normal"?"large":s==="large"?"small":"normal")}apply();return false;};}
var save=document.getElementById("save-reading"),resume=document.getElementById("resume-reading");
if(save){save.onclick=function(){put("last",location.href.split("#")[0]);this.innerHTML="Leitura marcada";return false;};}
if(resume){var last=get("last");if(last&&last.indexOf(location.origin+location.pathname.split("/").slice(0,-1).join("/"))===0){resume.href=last;resume.style.display="inline-block";}}
var q=document.getElementById("lite-query"),form=document.getElementById("lite-search"),rows=document.querySelectorAll("[data-search]"),category=document.getElementById("lite-category"),sort=document.getElementById("lite-sort");
function filter(){if(!rows.length)return;var term=q?q.value.toLowerCase():"",cat=category?category.value:"all";for(var i=0;i<rows.length;i++){var row=rows[i],show=(cat==="all"||row.getAttribute("data-category")===cat)&&row.getAttribute("data-search").indexOf(term)!==-1;row.style.display=show?"":"none";}}
if(form)form.onsubmit=function(){filter();return false};if(q)q.onkeyup=filter;if(category)category.onchange=filter;
if(sort)sort.onchange=function(){var list=document.getElementById("search-results");if(!list)return;var arr=[];for(var i=0;i<rows.length;i++)arr.push(rows[i]);arr.sort(function(a,b){var k=sort.value,va=a.getAttribute("data-"+k)||"",vb=b.getAttribute("data-"+k)||"";return k==="date"?(va<vb?1:va>vb?-1:0):(va<vb?-1:va>vb?1:0)});for(var j=0;j<arr.length;j++)list.appendChild(arr[j]);filter();};
}
if(document.addEventListener)document.addEventListener("DOMContentLoaded",init,false);else window.onload=init;
})();