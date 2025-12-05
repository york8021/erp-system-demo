// frontend/lib/api.js

// 後端 API 基底網址
// 若有設定 NEXT_PUBLIC_API_BASE，就用環境變數；否則預設指向 localhost:8000
const BASE =
    (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000") + "/api/v1";

// 共用 request 包裝
async function request(path, { method = "GET", token, body } = {}) {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let msg = `Request failed: ${res.status}`;
        try {
            const data = await res.json();
            if (data && data.detail) {
                msg = Array.isArray(data.detail)
                    ? data.detail.map((d) => d.msg || d).join(", ")
                    : data.detail;
            }
        } catch (_) {
            // ignore parse error, keep default msg
        }
        throw new Error(msg);
    }

    if (res.status === 204) return null;

    return res.json();
}

/* ==========================
 *  Auth
 * ========================== */

export function apiLogin(email, password) {
    return request("/auth/login", {
        method: "POST",
        body: { email, password },
    });
}

export function apiGetMe(token) {
    return request("/users/me", { token });
}

/* ==========================
 *  Users (Admin)
 * ========================== */

export function apiListUsers(token) {
    return request("/users", { token });
}

export function apiCreateUser(token, data) {
    // data: { email, full_name, role, password, is_active }
    return request("/users", {
        method: "POST",
        token,
        body: data,
    });
}

/* ==========================
 *  Master Data
 * ========================== */

// Items
export function apiListItems(token) {
    return request("/master/items", { token });
}

export function apiCreateItem(token, data) {
    // data: { sku, name, uom, cost_method }
    return request("/master/items", {
        method: "POST",
        token,
        body: data,
    });
}

// Customers
export function apiListCustomers(token) {
    return request("/master/customers", { token });
}

export function apiCreateCustomer(token, data) {
    // data: { code, name, tax_id?, payment_term? }
    return request("/master/customers", {
        method: "POST",
        token,
        body: data,
    });
}

// Vendors
export function apiListVendors(token) {
    return request("/master/vendors", { token });
}

export function apiCreateVendor(token, data) {
    // data: { code, name, tax_id?, payment_term? }
    return request("/master/vendors", {
        method: "POST",
        token,
        body: data,
    });
}

// Warehouses
export function apiListWarehouses(token) {
    return request("/master/warehouses", { token });
}

export function apiCreateWarehouse(token, data) {
    // data: { code, name }
    return request("/master/warehouses", {
        method: "POST",
        token,
        body: data,
    });
}

/* ==========================
 *  Purchasing
 * ========================== */

// Purchase Orders
export function apiCreatePO(token, data) {
    // data: { vendor_id, lines: [{ item_id, warehouse_id, qty, unit_price }] }
    return request("/purchasing/purchase-orders", {
        method: "POST",
        token,
        body: data,
    });
}

export function apiListPO(token) {
    return request("/purchasing/purchase-orders", { token });
}

export function apiApprovePO(token, id) {
    return request(`/purchasing/purchase-orders/${id}/approve`, {
        method: "POST",
        token,
    });
}

// Goods Receipts
export function apiCreateGR(token, data) {
    // data: { po_id?, lines: [{ item_id, warehouse_id, qty, unit_cost }] }
    return request("/purchasing/goods-receipts", {
        method: "POST",
        token,
        body: data,
    });
}

export function apiListGR(token) {
    return request("/purchasing/goods-receipts", { token });
}

export function apiPostGR(token, id) {
    return request(`/purchasing/goods-receipts/${id}/post`, {
        method: "POST",
        token,
    });
}

/* ==========================
 *  Sales
 * ========================== */

// Sales Orders
export function apiCreateSO(token, data) {
    // data: { customer_id, lines: [{ item_id, warehouse_id, qty, unit_price }] }
    return request("/sales/sales-orders", {
        method: "POST",
        token,
        body: data,
    });
}

export function apiListSO(token) {
    return request("/sales/sales-orders", { token });
}

export function apiApproveSO(token, id) {
    return request(`/sales/sales-orders/${id}/approve`, {
        method: "POST",
        token,
    });
}

// Shipments
export function apiCreateShipment(token, data) {
    // data: { so_id?, lines: [{ item_id, warehouse_id, qty }] }
    return request("/sales/shipments", {
        method: "POST",
        token,
        body: data,
    });
}

export function apiListShipments(token) {
    return request("/sales/shipments", { token });
}

export function apiPostShipment(token, id) {
    return request(`/sales/shipments/${id}/post`, {
        method: "POST",
        token,
    });
}

/* ==========================
 *  Inventory
 * ========================== */

export function apiListBalances(token) {
    return request("/inventory/balances", { token });
}

export function apiListTransactions(token) {
    return request("/inventory/transactions", { token });
}
