'use client'

import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, TrendingUp, PackageCheck, Truck, Users, Plus, ChevronUp, ChevronDown, ArrowRight, Star, ChevronRight, CheckCircle } from 'lucide-react';

// Animated section component
const AnimatedSection: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
};

// Floating element animation
const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number; duration?: number; distance?: number }> = ({ children, delay = 0, duration = 4, distance = 8 }) => {
  return (
    <div 
      className="animate-float"
      style={{
        animation: `float ${duration}s ease-in-out infinite ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// Button component with hover effect
const Button: React.FC<{ children: React.ReactNode; primary?: boolean; onClick?: () => void; className?: string }> = ({ children, primary = false, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`${
        primary
          ? 'bg-black text-white hover:bg-gray-800'
          : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
      } px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 group ${className}`}
    >
      {children}
      <ArrowRight className="w-4 h-4 transform transition-transform group-hover:translate-x-1" />
    </button>
  );
};

// Gradient badge component
const GradientBadge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-purple-500 text-sm font-medium ${className}`}>
      <Zap className="w-4 h-4" />
      {children}
    </div>
  );
};

// Feature card component
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-4px] border border-gray-100 h-full">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

// Testimonial component
const Testimonial: React.FC<{ text: string; author: string; position: string; rating?: number; company?: string; imageSrc?: string }> = ({ text, author, position, rating = 5, company = '', imageSrc = '/api/placeholder/64/64' }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-gray-700 italic mb-5 flex-grow">"{text}"</p>
      <div className="flex items-center mt-auto">
        <img src={imageSrc} alt={author} className="w-12 h-12 rounded-full mr-4" />
        <div>
          <p className="font-medium text-gray-900">{author}</p>
          <p className="text-gray-500 text-sm">{position}{company && `, ${company}`}</p>
        </div>
      </div>
    </div>
  );
};

