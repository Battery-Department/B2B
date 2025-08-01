'use client';

import { CreditCard, DollarSign, Calendar, Check } from 'lucide-react';

export default function BillingView() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Billing & Payments</h2>
        <p className="text-secondary">Manage subscriptions and payment methods</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="claude-card">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-[#6b46c1]" size={20} />
            <span className="text-sm text-secondary">Current Plan</span>
          </div>
          <p className="text-2xl font-semibold">Pro Plan</p>
          <p className="text-sm text-secondary">$199/month</p>
        </div>

        <div className="claude-card">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-[#6b46c1]" size={20} />
            <span className="text-sm text-secondary">Billing Cycle</span>
          </div>
          <p className="text-2xl font-semibold">Monthly</p>
          <p className="text-sm text-secondary">Next: Feb 1, 2024</p>
        </div>

        <div className="claude-card">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="text-[#6b46c1]" size={20} />
            <span className="text-sm text-secondary">Payment Method</span>
          </div>
          <p className="text-lg font-semibold">•••• 4242</p>
          <p className="text-sm text-secondary">Visa</p>
        </div>
      </div>

      <div className="claude-card">
        <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0">
              <div>
                <p className="font-medium">Invoice #{1000 + i}</p>
                <p className="text-sm text-secondary">January {i}, 2024</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check size={16} />
                  Paid
                </span>
                <button className="claude-button claude-button-secondary py-1 px-3">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}