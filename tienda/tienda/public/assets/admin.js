function fmt(n){return "$"+Number(n).toLocaleString("es-MX")}
var products=[], orders=[], coupons=[], editId=null;

function $(id){return document.getElementById(id)}

function setStatus(msg){
  var s=$("status"); if(s) s.textContent=msg?("Estado: "+msg):"";
  if(msg) console.log("[admin]",msg);
}

window.addEventListener("error",function(e){
  setStatus("Error de JavaScript: "+(e.message||e.error||"desconocido"));
});
window.addEventListener("unhandledrejection",function(e){
  setStatus("Promesa rechazada: "+(e.reason&&e.reason.message?e.reason.message:e.reason));
});

function showLogin(){ $("login").classList.remove("hidden"); $("dash").classList.add("hidden"); $("logout").classList.add("hidden"); }
function showDash(){ $("login").classList.add("hidden"); $("dash").classList.remove("hidden"); $("logout").classList.remove("hidden"); }

async function me(){
  setStatus("Comprobando sesión…");
  try{
    var r=await fetch("/api/auth",{credentials:"same-origin"});
    var d=await r.json();
    if(d && d.authed){ showDash(); await loadAll(); setStatus("Sesión activa. Listo."); }
    else { showLogin(); setStatus("Sin sesión. Ingresa tu contraseña."); }
  }catch(e){ setStatus("Error de conexión con /api/auth: "+e.message); }
}

async function doLogin(){
  var el=$("pwd");
  var pwd=el?el.value.trim():"";
  if(!pwd){ setStatus("Escribe la contraseña."); return; }
  setStatus("Enviando contraseña…");
  try{
    var r=await fetch("/api/auth",{
      method:"POST",
      headers:{"content-type":"application/json"},
      credentials:"same-origin",
      body:JSON.stringify({password:pwd})
    });
    setStatus("Respuesta del servidor: HTTP "+r.status);
    if(r.status===200){
      showDash();
      setStatus("Entraste. Cargando datos…");
      await loadAll();
      setStatus("Listo.");
    }else if(r.status===401){
      setStatus("Contraseña incorrecta (HTTP 401).");
    }else{
      setStatus("El servidor respondió HTTP "+r.status+". Revisa los logs de Netlify.");
    }
  }catch(e){
    setStatus("Error al conectar: "+e.message);
  }
}

async function logout(){
  await fetch("/api/auth",{method:"DELETE",credentials:"same-origin"});
  location.reload();
}

async function loadAll(){
  try{
    var rp=await fetch("/api/products",{credentials:"same-origin"});
    if(rp.ok){ var dp=await rp.json(); products=dp.products||[]; renderProducts(); }
  }catch(e){ setStatus("Error cargando productos: "+e.message); }
  try{
    var ro=await fetch("/api/orders",{credentials:"same-origin"});
    if(ro.ok){ var dord=await ro.json(); orders=dord.orders||[]; renderOrders(); }
  }catch(e){ setStatus("Error cargando pedidos: "+e.message); }
  try{
    var rc=await fetch("/api/coupons",{credentials:"same-origin"});
    if(rc.ok){ var dc=await rc.json(); coupons=dc.coupons||[]; renderCoupons(); }
  }catch(e){ setStatus("Error cargando cupones: "+e.message); }
}

function renderProducts(){
  $("prodBody").innerHTML=products.map(function(p){
    var pic=p.img?('<img src="'+p.img+'" style="width:40px;height:40px;border-radius:8px;object-fit:cover">'):(p.e||"📦");
    return '<tr><td>'+pic+'</td><td>'+(p.n||"")+'</td><td>'+(p.c||"")+'</td><td>'+fmt(p.p)+'</td><td>'+((p.stock===null||p.stock===undefined)?"-":p.stock)+'</td>'+
      '<td><button class="btn mini" onclick="editP('+p.id+')">Editar</button> <button class="btn mini" style="background:var(--orange)" onclick="delP('+p.id+')">Borrar</button></td></tr>';
  }).join("");
}

function editP(id){
  var p=products.find(function(x){return x.id===id}); if(!p) return;
  editId=id; $("pId").value=id; $("pName").value=p.n||""; $("pCat").value=p.c||""; $("pPrice").value=p.p||0;
  $("pStock").value=(p.stock===null||p.stock===undefined)?"":p.stock; $("pE").value=p.e||""; $("pTag").value=p.t||""; $("pBg").value=p.bg||"";
  $("pImg").value=p.img||""; $("pFile").value=""; $("pDesc").value=p.d||""; window.scrollTo(0,0);
}

