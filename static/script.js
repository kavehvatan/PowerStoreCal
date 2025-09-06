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
    selectEl.appendChild(opt);
  }
  if (defaultValue != null) {
    selectEl.value = String(defaultValue);
  } else {
    selectEl.value = String(Math.min(currentVal, newMax));
  }
}

// 1200T/3200T → 1..23 (default=23) | others → 1..21
function updateApplianceDrivesQtyMax(baseLabel){
  const tr = findFirstDrivesRow();
  if (!tr) return;
  const qtySel = tr.querySelector('td:nth-child(4) select.dd-qty');
  const is23   = /1200T|3200T/.test(baseLabel || '');
  const newMax = is23 ? 23 : 21;
  rebuildQtySelect(qtySel, newMax, is23 ? 23 : null);
}

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
});

window.addEventListener('DOMContentLoaded', ()=>{
  const baseSel = document.querySelector('select.dd-base');
  if (baseSel){
    const opt = baseSel.options[baseSel.selectedIndex];
    setMemoryCapacity(opt.dataset.memText, opt.dataset.memSku);
    updateApplianceDrivesQtyMax(opt.value);
  }
});

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
document.getElementById('btn-export').addEventListener('click', exportTableToExcel);