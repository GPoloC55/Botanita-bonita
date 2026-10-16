const fmt=n=>"$"+Number(n).toLocaleString("es-MX");
let products=[], orders=[], coupons=[], editId=null;

function $(id){return document.getElementById(id)}

async function me(){
  try{
    const r=await fetch("/api/auth");
    const d=await r.json();
    if(d.authed){ $("#login").classList.add("hidden"); $("#dash").classList.remove("hidden"); $("#logout").classList.remove("hidden"); await loadAll();}
    else{ $("#login").classList.remove("hidden"); $("#dash").classList.add("hidden");}
  }catch(e){ $("#loginErr").textContent="Error de conexión";}
}

async function login(){
  const pwd=$("#pwd").value.trim();
  if(!pwd) return;
  try{
    const r=await fetch("/api/auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:pwd})});
    if(!r.ok){ $("#loginErr").textContent="Contraseña incorrecta"; return;}
    await me();
  }catch(e){ $("#loginErr").textContent="Error de conexión";}
}

async function logout(){
  await fetch("/api/auth",{method:"DELETE"});
  location.reload();
}

async function loadAll(){
  const [rp,ro,rc]=await Promise.all([
    fetch("/api/products"), fetch("/api/orders"), fetch("/api/coupons")
  ]);
  if(rp.ok){const d=await rp.json(); products=d.products||[]; renderProducts();}
  if(ro.ok){const d=await ro.json(); orders=d.orders||[]; renderOrders();}
  if(rc.ok){const d=await rc.json(); coupons=d.coupons||[]; renderCoupons();}
}

function renderProducts(){
  $("#prodBody").innerHTML=products.map(p=>`
    <tr>
      <td>${p.img?`<img src="${p.img}" style="width:40px;height:40px;border-radius:8px;object-fit:cover">`:(p.e||"📦")}</td>
      <td>${p.n}</td><td>${p.c||""}</td><td>${fmt(p.p)}</td><td>${p.stock??"-"}</td>
      <td><button class="btn mini" onclick='editP(${p.id})'>Editar</button> <button class="btn mini" style="background:var(--orange)" onclick='delP(${p.id})'>Borrar</button></td>
    </tr>
  `).join("");
}

function editP(id){
  const p=products.find(x=>x.id===id); if(!p) return;
  editId=id; $("#pId").value=id; $("#pName").value=p.n||""; $("#pCat").value=p.c||""; $("#pPrice").value=p.p||0;
  $("#pStock").value=p.stock??""; $("#pE").value=p.e||""; $("#pTag").value=p.t||""; $("#pBg").value=p.bg||"";
  $("#pImg").value=p.img||""; $("#pFile").value=""; $("#pDesc").value=p.d||""; window.scrollTo({top:0,behavior:"smooth"});
}

function newP(){
  editId=null; $("#pId").value=""; $("#pName").value=""; $("#pCat").value=""; $("#pPrice").value="";
  $("#pStock").value=""; $("#pE").value=""; $("#pTag").value=""; $("#pBg").value=""; $("#pImg").value=""; $("#pFile").value=""; $("#pDesc").value="";
}

async function delP(id){
  if(!confirm("¿Borrar producto?")) return;
  await fetch("/api/products?id="+id,{method:"DELETE"});
  await loadAll();
}

async function readFile(){
  const f=$("#pFile").files[0]; if(!f) return null;
  return new Promise(res=>{
    const r=new FileReader();
    r.onload=e=>res(e.target.result);
    r.readAsDataURL(f);
  });
}

async function saveP(){
  let img=$("#pImg").value.trim();
  const dataurl=await readFile(); if(dataurl) img=dataurl;
  const body={
    name:$("#pName").value.trim(), cat:$("#pCat").value.trim(), price:Number($("#pPrice").value)||0,
    stock:$("#pStock").value===""?null:Number($("#pStock").value), emoji:$("#pE").value.trim(), tag:$("#pTag").value.trim(),
    bg:$("#pBg").value.trim(), img, desc:$("#pDesc").value.trim()
  };
  if(editId){ body.id=editId; }
  await fetch("/api/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
    id:editId||undefined, n:body.name, c:body.cat, p:body.price, stock:body.stock, e:body.emoji, t:body.tag, bg:body.bg, img:body.img, d:body.desc
  })});
  await loadAll(); newP();
}

function renderOrders(){
  $("#ordersBody").innerHTML=orders.map(o=>`
    <tr>
      <td>${o.id}</td><td>${o.createdAt?o.createdAt.slice(0,16).replace("T"," "):""}</td>
      <td>${o.customer?.name||""}<br><small>${o.customer?.phone||""} ${o.customer?.email||""}</small></td>
      <td>${(o.items||[]).map(i=>`${i.n} x ${i.qty}`).join(", ")}</td>
      <td>${o.shippingMethod||"pickup"}</td><td>${fmt(o.total)}</td>
      <td><select onchange='chgStatus("${o.id}",this.value)'>
        ${["pendiente","pagado","enviado","entregado","cancelado"].map(s=>`<option value="${s}" ${s===o.status?"selected":""}>${s}</option>`).join("")}
      </select></td>
      <td><small style="color:var(--mut)">${o.payment||""}</small></td>
    </tr>
  `).join("");
}

async function chgStatus(id,st){
  await fetch("/api/orders",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({id,status:st})});
  await loadAll();
}

function renderCoupons(){
  $("#coupsBody").innerHTML=coupons.map(c=>`
    <tr><td>${c.code}</td><td>${c.type}</td><td>${c.value}</td><td>${c.minSubtotal||0}</td><td>${c.active?"Sí":"No"}</td>
      <td><button class="btn mini" style="background:var(--orange)" onclick='delC("${c.code}")'>Borrar</button></td></tr>
  `).join("");
}

async function saveC(){
  const body={code:$("#cCode").value.trim().toUpperCase(), type:$("#cType").value, value:Number($("#cVal").value)||0, minSubtotal:Number($("#cMin").value)||0, active:$("#cActive").value==="true"};
  if(!body.code) return;
  await fetch("/api/coupons",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  await loadAll();
  $("#cCode").value=""; $("#cVal").value=""; $("#cMin").value="";
}

async function delC(code){
  if(!confirm("¿Borrar cupón?")) return;
  await fetch("/api/coupons?code="+encodeURIComponent(code),{method:"DELETE"});
  await loadAll();
}

document.addEventListener("DOMContentLoaded",()=>{
  $("#loginBtn").addEventListener("click",login);
  $("#pwd").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
  $("#logout").addEventListener("click",logout);
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));
    document.querySelectorAll("#dash section").forEach(s=>s.classList.add("hidden"));
    $("#s-"+b.dataset.t).classList.remove("hidden");
  }));
  $("#saveP").addEventListener("click",saveP);
  $("#newP").addEventListener("click",newP);
  $("#saveC").addEventListener("click",saveC);
  $("#pFile").addEventListener("change",async e=>{ if(e.target.files[0]) $("#pImg").value="(subiré archivo)"; });
  me();
});
