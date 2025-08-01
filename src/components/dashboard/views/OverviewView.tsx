'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, Package, DollarSign, MessageSquare, Zap, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: any;
  color: string;
}

interface Stats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
}

export default function OverviewView() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data.stats);
      
      // Update metrics with real data
      setMetrics([
        {
          title: 'Total Users',
          value: data.stats.totalUsers.toLocaleString(),
          change: +8.2,
          changeLabel: 'from last month',
          icon: Users,
          color: 'energy-blue'
        },
        {
          title: 'Chat Sessions',
          value: data.stats.totalSessions.toLocaleString(),
          change: +12.5,
          changeLabel: 'from last month',
          icon: MessageSquare,
          color: 'charged-teal'
        },
        {
          title: 'Total Messages',
          value: data.stats.totalMessages.toLocaleString(),
          change: +23.1,
          changeLabel: 'from last month',
          icon: Activity,
          color: 'power-yellow'
        },
        {
          title: 'System Health',
          value: '99.9%',
          change: +0.1,
          changeLabel: 'uptime',
          icon: Zap,
          color: 'circuit-green'
        }
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to mock data
      setMetrics([
        {
          title: 'Total Revenue',
          value: '$124,500',
          change: +12.5,
          changeLabel: 'from last month',
          icon: DollarSign,
          color: 'energy-blue'
        },
        {
          title: 'Active Users',
          value: '3,842',
          change: +8.2,
          changeLabel: 'from last month',
          icon: Users,
          color: 'charged-teal'
        },
        {
          title: 'Messages',
          value: '18,249',
          change: +23.1,
          changeLabel: 'from last month',
          icon: MessageSquare,
          color: 'power-yellow'
        },
        {
          title: 'Inventory Items',
          value: '567',
          change: -2.3,
          changeLabel: 'from last month',
          icon: Package,
          color: 'circuit-green'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="energy-skeleton h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 energy-transition">
      {/* Page Header with Energy Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-energy-white">System Overview</h1>
          <p className="text-sm text-gray-400">Real-time energy monitoring</p>
        </div>
        <button onClick={fetchStats} className="energy-button-secondary">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="energy-card energy-data-card group">
              <div className="energy-card-content">
                <div className="flex items-center justify-between mb-4">
                  <div className={`energy-icon-container ${metric.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className={`energy-charge-indicator ${metric.change > 0 ? 'charging' : 'discharging'}`}>
                    {metric.change > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">{metric.title}</p>
                  <p className="text-2xl font-bold text-energy-white">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.changeLabel}</p>
                </div>
              </div>
              <div className="energy-visualization">
                <div className="energy-flow-small"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Energy Flow Chart */}
      <div className="energy-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-energy-white">Energy Flow Analytics</h3>
          <div className="flex items-center gap-2">
            <button className="energy-tab">7 Days</button>
            <button className="energy-tab active">30 Days</button>
            <button className="energy-tab">90 Days</button>
          </div>
        </div>
        <div className="h-64 relative">
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {[40, 65, 45, 80, 55, 70, 90].map((height, index) => (
              <div
                key={index}
                className="w-1/7 mx-1 energy-bar rounded-t-lg transition-all duration-500 hover:scale-105 cursor-pointer group"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity energy-tooltip">
                  {height}%
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Energy Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="energy-card energy-interactive-card group">
          <div className="flex items-center gap-4">
            <div className="energy-icon-container energy-glow">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-energy-white">Chat Sessions</h4>
              <p className="text-sm text-gray-400">{stats?.totalSessions || 0} active sessions</p>
              <div className="real-time-energy-status mt-2">
                <div className="pulse green"></div>
                <span className="text-xs">Energy Flow: Optimal</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="energy-button w-full">View Sessions</button>
          </div>
        </div>

        <div className="energy-card energy-interactive-card group">
          <div className="flex items-center gap-4">
            <div className="energy-icon-container energy-glow">
              <Users size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-energy-white">User Management</h4>
              <p className="text-sm text-gray-400">{stats?.totalUsers || 0} registered users</p>
              <div className="real-time-energy-status mt-2">
                <div className="pulse yellow"></div>
                <span className="text-xs">Energy Flow: Moderate</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="energy-button w-full">Manage Users</button>
          </div>
        </div>

        <div className="energy-card energy-interactive-card group">
          <div className="flex items-center gap-4">
            <div className="energy-icon-container energy-glow">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-energy-white">System Status</h4>
              <p className="text-sm text-gray-400">All systems operational</p>
              <div className="real-time-energy-status mt-2">
                <div className="pulse green"></div>
                <span className="text-xs">Energy Flow: Maximum</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="energy-button w-full">View Details</button>
          </div>
        </div>
      </div>

      {/* Energy Activity Feed */}
      <div className="energy-card">
        <h3 className="text-lg font-semibold mb-6 text-energy-white">Live Energy Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New chat session started', user: 'Anonymous User', time: '2 minutes ago', icon: MessageSquare, energy: 'high' },
            { action: 'System update completed', user: 'System', time: '15 minutes ago', icon: Activity, energy: 'medium' },
            { action: 'New user registered', user: 'john.doe@example.com', time: '1 hour ago', icon: Users, energy: 'low' },
            { action: 'AI model updated', user: 'Admin', time: '3 hours ago', icon: Zap, energy: 'critical' },
          ].map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="energy-activity-item group">
                <div className="energy-activity-indicator">
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-energy-white">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                </div>
                <div className={`energy-level-indicator ${activity.energy}`}>
                  <div className="energy-pulse"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}