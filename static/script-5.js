/* ---------- Helpers to locate rows ---------- */
function findMemoryRow(){
  const rows = document.querySelectorAll('tbody tr');
  for (const tr of rows) {
    const first = tr.querySelector('td:first-child');
    if (first && first.textContent.trim() === 'Memory Capacity') return tr;
  }
  return null;
}

function findFirstDrivesRow(){ // فقط Drives اپلاینس
  const rows = document.querySelectorAll('tbody tr');
  for (const tr of rows) {
    const first = tr.querySelector('td:first-child');
    if (first && first.textContent.trim() === 'Drives') return tr;
  }
  return null;
}

/* ---------- Mutations ---------- */
function setMemoryCapacity(memText, memSku){
  const tr = findMemoryRow();
  if (!tr) return;
  const optTd = tr.querySelector('td:nth-child(2)');
  const skuTd = tr.querySelector('td:nth-child(3)');
  if (optTd) optTd.textContent = memText || '';
  if (skuTd) skuTd.textContent = memSku  || '';
}

function rebuildQtySelect(selectEl, newMax, defaultValue=null){
  if (!selectEl) return;
  const currentVal = parseInt(selectEl.value || '1', 10);
  selectEl.innerHTML = '';
  for (let i = 1; i <= newMax; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    // defaultSelected فقط برای «سرور» نیست، ولی برای سازگاری می‌گذاریم false
    selectEl.appendChild(opt);
  }
  if (defaultValue != null) {
    selectEl.value = String(defaultValue);
  } else {
    selectEl.value = String(Math.min(currentVal, newMax));
  }
}

/* 1200T/3200T → 1..23 (default=23) | others → 1..21 */
function updateApplianceDrivesQtyMax(baseLabel){
  const tr = findFirstDrivesRow();
  if (!tr) return;
  const qtySel = tr.querySelector('td:nth-child(4) select.dd-qty');
  const is23   = /1200T|3200T/.test(baseLabel || '');
  const newMax = is23 ? 23 : 21;
  rebuildQtySelect(qtySel, newMax, is23 ? 23 : null);
}

/* ---------- Export ---------- */
function exportTableToExcel(){
  const table = document.querySelector('table');
  const rows  = [];
  const header = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
  rows.push(header);
  table.querySelectorAll('tbody tr').forEach(tr=>{
    const cells = [];
    tr.querySelectorAll('td').forEach(td=>{
      const sel = td.querySelector('select');
      cells.push(sel ? sel.options[sel.selectedIndex].textContent.trim() : td.textContent.trim());
    });
    rows.push(cells);
  });
  const html = '<html><head><meta charset="utf-8"></head><body><table>'
    + rows.map(r=>'<tr>'+r.map(c=>'<td>'+String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;")+'</td>').join('')+'</tr>').join('')
    + '</table></body></html>';
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'powerstore-config.xls';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- QTY fixed wrapper (for non-select cells) ---------- */
function normalizeQtyFixed() {
  document.querySelectorAll('tbody tr').forEach(tr => {
    const td = tr.querySelector('td:nth-child(4)'); // ستون QTY
    if (!td) return;
    if (td.querySelector('select')) return; // اگر dropdown دارد، کاری نکن

    const txt = td.textContent.trim();
    if (!txt) return;
    if (td.querySelector('.qty-fixed')) return; // دوباره‌کاری نکن

    td.innerHTML = '<span class="qty-fixed">' + txt + '</span>';
  });
}

/* ===========================================================
   🔄 ریست به پیش‌فرض‌های «سرور» بعد از هر بار load/refresh
   =========================================================== */

/* تمام selectها را به گزینه‌ی دارای selected از HTML (Jinja) برگردان */
function resetSelectsToServerDefaults(){
  document.querySelectorAll('select').forEach(sel=>{
    // جلوگیری از autofill مرورگر
    sel.setAttribute('autocomplete', 'off');

    let idx = -1;
    for (let i = 0; i < sel.options.length; i++){
      if (sel.options[i].defaultSelected) { idx = i; break; }
    }
    // اگر گزینه‌ی selected در HTML نبود، پیش‌فرض: اولین گزینه
    sel.selectedIndex = (idx >= 0 ? idx : 0);
  });
}

/* بعد از ریست، وابستگی‌ها را هم دوباره اعمال کن */
function applyDerivedDefaultsAfterReset(){
  const baseSel = document.querySelector('select.dd-base');
  if (baseSel){
    const opt = baseSel.options[baseSel.selectedIndex];
    setMemoryCapacity(opt.dataset.memText, opt.dataset.memSku);
    updateApplianceDrivesQtyMax(opt.value);
  }
  normalizeQtyFixed();
}

/* وقتی صفحه از bfcache برمی‌گردد هم ریست کن */
window.addEventListener('pageshow', (e)=>{
  // persisted یعنی از bfcache برگشته
  if (e.persisted) {
    resetSelectsToServerDefaults();
    applyDerivedDefaultsAfterReset();
  }
});

/* ---------- Initial boot ---------- */
window.addEventListener('DOMContentLoaded', ()=>{
  // همیشه قبل از هر کاری، به defaultsِ HTML برگرد
  resetSelectsToServerDefaults();
  applyDerivedDefaultsAfterReset();

  document.getElementById('btn-export').addEventListener('click', exportTableToExcel);
});

/* ---------- React to user changes ---------- */
document.addEventListener('change', function(e){
  const el = e.target;
  if (!el.classList) return;

  if (el.classList.contains('dd-base')){
    const opt = el.options[el.selectedIndex];
    const tr  = el.closest('tr');
    const skuCell = tr && tr.querySelector('td:nth-child(3)');
    if (skuCell) skuCell.textContent = opt.dataset.sku || '';
    setMemoryCapacity(opt.dataset.memText, opt.dataset.memSku);
    updateApplianceDrivesQtyMax(opt.value);
  }

  if (el.classList.contains('dd-drive')){
    const tr = el.closest('tr');
    const skuCell = tr && tr.querySelector('td:nth-child(3)');
    if (skuCell){
      const opt = el.options[el.selectedIndex];
      skuCell.textContent = opt.dataset.sku || '';
    }
  }

  if (el.classList.contains('dd-sfp')){
    const tr = el.closest('tr');
    const skuCell = tr && tr.querySelector('td:nth-child(3)');
    if (skuCell){
      const opt = el.options[el.selectedIndex];
      skuCell.textContent = opt.dataset.sku || '';
    }
  }

  // اگر dropdownها عوض شدند، مجدد Fixedها را wrap کن
  normalizeQtyFixed();
});