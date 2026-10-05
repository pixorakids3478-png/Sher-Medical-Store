// SHER MEDICAL STORE - CHART.JS CONTROLLER
// Graceful empty states when no data is available; real live charts when data exists.
import { store } from './store.js';

let activeCharts = {};

function destroyChart(key) {
  if (activeCharts[key]) {
    activeCharts[key].destroy();
    delete activeCharts[key];
  }
}

export function destroyAllCharts() {
  Object.keys(activeCharts).forEach(destroyChart);
}

// 1. Sales Trend Line Chart
export function renderSalesTrendChart(canvasId, containerId, range = '7days') {
  destroyChart('salesTrend');
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const sales = store.data.sales;
  if (!sales || sales.length === 0) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  container.querySelector('.chart-empty-state')?.classList.add('hidden');

  // Compute daily totals
  const daysCount = range === '30days' ? 30 : range === 'monthly' ? 90 : 7;
  const labels = [];
  const dataPoints = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    labels.push(dayLabel);

    const dayTotal = sales
      .filter(s => s.date && s.date.slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
    dataPoints.push(dayTotal);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#1f2937' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const ctx = canvas.getContext('2d');
  activeCharts.salesTrend = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Sales Revenue',
        data: dataPoints,
        borderColor: '#1d4ed8',
        backgroundColor: 'rgba(29, 78, 216, 0.08)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Sales: ${store.data.settings.currency || 'Rs.'} ${Number(ctx.raw).toLocaleString()}`
          }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, beginAtZero: true }
      }
    }
  });
}

// 2. Profit Trend (Revenue vs Cost vs Profit)
export function renderProfitTrendChart(canvasId, containerId) {
  destroyChart('profitTrend');
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const sales = store.data.sales;
  if (!sales || sales.length === 0) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  container.querySelector('.chart-empty-state')?.classList.add('hidden');

  const labels = [];
  const revenueData = [];
  const costData = [];
  const profitData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));

    const daySales = sales.filter(s => s.date && s.date.slice(0, 10) === dateStr);
    const rev = daySales.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
    const prof = daySales.reduce((sum, s) => sum + Number(s.profit || 0), 0);
    const cost = Math.max(0, rev - prof);

    revenueData.push(rev);
    costData.push(cost);
    profitData.push(prof);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#1f2937' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const ctx = canvas.getContext('2d');
  activeCharts.profitTrend = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Revenue', data: revenueData, borderColor: '#1d4ed8', tension: 0.3, pointRadius: 3 },
        { label: 'Cost', data: costData, borderColor: '#94a3b8', tension: 0.3, pointRadius: 3 },
        { label: 'Profit', data: profitData, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.3, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor, boxWidth: 12, font: { size: 11 } } }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });
}

// 3. Sales vs Purchases Bar Chart
export function renderSalesVsPurchaseChart(canvasId, containerId) {
  destroyChart('salesVsPo');
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const sales = store.data.sales;
  const pos = store.data.purchases;
  if ((!sales || sales.length === 0) && (!pos || pos.length === 0)) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  container.querySelector('.chart-empty-state')?.classList.add('hidden');

  const labels = [];
  const salesData = [];
  const purchaseData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    labels.push(d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));

    const sVal = sales
      .filter(s => {
        const sd = new Date(s.date);
        return sd.getFullYear() === yr && sd.getMonth() === mo;
      })
      .reduce((acc, s) => acc + Number(s.grandTotal || 0), 0);

    const pVal = pos
      .filter(p => {
        const pd = new Date(p.date);
        return pd.getFullYear() === yr && pd.getMonth() === mo;
      })
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    salesData.push(sVal);
    purchaseData.push(pVal);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#1f2937' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const ctx = canvas.getContext('2d');
  activeCharts.salesVsPo = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Sales', data: salesData, backgroundColor: '#1d4ed8', borderRadius: 4 },
        { label: 'Purchases', data: purchaseData, backgroundColor: '#0d9488', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor, boxWidth: 12 } }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });
}

// 4. Expense Analysis Doughnut Chart (Only categories with data)
export function renderExpenseChart(canvasId, containerId) {
  destroyChart('expenses');
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const expenses = store.data.expenses;
  if (!expenses || expenses.length === 0) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  // Aggregate by category
  const catTotals = {};
  for (const exp of expenses) {
    const cat = exp.category || 'Other';
    catTotals[cat] = (catTotals[cat] || 0) + Number(exp.amount || 0);
  }

  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);

  if (labels.length === 0 || data.reduce((a, b) => a + b, 0) === 0) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  container.querySelector('.chart-empty-state')?.classList.add('hidden');

  const colors = ['#1d4ed8', '#0d9488', '#d97706', '#dc2626', '#8b5cf6', '#0284c7', '#10b981', '#64748b'];

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const ctx = canvas.getContext('2d');
  activeCharts.expenses = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: textColor, font: { size: 11 }, boxWidth: 12 } }
      }
    }
  });
}

// 5. Top Selling Medicines Horizontal Bar
export function renderTopMedicinesChart(canvasId, containerId) {
  destroyChart('topMeds');
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const sales = store.data.sales;
  const medCounts = {};

  if (sales) {
    for (const sale of sales) {
      if (sale.items) {
        for (const item of sale.items) {
          medCounts[item.name] = (medCounts[item.name] || 0) + Number(item.qty || 0);
        }
      }
    }
  }

  const sorted = Object.entries(medCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sorted.length === 0) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  canvas.classList.remove('hidden');
  container.querySelector('.chart-empty-state')?.classList.add('hidden');

  const labels = sorted.map(s => s[0]);
  const data = sorted.map(s => s[1]);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? '#1f2937' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const ctx = canvas.getContext('2d');
  activeCharts.topMeds = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Units Sold',
        data,
        backgroundColor: '#0d9488',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  });
}

// 6. Stock Status Breakdown Chart
export function renderStockStatusChart(canvasId, containerId) {
  destroyChart('stockStatus');
  const container = document.getElementById(containerId);
  const canvas = document.getElementById(canvasId);
  if (!container || !canvas) return;

  const meds = store.data.medicines;
  if (!meds || meds.length === 0) {
    canvas.classList.add('hidden');
    container.querySelector('.chart-empty-state')?.classList.remove('hidden');
    return;
  }

  let inStock = 0;
  let lowStock = 0;
  let outStock = 0;
  let nearExpiry = 0;

  for (const m of meds) {
    if (store.isOutOfStock(m)) outStock++;
    else if (store.isLowStock(m)) lowStock++;
    else inStock++;

    if (store.isNearExpiry(m.expiryDate) || store.isExpired(m.expiryDate)) nearExpiry++;
  }

  canvas.classList.remove('hidden');
  container.querySelector('.chart-empty-state')?.classList.add('hidden');

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const ctx = canvas.getContext('2d');
  activeCharts.stockStatus = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['In Stock', 'Low Stock', 'Out of Stock', 'Near Expiry/Expired'],
      datasets: [{
        data: [inStock, lowStock, outStock, nearExpiry],
        backgroundColor: ['#16a34a', '#d97706', '#dc2626', '#8b5cf6'],
        borderWidth: 2,
        borderColor: isDark ? '#111827' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: textColor, font: { size: 11 }, boxWidth: 12 } }
      }
    }
  });
}
