import React, { useState, useMemo } from 'react';
import { 
  MapPin, Clock, Users, Wrench, Calculator, TrendingUp, 
  AlertTriangle, CheckCircle, Info, Calendar, Truck
} from 'lucide-react';

interface JobSite {
  id: string;
  name: string;
  location: string;
  duration: number; // days
  workers: number;
  startDate: string;
  tools: string[];
  priority: 'low' | 'medium' | 'high';
}

interface JobSitePlannerProps {
  onPlanGenerated: (plan: any) => void;
}

const JobSitePlanner: React.FC<JobSitePlannerProps> = ({ onPlanGenerated }) => {
  const [jobSites, setJobSites] = useState<JobSite[]>([
    {
      id: '1',
      name: 'Downtown Office Complex',
      location: 'Seattle, WA',
      duration: 14,
      workers: 8,
      startDate: '2025-02-01',
      tools: ['drill', 'impactDriver', 'circularSaw'],
      priority: 'high'
    },
    {
      id: '2', 
      name: 'Residential Development',
      location: 'Bellevue, WA',
      duration: 21,
      workers: 12,
      startDate: '2025-02-15',
      tools: ['drill', 'impactDriver', 'recipSaw'],
      priority: 'medium'
    }
  ]);

  const [selectedSites, setSelectedSites] = useState<string[]>(['1']);

  const batteryPlan = useMemo(() => {
    const selectedJobSites = jobSites.filter(site => selectedSites.includes(site.id));
    
    let totalBatteriesNeeded = 0;
    let totalChargers = 0;
    let totalCost = 0;

    const siteDetails = selectedJobSites.map(site => {
      // Calculate batteries needed per site
      const batteriesPerWorker = 1.5; // Industry standard
      const bufferMultiplier = site.priority === 'high' ? 1.3 : site.priority === 'medium' ? 1.2 : 1.1;
      const siteBatteries = Math.ceil(site.workers * batteriesPerWorker * bufferMultiplier);
      const siteChargers = Math.ceil(siteBatteries / 3);
      const siteCost = siteBatteries * 125 + siteChargers * 89; // Assuming 9Ah batteries + chargers

      totalBatteriesNeeded += siteBatteries;
      totalChargers += siteChargers;
      totalCost += siteCost;

      return {
        ...site,
        batteriesNeeded: siteBatteries,
        chargersNeeded: siteChargers,
        estimatedCost: siteCost,
        runtimeHours: siteBatteries * 6.5, // 9Ah battery average runtime
      };
    });

    return {
      totalBatteries: totalBatteriesNeeded,
      totalChargers,
      totalCost,
      estimatedSavings: totalCost * 0.15, // Bulk discount
      siteDetails,
      deliverySchedule: siteDetails.map(site => ({
        siteId: site.id,
        siteName: site.name,
        deliveryDate: new Date(new Date(site.startDate).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days before start
        items: `${site.batteriesNeeded} batteries, ${site.chargersNeeded} chargers`
      }))
    };
  }, [jobSites, selectedSites]);

  const handleSiteToggle = (siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const addNewSite = () => {
    const newSite: JobSite = {
      id: Date.now().toString(),
      name: 'New Job Site',
      location: 'Enter location',
      duration: 7,
      workers: 4,
      startDate: new Date().toISOString().split('T')[0],
      tools: ['drill'],
      priority: 'medium'
    };
    setJobSites(prev => [...prev, newSite]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white">Multi-Site Job Planner</h3>
        </div>
        <p className="text-indigo-100 mt-2">Plan battery deployment across multiple job sites</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Job Sites List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900">Active Job Sites</h4>
            <button
              onClick={addNewSite}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Site
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobSites.map((site) => (
              <div
                key={site.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedSites.includes(site.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSiteToggle(site.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-bold text-gray-900">{site.name}</h5>
                    <p className="text-sm text-gray-600">{site.location}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(site.priority)}`}>
                    {site.priority}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>{site.duration} days</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Users className="w-3 h-3" />
                    <span>{site.workers} workers</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(site.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Wrench className="w-3 h-3" />
                    <span>{site.tools.length} tools</span>
                  </div>
                </div>

                {selectedSites.includes(site.id) && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>Batteries needed: <span className="font-bold">{batteryPlan.siteDetails.find(s => s.id === site.id)?.batteriesNeeded}</span></div>
                      <div>Estimated cost: <span className="font-bold">${batteryPlan.siteDetails.find(s => s.id === site.id)?.estimatedCost.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Plan Summary */}
        {selectedSites.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" />
              Fleet Planning Summary
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{batteryPlan.totalBatteries}</div>
                <div className="text-sm text-gray-600">Total Batteries</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{batteryPlan.totalChargers}</div>
                <div className="text-sm text-gray-600">Chargers Needed</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">${batteryPlan.totalCost.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Investment</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">${batteryPlan.estimatedSavings.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Bulk Savings</div>
              </div>
            </div>

            {/* Delivery Schedule */}
            <div className="mb-6">
              <h5 className="font-bold text-gray-900 mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Delivery Schedule
              </h5>
              <div className="space-y-2">
                {batteryPlan.deliverySchedule.map((delivery, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">{delivery.siteName}</div>
                      <div className="text-sm text-gray-600">{delivery.items}</div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-yellow-800">Risk Assessment</h6>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• High-priority sites have 30% buffer for unexpected demands</li>
                    <li>• Weather delays could affect delivery schedule</li>
                    <li>• Consider backup charging station for sites without power</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => onPlanGenerated(batteryPlan)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Generate Fleet Order</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSitePlanner;