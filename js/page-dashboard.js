// SHER MEDICAL STORE - DASHBOARD PAGE MODULE
import { store } from './store.js';
import { formatCurrency, formatDate } from './ui.js';
import { 
  renderSalesTrendChart, 
  renderProfitTrendChart, 
  renderSalesVsPurchaseChart, 
  renderExpenseChart, 
  renderTopMedicinesChart, 
  renderStockStatusChart 
} from './charts.js';

export function renderDashboardPage(container) {
  // Compute Top 8 KPI Cards dynamically from localStorage
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // 1. Today's Sales
  const todaySalesList = store.data.sales.filter(s => s.date && s.date.slice(0, 10) === todayStr);
  const todaySales = todaySalesList.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
  
  // 2. Today's Profit
  const todayProfit = todaySalesList.reduce((sum, s) => sum + Number(s.profit || 0), 0);

  // 3. Today's Purchases
  const todayPurchases = store.data.purchases
    .filter(p => p.date && p.date.slice(0, 10) === todayStr)
    .reduce((sum, p) => sum + Number(p.total || 0), 0);

  // 4. Cash in Hand (Opening Cash + Cash Sales + Other Income + Cust Payments - Purchases - Expenses - Supplier Payments)
  const cashSales = store.data.sales
    .filter(s => s.paymentMethod === 'Cash')
    .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);

  const totalOtherIncome = store.data.incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpenses = store.data.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalCashPurchases = store.data.purchases.reduce((sum, p) => sum + Number(p.paid || 0), 0);

  const cashInHand = (Number(store.data.settings.openingCash) || 0) + cashSales + totalOtherIncome - totalExpenses - totalCashPurchases;

  // 5. Total Medicines
  const totalMedicines = store.data.medicines.length;

  // 6. Low Stock
  const lowStockCount = store.data.medicines.filter(m => store.isLowStock(m)).length;

  // 7. Near Expiry
  const nearExpiryCount = store.data.medicines.filter(m => store.isNearExpiry(m.expiryDate) || store.isExpired(m.expiryDate)).length;

  // 8. Total Customers
  const totalCustomers = store.data.customers.length;

  // Update sidebar badges
  const medBadge = document.getElementById('badge-total-meds');
  if (medBadge) medBadge.textContent = totalMedicines;

  const stockBadge = document.getElementById('badge-stock-alerts');
  if (stockBadge) {
    const totalAlerts = lowStockCount + nearExpiryCount;
    stockBadge.textContent = totalAlerts;
    stockBadge.style.display = totalAlerts > 0 ? 'inline-block' : 'none';
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <h2>Dashboard Overview</h2>
        <p>Real-time analytics and inventory health indicators</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary btn-sm" id="dash-refresh-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          <span>Refresh</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm" id="dash-pos-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span>Launch POS</span>
        </button>
      </div>
    </div>

    <!-- 8 TOP KPI CARDS -->
    <div class="kpi-grid">
      <!-- 1. Today's Sales -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Today's Sales</span>
          <div class="kpi-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>
        <div class="kpi-value">${formatCurrency(todaySales)}</div>
        <div class="kpi-subtext">${todaySalesList.length} sales today</div>
      </div>

      <!-- 2. Today's Profit -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Today's Profit</span>
          <div class="kpi-icon-wrap success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
        </div>
        <div class="kpi-value" style="color: var(--success);">${formatCurrency(todayProfit)}</div>
        <div class="kpi-subtext">Net item profits minus discounts</div>
      </div>

      <!-- 3. Today's Purchases -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Today's Purchases</span>
          <div class="kpi-icon-wrap accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
        </div>
        <div class="kpi-value">${formatCurrency(todayPurchases)}</div>
        <div class="kpi-subtext">Restocking and incoming bills</div>
      </div>

      <!-- 4. Cash in Hand -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Cash in Hand</span>
          <div class="kpi-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
          </div>
        </div>
        <div class="kpi-value" style="color: ${cashInHand >= 0 ? 'var(--primary)' : 'var(--danger)'};">${formatCurrency(cashInHand)}</div>
        <div class="kpi-subtext">Active register balance</div>
      </div>

      <!-- 5. Total Medicines -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Total Medicines</span>
          <div class="kpi-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          </div>
        </div>
        <div class="kpi-value">${totalMedicines}</div>
        <div class="kpi-subtext">Active inventory catalog</div>
      </div>

      <!-- 6. Low Stock -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Low Stock</span>
          <div class="kpi-icon-wrap warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
        <div class="kpi-value" style="color: ${lowStockCount > 0 ? 'var(--warning-text)' : 'inherit'};">${lowStockCount}</div>
        <div class="kpi-subtext">Needs urgent restocking</div>
      </div>

      <!-- 7. Near Expiry -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Near Expiry</span>
          <div class="kpi-icon-wrap danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
        <div class="kpi-value" style="color: ${nearExpiryCount > 0 ? 'var(--danger-text)' : 'inherit'};">${nearExpiryCount}</div>
        <div class="kpi-subtext">Expiring within ${store.data.settings.nearExpiryDays || 90} days</div>
      </div>

      <!-- 8. Total Customers -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Total Customers</span>
          <div class="kpi-icon-wrap accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>
        <div class="kpi-value">${totalCustomers}</div>
        <div class="kpi-subtext">Registered customer ledgers</div>
      </div>
    </div>

    <!-- CHARTS SECTION -->
    <div class="charts-grid">
      <!-- A. SALES TREND -->
      <div class="chart-card" id="sales-trend-card">
        <div class="chart-card-header">
          <span class="chart-title">Sales Trend</span>
          <div class="chart-filter-pills" id="sales-range-filter">
            <button class="filter-pill-btn active" data-range="7days">7 Days</button>
            <button class="filter-pill-btn" data-range="30days">30 Days</button>
            <button class="filter-pill-btn" data-range="monthly">Monthly</button>
          </div>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-sales-trend"></canvas>
          <div class="chart-empty-state hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <p>No sales data available yet</p>
          </div>
        </div>
      </div>

      <!-- B. PROFIT TREND -->
      <div class="chart-card" id="profit-trend-card">
        <div class="chart-card-header">
          <span class="chart-title">Revenue vs Cost vs Profit</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-profit-trend"></canvas>
          <div class="chart-empty-state hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>No profit data available yet</p>
          </div>
        </div>
      </div>

      <!-- C. SALES VS PURCHASE -->
      <div class="chart-card" id="sales-vs-po-card">
        <div class="chart-card-header">
          <span class="chart-title">Sales vs Purchases</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-sales-vs-po"></canvas>
          <div class="chart-empty-state hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            <p>No sales or purchase data recorded yet</p>
          </div>
        </div>
      </div>

      <!-- D. EXPENSE ANALYSIS -->
      <div class="chart-card" id="expense-card">
        <div class="chart-card-header">
          <span class="chart-title">Expense Breakdown</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-expenses"></canvas>
          <div class="chart-empty-state hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            <p>No expenses recorded yet</p>
          </div>
        </div>
      </div>

      <!-- E. TOP SELLING MEDICINES -->
      <div class="chart-card" id="top-meds-card">
        <div class="chart-card-header">
          <span class="chart-title">Top Selling Medicines</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-top-meds"></canvas>
          <div class="chart-empty-state hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/></svg>
            <p>No medicine sales recorded yet</p>
          </div>
        </div>
      </div>

      <!-- F. STOCK STATUS -->
      <div class="chart-card" id="stock-status-card">
        <div class="chart-card-header">
          <span class="chart-title">Inventory Stock Health</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="chart-stock-status"></canvas>
          <div class="chart-empty-state hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <p>No medicines in stock</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  document.getElementById('dash-refresh-btn').onclick = () => renderDashboardPage(container);
  document.getElementById('dash-pos-btn').onclick = () => {
    document.querySelector('.nav-item[data-page="pos"]').click();
  };

  // Range filter pills for Sales Trend
  const rangeBtns = container.querySelectorAll('#sales-range-filter .filter-pill-btn');
  rangeBtns.forEach(btn => {
    btn.onclick = () => {
      rangeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSalesTrendChart('chart-sales-trend', 'sales-trend-card', btn.dataset.range);
    };
  });

  // Render Charts
  setTimeout(() => {
    renderSalesTrendChart('chart-sales-trend', 'sales-trend-card', '7days');
    renderProfitTrendChart('chart-profit-trend', 'profit-trend-card');
    renderSalesVsPurchaseChart('chart-sales-vs-po', 'sales-vs-po-card');
    renderExpenseChart('chart-expenses', 'expense-card');
    renderTopMedicinesChart('chart-top-meds', 'top-meds-card');
    renderStockStatusChart('chart-stock-status', 'stock-status-card');
  }, 50);
}
