// SHER MEDICAL STORE - APPLICATION BOOTSTRAPPER & ROUTER
import { store } from './store.js';
import { initLiveClock, initTheme, showToast } from './ui.js';
import { renderDashboardPage } from './page-dashboard.js';
import { renderPosPage } from './page-pos.js';
import { 
  renderMedicinesPage, 
  renderCategoriesPage, 
  renderStockPage, 
  renderPurchasesPage, 
  renderReturnsPage 
} from './page-inventory.js';
import { 
  renderSuppliersPage, 
  renderCustomersPage, 
  renderSalesPage, 
  renderExpensesPage, 
  renderIncomePage, 
  renderCashflowPage, 
  renderLedgerPage 
} from './page-entities.js';
import { 
  renderReportsPage, 
  renderEmployeesPage, 
  renderSettingsPage 
} from './page-admin.js';

let currentPage = 'dashboard';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLiveClock();
  initAuthentication();
  initBranding();
  initNavigation();
  initGlobalSearch();
  initNotifications();
  initKeyboardShortcuts();

  // Load Initial Page
  navigateTo('dashboard');
});

// Authentication System (Section 31)
function initAuthentication() {
  const overlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const userDisplay = document.getElementById('user-display-name');
  const dropdownName = document.getElementById('dropdown-user-name');
  const logoutBtn = document.getElementById('logout-btn');

  // Check login state
  const session = store.data.session;
  if (!session || !session.isLoggedIn) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    if (userDisplay) userDisplay.textContent = session.user || 'Admin';
    if (dropdownName) dropdownName.textContent = session.user || 'Admin';
  }

  // Password visibility toggle
  const togglePassBtn = document.getElementById('toggle-password-btn');
  const passInput = document.getElementById('login-password');
  if (togglePassBtn && passInput) {
    togglePassBtn.onclick = () => {
      passInput.type = passInput.type === 'password' ? 'text' : 'password';
    };
  }

  // Handle Login submission
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value.trim();

      const validUser = store.data.settings.adminUser || 'admin';
      const validPass = store.data.settings.adminPass || 'admin123';

      if (u === validUser && p === validPass) {
        store.data.session.isLoggedIn = true;
        store.data.session.user = u;
        store.save();
        overlay.classList.add('hidden');
        if (userDisplay) userDisplay.textContent = u;
        if (dropdownName) dropdownName.textContent = u;
        showToast('Signed in successfully', 'success');
        navigateTo('dashboard');
      } else {
        showToast('Invalid credentials. Default: admin / admin123', 'danger');
      }
    };
  }

  // Logout handler
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      store.data.session.isLoggedIn = false;
      store.save();
      overlay.classList.remove('hidden');
      document.getElementById('user-menu-dropdown')?.classList.add('hidden');
      showToast('Logged out of system', 'info');
    };
  }
}

// Brand Logo & Name sync
function initBranding() {
  const settings = store.data.settings;
  const storeNameEl = document.getElementById('sidebar-store-name');
  if (storeNameEl) storeNameEl.textContent = settings.storeName || 'SHER MEDICAL';

  if (settings.logoData) {
    const sbLogo = document.getElementById('sidebar-logo-img');
    const loginLogo = document.getElementById('login-logo-img');
    if (sbLogo) sbLogo.src = settings.logoData;
    if (loginLogo) loginLogo.src = settings.logoData;
  }
}

// Navigation & Sidebar
function initNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // Topbar quick POS button
  document.getElementById('quick-pos-btn')?.addEventListener('click', () => navigateTo('pos'));

  // Sidebar collapse toggle
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  collapseBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Mobile menu button
  const mobileBtn = document.getElementById('mobile-menu-btn');
  mobileBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // Close mobile sidebar when clicking main content
  document.getElementById('main-content')?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
  });

  // User dropdown toggle
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-menu-dropdown');
  userMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('hidden');
    document.getElementById('notif-panel')?.classList.add('hidden');
  });

  // Quick settings button
  document.getElementById('quick-settings-btn')?.addEventListener('click', () => {
    userDropdown?.classList.add('hidden');
    navigateTo('settings');
  });

  // Quick backup button
  document.getElementById('quick-backup-btn')?.addEventListener('click', () => {
    userDropdown?.classList.add('hidden');
    store.exportBackup();
    showToast('Backup archive downloaded', 'success');
  });

  // Global click to close popovers
  document.addEventListener('click', () => {
    userDropdown?.classList.add('hidden');
    document.getElementById('notif-panel')?.classList.add('hidden');
    document.getElementById('global-search-results')?.classList.add('hidden');
  });
}

