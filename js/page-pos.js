// SHER MEDICAL STORE - POS (POINT OF SALE) SYSTEM
import { store } from './store.js';
import { formatCurrency, showToast, printInvoice, openModal, closeModal } from './ui.js';

let cart = [];
let selectedCategory = 'all';
let searchQuery = '';
let selectedCustomerId = '';
let paymentMethod = 'Cash';
let overallDiscount = 0;
let paidAmount = 0;

export function renderPosPage(container) {
  const medicines = store.data.medicines;
  const categories = store.data.categories;
  const customers = store.data.customers;

  container.innerHTML = `
    <div class="pos-container">
      <!-- LEFT: MEDICINE CATALOG & SEARCH -->
      <div class="pos-catalog-panel">
        <div class="pos-catalog-header">
          <div class="pos-search-bar">
            <div class="input-icon-wrap" style="flex: 1;">
              <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="pos-search-input" placeholder="Search medicine by name, generic, barcode... (Enter to add)" autocomplete="off">
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="pos-add-med-quick" title="Add New Medicine to Inventory">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>+ Item</span>
            </button>
          </div>

          <!-- Category filter tabs -->
          <div class="pos-category-tabs" id="pos-cat-tabs">
            <button type="button" class="pos-cat-tab ${selectedCategory === 'all' ? 'active' : ''}" data-cat="all">All Medicines</button>
            ${categories.map(c => `
              <button type="button" class="pos-cat-tab ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>
            `).join('')}
          </div>
        </div>

        <div class="pos-grid-viewport">
          <div class="pos-medicine-grid" id="pos-med-grid"></div>
        </div>
      </div>

      <!-- RIGHT: CART & BILLING PANEL -->
      <div class="pos-cart-panel">
        <div class="pos-cart-header">
          <div>
            <h3 style="font-size: 15px; font-weight: 700;">Active Invoice</h3>
            <span class="text-xs text-muted" id="pos-inv-preview-no">INV-PENDING</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="pos-clear-cart-btn" style="color: var(--danger);">Clear</button>
        </div>

        <!-- Customer selection -->
        <div class="pos-customer-row">
          <select id="pos-customer-select">
            <option value="">Walk-in Customer</option>
            ${customers.map(c => `
              <option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.name} (${c.phone || 'No phone'})</option>
            `).join('')}
          </select>
          <button type="button" class="btn btn-secondary btn-sm" id="pos-add-cust-quick" title="Add Customer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </button>
        </div>

        <!-- Cart Items List -->
        <div class="pos-cart-items-wrap">
          <table class="pos-cart-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th class="cell-center">Qty</th>
                <th class="cell-num">Price</th>
                <th class="cell-num">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="pos-cart-body"></tbody>
          </table>
          <div id="pos-cart-empty" class="table-empty-state ${cart.length > 0 ? 'hidden' : ''}" style="padding: 30px 10px;">
            <p style="font-size: 13px; color: var(--text-muted);">Cart is empty. Select medicines from the left to start billing.</p>
          </div>
        </div>

        <!-- Totals & Checkout -->
        <div class="pos-cart-totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span class="font-mono" id="pos-subtotal-val">${formatCurrency(0)}</span>
          </div>
          <div class="totals-row">
            <span>Discount:</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="font-mono" style="font-size: 11px;">${store.data.settings.currency || 'Rs.'}</span>
              <input type="number" id="pos-discount-input" min="0" value="${overallDiscount}" style="width: 70px; height: 26px; border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; text-align: right; font-family: var(--font-mono); font-size: 12px;">
            </div>
          </div>
          <div class="totals-row grand-total">
            <span>Grand Total:</span>
            <span id="pos-grand-total-val">${formatCurrency(0)}</span>
          </div>

          <!-- Payment Methods -->
          <div style="margin-top: 4px;">
            <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Payment Method</label>
            <div class="pos-payment-selector">
              <div class="pay-method-pill ${paymentMethod === 'Cash' ? 'active' : ''}" data-method="Cash">Cash</div>
              <div class="pay-method-pill ${paymentMethod === 'Credit' ? 'active' : ''}" data-method="Credit">Credit</div>
              <div class="pay-method-pill ${paymentMethod === 'Bank' ? 'active' : ''}" data-method="Bank">Bank</div>
              <div class="pay-method-pill ${paymentMethod === 'Other' ? 'active' : ''}" data-method="Other">Other</div>
            </div>
          </div>

          <div class="totals-row">
            <span>Amount Paid:</span>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="font-mono" style="font-size: 11px;">${store.data.settings.currency || 'Rs.'}</span>
              <input type="number" id="pos-paid-input" min="0" style="width: 85px; height: 28px; border: 1px solid var(--border); border-radius: 4px; padding: 0 6px; text-align: right; font-family: var(--font-mono); font-size: 13px; font-weight: 600;">
            </div>
          </div>
          <div class="totals-row">
            <span>Remaining Due:</span>
            <span class="font-mono" id="pos-balance-val" style="font-weight: 700; color: var(--text-muted);">${formatCurrency(0)}</span>
          </div>

          <!-- Checkout Buttons -->
          <div class="pos-checkout-btn-wrap">
            <button type="button" class="btn btn-secondary btn-sm" id="pos-complete-only-btn" ${cart.length === 0 ? 'disabled' : ''}>Complete Only</button>
            <button type="button" class="btn btn-primary btn-sm" id="pos-complete-print-btn" ${cart.length === 0 ? 'disabled' : ''}>Complete & Print</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render product grid
  renderMedicineGrid();

  // Search input
  const searchInput = document.getElementById('pos-search-input');
  searchInput.focus();
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderMedicineGrid();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Try exact barcode match or top match
      const matched = store.data.medicines.find(m => 
        (m.barcode && m.barcode.toLowerCase() === searchQuery) || 
        m.name.toLowerCase().includes(searchQuery)
      );
      if (matched) {
        addToCart(matched);
        searchInput.value = '';
        searchQuery = '';
        renderMedicineGrid();
      } else {
        showToast('No matching medicine found', 'warning');
      }
    }
  });

  // Category filter tabs
  const catTabs = container.querySelectorAll('#pos-cat-tabs .pos-cat-tab');
  catTabs.forEach(tab => {
    tab.onclick = () => {
      catTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedCategory = tab.dataset.cat;
      renderMedicineGrid();
    };
  });

  // Customer dropdown
  const custSelect = document.getElementById('pos-customer-select');
  custSelect.onchange = (e) => {
    selectedCustomerId = e.target.value;
  };

  // Quick Add Customer Modal
  document.getElementById('pos-add-cust-quick').onclick = () => {
    openModal({
      title: 'Add New Customer',
      size: 'sm',
      bodyHtml: `
        <div class="form-group">
          <label>Customer Name *</label>
          <input type="text" id="new-cust-name" required placeholder="e.g. Muhammad Ali">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" id="new-cust-phone" placeholder="0300-1234567">
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" id="new-cust-address" placeholder="Sector / Street">
        </div>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary btn-sm" id="modal-cust-cancel">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" id="modal-cust-save">Save Customer</button>
      `
    });
    document.getElementById('modal-cust-cancel').onclick = closeModal;
    document.getElementById('modal-cust-save').onclick = () => {
      const name = document.getElementById('new-cust-name').value.trim();
      if (!name) return showToast('Customer name is required', 'warning');
      const newCust = {
        id: store.generateId('cust'),
        name,
        phone: document.getElementById('new-cust-phone').value.trim(),
        address: document.getElementById('new-cust-address').value.trim(),
        balance: 0,
        createdAt: new Date().toISOString()
      };
      store.data.customers.push(newCust);
      store.save();
      selectedCustomerId = newCust.id;
      closeModal();
      showToast('Customer added successfully', 'success');
      renderPosPage(container);
    };
  };

  // Quick Add Medicine button
  document.getElementById('pos-add-med-quick').onclick = () => {
    document.querySelector('.nav-item[data-page="medicines"]').click();
  };

  // Clear cart
  document.getElementById('pos-clear-cart-btn').onclick = () => {
    if (cart.length === 0) return;
    cart = [];
    overallDiscount = 0;
    paidAmount = 0;
    renderCart();
  };

  // Payment method selector
  const payPills = container.querySelectorAll('.pay-method-pill');
  payPills.forEach(pill => {
    pill.onclick = () => {
      payPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      paymentMethod = pill.dataset.method;
      updateTotals();
    };
  });

  // Discount input
  const discInput = document.getElementById('pos-discount-input');
  discInput.oninput = (e) => {
    overallDiscount = Math.max(0, Number(e.target.value) || 0);
    updateTotals();
  };

  // Paid amount input
  const paidInput = document.getElementById('pos-paid-input');
  paidInput.oninput = (e) => {
    paidAmount = Math.max(0, Number(e.target.value) || 0);
    updateTotals(false);
  };

  // Checkout actions
  document.getElementById('pos-complete-only-btn').onclick = () => checkout(false, container);
  document.getElementById('pos-complete-print-btn').onclick = () => checkout(true, container);

  renderCart();
}

function renderMedicineGrid() {
  const grid = document.getElementById('pos-med-grid');
  if (!grid) return;

  let list = store.data.medicines;

  if (selectedCategory !== 'all') {
    list = list.filter(m => m.categoryId === selectedCategory);
  }

  if (searchQuery) {
    list = list.filter(m => 
      m.name.toLowerCase().includes(searchQuery) ||
      (m.genericName && m.genericName.toLowerCase().includes(searchQuery)) ||
      (m.barcode && m.barcode.toLowerCase().includes(searchQuery)) ||
      (m.brand && m.brand.toLowerCase().includes(searchQuery))
    );
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 14px; font-weight: 600; color: var(--text-main);">No medicines found</p>
        <p style="font-size: 12px; margin-top: 4px;">Add medicines from the Medicines section or adjust search criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(med => {
    const isOut = Number(med.quantity) <= 0;
    const isLow = store.isLowStock(med);
    return `
      <div class="pos-item-card ${isOut ? 'out-of-stock' : ''}" data-id="${med.id}">
        <div>
          <div class="pos-item-name">${med.name}</div>
          <div class="pos-item-generic">${med.genericName || med.strength || ''}</div>
        </div>
        <div class="pos-item-footer">
          <span class="pos-item-price">${formatCurrency(med.salePrice)}</span>
          <span class="pos-item-stock" style="color: ${isOut ? 'var(--danger-text)' : isLow ? 'var(--warning-text)' : 'inherit'};">
            ${isOut ? 'Out of Stock' : `Qty: ${med.quantity}`}
          </span>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.pos-item-card').forEach(card => {
    card.onclick = () => {
      const med = store.getMedicine(card.dataset.id);
      if (med) addToCart(med);
    };
  });
}

