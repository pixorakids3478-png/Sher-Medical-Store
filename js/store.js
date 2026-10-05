// SHER MEDICAL STORE - STORE & DATA PERSISTENCE
// Manages localStorage, business logic, zero-demo-data initialization

const STORAGE_KEY = 'SHER_MED_STORE_DATA_V1';

const defaultState = {
  settings: {
    storeName: 'SHER MEDICAL STORE',
    address: 'Main Commercial Market, Medical Plaza, Phase 1',
    phone: '+92 300 1234567',
    whatsapp: '+92 300 1234567',
    email: 'info@shermedical.com',
    website: 'www.shermedical.com',
    currency: 'Rs.',
    nearExpiryDays: 90,
    lowStockThreshold: 10,
    logoData: null,
    adminUser: 'admin',
    adminPass: 'admin123',
    openingCash: 0
  },
  session: {
    isLoggedIn: true,
    user: 'admin',
    role: 'Administrator'
  },
  // All tables start at 0 (No demo data)
  medicines: [],
  categories: [
    { id: 'cat-1', name: 'Tablets', desc: 'Oral solid tablets' },
    { id: 'cat-2', name: 'Syrups & Suspensions', desc: 'Oral liquids' },
    { id: 'cat-3', name: 'Injections', desc: 'Ampoules and vials' },
    { id: 'cat-4', name: 'Capsules', desc: 'Hard and soft gelatin' },
    { id: 'cat-5', name: 'Topical & Ointments', desc: 'Creams and gels' },
    { id: 'cat-6', name: 'Eye & Ear Drops', desc: 'Sterile drops' },
    { id: 'cat-7', name: 'Surgical & Devices', desc: 'Bandages, syringes, kits' }
  ],
  customers: [],
  suppliers: [],
  purchases: [],
  sales: [],
  returns: [],
  expenses: [],
  incomes: [],
  employees: [],
  salaryPayments: []
};

