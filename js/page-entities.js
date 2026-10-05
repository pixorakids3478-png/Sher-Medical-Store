// SHER MEDICAL STORE - SUPPLIERS, CUSTOMERS, SALES HISTORY, EXPENSES, INCOME & CASH FLOW
import { store } from './store.js';
import { formatCurrency, formatDate, formatDateTime, showToast, openModal, closeModal, confirmDialog, printInvoice } from './ui.js';

// ==========================================
// 1. SUPPLIERS MANAGEMENT & LEDGER
// ==========================================
export function renderSuppliersPage(container) {
  function render() {
    const suppliers = store.data.suppliers;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Suppliers & Distributors</h2>
          <p>Maintain pharmaceutical vendor directories and payable account balances</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="supp-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Supplier</span>
        </button>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Supplier / Company</th>
                <th>Contact Details</th>
                <th>Address</th>
                <th class="cell-num">Total Invoiced</th>
                <th class="cell-num">Amount Paid</th>
                <th class="cell-num">Current Payable</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${suppliers.length === 0 ? `
                <tr>
                  <td colspan="7">
                    <div class="table-empty-state">
                      <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      </div>
                      <h4>No suppliers added yet</h4>
                      <p>Add distributor companies to organize bills and manage supplier ledger statements.</p>
                      <button type="button" class="btn btn-primary btn-sm" id="empty-add-supp-btn">+ Add First Supplier</button>
                    </div>
                  </td>
                </tr>
              ` : suppliers.map(s => {
                const totalInvoiced = store.data.purchases
                  .filter(p => p.supplierId === s.id)
                  .reduce((sum, p) => sum + Number(p.total || 0), 0);
                const totalPaid = store.data.purchases
                  .filter(p => p.supplierId === s.id)
                  .reduce((sum, p) => sum + Number(p.paid || 0), 0);
                const currentBalance = Number(s.balance) || 0;

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 600;">${s.name}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${s.company || 'Pharmaceutical Distributor'}</div>
                    </td>
                    <td>
                      <div>${s.phone || '-'}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${s.email || ''}</div>
                    </td>
                    <td>${s.address || '-'}</td>
                    <td class="cell-num font-mono">${formatCurrency(totalInvoiced)}</td>
                    <td class="cell-num font-mono">${formatCurrency(totalPaid)}</td>
                    <td class="cell-num font-mono" style="font-weight: 700; color: ${currentBalance > 0 ? 'var(--danger-text)' : 'inherit'};">
                      ${formatCurrency(currentBalance)}
                    </td>
                    <td style="text-align: right;">
                      <div class="row-actions">
                        <button type="button" class="btn btn-secondary btn-sm supp-pay-btn" data-id="${s.id}" title="Record Payment">Pay</button>
                        <button type="button" class="action-btn edit-supp-btn" data-id="${s.id}" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" class="action-btn delete delete-supp-btn" data-id="${s.id}" title="Delete">
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

    document.getElementById('supp-add-btn')?.addEventListener('click', () => openSupplierModal(null, render));
    document.getElementById('empty-add-supp-btn')?.addEventListener('click', () => openSupplierModal(null, render));

    container.querySelectorAll('.edit-supp-btn').forEach(btn => {
      btn.onclick = () => openSupplierModal(btn.dataset.id, render);
    });

    container.querySelectorAll('.delete-supp-btn').forEach(btn => {
      btn.onclick = () => {
        const s = store.data.suppliers.find(x => x.id === btn.dataset.id);
        if (!s) return;
        confirmDialog(`Delete supplier "${s.name}"? Historical purchase records will remain intact.`, () => {
          store.data.suppliers = store.data.suppliers.filter(x => x.id !== s.id);
          store.save();
          showToast('Supplier removed', 'info');
          render();
        }, 'Delete Supplier');
      };
    });

    container.querySelectorAll('.supp-pay-btn').forEach(btn => {
      btn.onclick = () => openSupplierPaymentModal(btn.dataset.id, render);
    });
  }

  render();
}

function openSupplierModal(editId = null, onSaved) {
  const isEdit = Boolean(editId);
  const supp = isEdit ? store.data.suppliers.find(s => s.id === editId) : {
    name: '', company: '', phone: '', whatsapp: '', email: '', address: '', balance: 0, notes: ''
  };

  openModal({
    title: isEdit ? 'Edit Supplier' : 'Add New Supplier',
    size: 'md',
    bodyHtml: `
      <div class="form-row">
        <div class="form-group">
          <label>Supplier / Representative Name *</label>
          <input type="text" id="sup-name" required value="${supp.name}" placeholder="e.g. Tariq Mehmood">
        </div>
        <div class="form-group">
          <label>Company / Agency Name</label>
          <input type="text" id="sup-company" value="${supp.company || ''}" placeholder="e.g. Premier Distributors">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" id="sup-phone" value="${supp.phone || ''}" placeholder="0300-1234567">
        </div>
        <div class="form-group">
          <label>WhatsApp Number</label>
          <input type="text" id="sup-wa" value="${supp.whatsapp || ''}" placeholder="0300-1234567">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="sup-email" value="${supp.email || ''}" placeholder="distributor@pharma.com">
        </div>
        <div class="form-group">
          <label>Opening Payable Balance (${store.data.settings.currency || 'Rs.'})</label>
          <input type="number" id="sup-bal" min="0" step="0.01" value="${supp.balance || 0}">
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" id="sup-address" value="${supp.address || ''}" placeholder="Warehouse / Office Address">
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-sup-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-sup-save">${isEdit ? 'Update' : 'Save'}</button>
    `
  });

  document.getElementById('modal-sup-cancel').onclick = closeModal;
  document.getElementById('modal-sup-save').onclick = () => {
    const name = document.getElementById('sup-name').value.trim();
    if (!name) return showToast('Supplier name is required', 'warning');

    const suppData = {
      name,
      company: document.getElementById('sup-company').value.trim(),
      phone: document.getElementById('sup-phone').value.trim(),
      whatsapp: document.getElementById('sup-wa').value.trim(),
      email: document.getElementById('sup-email').value.trim(),
      balance: parseFloat(document.getElementById('sup-bal').value) || 0,
      address: document.getElementById('sup-address').value.trim()
    };

    if (isEdit) {
      const idx = store.data.suppliers.findIndex(s => s.id === editId);
      if (idx !== -1) store.data.suppliers[idx] = { ...store.data.suppliers[idx], ...suppData };
    } else {
      store.data.suppliers.push({ id: store.generateId('sup'), ...suppData, createdAt: new Date().toISOString() });
    }

    store.save();
    closeModal();
    showToast('Supplier saved successfully', 'success');
    onSaved();
  };
}

function openSupplierPaymentModal(suppId, onSaved) {
  const supp = store.data.suppliers.find(s => s.id === suppId);
  if (!supp) return;

  openModal({
    title: `Record Payment to: ${supp.name}`,
    size: 'sm',
    bodyHtml: `
      <div style="background: var(--bg-subtle); padding: 10px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: 13px;">
        Current Payable: <strong class="font-mono" style="color: var(--danger-text);">${formatCurrency(supp.balance)}</strong>
      </div>
      <div class="form-group">
        <label>Payment Amount (${store.data.settings.currency || 'Rs.'}) *</label>
        <input type="number" id="supp-pay-amt" min="1" step="0.01" value="${supp.balance > 0 ? supp.balance : 0}">
      </div>
      <div class="form-group">
        <label>Payment Method</label>
        <select id="supp-pay-method">
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>
      <div class="form-group">
        <label>Payment Reference / Receipt #</label>
        <input type="text" id="supp-pay-ref" placeholder="e.g. Bank Ref / Voucher #">
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-sp-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-sp-save">Confirm Payment</button>
    `
  });

  document.getElementById('modal-sp-cancel').onclick = closeModal;
  document.getElementById('modal-sp-save').onclick = () => {
    const amt = parseFloat(document.getElementById('supp-pay-amt').value);
    if (isNaN(amt) || amt <= 0) return showToast('Please enter a valid payment amount', 'warning');

    supp.balance = Math.max(0, (Number(supp.balance) || 0) - amt);

    // Also record expense/cash outflow
    store.data.expenses.push({
      id: store.generateId('exp'),
      title: `Supplier Payment - ${supp.name}`,
      category: 'Supplier Payment',
      amount: amt,
      paymentMethod: document.getElementById('supp-pay-method').value,
      description: document.getElementById('supp-pay-ref').value.trim() || `Payment to ${supp.company || supp.name}`,
      date: new Date().toISOString()
    });

    store.save();
    closeModal();
    showToast(`Payment of ${formatCurrency(amt)} recorded for ${supp.name}`, 'success');
    onSaved();
  };
}

// ==========================================
// 2. CUSTOMERS MANAGEMENT & RECEIVABLES
// ==========================================
export function renderCustomersPage(container) {
  function render() {
    const customers = store.data.customers;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Customer Accounts & Receivables</h2>
          <p>Maintain patient directories, medical history contacts, and credit balances</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="cust-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Customer</span>
        </button>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone / WhatsApp</th>
                <th>Address</th>
                <th class="cell-num">Total Sales</th>
                <th class="cell-num">Receivable Credit</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${customers.length === 0 ? `
                <tr>
                  <td colspan="6">
                    <div class="table-empty-state">
                      <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <h4>No customers added yet</h4>
                      <p>Register customers to keep track of prescription records and credit balances.</p>
                      <button type="button" class="btn btn-primary btn-sm" id="empty-add-cust-btn">+ Add First Customer</button>
                    </div>
                  </td>
                </tr>
              ` : customers.map(c => {
                const totalSales = store.data.sales
                  .filter(s => s.customerId === c.id)
                  .reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
                const bal = Number(c.balance) || 0;

                return `
                  <tr>
                    <td style="font-weight: 600;">${c.name}</td>
                    <td>${c.phone || '-'}</td>
                    <td>${c.address || '-'}</td>
                    <td class="cell-num font-mono">${formatCurrency(totalSales)}</td>
                    <td class="cell-num font-mono" style="font-weight: 700; color: ${bal > 0 ? 'var(--danger-text)' : 'inherit'};">
                      ${formatCurrency(bal)}
                    </td>
                    <td style="text-align: right;">
                      <div class="row-actions">
                        <button type="button" class="btn btn-secondary btn-sm cust-recv-btn" data-id="${c.id}" title="Receive Payment">Receive</button>
                        <button type="button" class="action-btn edit-cust-btn" data-id="${c.id}" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" class="action-btn delete delete-cust-btn" data-id="${c.id}" title="Delete">
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

    document.getElementById('cust-add-btn')?.addEventListener('click', () => openCustomerModal(null, render));
    document.getElementById('empty-add-cust-btn')?.addEventListener('click', () => openCustomerModal(null, render));

    container.querySelectorAll('.edit-cust-btn').forEach(btn => {
      btn.onclick = () => openCustomerModal(btn.dataset.id, render);
    });

    container.querySelectorAll('.delete-cust-btn').forEach(btn => {
      btn.onclick = () => {
        const c = store.data.customers.find(x => x.id === btn.dataset.id);
        if (!c) return;
        confirmDialog(`Delete customer record for "${c.name}"?`, () => {
          store.data.customers = store.data.customers.filter(x => x.id !== c.id);
          store.save();
          showToast('Customer record deleted', 'info');
          render();
        }, 'Delete Customer');
      };
    });

    container.querySelectorAll('.cust-recv-btn').forEach(btn => {
      btn.onclick = () => openCustomerReceiveModal(btn.dataset.id, render);
    });
  }

  render();
}

function openCustomerModal(editId = null, onSaved) {
  const isEdit = Boolean(editId);
  const cust = isEdit ? store.data.customers.find(c => c.id === editId) : {
    name: '', phone: '', address: '', balance: 0, notes: ''
  };

  openModal({
    title: isEdit ? 'Edit Customer' : 'Add New Customer',
    size: 'sm',
    bodyHtml: `
      <div class="form-group">
        <label>Customer Full Name *</label>
        <input type="text" id="cp-name" required value="${cust.name}" placeholder="e.g. Asad Ullah">
      </div>
      <div class="form-group">
        <label>Phone / WhatsApp</label>
        <input type="text" id="cp-phone" value="${cust.phone || ''}" placeholder="0300-1234567">
      </div>
      <div class="form-group">
        <label>Opening Credit / Debt Balance</label>
        <input type="number" id="cp-bal" min="0" step="0.01" value="${cust.balance || 0}">
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" id="cp-addr" value="${cust.address || ''}" placeholder="Address / Location">
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-cp-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-cp-save">${isEdit ? 'Update' : 'Save'}</button>
    `
  });

  document.getElementById('modal-cp-cancel').onclick = closeModal;
  document.getElementById('modal-cp-save').onclick = () => {
    const name = document.getElementById('cp-name').value.trim();
    if (!name) return showToast('Customer name is required', 'warning');

    const data = {
      name,
      phone: document.getElementById('cp-phone').value.trim(),
      balance: parseFloat(document.getElementById('cp-bal').value) || 0,
      address: document.getElementById('cp-addr').value.trim()
    };

    if (isEdit) {
      const idx = store.data.customers.findIndex(c => c.id === editId);
      if (idx !== -1) store.data.customers[idx] = { ...store.data.customers[idx], ...data };
    } else {
      store.data.customers.push({ id: store.generateId('cust'), ...data, createdAt: new Date().toISOString() });
    }

    store.save();
    closeModal();
    showToast('Customer saved', 'success');
    onSaved();
  };
}

function openCustomerReceiveModal(custId, onSaved) {
  const cust = store.data.customers.find(c => c.id === custId);
  if (!cust) return;

  openModal({
    title: `Receive Payment from: ${cust.name}`,
    size: 'sm',
    bodyHtml: `
      <div style="background: var(--bg-subtle); padding: 10px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: 13px;">
        Outstanding Balance: <strong class="font-mono" style="color: var(--danger-text);">${formatCurrency(cust.balance)}</strong>
      </div>
      <div class="form-group">
        <label>Amount Received (${store.data.settings.currency || 'Rs.'}) *</label>
        <input type="number" id="cr-amt" min="1" step="0.01" value="${cust.balance > 0 ? cust.balance : 0}">
      </div>
      <div class="form-group">
        <label>Payment Method</label>
        <select id="cr-method">
          <option value="Cash">Cash</option>
          <option value="Bank">Bank Transfer</option>
          <option value="Easypaisa/JazzCash">Mobile Wallet (Easypaisa/JazzCash)</option>
        </select>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-cr-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-cr-save">Receive Payment</button>
    `
  });

  document.getElementById('modal-cr-cancel').onclick = closeModal;
  document.getElementById('modal-cr-save').onclick = () => {
    const amt = parseFloat(document.getElementById('cr-amt').value);
    if (isNaN(amt) || amt <= 0) return showToast('Please enter a valid amount', 'warning');

    cust.balance = Math.max(0, (Number(cust.balance) || 0) - amt);

    // Record as Income entry
    store.data.incomes.push({
      id: store.generateId('inc'),
      title: `Customer Debt Settlement - ${cust.name}`,
      category: 'Customer Debt Collection',
      amount: amt,
      paymentMethod: document.getElementById('cr-method').value,
      description: `Payment received from customer ${cust.name}`,
      date: new Date().toISOString()
    });

    store.save();
    closeModal();
    showToast(`Payment of ${formatCurrency(amt)} received from ${cust.name}`, 'success');
    onSaved();
  };
}

// ==========================================
// 3. SALES MANAGEMENT (SECTION 14)
// ==========================================
export function renderSalesPage(container) {
  let search = '';

  function render() {
    let sales = store.data.sales;
    if (search) {
      sales = sales.filter(s => 
        s.invoiceNo.toLowerCase().includes(search) ||
        (s.customerName && s.customerName.toLowerCase().includes(search))
      );
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Sales Ledger & Invoices</h2>
          <p>Audit trail of all retail sales, profit performance, and invoice reprints</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="sales-goto-pos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span>New Sale (POS)</span>
        </button>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <div class="table-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" class="table-search-input" id="sales-search-inp" placeholder="Search by Invoice # or Customer..." value="${search}">
            </div>
          </div>
          <div class="toolbar-right">
            <span class="text-xs text-muted">Total: <strong>${sales.length}</strong> sales</span>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th class="cell-center">Items</th>
                <th class="cell-num">Grand Total</th>
                <th class="cell-num">Paid</th>
                <th class="cell-num">Balance</th>
                <th class="cell-center">Method</th>
                <th class="cell-num">Profit</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sales.length === 0 ? `
                <tr>
                  <td colspan="10">
                    <div class="table-empty-state">
                      <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      </div>
                      <h4>No sales recorded yet</h4>
                      <p>Open the POS terminal to process your first customer sale and issue a professional pharmacy invoice.</p>
                      <button type="button" class="btn btn-primary btn-sm" id="empty-pos-btn">Launch POS</button>
                    </div>
                  </td>
                </tr>
              ` : sales.map(s => `
                <tr>
                  <td class="font-mono"><strong>${s.invoiceNo}</strong></td>
                  <td>${formatDateTime(s.date)}</td>
                  <td style="font-weight: 600;">${s.customerName}</td>
                  <td class="cell-center font-mono">${s.items ? s.items.length : 0}</td>
                  <td class="cell-num font-mono"><strong>${formatCurrency(s.grandTotal)}</strong></td>
                  <td class="cell-num font-mono text-muted">${formatCurrency(s.paidAmount)}</td>
                  <td class="cell-num font-mono" style="font-weight: 600; color: ${s.balanceAmount > 0 ? 'var(--danger-text)' : 'inherit'};">
                    ${formatCurrency(s.balanceAmount)}
                  </td>
                  <td class="cell-center"><span class="status-text ${s.paymentMethod === 'Cash' ? 'success' : 'info'}">${s.paymentMethod}</span></td>
                  <td class="cell-num font-mono" style="color: var(--success); font-weight: 600;">+${formatCurrency(s.profit)}</td>
                  <td style="text-align: right;">
                    <div class="row-actions">
                      <button type="button" class="action-btn print-sale-btn" data-id="${s.id}" title="Print Receipt">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      </button>
                      <button type="button" class="action-btn delete delete-sale-btn" data-id="${s.id}" title="Delete & Restore Stock">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('sales-goto-pos')?.addEventListener('click', () => {
      document.querySelector('.nav-item[data-page="pos"]').click();
    });
    document.getElementById('empty-pos-btn')?.addEventListener('click', () => {
      document.querySelector('.nav-item[data-page="pos"]').click();
    });

    const searchInp = document.getElementById('sales-search-inp');
    if (searchInp) {
      searchInp.oninput = (e) => {
        search = e.target.value.toLowerCase().trim();
        render();
      };
    }

    container.querySelectorAll('.print-sale-btn').forEach(btn => {
      btn.onclick = () => {
        const sale = store.data.sales.find(s => s.id === btn.dataset.id);
        if (sale) printInvoice(sale);
      };
    });

    container.querySelectorAll('.delete-sale-btn').forEach(btn => {
      btn.onclick = () => {
        confirmDialog('Deleting this sale will automatically restore all sold medicine quantities back to your inventory stock. Proceed?', () => {
          store.deleteSale(btn.dataset.id);
          showToast('Sale deleted and stock restored.', 'info');
          render();
        }, 'Delete Sale & Restore Stock');
      };
    });
  }

  render();
}

// ==========================================
// 4. EXPENSE MANAGEMENT (SECTION 16)
// ==========================================
export function renderExpensesPage(container) {
  function render() {
    const expenses = store.data.expenses;
    const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Store Expenses</h2>
          <p>Track store utility bills, salaries, rent, packaging, and operating costs</p>
        </div>
        <div class="page-actions">
          <span style="font-size: 14px; font-weight: 700; margin-right: 12px;">Total: <span class="font-mono" style="color: var(--danger-text);">${formatCurrency(totalExp)}</span></span>
          <button type="button" class="btn btn-primary btn-sm" id="exp-add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Expense Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th class="cell-num">Amount</th>
                <th>Description</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.length === 0 ? `
                <tr><td colspan="7"><div class="table-empty-state"><p>No expenses recorded yet.</p></div></td></tr>
              ` : expenses.map(e => `
                <tr>
                  <td style="font-weight: 600;">${e.title}</td>
                  <td><span class="status-text warning">${e.category}</span></td>
                  <td>${formatDate(e.date)}</td>
                  <td>${e.paymentMethod || 'Cash'}</td>
                  <td class="cell-num font-mono" style="font-weight: 700; color: var(--danger-text);">${formatCurrency(e.amount)}</td>
                  <td style="color: var(--text-secondary);">${e.description || '-'}</td>
                  <td style="text-align: right;">
                    <button type="button" class="action-btn delete delete-exp-btn" data-id="${e.id}" title="Delete">
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

    document.getElementById('exp-add-btn').onclick = () => openExpenseModal(render);

    container.querySelectorAll('.delete-exp-btn').forEach(btn => {
      btn.onclick = () => {
        confirmDialog('Delete this expense entry?', () => {
          store.data.expenses = store.data.expenses.filter(e => e.id !== btn.dataset.id);
          store.save();
          showToast('Expense entry deleted', 'info');
          render();
        }, 'Delete Expense');
      };
    });
  }

  render();
}

function openExpenseModal(onSaved) {
  openModal({
    title: 'Record New Expense',
    size: 'sm',
    bodyHtml: `
      <div class="form-group">
        <label>Expense Title *</label>
        <input type="text" id="ne-title" required placeholder="e.g. Electricity Bill - May">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category *</label>
          <select id="ne-cat">
            <option value="Rent">Rent</option>
            <option value="Electricity">Electricity</option>
            <option value="Salary">Salary</option>
            <option value="Transport">Transport / Delivery</option>
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Utility">Internet & Utilities</option>
            <option value="Packaging">Packaging & Envelopes</option>
            <option value="Other">Other Expenses</option>
          </select>
        </div>
        <div class="form-group">
          <label>Amount (${store.data.settings.currency || 'Rs.'}) *</label>
          <input type="number" id="ne-amt" min="1" step="0.01" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="ne-date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="ne-method">
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Online">Online / Mobile Wallet</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Notes / Voucher #</label>
        <textarea id="ne-desc" placeholder="Details..."></textarea>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-ne-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-ne-save">Save Expense</button>
    `
  });

  document.getElementById('modal-ne-cancel').onclick = closeModal;
  document.getElementById('modal-ne-save').onclick = () => {
    const title = document.getElementById('ne-title').value.trim();
    const amt = parseFloat(document.getElementById('ne-amt').value);
    if (!title) return showToast('Expense title required', 'warning');
    if (isNaN(amt) || amt <= 0) return showToast('Valid amount required', 'warning');

    store.data.expenses.push({
      id: store.generateId('exp'),
      title,
      category: document.getElementById('ne-cat').value,
      amount: amt,
      date: document.getElementById('ne-date').value || new Date().toISOString(),
      paymentMethod: document.getElementById('ne-method').value,
      description: document.getElementById('ne-desc').value.trim()
    });

    store.save();
    closeModal();
    showToast('Expense recorded', 'success');
    onSaved();
  };
}

// ==========================================
// 5. INCOME MANAGEMENT (SECTION 17)
// ==========================================
export function renderIncomePage(container) {
  function render() {
    const incomes = store.data.incomes;
    const totalInc = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Additional Income</h2>
          <p>Record non-retail revenue such as clinic sublet, equipment rent, or distributor bonuses</p>
        </div>
        <div class="page-actions">
          <span style="font-size: 14px; font-weight: 700; margin-right: 12px;">Total: <span class="font-mono" style="color: var(--success);">${formatCurrency(totalInc)}</span></span>
          <button type="button" class="btn btn-primary btn-sm" id="inc-add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Add Income</span>
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Income Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Method</th>
                <th class="cell-num">Amount</th>
                <th>Description</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${incomes.length === 0 ? `
                <tr><td colspan="7"><div class="table-empty-state"><p>No additional income records found.</p></div></td></tr>
              ` : incomes.map(i => `
                <tr>
                  <td style="font-weight: 600;">${i.title}</td>
                  <td><span class="status-text success">${i.category}</span></td>
                  <td>${formatDate(i.date)}</td>
                  <td>${i.paymentMethod || 'Cash'}</td>
                  <td class="cell-num font-mono" style="font-weight: 700; color: var(--success);">${formatCurrency(i.amount)}</td>
                  <td style="color: var(--text-secondary);">${i.description || '-'}</td>
                  <td style="text-align: right;">
                    <button type="button" class="action-btn delete delete-inc-btn" data-id="${i.id}" title="Delete">
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

    document.getElementById('inc-add-btn').onclick = () => openIncomeModal(render);

    container.querySelectorAll('.delete-inc-btn').forEach(btn => {
      btn.onclick = () => {
        confirmDialog('Delete this income record?', () => {
          store.data.incomes = store.data.incomes.filter(i => i.id !== btn.dataset.id);
          store.save();
          showToast('Income entry deleted', 'info');
          render();
        }, 'Delete Income');
      };
    });
  }

  render();
}

function openIncomeModal(onSaved) {
  openModal({
    title: 'Add Other Income',
    size: 'sm',
    bodyHtml: `
      <div class="form-group">
        <label>Income Title *</label>
        <input type="text" id="ni-title" required placeholder="e.g. Doctor Clinic Rent">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category *</label>
          <select id="ni-cat">
            <option value="Clinic Sublet">Clinic Sublet</option>
            <option value="Distributor Rebate">Distributor Rebate / Scheme</option>
            <option value="Testing & Vitals">Sugar / BP Check Service</option>
            <option value="Other">Other Revenue</option>
          </select>
        </div>
        <div class="form-group">
          <label>Amount (${store.data.settings.currency || 'Rs.'}) *</label>
          <input type="number" id="ni-amt" min="1" step="0.01" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="ni-date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="ni-method">
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
          </select>
        </div>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-ni-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-ni-save">Save Income</button>
    `
  });

  document.getElementById('modal-ni-cancel').onclick = closeModal;
  document.getElementById('modal-ni-save').onclick = () => {
    const title = document.getElementById('ni-title').value.trim();
    const amt = parseFloat(document.getElementById('ni-amt').value);
    if (!title) return showToast('Income title required', 'warning');
    if (isNaN(amt) || amt <= 0) return showToast('Valid amount required', 'warning');

    store.data.incomes.push({
      id: store.generateId('inc'),
      title,
      category: document.getElementById('ni-cat').value,
      amount: amt,
      date: document.getElementById('ni-date').value || new Date().toISOString(),
      paymentMethod: document.getElementById('ni-method').value
    });

    store.save();
    closeModal();
    showToast('Income recorded successfully', 'success');
    onSaved();
  };
}

// ==========================================
// 6. CASH FLOW SECTION (SECTION 6)
// ==========================================
export function renderCashflowPage(container) {
  let period = 'today';
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  function calculateFlow() {
    let sales = store.data.sales;
    let purchases = store.data.purchases;
    let expenses = store.data.expenses;
    let incomes = store.data.incomes;
    let returns = store.data.returns;

    if (period === 'today') {
      sales = sales.filter(s => s.date && s.date.slice(0, 10) === todayStr);
      purchases = purchases.filter(p => p.date && p.date.slice(0, 10) === todayStr);
      expenses = expenses.filter(e => e.date && e.date.slice(0, 10) === todayStr);
      incomes = incomes.filter(i => i.date && i.date.slice(0, 10) === todayStr);
      returns = returns.filter(r => r.date && r.date.slice(0, 10) === todayStr);
    } else if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      sales = sales.filter(s => new Date(s.date) >= oneWeekAgo);
      purchases = purchases.filter(p => new Date(p.date) >= oneWeekAgo);
      expenses = expenses.filter(e => new Date(e.date) >= oneWeekAgo);
      incomes = incomes.filter(i => new Date(i.date) >= oneWeekAgo);
      returns = returns.filter(r => new Date(r.date) >= oneWeekAgo);
    } else if (period === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      sales = sales.filter(s => new Date(s.date) >= oneMonthAgo);
      purchases = purchases.filter(p => new Date(p.date) >= oneMonthAgo);
      expenses = expenses.filter(e => new Date(e.date) >= oneMonthAgo);
      incomes = incomes.filter(i => new Date(i.date) >= oneMonthAgo);
      returns = returns.filter(r => new Date(r.date) >= oneMonthAgo);
    }

    const openingCash = Number(store.data.settings.openingCash) || 0;
    const cashSales = sales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
    const otherIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalCashIn = cashSales + otherIncome;

    const cashPurchases = purchases.reduce((sum, p) => sum + Number(p.paid || 0), 0);
    const storeExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const customerRefunds = returns.filter(r => r.type === 'Sale Return').reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);
    const totalCashOut = cashPurchases + storeExpenses + customerRefunds;

    const closingCash = openingCash + totalCashIn - totalCashOut;

    return {
      openingCash,
      cashSales,
      otherIncome,
      totalCashIn,
      cashPurchases,
      storeExpenses,
      customerRefunds,
      totalCashOut,
      closingCash
    };
  }

  function render() {
    const flow = calculateFlow();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Cash Flow Statement</h2>
          <p>Complete reconciliation of liquid cash reserves, daily inflows, and outflows</p>
        </div>
        <div class="chart-filter-pills" id="cf-period-pills">
          <button class="filter-pill-btn ${period === 'today' ? 'active' : ''}" data-p="today">Today</button>
          <button class="filter-pill-btn ${period === 'week' ? 'active' : ''}" data-p="week">This Week</button>
          <button class="filter-pill-btn ${period === 'month' ? 'active' : ''}" data-p="month">This Month</button>
          <button class="filter-pill-btn ${period === 'all' ? 'active' : ''}" data-p="all">All Time</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-title">Opening Register Cash</span>
          <div class="kpi-value font-mono">${formatCurrency(flow.openingCash)}</div>
          <div class="kpi-subtext">Starting cash balance</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Total Cash Inflow</span>
          <div class="kpi-value font-mono" style="color: var(--success);">${formatCurrency(flow.totalCashIn)}</div>
          <div class="kpi-subtext">Sales & non-retail revenues</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Total Cash Outflow</span>
          <div class="kpi-value font-mono" style="color: var(--danger-text);">${formatCurrency(flow.totalCashOut)}</div>
          <div class="kpi-subtext">Purchases, expenses & refunds</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Net Closing Cash</span>
          <div class="kpi-value font-mono" style="color: ${flow.closingCash >= 0 ? 'var(--primary)' : 'var(--danger-text)'}; font-size: 26px;">
            ${formatCurrency(flow.closingCash)}
          </div>
          <div class="kpi-subtext">Closing = Opening + Inflows - Outflows</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cash Stream / Account Category</th>
                <th class="cell-center">Type</th>
                <th class="cell-num">Inflow (+)</th>
                <th class="cell-num">Outflow (-)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Cash Sales</strong> (Retail OTC Customers)</td>
                <td class="cell-center"><span class="status-text success">Revenue</span></td>
                <td class="cell-num font-mono" style="color: var(--success);">+${formatCurrency(flow.cashSales)}</td>
                <td class="cell-num font-mono">-</td>
              </tr>
              <tr>
                <td><strong>Other Store Income</strong> (Sublet / Service)</td>
                <td class="cell-center"><span class="status-text success">Revenue</span></td>
                <td class="cell-num font-mono" style="color: var(--success);">+${formatCurrency(flow.otherIncome)}</td>
                <td class="cell-num font-mono">-</td>
              </tr>
              <tr>
                <td><strong>Supplier Restock Payments</strong> (Wholesale)</td>
                <td class="cell-center"><span class="status-text danger">Purchase</span></td>
                <td class="cell-num font-mono">-</td>
                <td class="cell-num font-mono" style="color: var(--danger-text);">-${formatCurrency(flow.cashPurchases)}</td>
              </tr>
              <tr>
                <td><strong>Store Operating Expenses</strong> (Rent, Power, Wages)</td>
                <td class="cell-center"><span class="status-text danger">Expense</span></td>
                <td class="cell-num font-mono">-</td>
                <td class="cell-num font-mono" style="color: var(--danger-text);">-${formatCurrency(flow.storeExpenses)}</td>
              </tr>
              <tr>
                <td><strong>Customer Sale Refunds</strong></td>
                <td class="cell-center"><span class="status-text warning">Refund</span></td>
                <td class="cell-num font-mono">-</td>
                <td class="cell-num font-mono" style="color: var(--danger-text);">-${formatCurrency(flow.customerRefunds)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('#cf-period-pills .filter-pill-btn').forEach(b => {
      b.onclick = () => {
        period = b.dataset.p;
        render();
      };
    });
  }

  render();
}

// ==========================================
// 7. ACCOUNTS / GENERAL LEDGER
// ==========================================
export function renderLedgerPage(container) {
  const customersWithBal = store.data.customers.filter(c => Number(c.balance) > 0);
  const suppliersWithBal = store.data.suppliers.filter(s => Number(s.balance) > 0);

  const totalReceivable = customersWithBal.reduce((sum, c) => sum + Number(c.balance || 0), 0);
  const totalPayable = suppliersWithBal.reduce((sum, s) => sum + Number(s.balance || 0), 0);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>Accounts & General Ledger</h2>
        <p>Receivables, payables, and net working capital positions</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">Total Receivables (Debtors)</span>
        <div class="kpi-value font-mono" style="color: var(--warning-text);">${formatCurrency(totalReceivable)}</div>
        <div class="kpi-subtext">Owed by ${customersWithBal.length} customer accounts</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Total Payables (Creditors)</span>
        <div class="kpi-value font-mono" style="color: var(--danger-text);">${formatCurrency(totalPayable)}</div>
        <div class="kpi-subtext">Owed to ${suppliersWithBal.length} supplier distributors</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Net Working Balance</span>
        <div class="kpi-value font-mono" style="color: ${totalReceivable >= totalPayable ? 'var(--success)' : 'var(--danger-text)'};">
          ${formatCurrency(totalReceivable - totalPayable)}
        </div>
        <div class="kpi-subtext">Receivables minus Payables</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="table-card">
        <div class="panel-header"><h3>Customer Receivables (Who owes you)</h3></div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Customer</th><th>Phone</th><th class="cell-num">Balance Owed</th></tr>
            </thead>
            <tbody>
              ${customersWithBal.length === 0 ? `
                <tr><td colspan="3"><div class="table-empty-state"><p>No outstanding customer balances.</p></div></td></tr>
              ` : customersWithBal.map(c => `
                <tr>
                  <td style="font-weight: 600;">${c.name}</td>
                  <td>${c.phone || '-'}</td>
                  <td class="cell-num font-mono" style="font-weight: 700; color: var(--danger-text);">${formatCurrency(c.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <div class="panel-header"><h3>Supplier Payables (Who you owe)</h3></div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Supplier / Company</th><th>Phone</th><th class="cell-num">Balance Due</th></tr>
            </thead>
            <tbody>
              ${suppliersWithBal.length === 0 ? `
                <tr><td colspan="3"><div class="table-empty-state"><p>No outstanding supplier payables.</p></div></td></tr>
              ` : suppliersWithBal.map(s => `
                <tr>
                  <td style="font-weight: 600;">${s.name} (${s.company || 'Distributor'})</td>
                  <td>${s.phone || '-'}</td>
                  <td class="cell-num font-mono" style="font-weight: 700; color: var(--danger-text);">${formatCurrency(s.balance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
