# Battery Tracking Modal Component Guide

## Overview

The Battery Tracking Modal is a sophisticated component that allows users to preview how their custom-engraved batteries will appear when scanned by customers. It displays a live demonstration of the battery protection verification system, complete with company branding and a 360-degree spinning battery video.

## Key Features

- **Dynamic Company Information**: Automatically pulls company name and contact details from user input
- **Iframe-based Display**: Shows the actual battery scan demo page in an isolated environment
- **360° Battery Video**: Displays an auto-playing, looping video of the battery spinning
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Clean Interface**: Removed marketing footers to focus on core verification features

## Component Structure

### Main Components

1. **BatteryTrackingDemoModal** (`/src/components/tracking/BatteryTrackingDemoModal.tsx`)
   - The modal container that displays the battery tracking experience
   - Uses an iframe to show the battery scan demo page
   - Handles URL parameter injection for dynamic data

2. **BatteryTrackingDemoTrigger** (same file)
   - The blue button that opens the modal
   - Features a pulsing animation when custom text is entered
   - Styled with the brand's signature blue gradient

3. **BatteryScanLandingPage** (`/src/components/BatteryScanLandingPage.tsx`)
   - The actual page displayed inside the modal
   - Shows "This Battery is Owned By [Company Name]"
   - Includes the 360° spinning battery video
   - Displays verification details and contact information

## How It Works

### Data Flow

1. **User Input**: Company name and contact info are stored in localStorage
2. **Button Click**: Trigger button opens the modal
3. **URL Parameters**: Modal constructs URL with query parameters:
   - `company`: Company name
   - `phone`: Phone number (extracted from secondary text)
   - `email`: Auto-generated from company name
   - `batteryId`: Generated from company data
   - `demo=true`: Indicates modal/demo mode
4. **Iframe Loading**: Modal loads the battery scan page with parameters
5. **Dynamic Display**: Page reads URL parameters and displays custom data

### Key Code Components

```tsx
// URL Parameter Construction
const params = new URLSearchParams({
  company: primaryText || 'Your Company',
  phone: extractPhone(secondaryText) || '(555) 123-4567',
  email: `info@${(primaryText || 'company').toLowerCase().replace(/\s+/g, '')}.com`,
  batteryId: generateBatteryId(),
  demo: 'true'
})
```

## Implementation Guide

### Basic Implementation

To add the Battery Tracking Modal to any page:

```tsx
import { useState } from 'react'
import { BatteryTrackingDemoModal, BatteryTrackingDemoTrigger } from '@/components/tracking/BatteryTrackingDemoModal'

export default function YourPage() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      {/* Your page content */}
      
      {/* Add the trigger button */}
      <BatteryTrackingDemoTrigger 
        onClick={() => setShowModal(true)}
        hasCustomText={true} // Makes button pulse when true
      />
      
      {/* Add the modal */}
      <BatteryTrackingDemoModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
```

### Advanced Integration with Engraving Store

If your page uses the engraving store for battery customization:

```tsx
import { useEngravingStore } from '@/lib/engraving-store'

export default function EngravingPage() {
  const [showModal, setShowModal] = useState(false)
  const { primaryText, secondaryText } = useEngravingStore()

  // Store data in localStorage for modal to access
  useEffect(() => {
    if (primaryText) localStorage.setItem('engravingPrimaryText', primaryText)
    if (secondaryText) localStorage.setItem('engravingSecondaryText', secondaryText)
  }, [primaryText, secondaryText])

  return (
    <div>
      {/* Engraving controls */}
      
      <BatteryTrackingDemoTrigger 
        onClick={() => setShowModal(true)}
        hasCustomText={!!primaryText || !!secondaryText}
      />
      
      <BatteryTrackingDemoModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
```

## Customization Options

### Button Styling

The trigger button can be customized via props:

```tsx
<BatteryTrackingDemoTrigger 
  onClick={() => setShowModal(true)}
  hasCustomText={true}
  // Button will pulse when hasCustomText is true
  // Default text: "See Your Battery's Protection"
/>
```

### Modal Behavior

The modal includes several built-in features:
- Click outside to close
- Escape key to close
- Smooth fade-in/out animations
- Loading state while iframe loads
- Full-screen mode on desktop

## File Structure

```
/src/components/tracking/
├── BatteryTrackingDemoModal.tsx    # Modal and trigger button
├── BatteryScanLandingPage.tsx      # Page displayed in modal
└── (other tracking components)

/public/
└── battery-spin-360.mp4            # 360° battery video
```

## Key Features Explained

### 1. Dynamic Title Change
- Original: "This Battery is Protected"
- Updated: "This Battery is Owned By [Company Name]"
- Dynamically inserts the company name from user input

### 2. 360° Battery Video
- Location: Below the Battery ID field
- Behavior: Autoplay, loop, muted
- Only shows in modal mode (`demo=true` parameter)
- Responsive sizing for different devices

### 3. Clean Interface
- Removed "Protect Your Tools" marketing section
- Removed footer with links
- Focus on verification and ownership details
- Maintains trust indicators and security badges

### 4. Header Navigation Disabled
- Battery Department logo is not clickable
- Prevents users from leaving the funnel
- Maintains visual branding without navigation

## Browser Compatibility

- **Chrome**: Full support (recommended)
- **Safari**: Full support
- **Firefox**: Full support
- **Edge**: Full support
- **Mobile browsers**: Fully responsive

Note: Video autoplay requires muted attribute for browser policies.

## Troubleshooting

### Common Issues

1. **Modal not opening**: Check console for JavaScript errors
2. **Video not playing**: Ensure video file exists at `/public/battery-spin-360.mp4`
3. **Company name not showing**: Verify localStorage has the data
4. **Iframe not loading**: Check for CORS or CSP issues

### Debug Mode

Add console logs to debug data flow:

```tsx
// In BatteryTrackingDemoModal
useEffect(() => {
  console.log('Modal opened, primaryText:', primaryText)
  console.log('Generated URL:', demoUrl)
}, [isOpen, primaryText, demoUrl])
```

## Performance Considerations

- **Lazy Loading**: Modal components use dynamic imports
- **Video Optimization**: MP4 format with reasonable file size
- **Iframe Isolation**: Prevents style/script conflicts
- **LocalStorage**: Fast data access without API calls

## Security Notes

- No sensitive data in URL parameters
- Iframe sandbox attributes for security
- Input sanitization for company names
- No external API calls from the modal

## Future Enhancements

Potential improvements to consider:
- Custom video upload per company
- QR code generation for actual batteries
- Analytics tracking for modal views
- Multiple language support
- Custom color themes per company

## Summary

The Battery Tracking Modal provides a seamless way for users to preview their custom battery protection system. It combines dynamic data injection, responsive design, and engaging visual elements (360° video) to create a compelling demonstration of the battery ownership verification system.

For implementation support or questions, refer to the example implementations in the codebase or reach out to the development team.