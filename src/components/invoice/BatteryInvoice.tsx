import React from 'react';
import { FileText, Zap, Calendar, CheckCircle, Download, Printer } from 'lucide-react';

const BatteryInvoice = () => {
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + 30);
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const lineItems = [
    { id: 1, description: "FlexVolt 6Ah Battery", quantity: 4, unitPrice: 76, originalPrice: 169, savings: "55%" },
    { id: 2, description: "FlexVolt 9Ah Battery", quantity: 3, unitPrice: 100, originalPrice: 249, savings: "60%" },
    { id: 3, description: "FlexVolt 15Ah Battery", quantity: 27, unitPrice: 196, originalPrice: 379, savings: "48%" }
  ];
  
  // Calculate totals
  const calculateSubtotal = () => {
    return lineItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };
  
  const subtotal = calculateSubtotal();
  const discount = subtotal * 0.20; // 20% discount
  const total = subtotal - discount;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Battery Department LLC</h1>
              <p className="text-sm text-gray-500">Professional Power Solutions</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>1250 Industrial Parkway</p>
            <p>Chicago, IL 60642</p>
            <p>support@batterydepartment.com</p>
            <p>(312) 555-7890</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-1">INVOICE</h2>
            <p className="text-gray-600 mb-3">#INV-2025-2864</p>
            <div className="flex items-center justify-end text-sm mt-2">
              <Calendar size={16} className="text-blue-600 mr-1" />
              <span className="text-gray-600">
                <span className="font-semibold">Date:</span> {formatDate(today)}
              </span>
            </div>
            <div className="flex items-center justify-end text-sm mt-1">
              <Calendar size={16} className="text-blue-600 mr-1" />
              <span className="text-gray-600">
                <span className="font-semibold">Due:</span> {formatDate(dueDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Info */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase">Bill To:</h3>
        <p className="text-gray-800 font-medium">Construction Partners Inc.</p>
        <p className="text-gray-600">Attn: Site Manager</p>
        <p className="text-gray-600">4570 Construction Way</p>
        <p className="text-gray-600">Denver, CO 80223</p>
      </div>
      
      {/* Order Summary */}
      <div className="mb-2 flex items-center">
        <FileText size={18} className="text-blue-600 mr-2" />
        <h3 className="text-lg font-bold text-gray-800">Order Summary</h3>
      </div>
      
      <div className="bg-blue-50 px-4 py-2 rounded-t-lg flex items-center mb-1">
        <CheckCircle size={16} className="text-green-600 mr-1" />
        <span className="text-blue-800 text-sm font-medium">JOBSITE SAVINGS: 20% OFF BULK ORDERS</span>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Item Description</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Qty</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Unit Price</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Original</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Savings</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-4 px-4 text-gray-800">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-xs text-green-600 mt-1">Compatible with all DeWalt 20V/60V tools</div>
                </td>
                <td className="py-4 px-4 text-center text-gray-800">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-gray-800">${item.unitPrice.toFixed(2)}</td>
                <td className="py-4 px-4 text-right text-gray-500">${item.originalPrice.toFixed(2)}</td>
                <td className="py-4 px-4 text-right text-green-600 font-medium">Save {item.savings}</td>
                <td className="py-4 px-4 text-right font-medium text-gray-800">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-full md:w-1/2 lg:w-2/5">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-green-600">
              <span className="font-medium">Bulk Order Discount (20%):</span>
              <span className="font-medium">-${discount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold">
              <span className="text-gray-800">Total:</span>
              <span className="text-lg text-blue-600">${total.toFixed(2)}</span>
            </div>
            <div className="mt-3 text-xs text-gray-600 italic text-center">
              Maximum discount applied - Thank you for your business!
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms & Warranty */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Payment Terms</h4>
          <p className="text-sm text-gray-600 mb-1">Payment due within 30 days</p>
          <p className="text-sm text-gray-600 mb-1">Make checks payable to: Battery Department LLC</p>
          <p className="text-sm text-gray-600">For wire transfers, please contact accounting</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Warranty Information</h4>
          <p className="text-sm text-gray-600 mb-1">
            <span className="text-green-600 font-medium">ZERO-HASSLE REPLACEMENTS - NO QUESTIONS ASKED</span>
          </p>
          <p className="text-sm text-gray-600">All products include 12-month warranty from date of purchase</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
          <Printer size={18} className="mr-2" />
          Print Invoice
        </button>
        <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 transition-colors">
          <Download size={18} className="mr-2" />
          Download PDF
        </button>
      </div>
      
      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>Questions? Contact our support team at support@batterydepartment.com or call (312) 555-7890</p>
        <p className="mt-1">Battery Department LLC | Professional Portable Power Solutions | www.batterydepartment.com</p>
      </div>
    </div>
  );
};

export default BatteryInvoice;