function newP(){
  editId=null; $("pId").value=""; $("pName").value=""; $("pCat").value=""; $("pPrice").value="";
  $("pStock").value=""; $("pE").value=""; $("pTag").value=""; $("pBg").value=""; $("pImg").value=""; $("pFile").value=""; $("pDesc").value="";
}

async function delP(id){
  if(!confirm("¿Borrar producto?")) return;
  await fetch("/api/products?id="+id,{method:"DELETE",credentials:"same-origin"});
  await loadAll();
}

function readFile(){
  var f=$("pFile").files[0]; if(!f) return Promise.resolve(null);
  return new Promise(function(res){
    var r=new FileReader();
    r.onload=function(e){res(e.target.result)};
    r.readAsDataURL(f);
  });
}

async function saveP(){
  var img=$("pImg").value.trim();
  var dataurl=await readFile(); if(dataurl) img=dataurl;
  var payload={
    id:editId||undefined,
    n:$("pName").value.trim(), c:$("pCat").value.trim(), p:Number($("pPrice").value)||0,
    stock:($("pStock").value==="")?null:Number($("pStock").value),
    e:$("pE").value.trim(), t:$("pTag").value.trim(), bg:$("pBg").value.trim(), img:img, d:$("pDesc").value.trim()
  };
  await fetch("/api/products",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});
  await loadAll(); newP();
}

function renderOrders(){
  $("ordersBody").innerHTML=orders.map(function(o){
    var c=o.customer||{};
    var when=o.createdAt?o.createdAt.slice(0,16).replace("T"," "):"";
    var items=(o.items||[]).map(function(i){return (i.n||"")+" x "+i.qty}).join(", ");
    var opts=["pendiente","pagado","enviado","entregado","cancelado"].map(function(s){
      return '<option value="'+s+'"'+(s===o.status?" selected":"")+'>'+s+'</option>';
    }).join("");
    return '<tr><td>'+o.id+'</td><td>'+when+'</td><td>'+(c.name||"")+'<br><small>'+(c.phone||"")+' '+(c.email||"")+'</small></td>'+
      '<td>'+items+'</td><td>'+(o.shippingMethod||"pickup")+'</td><td>'+fmt(o.total)+'</td>'+
      '<td><select onchange="chgStatus(\''+o.id+'\',this.value)">'+opts+'</select></td>'+
      '<td><small style="color:var(--mut)">'+(o.payment||"")+'</small></td></tr>';
  }).join("");
}

async function chgStatus(id,st){
  await fetch("/api/orders",{method:"PUT",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify({id:id,status:st})});
  await loadAll();
}

function renderCoupons(){
  $("coupsBody").innerHTML=coupons.map(function(c){
    return '<tr><td>'+c.code+'</td><td>'+c.type+'</td><td>'+c.value+'</td><td>'+(c.minSubtotal||0)+'</td><td>'+(c.active?"Sí":"No")+'</td>'+
      '<td><button class="btn mini" style="background:var(--orange)" onclick="delC(\''+c.code+'\')">Borrar</button></td></tr>';
  }).join("");
}

async function saveC(){
  var payload={code:$("cCode").value.trim().toUpperCase(), type:$("cType").value, value:Number($("cVal").value)||0, minSubtotal:Number($("cMin").value)||0, active:$("cActive").value==="true"};
  if(!payload.code){ setStatus("Escribe un código de cupón."); return; }
  await fetch("/api/coupons",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});
  await loadAll();
  $("cCode").value=""; $("cVal").value=""; $("cMin").value="";
}

async function delC(code){
  if(!confirm("¿Borrar cupón?")) return;
  await fetch("/api/coupons?code="+encodeURIComponent(code),{method:"DELETE",credentials:"same-origin"});
  await loadAll();
}

function init(){
  $("loginBtn").addEventListener("click",doLogin);
  $("pwd").addEventListener("keydown",function(e){if(e.key==="Enter")doLogin()});
  $("logout").addEventListener("click",logout);
  document.querySelectorAll(".tab").forEach(function(b){
    b.addEventListener("click",function(){
      document.querySelectorAll(".tab").forEach(function(x){x.classList.toggle("active",x===b)});
      document.querySelectorAll("#dash section").forEach(function(s){s.classList.add("hidden")});
      $("s-"+b.dataset.t).classList.remove("hidden");
    });
  });
  $("saveP").addEventListener("click",saveP);
  $("newP").addEventListener("click",newP);
  $("saveC").addEventListener("click",saveC);
  $("pFile").addEventListener("change",function(e){ if(e.target.files[0]) $("pImg").value="(subiré archivo)"; });
  me();
}

if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded",init); } else { init(); }
