import React, { useState, useEffect } from "react"
import { Shield, Zap, Users, Headphones, Package } from "lucide-react"

export default function KeyBenefitsSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Slideshow content with Lucide icons
  const slides = [
    {
      title: "Theft-Proof Design",
      description: "Permanent laser engraving makes batteries impossible to pawn or resell",
      gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      icon: Shield,
      iconColor: "#60A5FA"
    },
    {
      title: "Premium Samsung Cells",
      description: "21700 technology delivers 40% longer runtime than standard",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      icon: Zap,
      iconColor: "#34D399"
    },
    {
      title: "Crew Accountability",
      description: "Track every battery with custom asset IDs and assignments",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
      icon: Users,
      iconColor: "#A78BFA"
    },
    {
      title: "Boston-Based Support",
      description: "Local team on Harrison Ave, available 7AM-6PM EST",
      gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
      icon: Headphones,
      iconColor: "#FB923C"
    },
    {
      title: "Bulk Discounts Available",
      description: "Custom bulk pricing with custom pelican style cases for orders over 100 batteries",
      gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
      icon: Package,
      iconColor: "#818CF8"
    }
  ]

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  // Handle slide change
  const handleSlideChange = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        marginBottom: "48px",
        padding: "0 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Navigation Links with Icon Boxes - Hidden on mobile */}
      <div
        style={{
          display: isMobile ? "none" : "flex",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        {slides.map((slide, index) => {
          const IconComponent = slide.icon
          const isActive = currentSlide === index

          return (
            <div
              key={index}
              onClick={() => handleSlideChange(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSlideChange(index)
                }
              }}
              style={{
                background: isActive ? slide.gradient : "white",
                border: isActive ? "none" : "2px solid #E5E7EB",
                borderRadius: "12px",
                padding: "12px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.3s ease",
                boxShadow: isActive
                  ? "0 8px 24px rgba(0,0,0,0.15)"
                  : "0 2px 8px rgba(0,0,0,0.05)",
                transform: isActive
                  ? "translateY(-2px)"
                  : "translateY(0)",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = "translateY(-1px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"
                }
              }}
            >
              <IconComponent
                size={20}
                color={isActive ? "white" : slide.iconColor}
                strokeWidth={2.5}
                style={{ pointerEvents: "none" }}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: isActive ? "white" : "#374151",
                  pointerEvents: "none",
                }}
              >
                {slide.title}
              </span>
            </div>
          )
        })}
      </div>

      {/* Slideshow Content - Centered Text */}
      <div
        style={{
          background: slides[currentSlide].gradient,
          borderRadius: "24px",
          padding: "64px 48px",
          color: "white",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.5s ease",
          minHeight: "280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          {/* Large Lucide Icon */}
          <div
            style={{
              marginBottom: "32px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {React.createElement(slides[currentSlide].icon, {
              size: 72,
              color: "white",
              strokeWidth: 1.5,
            })}
          </div>
          <h3
            style={{
              fontSize: "42px",
              fontWeight: 700,
              marginBottom: "20px",
              lineHeight: 1.2,
              margin: "0 0 20px 0",
            }}
          >
            {slides[currentSlide].title}
          </h3>
          <p
            style={{
              fontSize: "22px",
              lineHeight: 1.6,
              opacity: 0.95,
              margin: "0",
            }}
          >
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      {/* Slide Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "24px",
          padding: "8px",
        }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSlideChange(index)}
            aria-label={`Go to slide ${index + 1}`}
            style={{
              width: currentSlide === index ? "32px" : "8px",
              height: "8px",
              borderRadius: "4px",
              border: "none",
              background:
                currentSlide === index ? "#006FEE" : "#E5E7EB",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (currentSlide !== index) {
                e.currentTarget.style.background = "#CBD5E1"
              }
            }}
            onMouseLeave={(e) => {
              if (currentSlide !== index) {
                e.currentTarget.style.background = "#E5E7EB"
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}