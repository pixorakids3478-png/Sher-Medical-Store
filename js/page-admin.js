// SHER MEDICAL STORE - REPORTS, EMPLOYEES & SYSTEM SETTINGS
import { store } from './store.js';
import { formatCurrency, formatDate, showToast, openModal, closeModal, confirmDialog } from './ui.js';

// ==========================================
// 1. REPORTS & ANALYTICS MODULE (SECTION 19)
// ==========================================
export function renderReportsPage(container) {
  let selectedReport = 'dailySales';
  let dateFrom = '';
  let dateTo = '';

  function generateReportData() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    switch (selectedReport) {
      case 'dailySales': {
        const list = store.data.sales.filter(s => s.date && s.date.slice(0, 10) === todayStr);
        return {
          title: "Today's Sales Report",
          headers: ['Invoice #', 'Customer', 'Items Count', 'Payment Method', 'Grand Total', 'Profit'],
          rows: list.map(s => [s.invoiceNo, s.customerName, s.items ? s.items.length : 0, s.paymentMethod, formatCurrency(s.grandTotal), formatCurrency(s.profit)]),
          summary: `Total Today: ${formatCurrency(list.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0))} | Total Profit: ${formatCurrency(list.reduce((sum, s) => sum + Number(s.profit || 0), 0))}`
        };
      }
      case 'monthlySales': {
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();
        const list = store.data.sales.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === curMonth && d.getFullYear() === curYear;
        });
        return {
          title: 'Current Month Sales Report',
          headers: ['Invoice #', 'Date', 'Customer', 'Payment Method', 'Grand Total', 'Profit'],
          rows: list.map(s => [s.invoiceNo, formatDate(s.date), s.customerName, s.paymentMethod, formatCurrency(s.grandTotal), formatCurrency(s.profit)]),
          summary: `Monthly Sales: ${formatCurrency(list.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0))} | Total Profit: ${formatCurrency(list.reduce((sum, s) => sum + Number(s.profit || 0), 0))}`
        };
      }
      case 'purchases': {
        const list = store.data.purchases;
        return {
          title: 'Purchase & Restocking Report',
          headers: ['PO #', 'Date', 'Supplier', 'Medicine', 'Qty', 'Unit Cost', 'Total Cost', 'Paid'],
          rows: list.map(p => [p.poNumber, formatDate(p.date), p.supplierName, p.medicineName, p.quantity, formatCurrency(p.purchasePrice), formatCurrency(p.total), formatCurrency(p.paid)]),
          summary: `Total Purchased: ${formatCurrency(list.reduce((sum, p) => sum + Number(p.total || 0), 0))}`
        };
      }
      case 'profit': {
        const list = store.data.sales;
        return {
          title: 'Net Profit Report',
          headers: ['Invoice #', 'Date', 'Revenue', 'Item Cost', 'Discount', 'Net Profit'],
          rows: list.map(s => [s.invoiceNo, formatDate(s.date), formatCurrency(s.grandTotal), formatCurrency(s.grandTotal - s.profit), formatCurrency(s.overallDiscount || 0), formatCurrency(s.profit)]),
          summary: `Total Net Profit: ${formatCurrency(list.reduce((sum, s) => sum + Number(s.profit || 0), 0))}`
        };
      }
      case 'lowStock': {
        const list = store.data.medicines.filter(m => store.isLowStock(m) || store.isOutOfStock(m));
        return {
          title: 'Low Stock & Reorder Report',
          headers: ['Medicine Name', 'Category', 'Current Qty', 'Min Level', 'Cost Price', 'Rack'],
          rows: list.map(m => [m.name, store.data.categories.find(c => c.id === m.categoryId)?.name || '-', m.quantity, m.minStock || 10, formatCurrency(m.purchasePrice), m.rack || '-']),
          summary: `${list.length} critical items require supplier purchase orders.`
        };
      }
      case 'expiry': {
        const list = store.data.medicines.filter(m => store.isNearExpiry(m.expiryDate) || store.isExpired(m.expiryDate));
        return {
          title: 'Expiry Surveillance Report',
          headers: ['Medicine Name', 'Batch', 'Stock Qty', 'Cost Price', 'Expiry Date', 'Status'],
          rows: list.map(m => [m.name, m.batchNo || '-', m.quantity, formatCurrency(m.purchasePrice), formatDate(m.expiryDate), store.isExpired(m.expiryDate) ? 'EXPIRED' : 'NEAR EXPIRY']),
          summary: `${list.length} medicines need quarantine or supplier return.`
        };
      }
      case 'expenses': {
        const list = store.data.expenses;
        return {
          title: 'Store Expenses Report',
          headers: ['Expense Title', 'Category', 'Date', 'Payment Method', 'Amount'],
          rows: list.map(e => [e.title, e.category, formatDate(e.date), e.paymentMethod, formatCurrency(e.amount)]),
          summary: `Total Expenses: ${formatCurrency(list.reduce((sum, e) => sum + Number(e.amount || 0), 0))}`
        };
      }
      default: {
        return { title: 'Report', headers: [], rows: [], summary: '' };
      }
    }
  }

  function render() {
    const report = generateReportData();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Reports & Analytics</h2>
          <p>Generate financial statements, stock audit summaries, and commercial reports</p>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="rep-csv-btn">Export CSV</button>
          <button type="button" class="btn btn-primary btn-sm" id="rep-print-btn">Print Report</button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <select class="table-filter-select" id="rep-type-select">
              <option value="dailySales" ${selectedReport === 'dailySales' ? 'selected' : ''}>Today's Sales</option>
              <option value="monthlySales" ${selectedReport === 'monthlySales' ? 'selected' : ''}>Monthly Sales</option>
              <option value="purchases" ${selectedReport === 'purchases' ? 'selected' : ''}>Purchases & Stock Receipts</option>
              <option value="profit" ${selectedReport === 'profit' ? 'selected' : ''}>Profit Analysis</option>
              <option value="lowStock" ${selectedReport === 'lowStock' ? 'selected' : ''}>Low Stock & Out of Stock</option>
              <option value="expiry" ${selectedReport === 'expiry' ? 'selected' : ''}>Expiry Surveillance</option>
              <option value="expenses" ${selectedReport === 'expenses' ? 'selected' : ''}>Operating Expenses</option>
            </select>
          </div>
          <div class="toolbar-right">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${report.summary}</span>
          </div>
        </div>

        <div class="table-container" id="report-printable-area">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 16px; font-weight: 700;">${report.title}</h3>
            <span class="text-xs text-muted">Generated: ${new Date().toLocaleString()}</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                ${report.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${report.rows.length === 0 ? `
                <tr><td colspan="${report.headers.length || 1}"><div class="table-empty-state"><p>No data recorded for this report criteria.</p></div></td></tr>
              ` : report.rows.map(row => `
                <tr>
                  ${row.map((cell, idx) => `<td class="${idx >= row.length - 2 ? 'font-mono' : ''}">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('rep-type-select').onchange = (e) => {
      selectedReport = e.target.value;
      render();
    };

    document.getElementById('rep-print-btn').onclick = () => {
      window.print();
    };

    document.getElementById('rep-csv-btn').onclick = () => {
      if (report.rows.length === 0) return showToast('No data to export', 'warning');
      const csv = [report.headers.join(','), ...report.rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report CSV downloaded', 'success');
    };
  }

  render();
}

// ==========================================
// 2. EMPLOYEE & SALARY PAYOUTS (SECTION 21)
// ==========================================
export function renderEmployeesPage(container) {
  function render() {
    const employees = store.data.employees;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title-group">
          <h2>Pharmacy Staff & Employees</h2>
          <p>Manage pharmacist licenses, staff salaries, and payroll disbursements</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="emp-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>+ Add Employee</span>
        </button>
      </div>

      <div class="table-card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>Phone / CNIC</th>
                <th>Joining Date</th>
                <th class="cell-num">Monthly Salary</th>
                <th class="cell-center">Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${employees.length === 0 ? `
                <tr>
                  <td colspan="7">
                    <div class="table-empty-state">
                      <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      </div>
                      <h4>No employees added yet</h4>
                      <p>Add pharmacists, counter sales staff, and store managers to track wages and payouts.</p>
                      <button type="button" class="btn btn-primary btn-sm" id="empty-add-emp-btn">+ Add First Employee</button>
                    </div>
                  </td>
                </tr>
              ` : employees.map(emp => `
                <tr>
                  <td>
                    <div style="font-weight: 600;">${emp.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${emp.fatherName ? `S/O ${emp.fatherName}` : ''}</div>
                  </td>
                  <td><span class="status-text info">${emp.designation || 'Staff'}</span></td>
                  <td>
                    <div>${emp.phone || '-'}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${emp.cnic || ''}</div>
                  </td>
                  <td>${formatDate(emp.joiningDate)}</td>
                  <td class="cell-num font-mono" style="font-weight: 700;">${formatCurrency(emp.salary)}</td>
                  <td class="cell-center"><span class="status-text ${emp.status === 'Active' ? 'success' : 'muted'}">${emp.status || 'Active'}</span></td>
                  <td style="text-align: right;">
                    <div class="row-actions">
                      <button type="button" class="btn btn-secondary btn-sm pay-salary-btn" data-id="${emp.id}">Pay Salary</button>
                      <button type="button" class="action-btn delete delete-emp-btn" data-id="${emp.id}" title="Delete">
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

    document.getElementById('emp-add-btn')?.addEventListener('click', () => openEmployeeModal(render));
    document.getElementById('empty-add-emp-btn')?.addEventListener('click', () => openEmployeeModal(render));

    container.querySelectorAll('.pay-salary-btn').forEach(btn => {
      btn.onclick = () => openPaySalaryModal(btn.dataset.id);
    });

    container.querySelectorAll('.delete-emp-btn').forEach(btn => {
      btn.onclick = () => {
        const emp = store.data.employees.find(e => e.id === btn.dataset.id);
        if (!emp) return;
        confirmDialog(`Remove employee "${emp.name}"?`, () => {
          store.data.employees = store.data.employees.filter(e => e.id !== emp.id);
          store.save();
          showToast('Employee removed', 'info');
          render();
        }, 'Remove Employee');
      };
    });
  }

  render();
}

function openEmployeeModal(onSaved) {
  openModal({
    title: 'Add New Staff Member',
    size: 'md',
    bodyHtml: `
      <div class="form-row">
        <div class="form-group">
          <label>Employee Name *</label>
          <input type="text" id="ep-name" required placeholder="e.g. Dr. Haris Bilal">
        </div>
        <div class="form-group">
          <label>Father Name</label>
          <input type="text" id="ep-father" placeholder="Father's name">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Designation *</label>
          <select id="ep-desig">
            <option value="Chief Pharmacist">Chief Pharmacist</option>
            <option value="Assistant Pharmacist">Assistant Pharmacist</option>
            <option value="Sales Counter Staff">Sales Counter Staff</option>
            <option value="Cashier">Cashier</option>
            <option value="Inventory Manager">Inventory Manager</option>
            <option value="Store Helper">Store Helper / Porter</option>
          </select>
        </div>
        <div class="form-group">
          <label>Monthly Salary (${store.data.settings.currency || 'Rs.'}) *</label>
          <input type="number" id="ep-salary" min="0" value="35000" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" id="ep-phone" placeholder="0300-1234567">
        </div>
        <div class="form-group">
          <label>CNIC / National ID</label>
          <input type="text" id="ep-cnic" placeholder="12345-1234567-1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Joining Date</label>
          <input type="date" id="ep-date" value="${new Date().toISOString().slice(0, 10)}">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="ep-status">
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-ep-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-ep-save">Save Employee</button>
    `
  });

  document.getElementById('modal-ep-cancel').onclick = closeModal;
  document.getElementById('modal-ep-save').onclick = () => {
    const name = document.getElementById('ep-name').value.trim();
    const sal = parseFloat(document.getElementById('ep-salary').value) || 0;
    if (!name) return showToast('Employee name is required', 'warning');

    store.data.employees.push({
      id: store.generateId('emp'),
      name,
      fatherName: document.getElementById('ep-father').value.trim(),
      designation: document.getElementById('ep-desig').value,
      salary: sal,
      phone: document.getElementById('ep-phone').value.trim(),
      cnic: document.getElementById('ep-cnic').value.trim(),
      joiningDate: document.getElementById('ep-date').value,
      status: document.getElementById('ep-status').value
    });

    store.save();
    closeModal();
    showToast('Employee created successfully', 'success');
    onSaved();
  };
}

function openPaySalaryModal(empId) {
  const emp = store.data.employees.find(e => e.id === empId);
  if (!emp) return;

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  openModal({
    title: `Disburse Salary: ${emp.name}`,
    size: 'sm',
    bodyHtml: `
      <div style="background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px;">
        <div><strong>Designation:</strong> ${emp.designation}</div>
        <div><strong>Standard Base Salary:</strong> <span class="font-mono">${formatCurrency(emp.salary)}</span></div>
      </div>
      <div class="form-group">
        <label>Salary Month</label>
        <input type="text" id="sal-month" value="${currentMonth}">
      </div>
      <div class="form-group">
        <label>Amount to Disburse (${store.data.settings.currency || 'Rs.'}) *</label>
        <input type="number" id="sal-amount" min="1" step="0.01" value="${emp.salary}" required>
      </div>
      <div class="form-group">
        <label>Payment Method</label>
        <select id="sal-method">
          <option value="Cash">Cash</option>
          <option value="Bank">Bank Transfer</option>
        </select>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="modal-sal-cancel">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="modal-sal-save">Disburse & Log Expense</button>
    `
  });

  document.getElementById('modal-sal-cancel').onclick = closeModal;
  document.getElementById('modal-sal-save').onclick = () => {
    const amt = parseFloat(document.getElementById('sal-amount').value);
    if (isNaN(amt) || amt <= 0) return showToast('Please enter a valid amount', 'warning');

    const monthStr = document.getElementById('sal-month').value.trim();

    // Automatically record an expense entry under category "Salary" so cash flow & profit sync!
    store.data.expenses.push({
      id: store.generateId('exp'),
      title: `Salary - ${emp.name} (${monthStr})`,
      category: 'Salary',
      amount: amt,
      paymentMethod: document.getElementById('sal-method').value,
      description: `Monthly salary payout to ${emp.name} for ${monthStr}`,
      date: new Date().toISOString()
    });

    store.save();
    closeModal();
    showToast(`Salary payout of ${formatCurrency(amt)} logged to Expenses!`, 'success');
  };
}

// ==========================================
// 3. SETTINGS & LOGO UPLOAD (SECTION 22 & 23)
// ==========================================
export function renderSettingsPage(container) {
  const s = store.data.settings;

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>System Settings & Store Profile</h2>
        <p>Pharmacy branding, receipt headers, logos, backup archives, and administrative security</p>
      </div>
    </div>

    <div class="charts-grid">
      <!-- Store Information Form -->
      <div class="chart-card">
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">Pharmacy Profile</h3>
        <form id="settings-store-form">
          <div class="form-group">
            <label>Store Name *</label>
            <input type="text" id="set-store-name" value="${s.storeName}" required>
          </div>
          <div class="form-group">
            <label>Physical Address</label>
            <input type="text" id="set-address" value="${s.address || ''}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" id="set-phone" value="${s.phone || ''}">
            </div>
            <div class="form-group">
              <label>WhatsApp Number</label>
              <input type="text" id="set-whatsapp" value="${s.whatsapp || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="set-email" value="${s.email || ''}">
            </div>
            <div class="form-group">
              <label>Currency Symbol</label>
              <input type="text" id="set-currency" value="${s.currency || 'Rs.'}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Near Expiry Warning (Days)</label>
              <input type="number" id="set-expiry-days" min="1" value="${s.nearExpiryDays || 90}">
            </div>
            <div class="form-group">
              <label>Low Stock Warning Threshold</label>
              <input type="number" id="set-stock-min" min="1" value="${s.lowStockThreshold || 10}">
            </div>
          </div>
          <div class="form-group">
            <label>Default Opening Register Cash</label>
            <input type="number" id="set-open-cash" min="0" step="0.01" value="${s.openingCash || 0}">
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Save Store Profile</button>
        </form>
      </div>

      <!-- Real Browse Logo Management (Section 22) -->
      <div class="chart-card">
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">Pharmacy Brand Logo</h3>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
          Upload a custom PNG/SVG logo to appear on all invoices, header navigation, reports, and receipts.
        </p>

        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
          <div style="width: 80px; height: 80px; border-radius: var(--radius-md); border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--bg-subtle);">
            <img id="logo-preview-img" src="${s.logoData || './assets/logo-placeholder.svg'}" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="file" id="logo-file-input" accept="image/*" class="hidden">
            <button type="button" class="btn btn-secondary btn-sm" id="browse-logo-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Browse Logo File</span>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="remove-logo-btn" style="color: var(--danger);">Remove Logo</button>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid var(--border); margin: 20px 0;">

        <!-- Backup & Restore (Section 23) -->
        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 8px;">Data Backup & Archive</h3>
        <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
          Export all transactions, medicine catalog, and ledgers into an offline JSON snapshot.
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
          <button type="button" class="btn btn-secondary btn-sm" id="backup-download-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Backup Data (JSON)</span>
          </button>
          <input type="file" id="restore-file-input" accept=".json" class="hidden">
          <button type="button" class="btn btn-secondary btn-sm" id="restore-upload-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>Restore Backup File</span>
          </button>
        </div>

        <!-- Strong Reset Confirmation -->
        <div style="background: var(--danger-bg); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: var(--radius-md); padding: 14px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--danger-text); margin-bottom: 4px;">Danger Zone: Reset Database</h4>
          <p style="font-size: 12px; color: var(--danger-text); margin-bottom: 10px;">
            Permanently erase all medicines, customers, suppliers, and sales history back to clean zero state.
          </p>
          <button type="button" class="btn btn-danger btn-sm" id="reset-all-btn">Reset All Data</button>
        </div>
      </div>
    </div>
  `;

  // Profile save
  document.getElementById('settings-store-form').onsubmit = (e) => {
    e.preventDefault();
    store.data.settings.storeName = document.getElementById('set-store-name').value.trim() || 'SHER MEDICAL STORE';
    store.data.settings.address = document.getElementById('set-address').value.trim();
    store.data.settings.phone = document.getElementById('set-phone').value.trim();
    store.data.settings.whatsapp = document.getElementById('set-whatsapp').value.trim();
    store.data.settings.email = document.getElementById('set-email').value.trim();
    store.data.settings.currency = document.getElementById('set-currency').value.trim() || 'Rs.';
    store.data.settings.nearExpiryDays = parseInt(document.getElementById('set-expiry-days').value, 10) || 90;
    store.data.settings.lowStockThreshold = parseInt(document.getElementById('set-stock-min').value, 10) || 10;
    store.data.settings.openingCash = parseFloat(document.getElementById('set-open-cash').value) || 0;

    store.save();
    showToast('Store settings updated', 'success');

    // Update sidebar store name
    const sbName = document.getElementById('sidebar-store-name');
    if (sbName) sbName.textContent = store.data.settings.storeName;
  };

  // Real Browse Logo Button
  const logoInput = document.getElementById('logo-file-input');
  const browseBtn = document.getElementById('browse-logo-btn');
  const previewImg = document.getElementById('logo-preview-img');

  browseBtn.onclick = () => logoInput.click();
  logoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const base64 = re.target.result;
      store.data.settings.logoData = base64;
      store.save();
      previewImg.src = base64;

      const sidebarLogo = document.getElementById('sidebar-logo-img');
      if (sidebarLogo) sidebarLogo.src = base64;

      showToast('Pharmacy logo uploaded and applied across software!', 'success');
    };
    reader.readAsDataURL(file);
  };

  document.getElementById('remove-logo-btn').onclick = () => {
    store.data.settings.logoData = null;
    store.save();
    previewImg.src = './assets/logo-placeholder.svg';
    const sidebarLogo = document.getElementById('sidebar-logo-img');
    if (sidebarLogo) sidebarLogo.src = './assets/logo-placeholder.svg';
    showToast('Logo removed. Default medical insignia restored.', 'info');
  };

  // Backup Download
  document.getElementById('backup-download-btn').onclick = () => {
    store.exportBackup();
    showToast('Complete backup file downloaded successfully', 'success');
  };

  // Restore Upload
  const restoreInput = document.getElementById('restore-file-input');
  document.getElementById('restore-upload-btn').onclick = () => restoreInput.click();
  restoreInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const success = store.importBackup(re.target.result);
      if (success) {
        showToast('Backup restored successfully! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast('Failed to restore backup. Invalid JSON format.', 'danger');
      }
    };
    reader.readAsText(file);
  };

  // Reset All Data
  document.getElementById('reset-all-btn').onclick = () => {
    openModal({
      title: 'CRITICAL: Confirm Full Database Reset',
      size: 'sm',
      bodyHtml: `
        <div style="font-size: 13px; color: var(--danger-text); line-height: 1.5; margin-bottom: 12px;">
          This will permanently wipe all medicines, purchases, sales, customer ledgers, and expenses!
        </div>
        <div class="form-group">
          <label>Type <strong>RESET</strong> in capital letters to confirm:</label>
          <input type="text" id="reset-confirm-input" placeholder="RESET" style="border-color: var(--danger);">
        </div>
      `,
      footerHtml: `
        <button type="button" class="btn btn-secondary btn-sm" id="modal-rst-cancel">Cancel</button>
        <button type="button" class="btn btn-danger btn-sm" id="modal-rst-confirm">Wipe All Data</button>
      `
    });

    document.getElementById('modal-rst-cancel').onclick = closeModal;
    document.getElementById('modal-rst-confirm').onclick = () => {
      const val = document.getElementById('reset-confirm-input').value.trim();
      if (val !== 'RESET') {
        return showToast('Confirmation word does not match "RESET"', 'warning');
      }
      store.resetAllData();
      closeModal();
      showToast('All database tables reset to 0.', 'info');
      setTimeout(() => window.location.reload(), 1000);
    };
  };
}
