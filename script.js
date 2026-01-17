// script.js - Shared logic: services, orders, costs stored in localStorage
(() => {
  // keys
  const SVC_KEY = 'bms_services_v2';
  const ORD_KEY = 'bms_orders_v2';
  const COST_KEY = 'bms_costs_v2';

  // in-memory
  let services = [];
  let orders = [];
  let recurring = [];

  // load from storage
  function loadAll(){
    try {
      services = JSON.parse(localStorage.getItem(SVC_KEY)) || [];
      orders = JSON.parse(localStorage.getItem(ORD_KEY)) || [];
      recurring = JSON.parse(localStorage.getItem(COST_KEY)) || [];
    } catch(e) {
      services = []; orders = []; recurring = [];
    }
  }

  function saveServices(){ localStorage.setItem(SVC_KEY, JSON.stringify(services)); }
  function saveOrders(){ localStorage.setItem(ORD_KEY, JSON.stringify(orders)); }
  function saveRecurring(){ localStorage.setItem(COST_KEY, JSON.stringify(recurring)); }

  // seed defaults if empty
  function seedDefaults(){
    if(services.length === 0){
      services = [
        {id:1, name:'A4 B/W Printing', price:50, qty:9999, unit:'per page', img:'printing.jpg', desc:'Black & white A4 printing'},
        {id:2, name:'A4 Colour Printing', price:150, qty:9999, unit:'per page', img:'printing.jpg', desc:'Full color A4 printing'},
        {id:3, name:'Photocopy (B/W)', price:20, qty:9999, unit:'per page', img:'printing.jpg', desc:'Photocopy per page'},
        {id:4, name:'Lamination', price:200, qty:9999, unit:'per item', img:'lamination.jpg', desc:'Lamination service'},
      ];
      saveServices();
    }
  }

  // --- PUBLIC renderers used by index.html & services.html ---
  window.renderHomeServices = function(){
    loadAll(); seedDefaults();
    const grid = document.getElementById('home-services-grid');
    if(!grid) return;
    grid.innerHTML = '';
    const top = services.slice(0,4);
    top.forEach(s=>{
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <img src="images/${s.img || 'printing.jpg'}" alt="${s.name}" onerror="this.style.display='none'">
        <h3>${s.name}</h3>
        <p class="muted">₦${Number(s.price).toLocaleString()} • ${s.unit}</p>
      `;
      grid.appendChild(card);
    });
  };

  window.renderServicesGrid = function(){
    loadAll(); seedDefaults();
    const grid = document.getElementById('services-grid');
    if(!grid) return;
    grid.innerHTML = '';
    services.forEach(s=>{
      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <img src="images/${s.img || 'printing.jpg'}" alt="${s.name}" onerror="this.style.display='none'">
        <h3><a href="#" data-id="${s.id}" class="svc-link">${s.name}</a></h3>
        <p class="muted">₦${Number(s.price).toLocaleString()} • ${s.unit}</p>
      `;
      grid.appendChild(card);
    });
    // attach links
    document.querySelectorAll('.svc-link').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const id = Number(e.target.dataset.id);
        showServiceDetail(id);
      });
    });
  };

  function showServiceDetail(id){
    const s = services.find(x=>x.id===id);
    if(!s) return alert('Service not found');
    document.getElementById('services-grid').classList.add('hidden');
    const detail = document.getElementById('service-detail');
    detail.classList.remove('hidden');
    document.getElementById('detail-image').src = 'images/'+(s.img||'printing.jpg');
    document.getElementById('detail-title').textContent = s.name;
    document.getElementById('detail-desc').textContent = s.desc || '';
    // table
    const wrap = document.getElementById('detail-table-wrap');
    wrap.innerHTML = `
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">
        <thead style="background:#0077b6; color:white;">
          <tr><th>Product / Service</th><th>Price (₦)</th><th>Quantity</th></tr>
        </thead>
        <tbody>
          <tr><td>${s.name}</td><td>${Number(s.price).toLocaleString()}</td><td>${s.qty}</td></tr>
        </tbody>
      </table>
    `;
  }

  // --- DASHBOARD initialiser & helpers ---
  window.initDashboard = function(){
    loadAll(); seedDefaults();
    // elements (dashboard.html ids)
    const svcName = document.getElementById('svc-name');
    const svcPrice = document.getElementById('svc-price');
    const svcUnit = document.getElementById('svc-unit');
    const svcImg = document.getElementById('svc-img');
    const svcAdd = document.getElementById('svc-add');
    const svcSave = document.getElementById('svc-save');
    const svcSeed = document.getElementById('svc-seed');
    const svcTableWrap = document.getElementById('svc-table-wrap');

    const ordCustomer = document.getElementById('ord-customer');
    const ordService = document.getElementById('ord-service');
    const ordQty = document.getElementById('ord-qty');
    const ordAdd = document.getElementById('ord-add');
    const ordersWrap = document.getElementById('orders-wrap');

    const costName = document.getElementById('cost-name');
    const costAmt = document.getElementById('cost-amt');
    const costAdd = document.getElementById('cost-add');
    const recurringWrap = document.getElementById('recurring-wrap');

    const oneName = document.getElementById('one-name');
    const oneAmt = document.getElementById('one-amt');
    const oneAdd = document.getElementById('one-add');
    const oneWrap = document.getElementById('one-wrap');

    const repFrom = document.getElementById('rep-from');
    const repTo = document.getElementById('rep-to');
    const repGen = document.getElementById('rep-gen');
    const repResult = document.getElementById('rep-result');
    const repExport = document.getElementById('rep-export');

    const exportSvc = document.getElementById('export-svc');
    const exportOrd = document.getElementById('export-ord');

    function refreshUI(){
      // services table (editable)
      svcTableWrap.innerHTML = '';
      const tbl = document.createElement('table');
      tbl.className = 'small';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Name</th><th>Price (₦)</th><th>Qty</th><th>Unit</th><th>Image</th><th>Actions</th></tr>';
      const tbody = document.createElement('tbody');
      services.forEach((s,idx)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input data-idx="${idx}" class="edit-name" value="${s.name}"></td>
          <td><input data-idx="${idx}" type="number" class="edit-price" value="${s.price}"></td>
          <td><input data-idx="${idx}" type="number" class="edit-qty" value="${s.qty}"></td>
          <td><input data-idx="${idx}" class="edit-unit" value="${s.unit||''}"></td>
          <td><input data-idx="${idx}" class="edit-img" value="${s.img||''}"></td>
          <td><button data-idx="${idx}" class="del-svc">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
      tbl.appendChild(thead); tbl.appendChild(tbody);
      svcTableWrap.appendChild(tbl);

      // attach listeners for inline edits & delete
      tbl.querySelectorAll('.edit-name').forEach(inp=>{
        inp.addEventListener('change', e=>{
          const i = Number(e.target.dataset.idx); services[i].name = e.target.value; saveServices(); renderServicesGrid(); renderHomeServices(); populateOrderServiceSelect();
        });
      });
      tbl.querySelectorAll('.edit-price').forEach(inp=>{
        inp.addEventListener('change', e=>{
          const i=Number(e.target.dataset.idx); services[i].price = Number(e.target.value||0); saveServices(); renderServicesGrid(); renderHomeServices(); populateOrderServiceSelect();
        });
      });
      tbl.querySelectorAll('.edit-qty').forEach(inp=>{
        inp.addEventListener('change', e=>{
          const i=Number(e.target.dataset.idx); services[i].qty = Number(e.target.value||0); saveServices();
        });
      });
      tbl.querySelectorAll('.edit-unit').forEach(inp=>{
        inp.addEventListener('change', e=>{
          const i=Number(e.target.dataset.idx); services[i].unit = e.target.value; saveServices();
        });
      });
      tbl.querySelectorAll('.edit-img').forEach(inp=>{
        inp.addEventListener('change', e=>{
          const i=Number(e.target.dataset.idx); services[i].img = e.target.value; saveServices(); renderServicesGrid();
        });
      });
      tbl.querySelectorAll('.del-svc').forEach(btn=>{
        btn.addEventListener('click', e=>{
          const i = Number(e.target.dataset.idx);
          if(!confirm('Delete this service?')) return;
          services.splice(i,1); saveServices(); refreshUI(); renderServicesGrid(); renderHomeServices(); populateOrderServiceSelect();
        });
      });

      // orders list
      ordersWrap.innerHTML = '';
      if(orders.length===0) ordersWrap.innerHTML = '<div class="muted small">No orders yet</div>';
      else {
        const otbl = document.createElement('table'); otbl.className='small';
        const the = document.createElement('thead'); the.innerHTML = '<tr><th>When</th><th>Customer</th><th>Service</th><th>Qty</th><th>Total</th><th>Paid</th><th>Actions</th></tr>';
        const tbd = document.createElement('tbody');
        orders.forEach((o, i)=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${new Date(o.createdAt).toLocaleString()}</td><td>${o.customer}</td><td>${o.serviceName}</td><td>${o.qty}</td><td>₦${(o.qty*o.price).toLocaleString()}</td><td>${o.paid? 'Yes':'No'}</td><td><button data-i="${i}" class="mark-paid">${o.paid? 'Unpay':'Mark Paid'}</button> <button data-i="${i}" class="del-ord">Delete</button></td>`;
          tbd.appendChild(tr);
        });
        otbl.appendChild(the); otbl.appendChild(tbd); ordersWrap.appendChild(otbl);
        otbl.querySelectorAll('.mark-paid').forEach(b=>{
          b.addEventListener('click', e=>{ const i=Number(e.target.dataset.i); orders[i].paid=!orders[i].paid; saveOrders(); refreshUI(); });
        });
        otbl.querySelectorAll('.del-ord').forEach(b=>{
          b.addEventListener('click', e=>{ const i=Number(e.target.dataset.i); if(!confirm('Delete order?')) return; orders.splice(i,1); saveOrders(); refreshUI(); });
        });
      }

      populateOrderServiceSelect();
      renderServicesGrid();
      renderHomeServices();
    }

    function populateOrderServiceSelect(){
      const sel = document.getElementById('ord-service');
      if(!sel) return;
      sel.innerHTML = '';
      services.forEach(s=>{
        const opt = document.createElement('option'); opt.value = s.id; opt.textContent = `${s.name} — ₦${s.price}`;
        sel.appendChild(opt);
      });
    }

    // add events
    svcAdd.addEventListener('click', ()=>{
      const name = svcName.value.trim(); if(!name) return alert('Enter name');
      const price = Number(svcPrice.value || 0); const unit = svcUnit.value.trim(); const img = svcImg.value.trim() || '';
      const id = Date.now() + Math.floor(Math.random()*999);
      services.push({ id, name, price, qty:9999, unit, img, desc:'' });
      saveServices(); svcName.value=''; svcPrice.value=0; svcUnit.value=''; svcImg.value='';
      refreshUI();
      alert('Service added. Remember to Save to keep changes.');
    });
    svcSave.addEventListener('click', ()=>{ saveServices(); alert('Services saved to localStorage'); });
    svcSeed.addEventListener('click', ()=>{ if(confirm('Reset to default services?')){ services=[]; saveServices(); seedDefaults(); loadAll(); refreshUI(); } });

    ordAdd.addEventListener('click', ()=>{
      const cust = (ordCustomer.value || 'Walk-in').trim();
      const svcId = Number(ordService.value);
      const svc = services.find(s=>s.id===svcId); if(!svc) return alert('Select service');
      const qty = Math.max(1, Number(ordQty.value||1));
      const order = { id: Date.now(), createdAt: new Date().toISOString(), customer: cust, serviceId: svc.id, serviceName: svc.name, price: svc.price, qty, paid:false };
      orders.unshift(order); saveOrders(); refreshUI(); ordCustomer.value=''; ordQty.value=1;
    });

    exportSvc.addEventListener('click', ()=> {
      if(services.length===0) return alert('No services');
      const rows = services.map(s=> [s.id, s.name, s.price, s.qty, s.unit, s.img].map(f=> `"${String(f).replace(/"/g,'""')}"`).join(','));
      const csv = ['id,name,price,qty,unit,img', ...rows].join('\n'); download(csv, 'bmsprints_services.csv', 'text/csv');
    });
    exportOrd.addEventListener('click', ()=> {
      if(orders.length===0) return alert('No orders');
      const rows = orders.map(o=> [o.id, o.createdAt, o.customer, o.serviceName, o.qty, o.price, o.paid ? 'Yes':'No'].map(f=> `"${String(f).replace(/"/g,'""')}"`).join(','));
      const csv = ['id,createdAt,customer,service,qty,price,paid', ...rows].join('\n'); download(csv, 'bmsprints_orders.csv', 'text/csv');
    });

    // costs
    function renderRecurring(){ recurringWrap.innerHTML = recurring.length===0? '<div class="muted small">No recurring costs</div>' : recurring.map(c=> `<div>${c.name}: ₦${Number(c.amount).toLocaleString()} <button data-id="${c.id}" class="del-rec">Remove</button></div>`).join(''); recurringWrap.querySelectorAll('.del-rec').forEach(b=>{ b.addEventListener('click', e=>{ const id=Number(e.target.dataset.id); recurring = recurring.filter(x=>x.id!==id); saveRecurring(); renderRecurring(); }); }); }
    costAdd.addEventListener('click', ()=>{ const name = (costName.value||'').trim(); const amt=Number(costAmt.value||0); if(!name) return alert('Name'); recurring.push({ id: Date.now(), name, amount: amt}); costName.value=''; costAmt.value=0; saveRecurring(); renderRecurring(); });

    // one-time
    let oneTime = [];
    function renderOneTime(){ oneWrap.innerHTML = oneTime.length===0? '<div class="muted small">No one-time costs</div>' : oneTime.map(c=> `<div>${c.name}: ₦${Number(c.amount).toLocaleString()} <button data-id="${c.id}" class="del-one">Remove</button></div>`).join(''); oneWrap.querySelectorAll('.del-one').forEach(b=>{ b.addEventListener('click', e=>{ const id=Number(e.target.dataset.id); oneTime = oneTime.filter(x=>x.id!==id); renderOneTime(); }); }); }
    oneAdd.addEventListener('click', ()=>{ const name=(oneName.value||'').trim(); const amt=Number(oneAmt.value||0); if(!name) return alert('Name'); oneTime.push({id: Date.now(), name, amount: amt}); oneName.value=''; oneAmt.value=0; renderOneTime(); });

    repGen.addEventListener('click', ()=>{
      const from = repFrom.value ? new Date(repFrom.value+'T00:00:00') : null;
      const to = repTo.value ? new Date(repTo.value+'T23:59:59') : null;
      const ords = orders.filter(o=>{
        const d = new Date(o.createdAt);
        if(from && d < from) return false;
        if(to && d > to) return false;
        return true;
      });
      const totalOrders = ords.length;
      const paidOrders = ords.filter(o=>o.paid).length;
      const revenue = ords.reduce((s,o)=> s + (o.paid ? o.price * o.qty : 0), 0);
      const recurringSum = recurring.reduce((s,c)=> s + Number(c.amount||0), 0);
      let days = 30;
      if(from && to) days = Math.ceil((to - from)/(1000*60*60*24)) + 1;
      const recurringForPeriod = (recurringSum/30) * days;
      const oneSum = oneTime.reduce((s,c)=> s + Number(c.amount||0), 0);
      const totalCosts = recurringForPeriod + oneSum;
      const profit = revenue - totalCosts;
      repResult.innerHTML = `<div><strong>Total Orders:</strong> ${totalOrders}</div><div><strong>Paid Orders:</strong> ${paidOrders}</div><div style="margin-top:8px"><strong>Total Revenue (₦):</strong> <span style="color:green;font-weight:700">₦${revenue.toLocaleString()}</span></div><div><strong>Costs (₦):</strong> ₦${Math.round(totalCosts).toLocaleString()} <small class="muted">(${Math.round(recurringForPeriod).toLocaleString()} recurring + ${Math.round(oneSum).toLocaleString()} one-time)</small></div><div style="margin-top:8px"><strong>Profit (₦):</strong> <span style="font-weight:700">₦${Math.round(profit).toLocaleString()}</span></div>`;
      // store report data for export
      repExport.dataset.csv = JSON.stringify({ ords, totalOrders, revenue, totalCosts, profit });
    });

    repExport.addEventListener('click', ()=>{
      const dataStr = repExport.dataset.csv;
      if(!dataStr) return alert('Generate report first');
      const obj = JSON.parse(dataStr);
      const rows = obj.ords.map(o=> [o.id, o.createdAt, o.customer, o.serviceName, o.qty, o.price, o.paid ? 'Yes':'No'].map(v=> `"${String(v).replace(/"/g,'""')}"`).join(','));
      const csv = ['id,createdAt,customer,service,qty,price,paid', ...rows].join('\n');
      download(csv, `bmsprints_report_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
    });

    // initial render
    refreshUI();
    renderRecurring();
    renderOneTime();

    // utility to download
    function download(content, filename, mime){
      const blob = new Blob([content], { type: mime || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 100);
    }
  }

  // shared download used elsewhere
  window.download = fu