# PricingConfigurator Integration Guide

## Overview
The `PricingConfigurator` component is a modular, self-contained pricing configuration interface that can be easily integrated into your existing design-with-ai page flow.

## Integration Steps

### 1. Import the Component
Add this import to your page file:
```tsx
import PricingConfigurator from '@/components/pricing/PricingConfigurator'
```

### 2. Add State Management
Add a new state variable to control when to show the pricing configurator:
```tsx
const [showPricingConfig, setShowPricingConfig] = useState(false)
```

### 3. Update the Flow
Modify your existing `onGetPricing` callback in the `FullScreenBatteryEditor`:

```tsx
onGetPricing={() => {
  // First show the pricing configurator
  setShowPricingConfig(true)
  
  // Smooth scroll to the pricing section
  setTimeout(() => {
    const pricingSection = document.querySelector('.pricing-config-section')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}}
```

### 4. Add the Component to Your Page
Insert this code after the battery editor section and before the battery selection:

```tsx
{/* Pricing Configuration Section */}
<AnimatePresence>
  {showPricingConfig && !showBatterySelection && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pricing-config-section bg-gray-50 border-t border-gray-200"
    >
      <PricingConfigurator
        batteryData={batteryData}
        onContinue={() => {
          setShowBatterySelection(true)
          // Smooth scroll to battery selection
          setTimeout(() => {
            const batterySection = document.querySelector('.battery-selection-section')
            if (batterySection) {
              batterySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
        }}
      />
    </motion.div>
  )}
</AnimatePresence>
```

### 5. Update Your Battery Selection Display Logic
Modify the condition for showing battery selection:
```tsx
{showBatterySelection && (
  // Your existing battery selection code
)}
```

## Complete Integration Example

Here's how the flow section of your page would look:

```tsx
export default function DesignWithAIPage() {
  // ... existing states ...
  const [showPricingConfig, setShowPricingConfig] = useState(false)
  const [showBatterySelection, setShowBatterySelection] = useState(false)

  return (
    <motion.div className="min-h-screen bg-white max-w-full overflow-x-hidden">
      {/* Full Screen Header and Battery Editor Container */}
      <div className="min-h-screen flex flex-col">
        {/* ... header section ... */}
        
        {/* Battery Editor Section */}
        <motion.div className="flex-1 flex items-center justify-center px-4 pb-8">
          <FullScreenBatteryEditor
            canvasRef={canvasRef}
            batteryImage="/images/flexbat-battery.png"
            batteryData={batteryData}
            onBatteryDataChange={setBatteryData}
            onGetPricing={() => {
              setShowPricingConfig(true)
              setTimeout(() => {
                const pricingSection = document.querySelector('.pricing-config-section')
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }, 100)
            }}
            onShareDesign={() => toast.success('Share feature coming soon!')}
          />
        </motion.div>
      </div>
      
      {/* Pricing Configuration Section */}
      <AnimatePresence>
        {showPricingConfig && !showBatterySelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pricing-config-section bg-gray-50 border-t border-gray-200"
          >
            <PricingConfigurator
              batteryData={batteryData}
              onContinue={() => {
                setShowBatterySelection(true)
                setTimeout(() => {
                  const batterySection = document.querySelector('.battery-selection-section')
                  if (batterySection) {
                    batterySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Battery Selection Section */}
      <AnimatePresence>
        {showBatterySelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Key Benefits Slideshow */}
            <ScrollReveal>
              <KeyBenefitsSlideshow />
            </ScrollReveal>
            
            {/* Battery Selection */}
            <div className="battery-selection-section bg-gray-50 border-t border-gray-200">
              {/* ... existing battery selection code ... */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

## Features of the PricingConfigurator Component

1. **Business Type Selection** - Allows users to identify their trade/industry
2. **Team Size Input** - Captures the number of team members using tools
3. **Purchase Frequency** - Determines buying patterns (weekly/monthly/quarterly/annually)
4. **Automatic Volume Calculation** - Estimates annual spend based on inputs
5. **Dynamic Discount Display** - Shows applicable volume discounts in real-time
6. **Benefits Summary** - Highlights key value propositions
7. **Smooth Animations** - Uses Framer Motion for polished transitions
8. **Mobile Responsive** - Works perfectly on all screen sizes
9. **Session Storage** - Saves configuration data for checkout pre-filling

## Customization Options

You can easily customize the component by modifying:

- Business types array
- Volume discount tiers
- Benefits list
- Color scheme (follows your existing design system)
- Animation timings
- Form validation rules

## Data Flow

The component stores the following data in sessionStorage under 'pricingConfig':
```json
{
  "businessType": "contractor",
  "teamSize": "25",
  "purchaseFrequency": "monthly",
  "estimatedVolume": 13500,
  "applicableDiscount": 15
}
```

This data can be retrieved in your checkout flow to:
- Pre-fill business information
- Apply appropriate discounts
- Show personalized messaging
- Track conversion metrics