// Router
export function navigateTo(pageId) {
  currentPage = pageId;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  // Update Breadcrumbs
  const crumbCurrent = document.getElementById('crumb-current');
  if (crumbCurrent) {
    const titles = {
      dashboard: 'Dashboard',
      pos: 'POS / New Sale',
      medicines: 'Medicines Catalog',
      categories: 'Categories',
      stock: 'Stock Management',
      purchases: 'Purchases',
      suppliers: 'Suppliers & Distributors',
      customers: 'Customers',
      sales: 'Sales History',
      returns: 'Returns',
      expenses: 'Expenses',
      income: 'Other Income',
      cashflow: 'Cash Flow',
      ledger: 'Accounts / Ledger',
      reports: 'Reports & Analytics',
      employees: 'Staff & Employees',
      settings: 'Settings'
    };
    crumbCurrent.textContent = titles[pageId] || pageId.toUpperCase();
  }

  // Switch visible page container
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  const container = document.getElementById(`page-${pageId}`);
  if (!container) return;
  container.classList.add('active');

  // Trigger page render
  switch (pageId) {
    case 'dashboard': renderDashboardPage(container); break;
    case 'pos': renderPosPage(container); break;
    case 'medicines': renderMedicinesPage(container); break;
    case 'categories': renderCategoriesPage(container); break;
    case 'stock': renderStockPage(container); break;
    case 'purchases': renderPurchasesPage(container); break;
    case 'suppliers': renderSuppliersPage(container); break;
    case 'customers': renderCustomersPage(container); break;
    case 'sales': renderSalesPage(container); break;
    case 'returns': renderReturnsPage(container); break;
    case 'expenses': renderExpensesPage(container); break;
    case 'income': renderIncomePage(container); break;
    case 'cashflow': renderCashflowPage(container); break;
    case 'ledger': renderLedgerPage(container); break;
    case 'reports': renderReportsPage(container); break;
    case 'employees': renderEmployeesPage(container); break;
    case 'settings': renderSettingsPage(container); break;
  }

  // Update notification counters in header
  updateNotifications();
}

// Global Search (Requirement #24)
function initGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const resultsBox = document.getElementById('global-search-results');
  if (!input || !resultsBox) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      resultsBox.classList.add('hidden');
      return;
    }

    const matchedMeds = store.data.medicines.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.genericName && m.genericName.toLowerCase().includes(q)) ||
      (m.barcode && m.barcode.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedSales = store.data.sales.filter(s => 
      s.invoiceNo.toLowerCase().includes(q) || 
      (s.customerName && s.customerName.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchedCusts = store.data.customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q))
    ).slice(0, 3);

    const matchedSupps = store.data.suppliers.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.company && s.company.toLowerCase().includes(q))
    ).slice(0, 3);

    if (matchedMeds.length === 0 && matchedSales.length === 0 && matchedCusts.length === 0 && matchedSupps.length === 0) {
      resultsBox.innerHTML = '<div style="padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center;">No matching records found.</div>';
      resultsBox.classList.remove('hidden');
      return;
    }

    let html = '';

    if (matchedMeds.length > 0) {
      html += `<div style="font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 4px 8px; text-transform: uppercase;">Medicines</div>`;
      matchedMeds.forEach(m => {
        html += `
          <div class="search-result-item" data-type="med" data-id="${m.id}" style="padding: 6px 8px; font-size: 12px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between;">
            <div><strong>${m.name}</strong> <span style="font-size: 11px; color: var(--text-muted);">${m.genericName || ''}</span></div>
            <span style="font-weight: 600; color: var(--primary);">${store.data.settings.currency || 'Rs.'} ${m.salePrice}</span>
          </div>
        `;
      });
    }

    if (matchedSales.length > 0) {
      html += `<div style="font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 6px 8px 4px; text-transform: uppercase;">Invoices</div>`;
      matchedSales.forEach(s => {
        html += `
          <div class="search-result-item" data-type="sale" data-id="${s.id}" style="padding: 6px 8px; font-size: 12px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between;">
            <div><strong>${s.invoiceNo}</strong> · ${s.customerName}</div>
            <span style="font-weight: 600;">${store.data.settings.currency || 'Rs.'} ${s.grandTotal}</span>
          </div>
        `;
      });
    }

    if (matchedCusts.length > 0) {
      html += `<div style="font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 6px 8px 4px; text-transform: uppercase;">Customers</div>`;
      matchedCusts.forEach(c => {
        html += `
          <div class="search-result-item" data-type="cust" data-id="${c.id}" style="padding: 6px 8px; font-size: 12px; border-radius: 4px; cursor: pointer;">
            <strong>${c.name}</strong> <span style="font-size: 11px; color: var(--text-muted);">${c.phone || ''}</span>
          </div>
        `;
      });
    }

    resultsBox.innerHTML = html;
    resultsBox.classList.remove('hidden');

    resultsBox.querySelectorAll('.search-result-item').forEach(item => {
      item.onclick = () => {
        const type = item.dataset.type;
        resultsBox.classList.add('hidden');
        input.value = '';
        if (type === 'med') navigateTo('medicines');
        else if (type === 'sale') navigateTo('sales');
        else if (type === 'cust') navigateTo('customers');
      };
    });
  });

  input.addEventListener('click', (e) => e.stopPropagation());
}

