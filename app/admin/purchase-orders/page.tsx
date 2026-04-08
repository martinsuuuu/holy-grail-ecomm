'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Truck, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  supplier: string;
  status: string;
  totalCost: number;
  createdAt: string;
  receivedAt: string | null;
  items: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    product: { id: string; name: string; stock: number };
  }>;
}

export default function AdminPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiving, setIsReceiving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/purchase-orders')
      .then(res => res.json())
      .then(data => { setPurchaseOrders(data); setIsLoading(false); });
  }, []);

  const handleReceive = async (id: string) => {
    if (!confirm('Mark this purchase order as received? This will update inventory.')) return;
    setIsReceiving(id);
    const res = await fetch(`/api/admin/purchase-orders/${id}/receive`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setPurchaseOrders(prev => prev.map(po => po.id === id ? updated : po));
    }
    setIsReceiving(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage supplier orders and inventory restocking</p>
        </div>
        <Link href="/admin/purchase-orders/new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">PO #</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date Ordered</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date Received</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Cost</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <Truck className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-3">No purchase orders yet</p>
                  <Link href="/admin/purchase-orders/new" className="btn-primary text-sm">
                    Create Purchase Order
                  </Link>
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <>
                  <tr
                    key={po.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === po.id ? null : po.id)}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      #{po.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900">{po.supplier}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(po.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {po.receivedAt ? formatDate(po.receivedAt) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(po.totalCost)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {po.status === 'RECEIVED' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" /> Received
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReceive(po.id); }}
                          disabled={isReceiving === po.id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-60"
                        >
                          <Clock className="h-3 w-3" />
                          {isReceiving === po.id ? 'Processing…' : 'Mark Received'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-400">
                      {expanded === po.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </td>
                  </tr>
                  {expanded === po.id && (
                    <tr key={`${po.id}-items`}>
                      <td colSpan={7} className="px-6 pb-4 bg-gray-50">
                        <table className="w-full text-sm mt-1">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-xs font-medium text-gray-500">Product</th>
                              <th className="text-right py-2 text-xs font-medium text-gray-500">Qty</th>
                              <th className="text-right py-2 text-xs font-medium text-gray-500">Unit Cost</th>
                              <th className="text-right py-2 text-xs font-medium text-gray-500">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {po.items.map(item => (
                              <tr key={item.id}>
                                <td className="py-2 text-gray-800">{item.product.name}</td>
                                <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                                <td className="py-2 text-right text-gray-600">{formatCurrency(item.unitCost)}</td>
                                <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.quantity * item.unitCost)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-gray-200">
                              <td colSpan={3} className="py-2 text-right font-semibold text-gray-700 text-xs">Total:</td>
                              <td className="py-2 text-right font-bold text-indigo-600">{formatCurrency(po.totalCost)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
