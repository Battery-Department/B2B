'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Filter, Search, Plus, RefreshCw } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastUpdated: Date;
  reorderPoint: number;
  trend: 'up' | 'down' | 'stable';
}

export default function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Simulate loading inventory data
    setTimeout(() => {
      setItems([
        {
          id: '1',
          name: 'Tesla Model 3 Battery Pack',
          sku: 'TM3-BP-001',
          quantity: 45,
          location: 'Warehouse A',
          status: 'in-stock',
          lastUpdated: new Date(),
          reorderPoint: 20,
          trend: 'stable'
        },
        {
          id: '2',
          name: 'BMW i3 Battery Module',
          sku: 'BMWi3-BM-002',
          quantity: 12,
          location: 'Warehouse B',
          status: 'low-stock',
          lastUpdated: new Date(),
          reorderPoint: 15,
          trend: 'down'
        },
        {
          id: '3',
          name: 'Nissan Leaf Battery Cell',
          sku: 'NL-BC-003',
          quantity: 0,
          location: 'Warehouse A',
          status: 'out-of-stock',
          lastUpdated: new Date(),
          reorderPoint: 50,
          trend: 'down'
        },
        {
          id: '4',
          name: 'Chevy Bolt Battery Pack',
          sku: 'CB-BP-004',
          quantity: 67,
          location: 'Warehouse C',
          status: 'in-stock',
          lastUpdated: new Date(),
          reorderPoint: 30,
          trend: 'up'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="skeleton h-96 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-blue-500" size={24} />
            <span className="text-2xl font-bold">124</span>
          </div>
          <p className="text-sm text-secondary">Total Items</p>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            <span className="text-2xl font-bold">89</span>
          </div>
          <p className="text-sm text-secondary">In Stock</p>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-yellow-500" size={24} />
            <span className="text-2xl font-bold">23</span>
          </div>
          <p className="text-sm text-secondary">Low Stock</p>
        </div>
        <div className="card-glass p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            <span className="text-2xl font-bold">12</span>
          </div>
          <p className="text-sm text-secondary">Out of Stock</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-glass p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-modern"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <button className="button-primary flex items-center gap-2">
              <Plus size={20} />
              Add Item
            </button>
            <button className="icon-button">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card-layer overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Trend</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Package className="text-white" size={16} />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-secondary">Reorder at {item.reorderPoint}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-sm">{item.sku}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.quantity}</span>
                      {item.quantity <= item.reorderPoint && (
                        <AlertTriangle className="text-yellow-500" size={14} />
                      )}
                    </div>
                  </td>
                  <td>{item.location}</td>
                  <td>
                    <span className={`badge ${getStatusColor(item.status)}`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {item.trend === 'up' && <TrendingUp className="text-green-500" size={16} />}
                      {item.trend === 'down' && <TrendingDown className="text-red-500" size={16} />}
                      {item.trend === 'stable' && <span className="text-gray-400">—</span>}
                      <span className="text-sm capitalize">{item.trend}</span>
                    </div>
                  </td>
                  <td className="text-sm text-secondary">
                    {item.lastUpdated.toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-sm text-blue-500 hover:underline">Edit</button>
                      <button className="text-sm text-red-500 hover:underline">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Suggestions */}
      <div className="card-glass">
        <h3 className="text-lg font-semibold mb-4">Reorder Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.filter(item => item.quantity <= item.reorderPoint).map((item) => (
            <div key={item.id} className="card-base p-4 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-secondary">{item.sku}</p>
                  </div>
                </div>
                <button className="button-primary text-sm">Reorder</button>
              </div>
              <div className="text-sm text-secondary">
                Current: {item.quantity} | Reorder Point: {item.reorderPoint}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}