function addToCart(medicine) {
  if (Number(medicine.quantity) <= 0) {
    showToast(`Insufficient stock for ${medicine.name}`, 'danger');
    return;
  }

  const existing = cart.find(item => item.medicineId === medicine.id);
  if (existing) {
    if (existing.qty + 1 > Number(medicine.quantity)) {
      showToast(`Cannot add more. Only ${medicine.quantity} available in stock!`, 'warning');
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({
      medicineId: medicine.id,
      name: medicine.name,
      salePrice: Number(medicine.salePrice) || 0,
      batchNo: medicine.batchNo || '',
      maxStock: Number(medicine.quantity),
      qty: 1,
      discount: 0
    });
  }

  renderCart();
}

function renderCart() {
  const body = document.getElementById('pos-cart-body');
  const emptyView = document.getElementById('pos-cart-empty');
  const compOnlyBtn = document.getElementById('pos-complete-only-btn');
  const compPrintBtn = document.getElementById('pos-complete-print-btn');

  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = '';
    emptyView?.classList.remove('hidden');
    if (compOnlyBtn) compOnlyBtn.disabled = true;
    if (compPrintBtn) compPrintBtn.disabled = true;
    updateTotals();
    return;
  }

  emptyView?.classList.add('hidden');
  if (compOnlyBtn) compOnlyBtn.disabled = false;
  if (compPrintBtn) compPrintBtn.disabled = false;

  body.innerHTML = cart.map((item, idx) => {
    const itemTotal = (item.salePrice * item.qty) - (item.discount || 0);
    return `
      <tr>
        <td>
          <div style="font-weight: 600;">${item.name}</div>
          <div style="font-size: 10px; color: var(--text-muted);">${item.batchNo ? `Batch: ${item.batchNo}` : ''}</div>
        </td>
        <td class="cell-center">
          <div class="cart-qty-ctrl">
            <button type="button" class="cart-qty-btn dec-btn" data-idx="${idx}">-</button>
            <input type="text" class="cart-qty-input qty-input" data-idx="${idx}" value="${item.qty}">
            <button type="button" class="cart-qty-btn inc-btn" data-idx="${idx}">+</button>
          </div>
        </td>
        <td class="cell-num">${formatCurrency(item.salePrice)}</td>
        <td class="cell-num font-mono"><strong>${formatCurrency(itemTotal)}</strong></td>
        <td style="text-align: right;">
          <button type="button" class="action-btn delete remove-cart-btn" data-idx="${idx}" title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach cart row events
  body.querySelectorAll('.dec-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.idx);
      if (cart[idx].qty > 1) {
        cart[idx].qty -= 1;
      } else {
        cart.splice(idx, 1);
      }
      renderCart();
    };
  });

  body.querySelectorAll('.inc-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.idx);
      if (cart[idx].qty + 1 > cart[idx].maxStock) {
        showToast(`Stock limit reached for ${cart[idx].name}`, 'warning');
        return;
      }
      cart[idx].qty += 1;
      renderCart();
    };
  });

  body.querySelectorAll('.qty-input').forEach(input => {
    input.onchange = (e) => {
      const idx = Number(input.dataset.idx);
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val <= 0) {
        cart.splice(idx, 1);
      } else if (val > cart[idx].maxStock) {
        showToast(`Stock limit exceeded! Max: ${cart[idx].maxStock}`, 'warning');
        cart[idx].qty = cart[idx].maxStock;
      } else {
        cart[idx].qty = val;
      }
      renderCart();
    };
  });

  body.querySelectorAll('.remove-cart-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.idx);
      cart.splice(idx, 1);
      renderCart();
    };
  });

  updateTotals(true);
}

function updateTotals(autoSetPaid = false) {
  const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.qty) - (item.discount || 0), 0);
  const grandTotal = Math.max(0, subtotal - overallDiscount);

  if (autoSetPaid) {
    if (paymentMethod === 'Credit') {
      paidAmount = 0;
    } else {
      paidAmount = grandTotal;
    }
  }

  const balance = Math.max(0, grandTotal - paidAmount);

  const subEl = document.getElementById('pos-subtotal-val');
  const grandEl = document.getElementById('pos-grand-total-val');
  const paidInp = document.getElementById('pos-paid-input');
  const balEl = document.getElementById('pos-balance-val');

  if (subEl) subEl.textContent = formatCurrency(subtotal);
  if (grandEl) grandEl.textContent = formatCurrency(grandTotal);
  if (paidInp && autoSetPaid) paidInp.value = paidAmount;
  if (balEl) {
    balEl.textContent = formatCurrency(balance);
    balEl.style.color = balance > 0 ? 'var(--danger-text)' : 'var(--success-text)';
  }
}

function checkout(andPrint, container) {
  if (cart.length === 0) {
    showToast('Cart is empty', 'warning');
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.salePrice * item.qty) - (item.discount || 0), 0);
  const grandTotal = Math.max(0, subtotal - overallDiscount);
  const balance = Math.max(0, grandTotal - paidAmount);

  // If credit sale, must have a customer
  let custName = 'Walk-in Customer';
  let custPhone = '';
  if (selectedCustomerId) {
    const cust = store.data.customers.find(c => c.id === selectedCustomerId);
    if (cust) {
      custName = cust.name;
      custPhone = cust.phone;
    }
  } else if (balance > 0) {
    showToast('Please select or add a Customer for partial/credit sales!', 'warning');
    return;
  }

  try {
    const saleRecord = store.recordSale({
      customerId: selectedCustomerId || null,
      customerName: custName,
      customerPhone: custPhone,
      items: cart,
      subtotal,
      overallDiscount,
      grandTotal,
      paidAmount,
      balanceAmount: balance,
      paymentMethod
    });

    showToast('Sale completed successfully! Stock updated.', 'success');

    if (andPrint) {
      printInvoice(saleRecord);
    }

    // Reset cart
    cart = [];
    overallDiscount = 0;
    paidAmount = 0;
    renderPosPage(container);
  } catch (err) {
    showToast(err.message, 'danger');
  }
}