// Accordion component
const Accordion: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="w-full flex justify-between items-center text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <div
        className={`mt-2 text-gray-600 overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

// Step component
const Step: React.FC<{ number: string; title: string; description: string; isOpen: boolean; onClick: () => void; icon?: React.ReactNode }> = ({ number, title, description, isOpen, onClick, icon }) => {
  return (
    <div className="mb-6">
      <button
        className={`w-full flex items-center text-left py-4 px-6 rounded-xl border ${
          isOpen ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'
        } transition-colors duration-200`}
        onClick={onClick}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-4 ${
          isOpen ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {number}
        </div>
        <span className="font-medium text-lg">{title}</span>
        {isOpen ? 
          <ChevronUp className="ml-auto text-indigo-600" /> : 
          <ChevronDown className="ml-auto text-gray-400" />
        }
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 pl-16 ${
        isOpen ? 'max-h-96 opacity-100 pt-4 pb-2' : 'max-h-0 opacity-0'
      }`}>
        <div className="flex">
          <div className="flex-1 text-gray-700">
            {description}
          </div>
          {icon && (
            <div className="ml-6 flex-none">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Product card component
const ProductCard: React.FC<{ title: string; imageSrc: string; price?: string; description: string; tags?: string[] }> = ({ title, imageSrc, price, description, tags = [] }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col h-full">
      <div className="relative">
        <img 
          src={imageSrc} 
          alt={title} 
          className="w-full h-48 object-cover object-center"
        />
        {price && (
          <div className="absolute top-4 right-4 bg-black text-white font-medium px-3 py-1 rounded-full text-sm">
            ${price}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600 mb-4 flex-grow">{description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span key={index} className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <Button>View Details</Button>
      </div>
    </div>
  );
};

const BatteryDepartmentHomepage = () => {
  const [activeStep, setActiveStep] = useState(1);
  
  useEffect(() => {
    // Add keyframe animation to global styles
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      @keyframes pulse-glow {
        0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
        70% { box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); }
        100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
      }
      .animate-float {
        animation: float 4s ease-in-out infinite;
      }
      .glow-pulse {
        animation: pulse-glow 2s infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="font-sans text-gray-900 overflow-hidden">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-2/3 right-1/2 w-64 h-64 bg-indigo-300 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center text-indigo-600 font-bold text-xl">
              <Zap className="w-6 h-6 mr-2" />
              <span>Battery Department</span>
            </div>
            <nav className="hidden md:flex ml-10 space-x-8">
              <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">About</a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Reviews</a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Contact</a>
              <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Power Portal</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button primary>Build My Battery Kit</Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection>
            <div className="flex flex-col lg:flex-row items-center max-w-6xl mx-auto">
              <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
                <div className="inline-block">
                  <GradientBadge className="mb-4">Trusted by 300+ Clients</GradientBadge>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Your Premium Battery Fleet Supplier
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Take a 30-second quiz to build your own custom plan tailored to your equipment needs with unmatched reliability and support.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button primary className="text-base">Build My Battery Plan</Button>
                  <Button className="text-base">Learn More</Button>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <FloatingElement>
                  <div className="relative">
                    <div className="absolute inset-0 -m-4 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-3xl blur-xl"></div>
                    <img 
                      src="/api/placeholder/600/400" 
                      alt="Battery Products" 
                      className="relative rounded-2xl shadow-lg w-full object-cover object-center"
                    />
                    <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">Takes just</div>
                      <div className="text-2xl font-bold text-gray-900">30 seconds</div>
                    </div>
                  </div>
                </FloatingElement>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
      
      {/* Power Portal Key Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection delay={200}>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <GradientBadge className="mb-4">Benefits</GradientBadge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                The Power Portal:
                <span className="text-indigo-600"> 6 Key Benefits</span>
              </h2>
              <p className="text-lg text-gray-600">
                Custom solutions that <strong>eliminate delays, reduce costs, and keep your teams productive</strong> from headquarters to jobsite
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatedSection delay={300}>
              <FeatureCard 
                icon={<div className="p-3 bg-indigo-50 rounded-lg inline-flex"><Zap className="w-6 h-6" /></div>}
                title="Self-Serve Power Portal"
                description="Manage your battery fleet from an easy-to-use portal. One click replenish ETC"
              />
            </AnimatedSection>
            
            <AnimatedSection delay={400}>
              <FeatureCard 
                icon={<div className="p-3 bg-indigo-50 rounded-lg inline-flex"><Truck className="w-6 h-6" /></div>}
                title="Direct-to-site Delivery"
                description="Site managers can order batteries that arrive exactly where and when they're needed."
              />
            </AnimatedSection>
            
            <AnimatedSection delay={500}>
              <FeatureCard 
                icon={<div className="p-3 bg-indigo-50 rounded-lg inline-flex"><TrendingUp className="w-6 h-6" /></div>}
                title="Inventory Management"
                description="Track battery usage across multiple jobsites in real-time. Identify high-usage patterns."
              />
            </AnimatedSection>
            
            <AnimatedSection delay={600}>
              <FeatureCard 
                icon={<div className="p-3 bg-indigo-50 rounded-lg inline-flex"><Users className="w-6 h-6" /></div>}
                title="Role-Based Access"
                description="Monitor who orders what with customized access levels for procurement teams, site managers, and field supervisors."
              />
            </AnimatedSection>
            
            <AnimatedSection delay={700}>
              <FeatureCard 
                icon={<div className="p-3 bg-indigo-50 rounded-lg inline-flex"><PackageCheck className="w-6 h-6" /></div>}
                title="Enterprise Integration"
                description="Seamlessly connect our portal with your existing procurement systems through custom API integration."
              />
            </AnimatedSection>
            
            <AnimatedSection delay={800}>
              <FeatureCard 
                icon={<div className="p-3 bg-indigo-50 rounded-lg inline-flex"><ShieldCheck className="w-6 h-6" /></div>}
                title="Procurement Flexibility"
                description="Choose how you pay with our flexible purchasing options. Buy online instantly with credit card or generate professional invoices."
              />
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection delay={300}>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">Getting started is as easy as 1,2,3.</p>
            </div>
          </AnimatedSection>
          
          <div className="max-w-4xl mx-auto">
            <AnimatedSection delay={400}>
              <Step 
                number="1"
                title="Take our AI Powered Battery Quiz"
                isOpen={activeStep === 1}
                onClick={() => setActiveStep(1)}
                description="Our quick quiz analyzes your equipment usage patterns and determines the optimal battery setup for your specific needs."
                icon={<img src="/api/placeholder/120/120" alt="Battery Quiz" className="rounded-lg" />}
              />
            </AnimatedSection>
            
            <AnimatedSection delay={500}>
              <Step 
                number="2"
                title="Choose Your Plan"
                isOpen={activeStep === 2}
                onClick={() => setActiveStep(2)}
                description="Once you've taken the quiz, you can customize your plan. You can either check out immediately or we can invoice you."
                icon={<div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-indigo-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15ZM65 52.5H52.5V65C52.5 66.38 51.38 67.5 50 67.5C48.62 67.5 47.5 66.38 47.5 65V52.5H35C33.62 52.5 32.5 51.38 32.5 50C32.5 48.62 33.62 47.5 35 47.5H47.5V35C47.5 33.62 48.62 32.5 50 32.5C51.38 32.5 52.5 33.62 52.5 35V47.5H65C66.38 47.5 67.5 48.62 67.5 50C67.5 51.38 66.38 52.5 65 52.5Z" fill="currentColor"/>
                  </svg>
                </div>}
              />
            </AnimatedSection>
            
            <AnimatedSection delay={600}>
              <Step 
                number="3"
                title="Login To The Power Portal"
                isOpen={activeStep === 3}
                onClick={() => setActiveStep(3)}
                description="Manage your entire battery fleet from The Power Portal: our user friendly custom dashboard to manage invoices, warranty's, customer support and more."
                icon={<img src="/api/placeholder/120/120" alt="Power Portal" className="rounded-lg" />}
              />
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Universal Compatibility */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern"></div>
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <AnimatedSection delay={300}>
            <div className="text-center mb-10">
              <GradientBadge className="mb-4 bg-white/10 text-white">Limitless Possibilities</GradientBadge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Universal Compatibility:<br />
                We Power All Construction Teams
              </h2>
              <p className="text-xl opacity-80 max-w-3xl mx-auto">
                Take advantage of trade priced batteries to supply your entire team.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <AnimatedSection delay={400} className="col-span-full lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 h-full flex flex-col items-center justify-center">
                <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                  <img src="/api/placeholder/60/60" alt="USA" className="rounded-full" />
                </div>
                <h3 className="text-5xl font-bold mb-2">100%</h3>
                <p className="text-xl opacity-80">US Company</p>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={500} className="col-span-full lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 h-full flex flex-col items-center justify-center">
                <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                  <img src="/api/placeholder/60/60" alt="Handshake" className="rounded-full" />
                </div>
                <h3 className="text-5xl font-bold mb-2">60%</h3>
                <p className="text-xl opacity-80">Reduced Bulk Pricing</p>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={600} className="col-span-full lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 h-full flex flex-col items-center justify-center">
                <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                  <img src="/api/placeholder/60/60" alt="Support" className="rounded-full" />
                </div>
                <h3 className="text-5xl font-bold mb-2">24/7</h3>
                <p className="text-xl opacity-80">Customer Service</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Featured Battery Packs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection delay={300}>
            <div className="text-center mb-16">
              <GradientBadge className="mb-4">Our Available Bundles</GradientBadge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Featured Battery Packs
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Whether you are a private contractor or an enterprise workforce, we have suitable pack sizes for all.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatedSection delay={400}>
              <ProductCard 
                title="6 Piece FlexVolt Trade Pack"
                imageSrc="/api/placeholder/400/240"
                price="720"
                description="These batteries are compatible with all 60v/20v DeWalt tools."
                tags={["Free Pelican-Style Case"]}
              />
            </AnimatedSection>
            
            <AnimatedSection delay={500}>
              <ProductCard 
                title="Framer Full Mastery & More 2024 Updated"
                imageSrc="/api/placeholder/400/240"
                price="99"
                description="Master Framer in 2024 with this updated course. Learn to design, prototype, and build interactive websites with ease."
                tags={["Free Pelican-Style Case"]}
              />
            </AnimatedSection>
            
            <AnimatedSection delay={600}>
              <ProductCard 
                title="Enterprise Integration Bundle"
                imageSrc="/api/placeholder/400/240"
                price="1299"
                description="Full enterprise solution with dedicated account manager and custom API integration."
                tags={["Premium Support", "API Access"]}
              />
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Client First Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <AnimatedSection delay={300} className="lg:w-1/2">
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Client First<br />
                Company
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                The foundation of our success is <span className="font-bold">YOU</span>. We're committed to exceeding expectations through personalized service and support that adapts to your unique operational challenges.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <p className="text-gray-700">Dedicated account manager for enterprise clients</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <p className="text-gray-700">24/7 technical support with 2-hour response time</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <p className="text-gray-700">Flexible payment terms for qualified customers</p>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={400} className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 -m-4 bg-gradient-to-r from-indigo-100/40 to-purple-100/40 rounded-3xl blur-xl"></div>
                <img 
                  src="/api/placeholder/600/400" 
                  alt="Client Support" 
                  className="relative rounded-2xl shadow-lg w-full object-cover object-center"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection delay={300}>
            <div className="text-center mb-16">
              <GradientBadge className="mb-4">Testimonials</GradientBadge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Client Feedback
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Take our 30 second quiz to see how your own battery design will look. It's easy!
              </p>
              <Button primary className="mt-6 mx-auto">Design My battery</Button>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatedSection delay={400}>
              <Testimonial 
                text="The courses are top-notch, providing in-depth knowledge that's easy to apply. Each lesson is structured to ensure you fully grasp the material."
                author="Brendan Wilson"
                position="Aspiring Web Designer"
                rating={5}
              />
            </AnimatedSection>
            
            <AnimatedSection delay={500}>
              <Testimonial 
                text="The courses are excellent, delivering practical insights with ease. Each module is designed to help you fully understand and apply the knowledge."
                author="Rock Lee"
                position="Web Designer"
                rating={5}
              />
            </AnimatedSection>
            
            <AnimatedSection delay={600}>
              <Testimonial 
                text="These courses are exceptional, offering detailed content that's easy to implement. Every lesson is carefully crafted to deepen your understanding."
                author="Sakura"
                position="Web Developer"
                rating={5}
              />
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <AnimatedSection delay={300}>
            <div className="text-center mb-16">
              <GradientBadge className="mb-4">FAQ</GradientBadge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Frequently Asked Questions!
              </h2>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <AnimatedSection delay={400}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold mb-6">What is Build-A-Battery?</h3>
                <div className="flex flex-col gap-4">
                  <Accordion title="Do you have refund policy?">
                    <p className="py-3">
                      All purchases come with a flexible full-refund policy. We look to do business for years, not months. If you ever need assistance, you can request help from The Power Portal - our modern self-serve portal where you can manage your entire battery fleet.
                    </p>
                  </Accordion>
                  
                  <Accordion title="How does it work?">
                    <p className="py-3">
                      Our innovative platform helps you identify the perfect battery solution for your equipment. After a quick assessment, we provide customized options that match your specific operational needs and budget.
                    </p>
                  </Accordion>
                  
                  <Accordion title="Why should we trust your services?">
                    <p className="py-3">
                      With over 300+ satisfied clients, industry-leading warranty terms, and a dedicated support team, we've built our reputation on quality products and exceptional service. Our batteries undergo rigorous testing to ensure maximum reliability.
                    </p>
                  </Accordion>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection delay={500}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold mb-6">Still Have Questions?</h3>
                <p className="text-gray-600 mb-6">
                  Our support team is ready to help with any questions about our products, services, or how we can customize solutions for your specific needs.
                </p>
                <a href="#" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors inline-flex items-center group">
                  Contact Us
                  <ChevronRight className="ml-1 w-4 h-4 transform transition-transform group-hover:translate-x-1" />
                </a>
                
                <div className="mt-8 flex items-center">
                  <div className="flex -space-x-2">
                    <img src="/api/placeholder/40/40" alt="Team Member 1" className="w-10 h-10 rounded-full border-2 border-white" />
                    <img src="/api/placeholder/40/40" alt="Team Member 2" className="w-10 h-10 rounded-full border-2 border-white" />
                    <img src="/api/placeholder/40/40" alt="Team Member 3" className="w-10 h-10 rounded-full border-2 border-white" />
                  </div>
                  <p className="ml-4 text-sm text-gray-600">We are happy to help you</p>
                </div>
                
                <div className="mt-8">
                  <Button primary className="w-full justify-center">Build My Battery</Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
      
      {/* Partner logos */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h3 className="text-center text-lg text-gray-500 mb-8">World Class Tech Used</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="/api/placeholder/120/40" alt="Partner 1" />
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="/api/placeholder/120/40" alt="Partner 2" />
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="/api/placeholder/120/40" alt="Partner 3" />
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="/api/placeholder/120/40" alt="Partner 4" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center text-white font-bold text-xl mb-4">
                <Zap className="w-5 h-5 mr-2" />
                <span>Battery Department</span>
              </div>
              <p className="text-gray-400 mb-4">
                Powering the future of construction teams with innovative battery solutions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Reviews</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Power Portal</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Shipping</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span className="text-gray-400">123 Battery Way, Electric City, CA 90210</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-gray-400">support@batterydept.com</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <span className="text-gray-400">(800) 123-4567</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              Battery Department LLC © 2025. Designed With Love
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating contact button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all duration-300 glow-pulse">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BatteryDepartmentHomepage;
