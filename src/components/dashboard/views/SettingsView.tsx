'use client';

import { Settings, User, Bell, Shield, Key } from 'lucide-react';

export default function SettingsView() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Settings</h2>
        <p className="text-secondary">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        <div className="claude-card">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-[#6b46c1]" size={20} />
            <h3 className="text-lg font-semibold">Profile Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b46c1]"
                defaultValue="Battery Department Inc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b46c1]"
                defaultValue="admin@batterydept.com"
              />
            </div>
          </div>
        </div>

        <div className="claude-card">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-[#6b46c1]" size={20} />
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-[#6b46c1]" defaultChecked />
              <span className="text-sm">Email notifications for new messages</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-[#6b46c1]" defaultChecked />
              <span className="text-sm">Weekly usage reports</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 text-[#6b46c1]" />
              <span className="text-sm">Marketing communications</span>
            </label>
          </div>
        </div>

        <div className="claude-card">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-[#6b46c1]" size={20} />
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 border border-[#e5e5e5] rounded-md hover:bg-[#f7f7f7] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key size={16} />
                  <span className="text-sm font-medium">Change Password</span>
                </div>
                <span className="text-sm text-secondary">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}