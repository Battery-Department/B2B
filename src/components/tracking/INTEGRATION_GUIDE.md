# Battery Tracking Modal Integration Guide

## Overview
The Battery Tracking Modal is a world-class interactive component that showcases battery protection features with an animated QR code scanning experience. It provides a three-stage journey: scanning, database access, and protection confirmation.

## Components Included

1. **BatteryTrackingModal** - Main modal component with stage management
2. **BatteryTrackingTrigger** - Animated trigger button with hover preview
3. **QRScannerAnimation** - QR code scanning animation with laser effect
4. **TrackingResultDisplay** - Phone mockup showing protection features

## Quick Integration

### 1. Import Required Files

```tsx
import { BatteryTrackingModal, BatteryTrackingTrigger } from '@/components/tracking/BatteryTrackingModal'
import '@/styles/scanner-animations.css' // Import CSS animations
```

### 2. Add State Management

```tsx
const [showTrackingModal, setShowTrackingModal] = useState(false)
```

### 3. Add the Components

```tsx
// Add the trigger button where you want it to appear
<BatteryTrackingTrigger 
  onClick={() => setShowTrackingModal(true)}
  hasCustomText={!!batteryData.line1 || !!batteryData.line2} // Pulse when user has added text
/>

// Add the modal (typically at the end of your component)
<BatteryTrackingModal 
  isOpen={showTrackingModal}
  onClose={() => setShowTrackingModal(false)}
/>
```

## Complete Integration Example

Here's how to integrate it into your existing design-with-ai page:

```tsx
'use client'

import React, { useState } from 'react'
import { BatteryTrackingModal, BatteryTrackingTrigger } from '@/components/tracking/BatteryTrackingModal'
import '@/styles/scanner-animations.css'
// ... other imports

export default function DesignWithAIPage() {
  // ... existing state
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  
  return (
    <motion.div className="min-h-screen bg-white">
      {/* ... existing content ... */}
      
      {/* Add trigger button after battery customization */}
      <div className="flex justify-center mt-6">
        <BatteryTrackingTrigger 
          onClick={() => setShowTrackingModal(true)}
          hasCustomText={!!batteryData.line1 || !!batteryData.line2}
        />
      </div>
      
      {/* ... rest of your content ... */}
      
      {/* Add modal at the end */}
      <BatteryTrackingModal 
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
      />
    </motion.div>
  )
}
```

## Placement Options

### Option 1: After Battery Editor (Recommended)
Place the trigger button right after the battery customization interface:

```tsx
<FullScreenBatteryEditor
  // ... props
/>
<div className="flex justify-center mt-6 mb-8">
  <BatteryTrackingTrigger 
    onClick={() => setShowTrackingModal(true)}
    hasCustomText={!!batteryData.line1}
  />
</div>
```

### Option 2: In Get Pricing Flow
Add it as an intermediate step before showing pricing:

```tsx
onGetPricing={() => {
  // Show tracking modal first
  setShowTrackingModal(true)
  // Then continue to pricing after modal closes
}}
```

### Option 3: In Cart/Checkout
Show protection features during checkout:

```tsx
<div className="bg-blue-50 p-4 rounded-lg mb-4">
  <p className="text-sm text-gray-700 mb-2">
    Your batteries include theft protection
  </p>
  <BatteryTrackingTrigger 
    onClick={() => setShowTrackingModal(true)}
    hasCustomText={true}
  />
</div>
```

## Features

### Animated QR Scanner
- Realistic red laser scanning effect
- 2-second scan duration
- Success glow animation
- Mobile-responsive sizing

### Three-Stage Experience
1. **Scanning Stage** - Interactive QR code scanning
2. **Loading Stage** - Database access animation
3. **Result Stage** - iPhone mockup with protection details

### Smart Trigger Button
- Pulses when user has custom text
- Shows QR preview on hover
- Smooth spring animations
- Gradient background matching design system

### Protection Features Display
- Instant Owner Verification
- Nationwide Tracking Active
- Warranty Registration
- 24/7 Recovery Support

## Customization Options

### Modify Protection Features
Edit the features array in `TrackingResultDisplay.tsx`:

```tsx
const features = [
  { icon: Shield, text: "Your Custom Feature", color: "text-green-600" },
  // Add more features
]
```

### Change Animation Timing
Adjust timing in `BatteryTrackingModal.tsx`:

```tsx
// Change loading duration
setTimeout(() => {
  setStage('result')
}, 2000) // Change from 1500ms to 2000ms
```

### Customize Colors
The modal uses your existing design system colors:
- Primary Blue: `#006FEE` (from-blue-600)
- Success Green: `#10B981` (green-500)
- Warning Yellow: `#FFCE00` (DeWalt yellow)

## Performance Considerations

1. **Lazy Loading** - Components use dynamic imports where beneficial
2. **Image Optimization** - QR code uses Next.js Image component
3. **CSS Animations** - GPU-accelerated transforms for smooth performance
4. **Reduced Motion** - Respects user preferences for accessibility

## Mobile Responsiveness

The modal is fully responsive with:
- Scaled battery size on mobile
- Touch-friendly buttons
- Optimized phone mockup display
- Proper spacing and typography

## Accessibility Features

- Keyboard navigation support
- Screen reader announcements
- Proper focus management
- High contrast support
- Reduced motion alternatives

## Troubleshooting

### QR Code Not Showing
Ensure the QR code image exists at `/public/images/battery-qr-code.png`

### Animations Not Working
Import the CSS file: `import '@/styles/scanner-animations.css'`

### Modal Not Closing
Check that you're passing the correct onClose function

### Custom Text Not Showing
The component uses `useEngravingStore()` - ensure the store has data

## Advanced Usage

### Custom QR Code
Pass a different QR code URL:

```tsx
<QRScannerAnimation 
  qrCodeUrl="/images/custom-qr.png"
  onScanComplete={handleComplete}
/>
```

### Callback After Protection View
Handle what happens after user views protection:

```tsx
<BatteryTrackingModal 
  isOpen={showTrackingModal}
  onClose={() => {
    setShowTrackingModal(false)
    // Continue to next step
    proceedToCheckout()
  }}
/>
```

### Track Analytics Events
Add analytics tracking:

```tsx
const handleModalOpen = () => {
  // Track event
  analytics.track('Protection Modal Viewed')
  setShowTrackingModal(true)
}
```

## Design System Alignment

The component follows your established design patterns:
- Poppins font family for headings
- Consistent button styles with gradients
- Card patterns with subtle shadows
- Spring animations matching existing components
- Color palette from your design system