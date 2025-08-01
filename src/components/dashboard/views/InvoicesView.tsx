'use client';

import { CheckCircle, Clock, XCircle } from 'lucide-react';

export default function InvoicesView() {
  return (
    <div>
      <div className="page-header-minimal">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-secondary">Friday, May 16, 2025</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <div className="stat-logo">BD</div>
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-symbol">$</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-value">$466,500</div>
            <div className="stat-subtext">4 invoices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <CheckCircle className="stat-icon text-success" size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Paid</span>
            </div>
            <div className="stat-value">$125,000</div>
            <div className="stat-subtext">1 invoices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Clock className="stat-icon text-warning" size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-value">$185,500</div>
            <div className="stat-subtext">2 invoices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <XCircle className="stat-icon text-error" size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-label">Overdue</span>
            </div>
            <div className="stat-value">$156,000</div>
            <div className="stat-subtext">1 invoices</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-header-minimal {
          margin-bottom: 2rem;
        }

        .page-header-minimal h1 {
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }

        .page-header-minimal p {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .stat-icon-wrapper {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: 8px;
          flex-shrink: 0;
        }

        .stat-logo {
          font-weight: bold;
          font-size: 16px;
          color: var(--text-primary);
        }

        .stat-icon {
          color: var(--text-secondary);
        }

        .stat-icon.text-success {
          color: var(--color-success);
        }

        .stat-icon.text-warning {
          color: var(--color-warning);
        }

        .stat-icon.text-error {
          color: var(--color-error);
        }

        .stat-content {
          flex: 1;
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .stat-symbol {
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .stat-subtext {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}