// Notifications Panel (Requirement #25)
function initNotifications() {
  const notifBtn = document.getElementById('notif-btn');
  const notifPanel = document.getElementById('notif-panel');

  notifBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    notifPanel?.classList.toggle('hidden');
    document.getElementById('user-menu-dropdown')?.classList.add('hidden');
    updateNotifications();
  });

  notifPanel?.addEventListener('click', (e) => e.stopPropagation());
}

function updateNotifications() {
  const notifBadge = document.getElementById('notif-badge');
  const notifList = document.getElementById('notif-list');
  const summaryText = document.getElementById('notif-summary-text');

  const lowStock = store.data.medicines.filter(m => store.isLowStock(m));
  const outOfStock = store.data.medicines.filter(m => store.isOutOfStock(m));
  const nearExpiry = store.data.medicines.filter(m => store.isNearExpiry(m.expiryDate) && !store.isExpired(m.expiryDate));
  const expired = store.data.medicines.filter(m => store.isExpired(m.expiryDate));
  const customerDebts = store.data.customers.filter(c => Number(c.balance) > 0);
  const supplierPayables = store.data.suppliers.filter(s => Number(s.balance) > 0);

  const totalAlerts = lowStock.length + outOfStock.length + nearExpiry.length + expired.length + customerDebts.length + supplierPayables.length;

  if (notifBadge) {
    if (totalAlerts > 0) {
      notifBadge.textContent = totalAlerts;
      notifBadge.classList.remove('hidden');
    } else {
      notifBadge.classList.add('hidden');
    }
  }

  if (summaryText) {
    summaryText.textContent = `${totalAlerts} active alerts`;
  }

  if (!notifList) return;

  if (totalAlerts === 0) {
    notifList.innerHTML = `<div class="empty-notif">No urgent store alerts. All systems running smooth!</div>`;
    return;
  }

  let html = '';

  expired.forEach(m => {
    html += `
      <div class="notif-item" data-target="stock">
        <span style="color: var(--danger-text); font-weight: 700;">[EXPIRED]</span>
        <div><strong>${m.name}</strong> expired. Remove from active shelf.</div>
      </div>
    `;
  });

  outOfStock.forEach(m => {
    html += `
      <div class="notif-item" data-target="stock">
        <span style="color: var(--danger-text); font-weight: 700;">[OUT OF STOCK]</span>
        <div><strong>${m.name}</strong> quantity is 0. Reorder from supplier.</div>
      </div>
    `;
  });

  lowStock.forEach(m => {
    html += `
      <div class="notif-item" data-target="stock">
        <span style="color: var(--warning-text); font-weight: 700;">[LOW STOCK]</span>
        <div><strong>${m.name}</strong> has ${m.quantity} left (below min level).</div>
      </div>
    `;
  });

  nearExpiry.forEach(m => {
    html += `
      <div class="notif-item" data-target="stock">
        <span style="color: var(--warning-text); font-weight: 700;">[NEAR EXPIRY]</span>
        <div><strong>${m.name}</strong> expires on ${m.expiryDate ? m.expiryDate.slice(0, 10) : ''}.</div>
      </div>
    `;
  });

  customerDebts.forEach(c => {
    html += `
      <div class="notif-item" data-target="customers">
        <span style="color: var(--info-text); font-weight: 700;">[RECEIVABLE]</span>
        <div><strong>${c.name}</strong> owes ${store.data.settings.currency || 'Rs.'} ${c.balance}.</div>
      </div>
    `;
  });

  notifList.innerHTML = html;

  notifList.querySelectorAll('.notif-item').forEach(item => {
    item.onclick = () => {
      document.getElementById('notif-panel')?.classList.add('hidden');
      navigateTo(item.dataset.target);
    };
  });
}

// Keyboard shortcuts (F2 for POS, Ctrl+K for search)
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      navigateTo('pos');
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      document.getElementById('global-search-input')?.focus();
    }
  });
}
