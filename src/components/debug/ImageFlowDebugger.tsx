'use client'

import React, { useEffect, useState } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'

export default function ImageFlowDebugger() {
  const { previewImage } = useEngravingStore()
  const [cartData, setCartData] = useState<any>(null)
  const [orderData, setOrderData] = useState<any>(null)
  const [isDevelopment, setIsDevelopment] = useState(false)

  useEffect(() => {
    // Only show in development
    setIsDevelopment(process.env.NODE_ENV === 'development')
    
    if (process.env.NODE_ENV === 'development') {
      // Check cart data
      const cart = localStorage.getItem('batteryCart')
      if (cart) {
        setCartData(JSON.parse(cart))
      }

      // Check order data
      const order = sessionStorage.getItem('orderData')
      if (order) {
        setOrderData(JSON.parse(order))
      }
    }
  }, [previewImage])

  if (!isDevelopment) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-500 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-purple-700 mb-2">🔍 Image Flow Debugger</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold">Engraving Store Preview:</span>
          <div className="flex items-center gap-2 mt-1">
            {previewImage ? (
              <>
                <span className="text-green-600">✓ Available</span>
                <img 
                  src={previewImage} 
                  alt="Store preview" 
                  className="w-16 h-16 object-contain border rounded"
                />
              </>
            ) : (
              <span className="text-red-600">✗ Not captured</span>
            )}
          </div>
        </div>

        <div>
          <span className="font-semibold">Cart Items with Preview:</span>
          <div className="mt-1">
            {cartData?.items?.filter((item: any) => item.customization?.previewImage).length || 0} items
          </div>
        </div>

        <div>
          <span className="font-semibold">Order Data Preview:</span>
          <div className="flex items-center gap-2 mt-1">
            {orderData?.previewImage ? (
              <>
                <span className="text-green-600">✓ Available</span>
                <img 
                  src={orderData.previewImage} 
                  alt="Order preview" 
                  className="w-16 h-16 object-contain border rounded"
                />
              </>
            ) : (
              <span className="text-amber-600">⚠ Check items</span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <button
            onClick={() => {
              console.log('Debug Info:', {
                previewImage: previewImage?.substring(0, 100) + '...',
                cartData,
                orderData
              })
            }}
            className="text-purple-600 hover:text-purple-700 text-xs underline"
          >
            Log to Console
          </button>
        </div>
      </div>
    </div>
  )
}