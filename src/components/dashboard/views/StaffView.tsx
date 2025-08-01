'use client';

import { Users, Plus, Mail, Shield } from 'lucide-react';

export default function StaffView() {
  const staffMembers = [
    { id: 1, name: 'John Doe', email: 'john@batterydept.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@batterydept.com', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Mike Wilson', email: 'mike@batterydept.com', role: 'Support', status: 'Active' },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Staff Accounts</h2>
          <p className="text-secondary">Manage team members and permissions</p>
        </div>
        <button className="claude-button claude-button-primary">
          <Plus size={16} className="mr-2" />
          Add Member
        </button>
      </div>

      <div className="claude-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e5e5]">
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((member) => (
                <tr key={member.id} className="border-b border-[#e5e5e5] last:border-0">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#6b46c1] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-secondary" />
                      {member.email}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-[#6b46c1]" />
                      <span className="text-sm">{member.role}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="text-sm text-[#6b46c1] hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}