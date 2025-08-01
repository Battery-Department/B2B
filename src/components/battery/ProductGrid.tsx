'use client';

import React from 'react';
import { ProductCard, ProductData } from './ProductCard';
import { ProductSearch } from './ProductSearch';
import { QuickViewModal } from './QuickViewModal';
import { ProductComparison } from './ProductComparison';
import { Battery, Package, Scale } from 'lucide-react';

interface ProductGridProps {
  products: ProductData[];
  quantities: Record<string, number>;
  onUpdateQuantity: (productId: string, delta: number) => void;
}

export function ProductGrid({ products, quantities, onUpdateQuantity }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('featured');
  const [selectedProduct, setSelectedProduct] = React.useState<ProductData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = React.useState(false);
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);

  // Filter products based on search
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.features.toLowerCase().includes(query) ||
        product.workOutput.toLowerCase().includes(query)
      );
    }

    // Sort products
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        break;
      case 'power':
        // Sort by capacity (extract number from name)
        filtered.sort((a, b) => {
          const aCapacity = parseInt(a.name.match(/\d+/)?.[0] || '0');
          const bCapacity = parseInt(b.name.match(/\d+/)?.[0] || '0');
          return bCapacity - aCapacity;
        });
        break;
      default:
        // Featured (original order with popular first)
        filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return filtered;
  }, [products, searchQuery, sortBy]);

  const handleQuickView = (product: ProductData) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleAddToCart = (productId: string, quantity: number) => {
    onUpdateQuantity(productId, quantity);
  };

  return (
    <div className="space-y-6">
      {/* Search and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1">
          <ProductSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
            currentSort={sortBy}
          />
        </div>
        
        {/* Compare Button */}
        {products.length > 1 && (
          <button
            onClick={() => setIsCompareOpen(true)}
            className="px-4 py-2 bg-white border-2 border-[#006FEE] text-[#006FEE] rounded-xl font-semibold hover:bg-[#F0F9FF] transition-colors flex items-center gap-2"
          >
            <Scale size={18} />
            Compare All
          </button>
        )}
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-600">
          Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </p>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={quantities[product.id] || 0}
              onUpdateQuantity={onUpdateQuantity}
              onQuickView={handleQuickView}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Battery size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No products found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Product Comparison Modal */}
      <ProductComparison
        products={products}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}