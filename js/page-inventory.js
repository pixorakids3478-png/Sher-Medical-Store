// SHER MEDICAL STORE - INVENTORY, MEDICINES, STOCK, PURCHASES & RETURNS
import { store } from './store.js';
import { formatCurrency, formatDate, showToast, openModal, closeModal, confirmDialog } from './ui.js';

// ==========================================
// 1. MEDICINES MANAGEMENT
// ==========================================
export function renderMedicinesPage(container) {
  let search = '';
  let categoryFilter = 'all';

  function render() {
    let list = store.data.medicines;
    if (categoryFilter !== 'all') {
      list = list.filter(m => m.categoryId === categoryFilter);
    }
    if (search) {
      list = list.filter(m => 
        m.name.toLowerCase().includes(search) ||
        (m.genericName && m.genericName.toLowerCase().includes(search)) ||
        (m.brand && m.brand.toLowerCase().includes(search)) ||
        (m.barcode && m.barcode.toLowerCase().includes(search))
      );
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Medicines Catalog</h2>
          <p>Manage pharmaceutical products, batch details, pricing, and stock formulas</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="med-export-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Export CSV</span>
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="med-add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Medicine</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="table-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="table-search-input" id="med-search-input" placeholder="Search medicine, formula, barcode..." value="${search}">
            </div>
            <select class="table-filter-select" id="med-cat-filter">
              <option value="all">All Categories</option>
              ${store.data.categories.map(c => `
                <option value="${c.id}" ${c.id === categoryFilter ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="toolbar-right">
            <span class="text-xs text-muted">Total: <strong>${list.length}</strong> items</span>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Batch / Shelf</th>
                <th>Expiry</th>
                <th class="cell-num">Cost Price</th>
                <th class="cell-num">Sale Price</th>
                <th class="cell-center">Stock</th>
                <th class="cell-center">Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="med-table-body">
              ${list.length === 0 ? `
                <tr>
                  <td colspan="9">
                    <div class="table-empty-state">
                      <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      </div>
                      <h4>No medicines added yet</h4>
                      <p>Start populating your pharmacy catalog by clicking "+ Add Medicine" button.</p>
                      <button type="button" class="btn btn-primary btn-sm" id="empty-add-med-btn">+ Add First Medicine</button>
                    </div>
                  </td>
                </tr>
              ` : list.map(med => {
                const isOut = Number(med.quantity) <= 0;
                const isLow = store.isLowStock(med);
                const isNearExp = store.isNearExpiry(med.expiryDate);
                const isExp = store.isExpired(med.expiryDate);

                let statusBadge = '<span class="status-text success">In Stock</span>';
                if (isExp) statusBadge = '<span class="status-text danger">Expired</span>';
                else if (isNearExp) statusBadge = '<span class="status-text warning">Near Expiry</span>';
                else if (isOut) statusBadge = '<span class="status-text danger">Out of Stock</span>';
                else if (isLow) statusBadge = '<span class="status-text warning">Low Stock</span>';

                const catObj = store.data.categories.find(c => c.id === med.categoryId);

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600; color: var(--text-main);">${med.name}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${med.genericName || med.brand || '-'}</div>
                    </td>
                    <td>${catObj ? catObj.name : 'Unassigned'}</td>
                    <td>
                      <div>${med.batchNo || '-'}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${med.rack ? `Rack: ${med.rack}` : ''}</div>
                    </td>
                    <td>${formatDate(med.expiryDate)}</td>
                    <td class="cell-num">${formatCurrency(med.purchasePrice)}</td>
                    <td class="cell-num font-mono"><strong>${formatCurrency(med.salePrice)}</strong></td>
                    <td class="cell-center font-mono" style="font-weight: 700;">${med.quantity}</td>
                    <td class="cell-center">${statusBadge}</td>
                    <td style="text-align: right;">
                      <div class="row-actions">
                        <button type="button" class="action-btn view-med-btn" data-id="${med.id}" title="View Details">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button type="button" class="action-btn edit-med-btn" data-id="${med.id}" title="Edit Medicine">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" class="action-btn delete delete-med-btn" data-id="${med.id}" title="Delete Medicine">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind event handlers
    const searchInp = document.getElementById('med-search-input');
    if (searchInp) {
      searchInp.oninput = (e) => {
        search = e.target.value.toLowerCase().trim();
        render();
      };
    }

    const catSelect = document.getElementById('med-cat-filter');
    if (catSelect) {
      catSelect.onchange = (e) => {
        categoryFilter = e.target.value;
        render();
      };
    }

    const addBtn = document.getElementById('med-add-btn');
    if (addBtn) addBtn.onclick = () => openMedicineModal(null, render);

    const emptyAdd = document.getElementById('empty-add-med-btn');
    if (emptyAdd) emptyAdd.onclick = () => openMedicineModal(null, render);

    container.querySelectorAll('.view-med-btn').forEach(btn => {
      btn.onclick = () => openViewMedicineModal(btn.dataset.id);
    });

    container.querySelectorAll('.edit-med-btn').forEach(btn => {
      btn.onclick = () => openMedicineModal(btn.dataset.id, render);
    });

    container.querySelectorAll('.delete-med-btn').forEach(btn => {
      btn.onclick = () => {
        const med = store.getMedicine(btn.dataset.id);
        if (!med) return;
        confirmDialog(`Are you sure you want to delete "${med.name}" from your catalog?`, () => {
          store.data.medicines = store.data.medicines.filter(m => m.id !== med.id);
          store.save();
          showToast(`Medicine "${med.name}" deleted successfully.`, 'info');
          render();
        }, 'Delete Medicine');
      };
    });

    const exportBtn = document.getElementById('med-export-btn');
    if (exportBtn) {
      exportBtn.onclick = () => exportMedicinesCSV();
    }
  }

  render();
}

function openMedicineModal(editId = null, onSaved) {
  const isEdit = Boolean(editId);
  const med = isEdit ? store.getMedicine(editId) : {
    name: '',
    genericName: '',
    brand: '',
    categoryId: store.data.categories[0]?.id || '',
    type: 'Tablet',
    strength: '',
    packSize: '10',
    batchNo: '',
    barcode: '',
    rack: '',
    supplier: '',
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    minStock: 10,
    mfgDate: '',
    expiryDate: '',
    description: ''
  };

  openModal({
    title: isEdit ? 'Edit Medicine' : 'Add New Medicine',
    size: 'lg',
    bodyHtml: `
      <form id="med-form">
        <div class="form-row">
          <div class="form-group">
            <label>Medicine Name *</label>
            <input type="text" id="mf-name" required value="${med.name}" placeholder="e.g. Panadol Extra">
          </div>
          <div class="form-group">
            <label>Generic / Formula Name</label>
            <input type="text" id="mf-generic" value="${med.genericName || ''}" placeholder="e.g. Paracetamol + Caffeine">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Category *</label>
            <select id="mf-category">
              ${store.data.categories.map(c => `
                <option value="${c.id}" ${c.id === med.categoryId ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Brand / Manufacturer</label>
            <input type="text" id="mf-brand" value="${med.brand || ''}" placeholder="e.g. GSK, Abbott, Getz">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Type / Dosage Form</label>
            <select id="mf-type">
              <option value="Tablet" ${med.type === 'Tablet' ? 'selected' : ''}>Tablet</option>
              <option value="Capsule" ${med.type === 'Capsule' ? 'selected' : ''}>Capsule</option>
              <option value="Syrup" ${med.type === 'Syrup' ? 'selected' : ''}>Syrup</option>
              <option value="Suspension" ${med.type === 'Suspension' ? 'selected' : ''}>Suspension</option>
              <option value="Injection" ${med.type === 'Injection' ? 'selected' : ''}>Injection</option>
              <option value="Ointment" ${med.type === 'Ointment' ? 'selected' : ''}>Ointment / Gel</option>
              <option value="Drops" ${med.type === 'Drops' ? 'selected' : ''}>Eye / Ear Drops</option>
              <option value="Inhaler" ${med.type === 'Inhaler' ? 'selected' : ''}>Inhaler</option>
              <option value="Device" ${med.type === 'Device' ? 'selected' : ''}>Surgical / Device</option>
            </select>
          </div>
          <div class="form-group">
            <label>Strength</label>
            <input type="text" id="mf-strength" value="${med.strength || ''}" placeholder="e.g. 500mg, 10ml, 250mg/5ml">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Purchase / Cost Price (${store.data.settings.currency || 'Rs.'}) *</label>
            <input type="number" id="mf-cost" step="0.01" min="0" required value="${med.purchasePrice}">
          </div>
          <div class="form-group">
            <label>Sale Price (${store.data.settings.currency || 'Rs.'}) *</label>
            <input type="number" id="mf-sale" step="0.01" min="0" required value="${med.salePrice}">
          </div>
          <div class="form-group">
            <label>Opening / Current Stock *</label>
            <input type="number" id="mf-qty" min="0" required value="${med.quantity}">
          </div>
          <div class="form-group">
            <label>Min. Stock Level</label>
            <input type="number" id="mf-min" min="0" value="${med.minStock}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="mf-batch" value="${med.batchNo || ''}" placeholder="e.g. BTH-8902">
          </div>
          <div class="form-group">
            <label>Barcode / GTIN</label>
            <input type="text" id="mf-barcode" value="${med.barcode || ''}" placeholder="Scan barcode or enter code">
          </div>
          <div class="form-group">
            <label>Rack / Shelf Location</label>
            <input type="text" id="mf-rack" value="${med.rack || ''}" placeholder="e.g. Shelf A-3">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Manufacturing Date</label>
            <input type="date" id="mf-mfg" value="${med.mfgDate ? med.mfgDate.slice(0, 10) : ''}">
          </div>
          <div class="form-group">
            <label>Expiry Date *</label>
            <input type="date" id="mf-exp" required value="${med.expiryDate ? med.expiryDate.slice(0, 10) : ''}">
          </div>
        </div>

        <div class="form-group">
          <label>Description / Notes</label>
          <textarea id="mf-desc" placeholder="Special storage instructions or indications...">${med.description || ''}</textarea>
        </div>
      </form>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-med-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-med-save">${isEdit ? 'Update Medicine' : 'Save Medicine'}</button>
    `
  });

  document.getElementById('modal-med-cancel').onclick = closeModal;
  document.getElementById('modal-med-save').onclick = () => {
    const name = document.getElementById('mf-name').value.trim();
    if (!name) return showToast('Medicine name is required', 'warning');

    const cost = parseFloat(document.getElementById('mf-cost').value);
    const sale = parseFloat(document.getElementById('mf-sale').value);
    const qty = parseInt(document.getElementById('mf-qty').value, 10);
    const exp = document.getElementById('mf-exp').value;

    if (isNaN(cost) || cost < 0) return showToast('Valid purchase price required', 'warning');
    if (isNaN(sale) || sale < 0) return showToast('Valid sale price required', 'warning');
    if (isNaN(qty) || qty < 0) return showToast('Valid quantity required', 'warning');
    if (!exp) return showToast('Expiry date is required', 'warning');

    const medData = {
      name,
      genericName: document.getElementById('mf-generic').value.trim(),
      brand: document.getElementById('mf-brand').value.trim(),
      categoryId: document.getElementById('mf-category').value,
      type: document.getElementById('mf-type').value,
      strength: document.getElementById('mf-strength').value.trim(),
      purchasePrice: cost,
      salePrice: sale,
      quantity: qty,
      minStock: parseInt(document.getElementById('mf-min').value, 10) || 10,
      batchNo: document.getElementById('mf-batch').value.trim(),
      barcode: document.getElementById('mf-barcode').value.trim(),
      rack: document.getElementById('mf-rack').value.trim(),
      mfgDate: document.getElementById('mf-mfg').value || null,
      expiryDate: exp,
      description: document.getElementById('mf-desc').value.trim()
    };

    if (isEdit) {
      const idx = store.data.medicines.findIndex(m => m.id === editId);
      if (idx !== -1) {
        store.data.medicines[idx] = { ...store.data.medicines[idx], ...medData, updatedAt: new Date().toISOString() };
      }
      showToast('Medicine updated successfully', 'success');
    } else {
      store.data.medicines.push({
        id: store.generateId('med'),
        ...medData,
        createdAt: new Date().toISOString()
      });
      showToast('Medicine added to catalog', 'success');
    }

    store.save();
    closeModal();
    onSaved();
  };
}

function openViewMedicineModal(medId) {
  const med = store.getMedicine(medId);
  if (!med) return;

  const catObj = store.data.categories.find(c => c.id === med.categoryId);
  const profitMargin = med.salePrice > 0 ? (((med.salePrice - med.purchasePrice) / med.salePrice) * 100).toFixed(1) : 0;
  const unitProfit = med.salePrice - med.purchasePrice;

  openModal({
    title: `${med.name} - Product Details`,
    size: 'md',
    bodyHtml: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 13px;">
        <div><strong>Generic Name:</strong> <p class="text-muted">${med.genericName || 'N/A'}</p></div>
        <div><strong>Category:</strong> <p class="text-muted">${catObj ? catObj.name : 'Unassigned'}</p></div>
        <div><strong>Brand:</strong> <p class="text-muted">${med.brand || 'N/A'}</p></div>
        <div><strong>Dosage Form:</strong> <p class="text-muted">${med.type} (${med.strength || 'N/A'})</p></div>
        <div><strong>Batch No:</strong> <p class="text-muted font-mono">${med.batchNo || 'N/A'}</p></div>
        <div><strong>Rack / Shelf:</strong> <p class="text-muted">${med.rack || 'Unassigned'}</p></div>
        <div><strong>Barcode:</strong> <p class="text-muted font-mono">${med.barcode || 'N/A'}</p></div>
        <div><strong>Current Stock:</strong> <p class="font-mono" style="font-weight: 700; color: ${med.quantity > 0 ? 'var(--primary)' : 'var(--danger)'};">${med.quantity} units</p></div>
        <div><strong>Cost Price:</strong> <p class="font-mono">${formatCurrency(med.purchasePrice)}</p></div>
        <div><strong>Sale Price:</strong> <p class="font-mono">${formatCurrency(med.salePrice)}</p></div>
        <div><strong>Profit Margin:</strong> <p class="font-mono" style="color: var(--success);">${unitProfit >= 0 ? '+' : ''}${formatCurrency(unitProfit)} (${profitMargin}%)</p></div>
        <div><strong>Expiry Date:</strong> <p class="font-mono">${formatDate(med.expiryDate)}</p></div>
      </div>
      ${med.description ? `
        <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border);">
          <strong>Description:</strong>
          <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${med.description}</p>
        </div>
      ` : ''}
    `,
    footerHtml: `<button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-close-btn').click()">Close</button>`
  });
}

function exportMedicinesCSV() {
  const meds = store.data.medicines;
  if (meds.length === 0) return showToast('No medicines to export', 'warning');

  const headers = ['Name', 'Generic Name', 'Category', 'Batch', 'Cost Price', 'Sale Price', 'Quantity', 'Expiry Date', 'Barcode'];
  const rows = meds.map(m => [
    `"${m.name}"`,
    `"${m.genericName || ''}"`,
    `"${(store.data.categories.find(c => c.id === m.categoryId)?.name || '')}"`,
    `"${m.batchNo || ''}"`,
    m.purchasePrice,
    m.salePrice,
    m.quantity,
    `"${m.expiryDate || ''}"`,
    `"${m.barcode || ''}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medicines_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Medicines exported to CSV successfully', 'success');
}

// ==========================================
// 2. CATEGORIES MANAGEMENT
// ==========================================
export function renderCategoriesPage(container) {
  function render() {
    const cats = store.data.categories;
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Medicine Categories</h2>
          <p>Organize products by therapeutic or pharmaceutical classifications</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="cat-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Category</span>
        </button>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th class="cell-center">Medicines Count</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${cats.map(c => {
                const count = store.data.medicines.filter(m => m.categoryId === c.id).length;
                return `
                  <tr>
                    <td style="font-weight: 600;">${c.name}</td>
                    <td style="color: var(--text-secondary);">${c.desc || '-'}</td>
                    <td class="cell-center font-mono">${count} items</td>
                    <td style="text-align: right;">
                      <div class="row-actions">
                        <button type="button" class="action-btn edit-cat-btn" data-id="${c.id}" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" class="action-btn delete delete-cat-btn" data-id="${c.id}" title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('cat-add-btn').onclick = () => openCategoryModal(null, render);

    container.querySelectorAll('.edit-cat-btn').forEach(btn => {
      btn.onclick = () => openCategoryModal(btn.dataset.id, render);
    });

    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.onclick = () => {
        const cat = store.data.categories.find(c => c.id === btn.dataset.id);
        if (!cat) return;
        confirmDialog(`Delete category "${cat.name}"? Existing medicines in this category will become unassigned.`, () => {
          store.data.categories = store.data.categories.filter(c => c.id !== cat.id);
          store.save();
          showToast('Category deleted', 'info');
          render();
        }, 'Delete Category');
      };
    });
  }

  render();
}

function openCategoryModal(editId = null, onSaved) {
  const isEdit = Boolean(editId);
  const cat = isEdit ? store.data.categories.find(c => c.id === editId) : { name: '', desc: '' };

  openModal({
    title: isEdit ? 'Edit Category' : 'Add New Category',
    size: 'sm',
    bodyHtml: `
      <div class="form-group">
        <label>Category Name *</label>
        <input type="text" id="cat-name-input" value="${cat.name}" required placeholder="e.g. Antibiotics">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="cat-desc-input" placeholder="Category notes...">${cat.desc || ''}</textarea>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-cat-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-cat-save">${isEdit ? 'Update' : 'Save'}</button>
    `
  });

  document.getElementById('modal-cat-cancel').onclick = closeModal;
  document.getElementById('modal-cat-save').onclick = () => {
    const name = document.getElementById('cat-name-input').value.trim();
    if (!name) return showToast('Category name is required', 'warning');
    const desc = document.getElementById('cat-desc-input').value.trim();

    if (isEdit) {
      const target = store.data.categories.find(c => c.id === editId);
      if (target) {
        target.name = name;
        target.desc = desc;
      }
    } else {
      store.data.categories.push({
        id: store.generateId('cat'),
        name,
        desc
      });
    }

    store.save();
    closeModal();
    showToast(`Category ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    onSaved();
  };
}

// ==========================================
// 3. STOCK MANAGEMENT (SECTION 8)
// ==========================================
export function renderStockPage(container) {
  let filter = 'all';

  function render() {
    let list = store.data.medicines;

    // Filter computation
    if (filter === 'inStock') list = list.filter(m => Number(m.quantity) > (m.minStock || 10));
    else if (filter === 'lowStock') list = list.filter(m => store.isLowStock(m));
    else if (filter === 'outOfStock') list = list.filter(m => store.isOutOfStock(m));
    else if (filter === 'nearExpiry') list = list.filter(m => store.isNearExpiry(m.expiryDate) && !store.isExpired(m.expiryDate));
    else if (filter === 'expired') list = list.filter(m => store.isExpired(m.expiryDate));

    // Summary counts
    const totalUnits = store.data.medicines.reduce((sum, m) => sum + Number(m.quantity || 0), 0);
    const lowCount = store.data.medicines.filter(m => store.isLowStock(m)).length;
    const outCount = store.data.medicines.filter(m => store.isOutOfStock(m)).length;
    const nearExpCount = store.data.medicines.filter(m => store.isNearExpiry(m.expiryDate) && !store.isExpired(m.expiryDate)).length;
    const expCount = store.data.medicines.filter(m => store.isExpired(m.expiryDate)).length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Stock Management</h2>
          <p>Real-time stock valuation, reorder thresholds, and expiration surveillance</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="stock-adjust-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          <span>Adjust Stock / Audit</span>
        </button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-title">Total Units in Stock</span>
          <div class="kpi-value font-mono">${totalUnits}</div>
          <div class="kpi-subtext">Across ${store.data.medicines.length} products</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Low Stock Alert</span>
          <div class="kpi-value font-mono" style="color: var(--warning-text);">${lowCount}</div>
          <div class="kpi-subtext">At or below minimum threshold</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Out of Stock</span>
          <div class="kpi-value font-mono" style="color: var(--danger-text);">${outCount}</div>
          <div class="kpi-subtext">Requires immediate supplier purchase</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Near Expiry / Expired</span>
          <div class="kpi-value font-mono" style="color: var(--danger-text);">${nearExpCount + expCount}</div>
          <div class="kpi-subtext">${nearExpCount} near expiry, ${expCount} expired</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="chart-filter-pills" id="stock-filter-pills">
              <button class="filter-pill-btn ${filter === 'all' ? 'active' : ''}" data-f="all">All Items</button>
              <button class="filter-pill-btn ${filter === 'inStock' ? 'active' : ''}" data-f="inStock">In Stock</button>
              <button class="filter-pill-btn ${filter === 'lowStock' ? 'active' : ''}" data-f="lowStock">Low Stock (${lowCount})</button>
              <button class="filter-pill-btn ${filter === 'outOfStock' ? 'active' : ''}" data-f="outOfStock">Out of Stock (${outCount})</button>
              <button class="filter-pill-btn ${filter === 'nearExpiry' ? 'active' : ''}" data-f="nearExpiry">Near Expiry (${nearExpCount})</button>
              <button class="filter-pill-btn ${filter === 'expired' ? 'active' : ''}" data-f="expired">Expired (${expCount})</button>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th>Rack</th>
                <th class="cell-center">Stock Qty</th>
                <th class="cell-center">Min Level</th>
                <th>Expiry Date</th>
                <th class="cell-center">Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.length === 0 ? `
                <tr><td colspan="8"><div class="table-empty-state"><p>No items match current stock filter.</p></div></td></tr>
              ` : list.map(m => {
                const isOut = Number(m.quantity) <= 0;
                const isLow = store.isLowStock(m);
                const isNearExp = store.isNearExpiry(m.expiryDate);
                const isExp = store.isExpired(m.expiryDate);

                let statusBadge = '<span class="status-text success">Adequate</span>';
                if (isExp) statusBadge = '<span class="status-text danger">EXPIRED</span>';
                else if (isNearExp) statusBadge = '<span class="status-text warning">NEAR EXPIRY</span>';
                else if (isOut) statusBadge = '<span class="status-text danger">OUT OF STOCK</span>';
                else if (isLow) statusBadge = '<span class="status-text warning">LOW STOCK</span>';

                return `
                  <tr>
                    <td style="font-weight: 600;">${m.name}</td>
                    <td class="font-mono">${m.batchNo || '-'}</td>
                    <td>${m.rack || '-'}</td>
                    <td class="cell-center font-mono" style="font-weight: 700; color: ${isOut ? 'var(--danger-text)' : isLow ? 'var(--warning-text)' : 'inherit'};">${m.quantity}</td>
                    <td class="cell-center font-mono text-muted">${m.minStock || 10}</td>
                    <td class="font-mono">${formatDate(m.expiryDate)}</td>
                    <td class="cell-center">${statusBadge}</td>
                    <td style="text-align: right;">
                      <button type="button" class="btn btn-secondary btn-sm quick-edit-stock" data-id="${m.id}">Adjust</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind filter pills
    container.querySelectorAll('#stock-filter-pills .filter-pill-btn').forEach(b => {
      b.onclick = () => {
        filter = b.dataset.f;
        render();
      };
    });

    container.querySelectorAll('.quick-edit-stock').forEach(btn => {
      btn.onclick = () => openStockAdjustModal(btn.dataset.id, render);
    });

    document.getElementById('stock-adjust-btn').onclick = () => {
      if (store.data.medicines.length === 0) return showToast('No medicines available to adjust', 'warning');
      openStockAdjustModal(store.data.medicines[0].id, render);
    };
  }

  render();
}

function openStockAdjustModal(medId, onSaved) {
  const med = store.getMedicine(medId);
  if (!med) return;

  openModal({
    title: `Adjust Stock: ${med.name}`,
    size: 'sm',
    bodyHtml: `
      <div class="form-group">
        <label>Select Medicine</label>
        <select id="adj-med-select">
          ${store.data.medicines.map(m => `
            <option value="${m.id}" ${m.id === medId ? 'selected' : ''}>${m.name} (Current: ${m.quantity})</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>New Physical Count (Quantity) *</label>
        <input type="number" id="adj-new-qty" min="0" required value="${med.quantity}">
      </div>
      <div class="form-group">
        <label>Reason for Adjustment</label>
        <select id="adj-reason">
          <option value="Physical Audit Discrepancy">Physical Audit Discrepancy</option>
          <option value="Damaged / Broken">Damaged / Broken / Leaked</option>
          <option value="Expired Disposal">Expired Stock Disposal</option>
          <option value="Supplier Replacement">Supplier Replacement</option>
          <option value="Other Adjustment">Other</option>
        </select>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-adj-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-adj-save">Update Quantity</button>
    `
  });

  const select = document.getElementById('adj-med-select');
  const qtyInput = document.getElementById('adj-new-qty');
  select.onchange = () => {
    const cur = store.getMedicine(select.value);
    if (cur) qtyInput.value = cur.quantity;
  };

  document.getElementById('modal-adj-cancel').onclick = closeModal;
  document.getElementById('modal-adj-save').onclick = () => {
    const target = store.getMedicine(select.value);
    const newQty = parseInt(qtyInput.value, 10);
    if (isNaN(newQty) || newQty < 0) return showToast('Please enter a valid non-negative quantity', 'warning');

    target.quantity = newQty;
    store.save();
    closeModal();
    showToast(`Stock updated for ${target.name} to ${newQty}`, 'success');
    onSaved();
  };
}

// ==========================================
// 4. PURCHASES MANAGEMENT (SECTION 11)
// ==========================================
export function renderPurchasesPage(container) {
  function render() {
    const pos = store.data.purchases;
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Purchase Orders & Restocking</h2>
          <p>Track wholesale medicine receipts from distributors and suppliers</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="po-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ New Purchase</span>
        </button>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Medicine</th>
                <th>Batch</th>
                <th class="cell-center">Qty</th>
                <th class="cell-num">Cost</th>
                <th class="cell-num">Total</th>
                <th class="cell-num">Paid</th>
                <th class="cell-num">Balance</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pos.length === 0 ? `
                <tr>
                  <td colspan="11">
                    <div class="table-empty-state">
                      <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                      </div>
                      <h4>No purchase orders recorded yet</h4>
                      <p>Record stock purchases from your suppliers to automatically increase inventory levels.</p>
                      <button type="button" class="btn btn-primary btn-sm" id="empty-add-po-btn">+ Record First Purchase</button>
                    </div>
                  </td>
                </tr>
              ` : pos.map(p => `
                <tr>
                  <td class="font-mono"><strong>${p.poNumber}</strong></td>
                  <td>${formatDate(p.date)}</td>
                  <td style="font-weight: 600;">${p.supplierName || 'Direct Cash'}</td>
                  <td>${p.medicineName}</td>
                  <td class="font-mono">${p.batchNo || '-'}</td>
                  <td class="cell-center font-mono"><strong>+${p.quantity}</strong></td>
                  <td class="cell-num">${formatCurrency(p.purchasePrice)}</td>
                  <td class="cell-num font-mono"><strong>${formatCurrency(p.total)}</strong></td>
                  <td class="cell-num font-mono text-muted">${formatCurrency(p.paid)}</td>
                  <td class="cell-num font-mono" style="color: ${p.remaining > 0 ? 'var(--danger-text)' : 'inherit'}; font-weight: 600;">${formatCurrency(p.remaining)}</td>
                  <td style="text-align: right;">
                    <button type="button" class="action-btn delete delete-po-btn" data-id="${p.id}" title="Delete & Revert Stock">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const addBtn = document.getElementById('po-add-btn');
    if (addBtn) addBtn.onclick = () => openPurchaseModal(render);
    const emptyBtn = document.getElementById('empty-add-po-btn');
    if (emptyBtn) emptyBtn.onclick = () => openPurchaseModal(render);

    container.querySelectorAll('.delete-po-btn').forEach(btn => {
      btn.onclick = () => {
        confirmDialog('Deleting this purchase will automatically reduce the corresponding quantity from medicine stock. Proceed?', () => {
          store.deletePurchase(btn.dataset.id);
          showToast('Purchase deleted and inventory reverted.', 'info');
          render();
        }, 'Delete Purchase');
      };
    });
  }

  render();
}

function openPurchaseModal(onSaved) {
  if (store.data.medicines.length === 0) {
    return showToast('Please add at least one medicine in catalog before recording purchases.', 'warning');
  }

  openModal({
    title: 'New Purchase Entry',
    size: 'lg',
    bodyHtml: `
      <form id="po-form">
        <div class="form-row">
          <div class="form-group">
            <label>Supplier / Distributor</label>
            <select id="po-supplier-select">
              <option value="">Direct Cash Purchase</option>
              ${store.data.suppliers.map(s => `
                <option value="${s.id}">${s.name} (${s.company || 'Distributor'})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Purchase Date *</label>
            <input type="date" id="po-date-input" value="${new Date().toISOString().slice(0, 10)}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Select Medicine to Restock *</label>
            <select id="po-med-select" required>
              ${store.data.medicines.map(m => `
                <option value="${m.id}">${m.name} (Current Stock: ${m.quantity})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Quantity to Purchase *</label>
            <input type="number" id="po-qty-input" min="1" value="10" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Cost / Purchase Price per unit *</label>
            <input type="number" id="po-price-input" min="0" step="0.01" value="${store.data.medicines[0].purchasePrice}" required>
          </div>
          <div class="form-group">
            <label>Retail / Sale Price per unit</label>
            <input type="number" id="po-saleprice-input" min="0" step="0.01" value="${store.data.medicines[0].salePrice}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Batch Number</label>
            <input type="text" id="po-batch-input" placeholder="e.g. B-9011">
          </div>
          <div class="form-group">
            <label>Expiry Date</label>
            <input type="date" id="po-exp-input" value="${store.data.medicines[0].expiryDate ? store.data.medicines[0].expiryDate.slice(0, 10) : ''}">
          </div>
        </div>

        <div class="form-row" style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); margin-top: 10px;">
          <div class="form-group">
            <label>Total Invoice Cost</label>
            <div id="po-total-display" class="font-mono" style="font-size: 16px; font-weight: 700; color: var(--primary); padding-top: 6px;">${formatCurrency(0)}</div>
          </div>
          <div class="form-group">
            <label>Amount Paid Now</label>
            <input type="number" id="po-paid-input" min="0" step="0.01" value="0">
          </div>
        </div>
      </form>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-po-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-po-save">Confirm & Increase Stock</button>
    `
  });

  const medSelect = document.getElementById('po-med-select');
  const qtyInp = document.getElementById('po-qty-input');
  const priceInp = document.getElementById('po-price-input');
  const saleInp = document.getElementById('po-saleprice-input');
  const expInp = document.getElementById('po-exp-input');
  const totalDisplay = document.getElementById('po-total-display');
  const paidInp = document.getElementById('po-paid-input');

  function updatePoCalc() {
    const q = parseInt(qtyInp.value, 10) || 0;
    const p = parseFloat(priceInp.value) || 0;
    const tot = q * p;
    totalDisplay.textContent = formatCurrency(tot);
    if (!paidInp.dataset.manual) {
      paidInp.value = tot;
    }
  }

  paidInp.oninput = () => {
    paidInp.dataset.manual = 'true';
  };

  medSelect.onchange = () => {
    const med = store.getMedicine(medSelect.value);
    if (med) {
      priceInp.value = med.purchasePrice;
      saleInp.value = med.salePrice;
      if (med.expiryDate) expInp.value = med.expiryDate.slice(0, 10);
      updatePoCalc();
    }
  };

  qtyInp.oninput = updatePoCalc;
  priceInp.oninput = updatePoCalc;
  updatePoCalc();

  document.getElementById('modal-po-cancel').onclick = closeModal;
  document.getElementById('modal-po-save').onclick = () => {
    const medId = medSelect.value;
    const qty = parseInt(qtyInp.value, 10);
    const price = parseFloat(priceInp.value);
    const paid = parseFloat(paidInp.value) || 0;

    if (!medId) return showToast('Please select a medicine', 'warning');
    if (isNaN(qty) || qty <= 0) return showToast('Please enter a valid quantity', 'warning');
    if (isNaN(price) || price < 0) return showToast('Please enter a valid price', 'warning');

    const suppId = document.getElementById('po-supplier-select').value;
    const supp = store.data.suppliers.find(s => s.id === suppId);

    try {
      store.recordPurchase({
        supplierId: suppId || null,
        supplierName: supp ? supp.name : 'Direct Cash Purchase',
        medicineId: medId,
        quantity: qty,
        purchasePrice: price,
        salePrice: parseFloat(saleInp.value) || 0,
        batchNo: document.getElementById('po-batch-input').value.trim(),
        expiryDate: expInp.value || null,
        date: document.getElementById('po-date-input').value,
        paid
      });

      closeModal();
      showToast('Purchase recorded successfully! Medicine stock increased.', 'success');
      onSaved();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };
}

// ==========================================
// 5. RETURNS MANAGEMENT (SECTION 15)
// ==========================================
export function renderReturnsPage(container) {
  function render() {
    const returns = store.data.returns;
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Sales & Purchase Returns</h2>
          <p>Customer refunds and damaged/expired supplier return reversals</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="ret-po-btn">+ Purchase Return</button>
          <button type="button" class="btn btn-primary btn-sm" id="ret-sale-btn">+ Customer Sale Return</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Return Type</th>
                <th>Invoice / Ref</th>
                <th>Medicine</th>
                <th class="cell-center">Quantity Returned</th>
                <th class="cell-num">Refund Amount</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${returns.length === 0 ? `
                <tr><td colspan="7"><div class="table-empty-state"><p>No returns recorded yet.</p></div></td></tr>
              ` : returns.map(r => `
                <tr>
                  <td>${formatDate(r.date)}</td>
                  <td><span class="status-text ${r.type === 'Sale Return' ? 'warning' : 'info'}">${r.type}</span></td>
                  <td class="font-mono">${r.invoiceNo || r.supplierName || '-'}</td>
                  <td style="font-weight: 600;">${r.medicineName}</td>
                  <td class="cell-center font-mono" style="font-weight: 700;">${r.quantity}</td>
                  <td class="cell-num font-mono"><strong>${formatCurrency(r.refundAmount)}</strong></td>
                  <td style="color: var(--text-secondary);">${r.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('ret-sale-btn').onclick = () => openSaleReturnModal(render);
    document.getElementById('ret-po-btn').onclick = () => openPurchaseReturnModal(render);
  }

  render();
}

function openSaleReturnModal(onSaved) {
  if (store.data.sales.length === 0) return showToast('No sales recorded yet to return', 'warning');

  openModal({
    title: 'Customer Sale Return',
    size: 'md',
    bodyHtml: `
      <div class="form-group">
        <label>Select Invoice *</label>
        <select id="ret-sale-inv-select">
          ${store.data.sales.map(s => `
            <option value="${s.id}">Invoice #${s.invoiceNo} - ${s.customerName} (${formatCurrency(s.grandTotal)})</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Select Item to Return *</label>
        <select id="ret-sale-item-select"></select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Return Quantity *</label>
          <input type="number" id="ret-sale-qty" min="1" value="1" required>
        </div>
        <div class="form-group">
          <label>Refund Amount (${store.data.settings.currency || 'Rs.'}) *</label>
          <input type="number" id="ret-sale-amt" min="0" step="0.01" required>
        </div>
      </div>
      <div class="form-group">
        <label>Return Reason</label>
        <input type="text" id="ret-sale-reason" placeholder="e.g. Unopened leftover, patient discontinued">
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-ret-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-ret-save">Process Return & Restore Stock</button>
    `
  });

  const invSelect = document.getElementById('ret-sale-inv-select');
  const itemSelect = document.getElementById('ret-sale-item-select');
  const qtyInp = document.getElementById('ret-sale-qty');
  const amtInp = document.getElementById('ret-sale-amt');

  function populateItems() {
    const sale = store.data.sales.find(s => s.id === invSelect.value);
    if (!sale) return;
    itemSelect.innerHTML = sale.items.map(it => `
      <option value="${it.medicineId}" data-price="${it.salePrice}" data-max="${it.qty}">${it.name} (Sold: ${it.qty} @ ${formatCurrency(it.salePrice)})</option>
    `).join('');
    updateAmount();
  }

  function updateAmount() {
    const opt = itemSelect.selectedOptions[0];
    if (!opt) return;
    const price = parseFloat(opt.dataset.price) || 0;
    const q = parseInt(qtyInp.value, 10) || 0;
    amtInp.value = (price * q).toFixed(2);
  }

  invSelect.onchange = populateItems;
  itemSelect.onchange = updateAmount;
  qtyInp.oninput = updateAmount;
  populateItems();

  document.getElementById('modal-ret-cancel').onclick = closeModal;
  document.getElementById('modal-ret-save').onclick = () => {
    const sale = store.data.sales.find(s => s.id === invSelect.value);
    const opt = itemSelect.selectedOptions[0];
    if (!sale || !opt) return;

    const medId = opt.value;
    const qty = parseInt(qtyInp.value, 10);
    const maxQty = parseInt(opt.dataset.max, 10);
    const refund = parseFloat(amtInp.value);

    if (isNaN(qty) || qty <= 0 || qty > maxQty) {
      return showToast(`Invalid quantity. Max returnable: ${maxQty}`, 'warning');
    }

    store.recordSaleReturn({
      saleId: sale.id,
      invoiceNo: sale.invoiceNo,
      medicineId: medId,
      quantity: qty,
      refundAmount: refund,
      reason: document.getElementById('ret-sale-reason').value.trim() || 'Customer Return'
    });

    closeModal();
    showToast('Sale return processed. Medicine added back to stock!', 'success');
    onSaved();
  };
}

function openPurchaseReturnModal(onSaved) {
  if (store.data.suppliers.length === 0 || store.data.medicines.length === 0) {
    return showToast('Suppliers and medicines required for purchase return', 'warning');
  }

  openModal({
    title: 'Supplier Purchase Return',
    size: 'md',
    bodyHtml: `
      <div class="form-group">
        <label>Select Supplier *</label>
        <select id="ret-po-supp-select">
          ${store.data.suppliers.map(s => `<option value="${s.id}">${s.name} (${s.company || 'Distributor'})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Select Medicine to Return *</label>
        <select id="ret-po-med-select">
          ${store.data.medicines.map(m => `<option value="${m.id}" data-cost="${m.purchasePrice}" data-stock="${m.quantity}">${m.name} (Available: ${m.quantity})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Quantity *</label>
          <input type="number" id="ret-po-qty" min="1" value="1" required>
        </div>
        <div class="form-group">
          <label>Total Credit / Return Amount *</label>
          <input type="number" id="ret-po-amt" min="0" step="0.01" required>
        </div>
      </div>
      <div class="form-group">
        <label>Reason</label>
        <input type="text" id="ret-po-reason" placeholder="e.g. Expired batch replacement, defective seal">
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-retpo-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-retpo-save">Reduce Stock & Credit Supplier</button>
    `
  });

  const medSel = document.getElementById('ret-po-med-select');
  const qtyInp = document.getElementById('ret-po-qty');
  const amtInp = document.getElementById('ret-po-amt');

  function updateRetPoAmt() {
    const opt = medSel.selectedOptions[0];
    if (!opt) return;
    const cost = parseFloat(opt.dataset.cost) || 0;
    const q = parseInt(qtyInp.value, 10) || 0;
    amtInp.value = (cost * q).toFixed(2);
  }

  medSel.onchange = updateRetPoAmt;
  qtyInp.oninput = updateRetPoAmt;
  updateRetPoAmt();

  document.getElementById('modal-retpo-cancel').onclick = closeModal;
  document.getElementById('modal-retpo-save').onclick = () => {
    const supp = store.data.suppliers.find(s => s.id === document.getElementById('ret-po-supp-select').value);
    const opt = medSel.selectedOptions[0];
    const medId = opt.value;
    const qty = parseInt(qtyInp.value, 10);
    const curStock = parseInt(opt.dataset.stock, 10);

    if (qty > curStock) {
      return showToast(`Cannot return more than available stock (${curStock})`, 'warning');
    }

    store.recordPurchaseReturn({
      supplierId: supp ? supp.id : null,
      supplierName: supp ? supp.name : 'Supplier',
      medicineId: medId,
      quantity: qty,
      refundAmount: parseFloat(amtInp.value) || 0,
      reason: document.getElementById('ret-po-reason').value.trim()
    });

    closeModal();
    showToast('Purchase return logged. Stock deducted from inventory.', 'success');
    onSaved();
  };
}
