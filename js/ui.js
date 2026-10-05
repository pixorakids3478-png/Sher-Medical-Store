// SHER MEDICAL STORE - UI UTILITIES & SHELL CONTROLLER
import { store } from './store.js';

// Format currency
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  const curr = store.data.settings.currency || 'Rs.';
  return `${curr} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format date
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Format full date & time
export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateStr;
  }
}

// Toast Notifications
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconSvg = type === 'success' 
    ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
    : type === 'warning'
    ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    : type === 'danger'
    ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
    : '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-msg">${message}</span>
    <span class="toast-close">&times;</span>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Modal Windows
export function openModal({ title, bodyHtml, footerHtml, size = '' }) {
  const backdrop = document.getElementById('modal-container');
  const windowEl = document.getElementById('modal-window');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  windowEl.className = `modal-window ${size ? 'modal-' + size : ''}`;
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  footerEl.innerHTML = footerHtml || '';

  backdrop.classList.remove('hidden');

  const closeBtn = document.getElementById('modal-close-btn');
  closeBtn.onclick = closeModal;

  backdrop.onclick = (e) => {
    if (e.target === backdrop) closeModal();
  };
}

export function closeModal() {
  const backdrop = document.getElementById('modal-container');
  if (backdrop) backdrop.classList.add('hidden');
}

export function confirmDialog(message, onConfirm, title = 'Confirm Action') {
  openModal({
    title,
    size: 'sm',
    bodyHtml: `
      <div style="display: flex; gap: 14px; align-items: flex-start;">
        <div style="background: var(--danger-bg); color: var(--danger-text); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div>
          <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">Are you sure?</h4>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${message}</p>
        </div>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn-secondary btn-sm" id="confirm-cancel-btn">Cancel</button>
      <button type="button" class="btn btn-danger btn-sm" id="confirm-ok-btn">Proceed</button>
    `
  });

  document.getElementById('confirm-cancel-btn').onclick = closeModal;
  document.getElementById('confirm-ok-btn').onclick = () => {
    closeModal();
    onConfirm();
  };
}

// Live Clock
export function initLiveClock() {
  const dateEl = document.getElementById('clock-date');
  const timeEl = document.getElementById('clock-time');

  function update() {
    const now = new Date();
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
  }

  update();
  setInterval(update, 1000);
}

// Theme handling
export function initTheme() {
  const saved = localStorage.getItem('SHER_THEME') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcons(saved);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('SHER_THEME', next);
      updateThemeIcons(next);
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: next }));
    });
  }
}

function updateThemeIcons(theme) {
  const sun = document.getElementById('theme-icon-sun');
  const moon = document.getElementById('theme-icon-moon');
  if (!sun || !moon) return;
  if (theme === 'dark') {
    sun.classList.remove('hidden');
    moon.classList.add('hidden');
  } else {
    sun.classList.add('hidden');
    moon.classList.remove('hidden');
  }
}

// Print Invoice directly
export function printInvoice(sale) {
  const container = document.getElementById('invoice-print-container');
  if (!container) return;

  const settings = store.data.settings;
  const logoHtml = settings.logoData 
    ? `<img src="${settings.logoData}" style="max-height: 48px; max-width: 140px; margin-bottom: 8px;">`
    : '';

  const itemsRows = sale.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td>${it.batchNo || '-'}</td>
      <td class="cell-center">${it.qty}</td>
      <td class="cell-num">${formatCurrency(it.salePrice)}</td>
      <td class="cell-num">${formatCurrency(it.discount || 0)}</td>
      <td class="cell-num"><strong>${formatCurrency(it.itemTotal)}</strong></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="invoice-sheet">
      <div class="inv-header">
        <div class="inv-store-info">
          ${logoHtml}
          <h2>${settings.storeName || 'SHER MEDICAL STORE'}</h2>
          <p>${settings.address || 'Medical Plaza, Pharmacy Road'}</p>
          <p>Phone: ${settings.phone} | WhatsApp: ${settings.whatsapp}</p>
        </div>
        <div class="inv-meta">
          <h3>INVOICE</h3>
          <p><strong>Invoice #:</strong> ${sale.invoiceNo}</p>
          <p><strong>Date:</strong> ${formatDateTime(sale.date)}</p>
          <p><strong>Payment:</strong> ${sale.paymentMethod || 'Cash'}</p>
        </div>
      </div>

      <div class="inv-customer-box">
        <div>
          <strong>Billed To:</strong> ${sale.customerName || 'Walk-in Customer'}
          ${sale.customerPhone ? ` · Tel: ${sale.customerPhone}` : ''}
        </div>
        <div>
          <strong>Status:</strong> ${sale.balanceAmount > 0 ? 'PARTIAL / CREDIT' : 'PAID'}
        </div>
      </div>

      <table class="inv-table">
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Batch</th>
            <th class="cell-center">Qty</th>
            <th class="cell-num">Price</th>
            <th class="cell-num">Discount</th>
            <th class="cell-num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="inv-totals-box">
        <div class="inv-total-row">
          <span>Subtotal:</span>
          <span class="font-mono">${formatCurrency(sale.subtotal)}</span>
        </div>
        ${sale.overallDiscount > 0 ? `
          <div class="inv-total-row">
            <span>Discount:</span>
            <span class="font-mono">-${formatCurrency(sale.overallDiscount)}</span>
          </div>
        ` : ''}
        <div class="inv-total-row grand">
          <span>Grand Total:</span>
          <span class="font-mono">${formatCurrency(sale.grandTotal)}</span>
        </div>
        <div class="inv-total-row">
          <span>Amount Paid:</span>
          <span class="font-mono">${formatCurrency(sale.paidAmount)}</span>
        </div>
        <div class="inv-total-row">
          <span>Balance Due:</span>
          <span class="font-mono" style="font-weight: 700; color: ${sale.balanceAmount > 0 ? '#b91c1c' : '#15803d'}">
            ${formatCurrency(sale.balanceAmount)}
          </span>
        </div>
      </div>

      <div class="inv-footer">
        <p>Thank you for choosing ${settings.storeName}!</p>
        <p>Please check medicines before leaving. Medicines returnable within 3 days with bill in original seal.</p>
      </div>
    </div>
  `;

  container.classList.remove('hidden');
  window.print();
  setTimeout(() => container.classList.add('hidden'), 1000);
}
