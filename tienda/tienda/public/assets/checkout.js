const DEFAULT_P=[
  {id:1,n:"Barrita de Zanahoria",d:"Dulce y crujiente",p:35,c:"Barritas",e:"🥕",bg:"#ffe3c7"},
  {id:2,n:"Barrita de Betabel",d:"Con toque de manzana",p:38,c:"Barritas",e:"🟣",bg:"#f3d6f5"},
  {id:3,n:"Barrita de Brócoli",d:"Con queso y limón",p:38,c:"Barritas",e:"🥦",bg:"#d9f0c6"},
  {id:4,n:"Barrita de Jitomate",d:"Sabor pizza, sin culpa",p:36,c:"Barritas",e:"🍅",bg:"#ffd6d1"},
  {id:5,n:"Caja Mixta x6",d:"Una de cada sabor",p:199,c:"Cajas",e:"🎁",bg:"#d6ecff"},
  {id:6,n:"Caja Fiesta x12",d:"Ideal para escuela u oficina",p:379,c:"Cajas",e:"🎉",bg:"#fff1b8"},
  {id:7,n:"Playera Osito Arcoíris",d:"Talla infantil y adulto",p:249,c:"Regalos",e:"🧸",bg:"#fde0ef"}];

const SHIPPING={pickup:0,lalamove:79,paqueteria:99};
const $=id=>document.getElementById(id);
const fmt=n=>"$"+Number(n).toLocaleString("es-MX");

let cart={}, P=[], discount=0, couponCode="";

function loadCart(){
  try{cart=JSON.parse(localStorage.getItem("bb_cart"))||{}}catch(e){cart={}}
}

async function loadProducts(){
  try{
    const r=await fetch("/api/products");
    if(r.ok){const d=await r.json(); P=(d.products||[]).length?d.products:[]}
  }catch(e){}
  if(!P.length) P=DEFAULT_P;
  render();
}

function itemsList(){
  const keys=Object.keys(cart);
  if(!keys.length) return "<p>Tu carrito está vacío. <a href='index.html' style='color:var(--orange)'>Volver a la tienda</a>.</p>";
  return keys.map(i=>{
    const x=P.find(p=>p.id==i);
    if(!x) return "";
    const qty=cart[i]; const line=x.p*qty;
    return `<div class="item"><span>${x.n} x ${qty}</span><span>${fmt(line)}</span></div>`;
  }).join("");
}

function calc(){
  let subtotal=0, q=0;
  for(const i of Object.keys(cart)){
    const x=P.find(p=>p.id==i); if(!x) continue; q+=cart[i]; subtotal+=x.p*cart[i];
  }
  const m=document.querySelector("input[name=delivery]:checked").value;
  const sh=SHIPPING[m]||0;
  if(subtotal===0){discount=0; couponCode=""; $("coupon").value=""; $("couponMsg").textContent="";}
  const total=Math.max(0,subtotal+sh-discount);
  $("s").textContent=fmt(subtotal);
  $("sh").textContent=fmt(sh);
  $("disc").textContent=discount?`- ${fmt(discount)}`:"$0";
  $("t").textContent=fmt(total);
  $("items").innerHTML=itemsList();
  $("pay").disabled=!q;
  $("addrWrap").style.display=m==="pickup"?"none":"block";
}

async function applyCoupon(){
  const code=$("coupon").value.trim().toUpperCase();
  if(!code){discount=0; couponCode=""; $("couponMsg").textContent=""; calc(); return;}
  let subtotal=0;
  for(const i of Object.keys(cart)){ const x=P.find(p=>p.id==i); if(x) subtotal+=x.p*cart[i]; }
  try{
    const r=await fetch(`/api/coupons?validate=${encodeURIComponent(code)}&subtotal=${subtotal}`);
    if(!r.ok){throw new Error();}
    const d=await r.json();
    if(d.valid){discount=d.discount||0; couponCode=d.code; $("couponMsg").textContent="Cupón aplicado ✅"; calc(); return;}
  }catch(e){}
  discount=0; couponCode=""; $("couponMsg").textContent="Cupón no válido o monto mínimo no alcanzado."; calc();
}

async function createOrder(){
  if(!$("name").value.trim()||!$("phone").value.trim()){ alert("Nombre y teléfono son obligatorios"); return;}
  const m=document.querySelector("input[name=delivery]:checked").value;
  if(m!=="pickup"&&!$("address").value.trim()){ alert("La dirección es obligatoria para envío"); return;}
  let subtotal=0; const items=[];
  for(const i of Object.keys(cart)){ const x=P.find(p=>p.id==i); if(!x) continue; const qty=cart[i]; subtotal+=x.p*qty; items.push({id:x.id,qty}); }
  if(!items.length){ alert("Carrito vacío"); return;}
  const sh=SHIPPING[m]||0;
  const total=Math.max(0,subtotal+sh-discount);
  const body={
    items, coupon: couponCode||undefined,
    delivery:{method:m,address:$("address").value.trim()||undefined},
    customer:{name:$("name").value.trim(),phone:$("phone").value.trim(),email:$("email").value.trim(),notes:$("notes").value.trim()}
  };
  $("pay").disabled=true; $("pay").textContent="Creando pedido...";
  try{
    const r=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||"Error creando pedido");
    localStorage.removeItem("bb_cart");
    location.href=`success.html?order=${encodeURIComponent(d.orderId)}&total=${total}`;
  }catch(e){
    alert("Error al crear el pedido: "+(e.message||""));
    $("pay").disabled=false; $("pay").textContent="Crear pedido (sandbox)";
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  loadCart();
  loadProducts();
  document.querySelectorAll("input[name=delivery]").forEach(r=>r.addEventListener("change",calc));
  $("apply").addEventListener("click",applyCoupon);
  $("pay").addEventListener("click",createOrder);
  calc();
});
