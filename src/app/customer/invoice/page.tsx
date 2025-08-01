'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Zap, Calendar, CheckCircle, Download, Printer, ArrowLeft, CreditCard } from 'lucide-react';
import EnhancedBatteryInvoice from '@/components/invoice/EnhancedBatteryInvoice';

// Force dynamic rendering with no cache
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Print CSS
const printStyles = `
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    
    /* Hide mobile header and action buttons for print */
    .no-print {
      display: none !important;
    }
    
    /* Ensure proper page breaks */
    .page-break-inside-avoid {
      page-break-inside: avoid;
    }
    
    /* Remove shadows and borders for cleaner print */
    .print-clean {
      box-shadow: none !important;
      border: 1px solid #e0e0e0 !important;
    }
  }
`;

export default function InvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Get invoice data from sessionStorage
    const storedInvoice = sessionStorage.getItem('currentInvoice');
    if (storedInvoice) {
      setInvoiceData(JSON.parse(storedInvoice));
    } else {
      // Fallback to old invoice data format
      const oldInvoiceData = sessionStorage.getItem('invoiceData');
      if (oldInvoiceData) {
        const data = JSON.parse(oldInvoiceData);
        // Convert to new format
        setInvoiceData({
          invoiceNumber: searchParams.get('id') || `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          customer: {
            name: 'Construction Partners Inc.',
            email: 'orders@constructionpartners.com',
            phone: '(555) 123-4567',
            address: '4570 Construction Way, Denver, CO 80223'
          },
          items: data.items,
          subtotal: data.subtotal,
          depositAmount: data.total * 0.1,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [searchParams]);

  if (!mounted || !invoiceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const handlePayDeposit = () => {
    // Navigate to Stripe checkout
    router.push(`/api/stripe/checkout?invoice=${invoiceData.invoiceNumber}&amount=${invoiceData.depositAmount}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      {/* Mobile Header */}
      {isMobile && (
        <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h3 className="text-lg font-bold text-gray-900">Invoice</h3>
          <div className="w-16"></div>
        </div>
      )}
      
      <div className="px-4 py-8 md:px-8 max-w-5xl mx-auto">
        <EnhancedBatteryInvoice
          invoiceNumber={invoiceData.invoiceNumber}
          customer={invoiceData.customer}
          items={invoiceData.items}
          subtotal={invoiceData.subtotal}
          depositAmount={invoiceData.depositAmount}
          createdAt={invoiceData.createdAt}
          dueDate={invoiceData.dueDate}
          onPayDeposit={handlePayDeposit}
        />
      </div>
    </div>
  );
}