'use client';

import { FileText, Download, Calendar, TrendingUp, Users, MessageSquare } from 'lucide-react';

export default function ReportsView() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Reports & Analytics</h2>
        <p className="text-secondary">View business insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="claude-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-[#6b46c1]" size={20} />
              <span className="text-sm text-secondary">Total Messages</span>
            </div>
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-semibold">12,456</p>
          <p className="text-sm text-green-500">+12% from last month</p>
        </div>

        <div className="claude-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="text-[#6b46c1]" size={20} />
              <span className="text-sm text-secondary">Active Users</span>
            </div>
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-semibold">3,247</p>
          <p className="text-sm text-green-500">+8% from last month</p>
        </div>

        <div className="claude-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-[#6b46c1]" size={20} />
              <span className="text-sm text-secondary">Conversion Rate</span>
            </div>
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-semibold">24.5%</p>
          <p className="text-sm text-green-500">+3% from last month</p>
        </div>
      </div>

      <div className="claude-card">
        <h3 className="text-lg font-semibold mb-4">Available Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'Monthly Usage Report', period: 'January 2024' },
            { name: 'Customer Analytics', period: 'Q4 2023' },
            { name: 'Revenue Summary', period: 'Year 2023' },
            { name: 'Support Tickets Analysis', period: 'January 2024' },
          ].map((report, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-0">
              <div className="flex items-center gap-3">
                <FileText className="text-secondary" size={20} />
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-secondary">{report.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="claude-button claude-button-secondary py-1 px-3">
                  View
                </button>
                <button className="p-2 hover:bg-[#f7f7f7] rounded-md transition-colors">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}