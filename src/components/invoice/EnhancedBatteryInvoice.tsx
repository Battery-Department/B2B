import React from 'react';
import { FileText, Zap, Calendar, CheckCircle, Download, Printer, CreditCard } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  retailPrice: number;
  customization?: {
    line1?: string;
    line2?: string;
  };
  previewImage?: string;
}

interface InvoiceCustomer {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

interface InvoiceProps {
  invoiceNumber: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  subtotal: number;
  depositAmount: number;
  createdAt?: string;
  dueDate?: string;
  onPayDeposit?: () => void;
}

const EnhancedBatteryInvoice: React.FC<InvoiceProps> = ({
  invoiceNumber,
  customer,
  items,
  subtotal,
  depositAmount,
  createdAt,
  dueDate,
  onPayDeposit
}) => {
  const today = createdAt ? new Date(createdAt) : new Date();
  const due = dueDate ? new Date(dueDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const balanceDue = subtotal - depositAmount;
  
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
            <p>160 Harrison Ave</p>
            <p>Boston, MA 02118</p>
            <p>support@batterydepartment.com</p>
            <p>(617) 555-7890</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-1">INVOICE</h2>
            <p className="text-gray-600 mb-3">#{invoiceNumber}</p>
            <div className="flex items-center justify-end text-sm mt-2">
              <Calendar size={16} className="text-blue-600 mr-1" />
              <span className="text-gray-600">
                <span className="font-semibold">Date:</span> {formatDate(today)}
              </span>
            </div>
            <div className="flex items-center justify-end text-sm mt-1">
              <Calendar size={16} className="text-blue-600 mr-1" />
              <span className="text-gray-600">
                <span className="font-semibold">Due:</span> {formatDate(due)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Info */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase">Bill To:</h3>
        <p className="text-gray-800 font-medium">{customer.name}</p>
        <p className="text-gray-600">{customer.email}</p>
        <p className="text-gray-600">{customer.phone}</p>
        {customer.address && <p className="text-gray-600">{customer.address}</p>}
      </div>
      
      {/* Order Summary */}
      <div className="mb-2 flex items-center">
        <FileText size={18} className="text-blue-600 mr-2" />
        <h3 className="text-lg font-bold text-gray-800">Order Summary</h3>
      </div>
      
      <div className="bg-blue-50 px-4 py-2 rounded-t-lg flex items-center mb-1">
        <CheckCircle size={16} className="text-green-600 mr-1" />
        <span className="text-blue-800 text-sm font-medium">10% DEPOSIT SYSTEM - PAY NOW, BALANCE ON DELIVERY</span>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Item Description</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Preview</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Qty</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Retail Price</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">10% Deposit</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-4 px-4 text-gray-800">
                  <div className="font-medium">{item.description}</div>
                  {item.customization && (
                    <div className="text-xs text-gray-600 mt-1">
                      {item.customization.line1 && <div>Line 1: {item.customization.line1}</div>}
                      {item.customization.line2 && <div>Line 2: {item.customization.line2}</div>}
                    </div>
                  )}
                  <div className="text-xs text-green-600 mt-1">Custom laser engraving included</div>
                </td>
                <td className="py-4 px-4 text-center">
                  {item.previewImage ? (
                    <img 
                      src={item.previewImage} 
                      alt="Battery Preview"
                      className="w-16 h-12 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center mx-auto">
                      <Zap size={20} className="text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-center text-gray-800">{item.quantity}</td>
                <td className="py-4 px-4 text-right text-gray-800">${item.retailPrice.toFixed(2)}</td>
                <td className="py-4 px-4 text-right text-gray-800">${item.unitPrice.toFixed(2)}</td>
                <td className="py-4 px-4 text-right font-medium text-gray-800">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </td>
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
              <span className="text-gray-600">Retail Subtotal:</span>
              <span className="text-gray-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-green-600 font-medium">
              <span>10% Deposit Due Now:</span>
              <span>${depositAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
              <span className="text-gray-600">Balance Due on Delivery:</span>
              <span className="text-gray-800">${balanceDue.toFixed(2)}</span>
            </div>
            <div className="mt-3 text-xs text-gray-600 italic text-center">
              30-day production lead time after deposit received
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Button */}
      {onPayDeposit && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onPayDeposit}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition-colors font-medium"
          >
            <CreditCard size={20} className="mr-2" />
            Pay 10% Deposit Now (${depositAmount.toFixed(2)})
          </button>
        </div>
      )}
      
      {/* Terms & Warranty */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Payment Terms</h4>
          <p className="text-sm text-gray-600 mb-1">10% deposit required to secure order</p>
          <p className="text-sm text-gray-600 mb-1">Balance due upon delivery (NET 30)</p>
          <p className="text-sm text-gray-600">Made in USA - Boston manufacturing</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Production & Warranty</h4>
          <p className="text-sm text-gray-600 mb-1">
            <span className="text-green-600 font-medium">30-DAY PRODUCTION TIMELINE</span>
          </p>
          <p className="text-sm text-gray-600">12-month warranty on all batteries</p>
          <p className="text-sm text-gray-600">Free replacement for defects</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        <button className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 transition-colors">
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
        <p>Questions? Contact our support team at support@batterydepartment.com or call (617) 555-7890</p>
        <p className="mt-1">Battery Department LLC | Professional Portable Power Solutions | www.batterydepartment.com</p>
      </div>
    </div>
  );
};

export default EnhancedBatteryInvoice;