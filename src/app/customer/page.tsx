'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Battery, 
  Zap, 
  ShieldCheck, 
  Award, 
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Package
} from 'lucide-react'

export default function CustomerPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Battery,
      title: 'Premium FlexVolt Batteries',
      description: 'Industry-leading battery technology with up to 10 hours runtime',
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #E6F4FF 0%, #F0F9FF 100%)'
    },
    {
      icon: ShieldCheck,
      title: '12-Month Warranty',
      description: 'Full coverage warranty on all battery products',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #E6FFF9 0%, #F0FFF8 100%)'
    },
    {
      icon: Zap,
      title: 'Fast Charging',
      description: 'Quick charge technology - 80% in just 60 minutes',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #FFF7E6 0%, #FFF9F0 100%)'
    },
    {
      icon: Award,
      title: 'Rewards Program',
      description: 'Earn points with every purchase and unlock exclusive discounts',
      color: '#7C3AED',
      gradient: 'linear-gradient(135deg, #F3E6FF 0%, #F9F0FF 100%)'
    }
  ]

  const stats = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '24/7', label: 'Customer Support' },
    { value: '45%', label: 'Average Savings' }
  ]

  return (
    <div style={{ 
      backgroundColor: '#F8FAFC',
      minHeight: '100vh',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.8s ease-in-out'
    }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0048AC 0%, #006FEE 50%, #0084FF 100%)',
        color: 'white',
        padding: '80px 24px 48px',
        borderRadius: '0 0 32px 32px',
        boxShadow: '0 16px 48px rgba(0, 111, 238, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '8px 16px',
            borderRadius: '100px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)'
          }}>
            <Zap size={18} />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              Welcome to Lithi Battery Hub
            </span>
          </div>

          <h1 style={{
            fontSize: '56px',
            fontWeight: '800',
            marginBottom: '24px',
            lineHeight: '1.1',
            animation: 'slideUp 0.8s ease-out'
          }}>
            Power Your Business<br />
            <span style={{ color: '#FFB800' }}>Forward</span>
          </h1>

          <p style={{
            fontSize: '20px',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Get premium FlexVolt batteries at wholesale prices with bulk discounts up to 20% off
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => router.push('/customer/products')}
              style={{
                backgroundColor: 'white',
                color: '#006FEE',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
              }}
            >
              Shop Now
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => router.push('/customer/dashboard')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                border: '2px solid white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '-40px auto 60px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          {stats.map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 111, 238, 0.08)',
                border: '1px solid #E6F4FF',
                transform: `translateY(${isVisible ? '0' : '20px'})`,
                opacity: isVisible ? 1 : 0,
                transition: `all 0.5s ease-out ${index * 0.1}s`
              }}
            >
              <p style={{
                fontSize: '40px',
                fontWeight: '800',
                color: '#006FEE',
                marginBottom: '8px'
              }}>
                {stat.value}
              </p>
              <p style={{
                fontSize: '16px',
                color: '#5B6B7D',
                fontWeight: '500'
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 80px',
        padding: '0 24px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '40px',
            fontWeight: '800',
            color: '#0A051E',
            marginBottom: '16px'
          }}>
            Why Choose Lithi?
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#5B6B7D',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Industry-leading battery technology paired with unbeatable prices and customer service
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                padding: '32px',
                borderRadius: '16px',
                background: feature.gradient,
                border: `1px solid ${feature.color}20`,
                cursor: 'pointer',
                transform: `translateY(${isVisible ? '0' : '30px'})`,
                opacity: isVisible ? 1 : 0,
                transition: `all 0.6s ease-out ${index * 0.15}s`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)'
                e.currentTarget.style.boxShadow = `0 12px 32px ${feature.color}15`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: feature.color + '15',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <feature.icon size={30} color={feature.color} />
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0A051E',
                marginBottom: '12px'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#5B6B7D',
                lineHeight: '1.6'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #E6F4FF 100%)',
        padding: '80px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#0A051E',
            marginBottom: '16px'
          }}>
            Ready to Power Up Your Business?
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#5B6B7D',
            marginBottom: '32px'
          }}>
            Join thousands of businesses saving money with our bulk battery solutions
          </p>
          <button
            onClick={() => router.push('/customer/auth/register')}
            style={{
              background: 'linear-gradient(135deg, #006FEE 0%, #0084FF 100%)',
              color: 'white',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0, 111, 238, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 111, 238, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 111, 238, 0.3)'
            }}
          >
            Create Your Account
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}