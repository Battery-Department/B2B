'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import OverviewView from './views/OverviewView';
import MessagesView from './views/MessagesView';
import BillingView from './views/BillingView';
import InventoryView from './views/InventoryView';
import SettingsView from './views/SettingsView';
import StaffView from './views/StaffView';
import ReportsView from './views/ReportsView';
import LithiView from './views/LithiView';
import InvoicesView from './views/InvoicesView';

export default function Dashboard() {
  const [activeView, setActiveView] = useState('invoices');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView />;
      case 'messages':
        return <MessagesView />;
      case 'billing':
        return <BillingView />;
      case 'inventory':
        return <InventoryView />;
      case 'settings':
        return <SettingsView />;
      case 'staff':
        return <StaffView />;
      case 'reports':
        return <ReportsView />;
      case 'lithi':
        return <LithiView />;
      case 'invoices':
        return <InvoicesView />;
      default:
        return <InvoicesView />;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="energy-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container energy-ambient-bg">
      <div className="energy-grid"></div>
      <div className="energy-particles">
        <div className="particle" style={{ animationDelay: '0s' }}></div>
        <div className="particle" style={{ animationDelay: '1s' }}></div>
        <div className="particle" style={{ animationDelay: '2s' }}></div>
        <div className="particle" style={{ animationDelay: '3s' }}></div>
        <div className="particle" style={{ animationDelay: '4s' }}></div>
      </div>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="dashboard-main">
        <div className="page-content energy-transition">
          {renderView()}
        </div>
      </main>
    </div>
  );
}