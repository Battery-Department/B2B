'use client';

import { 
  BarChart,
  MessageSquare, 
  CreditCard, 
  Settings, 
  Users, 
  FileText,
  Package,
  FileSignature,
  Palette,
  Home,
  Bot,
  CheckCircle
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: BarChart },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'staff', label: 'Staff Accounts', icon: Users },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileSignature },
  { id: 'lithi', label: 'Lithi AI', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <div className="dashboard-sidebar energy-sidebar">
      <div className="energy-flow"></div>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo energy-glow">
            <span className="energy-icon">⚡</span>
          </div>
          <div>
            <h1 className="sidebar-title">Battery Dept</h1>
            <p className="sidebar-subtitle">Enterprise Portal</p>
          </div>
        </div>
        <div className="system-status real-time-energy-status">
          <div className="pulse green"></div>
          <span className="status-text">System Online</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`nav-item energy-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon">
                <Icon size={18} />
              </div>
              <span>{item.label}</span>
              <div className="energy-indicator"></div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar energy-glow">BD</div>
          <div className="user-details">
            <p className="user-name">Battery Dept</p>
            <p className="user-email">admin@batterydept.com</p>
          </div>
        </div>
        <div className="subscription-info">
          <div className="subscription-badge energy-badge">Pro Plan Active</div>
          <div className="subscription-details">Enhanced features enabled</div>
          <div className="energy-progress-bar">
            <div className="energy-fill" style={{ width: '75%' }}></div>
          </div>
          <div className="subscription-details mt-1">75% usage</div>
        </div>
      </div>
    </div>
  );
}