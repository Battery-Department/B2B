'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, Trash2, Search, Package, Battery, Plus, Minus } from 'lucide-react'

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const favoriteProducts = [
    {
      id: 1,
      name: 'LithiPro 150Ah Battery',
      category: 'Professional Grade',
      price: 599.00,
      originalPrice: 699.00,
      image: '/api/placeholder/200/200',
      rating: 4.8,
      reviews: 156,
      inStock: true,
      addedDate: 'May 20, 2025',
      description: 'High-capacity lithium battery for demanding applications',
      capacity: '150Ah',
      voltage: '12V',
      warranty: '5 years'
    },
    {
      id: 2,
      name: 'PowerMax 100Ah Battery',
      category: 'Standard Series',
      price: 399.00,
      originalPrice: 449.00,
      image: '/api/placeholder/200/200',
      rating: 4.6,
      reviews: 234,
      inStock: true,
      addedDate: 'May 18, 2025',
      description: 'Reliable power solution for everyday use',
      capacity: '100Ah',
      voltage: '12V',
      warranty: '3 years'
    },
    {
      id: 3,
      name: 'EcoCharge 50Ah Battery',
      category: 'Compact Series',
      price: 199.00,
      image: '/api/placeholder/200/200',
      rating: 4.5,
      reviews: 45,
      inStock: true,
      addedDate: 'May 15, 2025',
      description: 'Compact and lightweight for portable applications',
      capacity: '50Ah',
      voltage: '12V',
      warranty: '2 years'
    },
    {
      id: 4,
      name: 'Smart BMS Module',
      category: 'Accessories',
      price: 149.00,
      image: '/api/placeholder/200/200',
      rating: 4.9,
      reviews: 89,
      inStock: false,
      addedDate: 'May 10, 2025',
      description: 'Advanced battery management system with app control',
      compatibility: 'All LithiPro models',
      features: 'Bluetooth, App Control',
      warranty: '2 years'
    }
  ]

  const filteredProducts = favoriteProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'name':
        return a.name.localeCompare(b.name)
      case 'recent':
      default:
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    }
  })

  const removeFromFavorites = (productId: number) => {
    // Implementation would go here
    console.log('Removing product', productId)
  }

  const updateQuantity = (productId: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }))
  }

  const addToCart = (product: any) => {
    const quantity = quantities[product.id] || 1
    console.log(`Adding ${quantity} x ${product.name} to cart`)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(to right, #006FEE, #0050B3)',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}>
        <div style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'white' }}>Saved Items</h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ color: 'white', fontSize: '14px' }}>Mike Johnson</span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '16px'
            }}>
              MJ
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Page info and controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <p style={{ color: '#5B6B7D', fontSize: '14px' }}>
              {sortedProducts.length} products saved
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search saved items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '300px',
                    padding: '12px 44px 12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #E6F4FF',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#006FEE'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#E6F4FF'}
                />
                <Search style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  color: '#5B6B7D'
                }} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid #E6F4FF',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#5B6B7D'
                }}
              >
                <option value="recent">Recently Added</option>
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              border: '2px solid #E6F4FF'
            }}>
              <Heart size={48} style={{ color: '#E6F4FF', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                No saved items found
              </h2>
              <p style={{ fontSize: '14px', color: '#5B6B7D', marginBottom: '24px' }}>
                {searchQuery ? `No products matching "${searchQuery}"` : 'Start adding products to your favorites'}
              </p>
              <Link
                href="/customer/products"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#006FEE',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0050B3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#006FEE'}
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {sortedProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    border: '2px solid #E6F4FF',
                    transform: hoveredCard === product.id ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: hoveredCard === product.id ? '0 12px 24px rgba(0, 111, 238, 0.15)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredCard(product.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{ padding: '24px' }}>
                    {/* Product header with remove button */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827'
                          }}>
                            {product.name}
                          </h3>
                          {!product.inStock && (
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              Out of Stock
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#5B6B7D' }}>{product.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromFavorites(product.id)}
                        style={{
                          padding: '8px',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#DC2626'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEE2E2'
                          e.currentTarget.style.color = '#DC2626'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Product image placeholder */}
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Battery size={48} style={{ color: '#E6F4FF' }} />
                    </div>

                    {/* Product details */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '13px', color: '#5B6B7D', marginBottom: '8px' }}>
                        {product.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {product.capacity && (
                          <span style={{ fontSize: '12px', color: '#006FEE' }}>
                            <strong>Capacity:</strong> {product.capacity}
                          </span>
                        )}
                        {product.voltage && (
                          <span style={{ fontSize: '12px', color: '#006FEE' }}>
                            <strong>Voltage:</strong> {product.voltage}
                          </span>
                        )}
                        {product.warranty && (
                          <span style={{ fontSize: '12px', color: '#006FEE' }}>
                            <strong>Warranty:</strong> {product.warranty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            style={{
                              fill: i < Math.floor(product.rating) ? '#FBBF24' : 'none',
                              stroke: '#FBBF24'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '13px', color: '#5B6B7D' }}>
                        {product.rating} ({product.reviews} reviews)
                      </span>
                    </div>

                    {/* Price and quantity */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#006FEE'
                          }}>
                            ${product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && (
                            <span style={{
                              fontSize: '16px',
                              color: '#9CA3AF',
                              textDecoration: 'line-through'
                            }}>
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#16A34A',
                          marginTop: '4px'
                        }}>
                          {product.originalPrice ? `Save $${(product.originalPrice - product.price).toFixed(2)}` : 'Best Value'}
                        </p>
                      </div>
                      
                      {/* Quantity selector */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: '#F8FAFC',
                        borderRadius: '8px',
                        padding: '4px'
                      }}>
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          disabled={!product.inStock}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            color: '#006FEE',
                            cursor: product.inStock ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        <span style={{
                          minWidth: '32px',
                          textAlign: 'center',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827'
                        }}>
                          {quantities[product.id] || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          disabled={!product.inStock}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            color: '#006FEE',
                            cursor: product.inStock ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Add to cart button */}
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: product.inStock ? '#006FEE' : '#E5E7EB',
                        color: product.inStock ? 'white' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: product.inStock ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      disabled={!product.inStock}
                      onMouseEnter={(e) => {
                        if (product.inStock) {
                          e.currentTarget.style.backgroundColor = '#0050B3'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.inStock) {
                          e.currentTarget.style.backgroundColor = '#006FEE'
                        }
                      }}
                    >
                      <ShoppingCart size={16} />
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>

                    {/* Added date */}
                    <p style={{
                      fontSize: '12px',
                      color: '#9CA3AF',
                      marginTop: '12px',
                      textAlign: 'center'
                    }}>
                      Added {product.addedDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}