class StoreManager {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings || {}) } };
      }
    } catch (err) {
      console.error('Failed to load localStorage data', err);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }

  // Backup & Restore
  exportBackup() {
    const jsonStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sher_medical_store_backup_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importBackup(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON format');
      this.data = { ...defaultState, ...parsed };
      this.save();
      return true;
    } catch (err) {
      console.error('Backup restore failed:', err);
      return false;
    }
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = JSON.parse(JSON.stringify(defaultState));
    this.save();
  }

  // Helper generators
  generateId(prefix = 'item') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  generateInvoiceNumber() {
    const count = this.data.sales.length + 1;
    return `INV-${String(count).padStart(5, '0')}`;
  }

  generatePurchaseNumber() {
    const count = this.data.purchases.length + 1;
    return `PO-${String(count).padStart(5, '0')}`;
  }

  // Stock & Medicine Helpers
  getMedicine(id) {
    return this.data.medicines.find(m => m.id === id);
  }

  isNearExpiry(expiryDateStr) {
    if (!expiryDateStr) return false;
    const exp = new Date(expiryDateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= (this.data.settings.nearExpiryDays || 90);
  }

  isExpired(expiryDateStr) {
    if (!expiryDateStr) return false;
    const exp = new Date(expiryDateStr);
    const now = new Date();
    return exp < now;
  }

  isLowStock(medicine) {
    const min = Number(medicine.minStock) || Number(this.data.settings.lowStockThreshold) || 10;
    return Number(medicine.quantity) <= min && Number(medicine.quantity) > 0;
  }

  isOutOfStock(medicine) {
    return Number(medicine.quantity) <= 0;
  }

  // POS / Sale transaction logic
  recordSale(saleData) {
    // 1. Verify stock and decrement
    for (const item of saleData.items) {
      const med = this.getMedicine(item.medicineId);
      if (!med || med.quantity < item.qty) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${med ? med.quantity : 0}`);
      }
    }

    // Decrement stock
    for (const item of saleData.items) {
      const med = this.getMedicine(item.medicineId);
      med.quantity = Number(med.quantity) - Number(item.qty);
    }

    // 2. Compute item profits
    let totalProfit = 0;
    const enrichedItems = saleData.items.map(item => {
      const med = this.getMedicine(item.medicineId);
      const purchasePrice = Number(med ? med.purchasePrice : 0);
      const salePrice = Number(item.salePrice);
      const discount = Number(item.discount || 0);
      const itemTotal = (salePrice * item.qty) - discount;
      const profit = (salePrice - purchasePrice) * item.qty - discount;
      totalProfit += profit;
      return {
        ...item,
        purchasePrice,
        itemTotal,
        profit
      };
    });

    const netProfit = totalProfit - Number(saleData.overallDiscount || 0);

    const saleRecord = {
      id: this.generateId('sale'),
      invoiceNo: saleData.invoiceNo || this.generateInvoiceNumber(),
      date: saleData.date || new Date().toISOString(),
      customerId: saleData.customerId || null,
      customerName: saleData.customerName || 'Walk-in Customer',
      customerPhone: saleData.customerPhone || '',
      items: enrichedItems,
      subtotal: Number(saleData.subtotal),
      overallDiscount: Number(saleData.overallDiscount || 0),
      grandTotal: Number(saleData.grandTotal),
      paidAmount: Number(saleData.paidAmount),
      balanceAmount: Number(saleData.balanceAmount || 0),
      paymentMethod: saleData.paymentMethod || 'Cash',
      profit: netProfit,
      notes: saleData.notes || ''
    };

    this.data.sales.unshift(saleRecord);

    // If customer selected and has balance, update customer ledger
    if (saleRecord.customerId && saleRecord.balanceAmount > 0) {
      const cust = this.data.customers.find(c => c.id === saleRecord.customerId);
      if (cust) {
        cust.balance = (Number(cust.balance) || 0) + Number(saleRecord.balanceAmount);
      }
    }

    this.save();
    return saleRecord;
  }

  // Delete sale restores stock
  deleteSale(saleId) {
    const idx = this.data.sales.findIndex(s => s.id === saleId);
    if (idx === -1) return false;
    const sale = this.data.sales[idx];

    // Restore stock
    for (const item of sale.items) {
      const med = this.getMedicine(item.medicineId);
      if (med) {
        med.quantity = Number(med.quantity) + Number(item.qty);
      }
    }

    // Revert customer balance if needed
    if (sale.customerId && sale.balanceAmount > 0) {
      const cust = this.data.customers.find(c => c.id === sale.customerId);
      if (cust) {
        cust.balance = Math.max(0, (Number(cust.balance) || 0) - Number(sale.balanceAmount));
      }
    }

    this.data.sales.splice(idx, 1);
    this.save();
    return true;
  }

  // Purchases
  recordPurchase(purchaseData) {
    const med = this.getMedicine(purchaseData.medicineId);
    if (!med) throw new Error('Medicine not found');

    const qty = Number(purchaseData.quantity);
    const price = Number(purchaseData.purchasePrice);
    const total = qty * price;
    const paid = Number(purchaseData.paid || 0);
    const remaining = total - paid;

    // Increment medicine stock & update purchase price / batch / expiry
    med.quantity = (Number(med.quantity) || 0) + qty;
    if (purchaseData.purchasePrice) med.purchasePrice = price;
    if (purchaseData.salePrice) med.salePrice = Number(purchaseData.salePrice);
    if (purchaseData.batchNo) med.batchNo = purchaseData.batchNo;
    if (purchaseData.expiryDate) med.expiryDate = purchaseData.expiryDate;

    const purchaseRecord = {
      id: this.generateId('po'),
      poNumber: purchaseData.poNumber || this.generatePurchaseNumber(),
      date: purchaseData.date || new Date().toISOString(),
      supplierId: purchaseData.supplierId,
      supplierName: purchaseData.supplierName,
      medicineId: med.id,
      medicineName: med.name,
      batchNo: purchaseData.batchNo || med.batchNo,
      expiryDate: purchaseData.expiryDate || med.expiryDate,
      quantity: qty,
      purchasePrice: price,
      total,
      paid,
      remaining
    };

    this.data.purchases.unshift(purchaseRecord);

    // Update supplier balance
    if (purchaseData.supplierId && remaining > 0) {
      const supp = this.data.suppliers.find(s => s.id === purchaseData.supplierId);
      if (supp) {
        supp.balance = (Number(supp.balance) || 0) + remaining;
      }
    }

    this.save();
    return purchaseRecord;
  }

  deletePurchase(purchaseId) {
    const idx = this.data.purchases.findIndex(p => p.id === purchaseId);
    if (idx === -1) return false;
    const po = this.data.purchases[idx];

    // Decrement stock
    const med = this.getMedicine(po.medicineId);
    if (med) {
      med.quantity = Math.max(0, (Number(med.quantity) || 0) - Number(po.quantity));
    }

    // Adjust supplier balance
    if (po.supplierId && po.remaining > 0) {
      const supp = this.data.suppliers.find(s => s.id === po.supplierId);
      if (supp) {
        supp.balance = Math.max(0, (Number(supp.balance) || 0) - Number(po.remaining));
      }
    }

    this.data.purchases.splice(idx, 1);
    this.save();
    return true;
  }

  // Returns logic
  recordSaleReturn(returnData) {
    const sale = this.data.sales.find(s => s.id === returnData.saleId || s.invoiceNo === returnData.invoiceNo);
    const med = this.getMedicine(returnData.medicineId);
    const qty = Number(returnData.quantity);

    // Restore stock
    if (med) {
      med.quantity = (Number(med.quantity) || 0) + qty;
    }

    const returnRecord = {
      id: this.generateId('ret-sale'),
      type: 'Sale Return',
      invoiceNo: returnData.invoiceNo,
      saleId: returnData.saleId,
      medicineId: returnData.medicineId,
      medicineName: med ? med.name : returnData.medicineName,
      quantity: qty,
      refundAmount: Number(returnData.refundAmount),
      reason: returnData.reason || 'Customer Return',
      date: new Date().toISOString()
    };

    this.data.returns.unshift(returnRecord);
    this.save();
    return returnRecord;
  }

  recordPurchaseReturn(returnData) {
    const med = this.getMedicine(returnData.medicineId);
    const qty = Number(returnData.quantity);

    if (med) {
      med.quantity = Math.max(0, (Number(med.quantity) || 0) - qty);
    }

    const returnRecord = {
      id: this.generateId('ret-po'),
      type: 'Purchase Return',
      supplierId: returnData.supplierId,
      supplierName: returnData.supplierName,
      medicineId: returnData.medicineId,
      medicineName: med ? med.name : returnData.medicineName,
      quantity: qty,
      refundAmount: Number(returnData.refundAmount),
      reason: returnData.reason || 'Defective/Expired return to supplier',
      date: new Date().toISOString()
    };

    // Reduce supplier balance
    if (returnData.supplierId) {
      const supp = this.data.suppliers.find(s => s.id === returnData.supplierId);
      if (supp) {
        supp.balance = Math.max(0, (Number(supp.balance) || 0) - Number(returnData.refundAmount));
      }
    }

    this.data.returns.unshift(returnRecord);
    this.save();
    return returnRecord;
  }
}

export const store = new StoreManager();
