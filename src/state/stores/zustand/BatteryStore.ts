import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Battery Types
export interface Battery {
  id: string
  name: string
  type: 'lithium' | 'lead-acid' | 'nickel-metal-hydride' | 'solid-state'
  capacity: number // in Ah
  voltage: number // in V
  price: number
  brand: string
  specifications: {
    cycleLife: number
    chargingTime: number // in hours
    temperature: {
      min: number
      max: number
    }
    weight: number // in kg
    dimensions: {
      length: number
      width: number
      height: number
    }
  }
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order'
  rating: number
  reviews: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface BatteryFilters {
  type?: string[]
  brand?: string[]
  priceRange?: {
    min: number
    max: number
  }
  capacityRange?: {
    min: number
    max: number
  }
  voltageRange?: {
    min: number
    max: number
  }
  availability?: string[]
  rating?: number
  search?: string
}

export interface BatteryComparison {
  batteries: Battery[]
  comparisonId: string
  createdAt: string
}

export interface BatteryState {
  // Data
  batteries: Battery[]
  filteredBatteries: Battery[]
  selectedBattery: Battery | null
  favoriteBatteries: string[]
  comparisons: BatteryComparison[]
  
  // UI State
  filters: BatteryFilters
  sortBy: 'price' | 'capacity' | 'rating' | 'name' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  viewMode: 'grid' | 'list' | 'table'
  loading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  itemsPerPage: number
  totalItems: number
  
  // Search
  searchQuery: string
  searchHistory: string[]
  
  // Actions
  setBatteries: (batteries: Battery[]) => void
  addBattery: (battery: Battery) => void
  updateBattery: (id: string, updates: Partial<Battery>) => void
  deleteBattery: (id: string) => void
  selectBattery: (battery: Battery | null) => void
  
  // Favorites
  toggleFavorite: (batteryId: string) => void
  getFavorites: () => Battery[]
  
  // Filtering & Sorting
  setFilters: (filters: Partial<BatteryFilters>) => void
  clearFilters: () => void
  setSorting: (sortBy: BatteryState['sortBy'], order: BatteryState['sortOrder']) => void
  applyFiltersAndSort: () => void
  
  // Search
  setSearchQuery: (query: string) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  
  // Comparison
  addToComparison: (battery: Battery) => string
  removeFromComparison: (comparisonId: string, batteryId: string) => void
  clearComparison: (comparisonId: string) => void
  getComparison: (comparisonId: string) => BatteryComparison | null
  
  // Pagination
  setPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  
  // UI
  setViewMode: (mode: BatteryState['viewMode']) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Utilities
  getBatteryById: (id: string) => Battery | undefined
  getBatteriesByType: (type: string) => Battery[]
  getBatteriesByBrand: (brand: string) => Battery[]
  getTopRatedBatteries: (limit?: number) => Battery[]
  searchBatteries: (query: string) => Battery[]
  
  // Analytics
  getAnalytics: () => {
    totalBatteries: number
    averagePrice: number
    averageRating: number
    typeDistribution: Record<string, number>
    brandDistribution: Record<string, number>
    availabilityDistribution: Record<string, number>
  }
}

// Helper functions
const applyFilters = (batteries: Battery[], filters: BatteryFilters): Battery[] => {
  return batteries.filter(battery => {
    // Type filter
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(battery.type)) return false
    }
    
    // Brand filter
    if (filters.brand && filters.brand.length > 0) {
      if (!filters.brand.includes(battery.brand)) return false
    }
    
    // Price range filter
    if (filters.priceRange) {
      if (battery.price < filters.priceRange.min || battery.price > filters.priceRange.max) {
        return false
      }
    }
    
    // Capacity range filter
    if (filters.capacityRange) {
      if (battery.capacity < filters.capacityRange.min || battery.capacity > filters.capacityRange.max) {
        return false
      }
    }
    
    // Voltage range filter
    if (filters.voltageRange) {
      if (battery.voltage < filters.voltageRange.min || battery.voltage > filters.voltageRange.max) {
        return false
      }
    }
    
    // Availability filter
    if (filters.availability && filters.availability.length > 0) {
      if (!filters.availability.includes(battery.availability)) return false
    }
    
    // Rating filter
    if (filters.rating && battery.rating < filters.rating) {
      return false
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableText = [
        battery.name,
        battery.brand,
        battery.type,
        ...battery.tags
      ].join(' ').toLowerCase()
      
      if (!searchableText.includes(searchLower)) return false
    }
    
    return true
  })
}

const applySorting = (
  batteries: Battery[], 
  sortBy: BatteryState['sortBy'], 
  order: BatteryState['sortOrder']
): Battery[] => {
  return [...batteries].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price
        break
      case 'capacity':
        comparison = a.capacity - b.capacity
        break
      case 'rating':
        comparison = a.rating - b.rating
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      default:
        comparison = 0
    }
    
    return order === 'asc' ? comparison : -comparison
  })
}

// Create the store
export const useBatteryStore = create<BatteryState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          batteries: [],
          filteredBatteries: [],
          selectedBattery: null,
          favoriteBatteries: [],
          comparisons: [],
          
          filters: {},
          sortBy: 'name',
          sortOrder: 'asc',
          viewMode: 'grid',
          loading: false,
          error: null,
          
          currentPage: 1,
          itemsPerPage: 20,
          totalItems: 0,
          
          searchQuery: '',
          searchHistory: [],
          
          // Actions
          setBatteries: (batteries) => {
            set((state) => {
              state.batteries = batteries
              state.totalItems = batteries.length
              state.applyFiltersAndSort()
            })
          },
          
          addBattery: (battery) => {
            set((state) => {
              state.batteries.push(battery)
              state.totalItems = state.batteries.length
              state.applyFiltersAndSort()
            })
          },
          
          updateBattery: (id, updates) => {
            set((state) => {
              const index = state.batteries.findIndex(b => b.id === id)
              if (index !== -1) {
                Object.assign(state.batteries[index], updates, {
                  updatedAt: new Date().toISOString()
                })
                state.applyFiltersAndSort()
              }
            })
          },
          
          deleteBattery: (id) => {
            set((state) => {
              state.batteries = state.batteries.filter(b => b.id !== id)
              state.favoriteBatteries = state.favoriteBatteries.filter(fId => fId !== id)
              state.totalItems = state.batteries.length
              
              if (state.selectedBattery?.id === id) {
                state.selectedBattery = null
              }
              
              state.applyFiltersAndSort()
            })
          },
          
          selectBattery: (battery) => {
            set((state) => {
              state.selectedBattery = battery
            })
          },
          
          // Favorites
          toggleFavorite: (batteryId) => {
            set((state) => {
              const index = state.favoriteBatteries.indexOf(batteryId)
              if (index === -1) {
                state.favoriteBatteries.push(batteryId)
              } else {
                state.favoriteBatteries.splice(index, 1)
              }
            })
          },
          
          getFavorites: () => {
            const state = get()
            return state.batteries.filter(b => state.favoriteBatteries.includes(b.id))
          },
          
          // Filtering & Sorting
          setFilters: (newFilters) => {
            set((state) => {
              Object.assign(state.filters, newFilters)
              state.currentPage = 1
              state.applyFiltersAndSort()
            })
          },
          
          clearFilters: () => {
            set((state) => {
              state.filters = {}
              state.currentPage = 1
              state.applyFiltersAndSort()
            })
          },
          
          setSorting: (sortBy, order) => {
            set((state) => {
              state.sortBy = sortBy
              state.sortOrder = order
              state.applyFiltersAndSort()
            })
          },
          
          applyFiltersAndSort: () => {
            set((state) => {
              let filtered = applyFilters(state.batteries, state.filters)
              filtered = applySorting(filtered, state.sortBy, state.sortOrder)
              state.filteredBatteries = filtered
              state.totalItems = filtered.length
            })
          },
          
          // Search
          setSearchQuery: (query) => {
            set((state) => {
              state.searchQuery = query
              state.filters.search = query
              state.currentPage = 1
              state.applyFiltersAndSort()
            })
          },
          
          addToSearchHistory: (query) => {
            set((state) => {
              if (query.trim() && !state.searchHistory.includes(query)) {
                state.searchHistory.unshift(query)
                state.searchHistory = state.searchHistory.slice(0, 10) // Keep last 10
              }
            })
          },
          
          clearSearchHistory: () => {
            set((state) => {
              state.searchHistory = []
            })
          },
          
          // Comparison
          addToComparison: (battery) => {
            const comparisonId = `comparison-${Date.now()}`
            set((state) => {
              state.comparisons.push({
                batteries: [battery],
                comparisonId,
                createdAt: new Date().toISOString()
              })
            })
            return comparisonId
          },
          
          removeFromComparison: (comparisonId, batteryId) => {
            set((state) => {
              const comparison = state.comparisons.find(c => c.comparisonId === comparisonId)
              if (comparison) {
                comparison.batteries = comparison.batteries.filter(b => b.id !== batteryId)
                if (comparison.batteries.length === 0) {
                  state.comparisons = state.comparisons.filter(c => c.comparisonId !== comparisonId)
                }
              }
            })
          },
          
          clearComparison: (comparisonId) => {
            set((state) => {
              state.comparisons = state.comparisons.filter(c => c.comparisonId !== comparisonId)
            })
          },
          
          getComparison: (comparisonId) => {
            const state = get()
            return state.comparisons.find(c => c.comparisonId === comparisonId) || null
          },
          
          // Pagination
          setPage: (page) => {
            set((state) => {
              state.currentPage = page
            })
          },
          
          setItemsPerPage: (items) => {
            set((state) => {
              state.itemsPerPage = items
              state.currentPage = 1
            })
          },
          
          // UI
          setViewMode: (mode) => {
            set((state) => {
              state.viewMode = mode
            })
          },
          
          setLoading: (loading) => {
            set((state) => {
              state.loading = loading
            })
          },
          
          setError: (error) => {
            set((state) => {
              state.error = error
            })
          },
          
          // Utilities
          getBatteryById: (id) => {
            const state = get()
            return state.batteries.find(b => b.id === id)
          },
          
          getBatteriesByType: (type) => {
            const state = get()
            return state.batteries.filter(b => b.type === type)
          },
          
          getBatteriesByBrand: (brand) => {
            const state = get()
            return state.batteries.filter(b => b.brand === brand)
          },
          
          getTopRatedBatteries: (limit = 10) => {
            const state = get()
            return [...state.batteries]
              .sort((a, b) => b.rating - a.rating)
              .slice(0, limit)
          },
          
          searchBatteries: (query) => {
            const state = get()
            return applyFilters(state.batteries, { search: query })
          },
          
          // Analytics
          getAnalytics: () => {
            const state = get()
            const batteries = state.batteries
            
            if (batteries.length === 0) {
              return {
                totalBatteries: 0,
                averagePrice: 0,
                averageRating: 0,
                typeDistribution: {},
                brandDistribution: {},
                availabilityDistribution: {}
              }
            }
            
            const totalPrice = batteries.reduce((sum, b) => sum + b.price, 0)
            const totalRating = batteries.reduce((sum, b) => sum + b.rating, 0)
            
            const typeDistribution: Record<string, number> = {}
            const brandDistribution: Record<string, number> = {}
            const availabilityDistribution: Record<string, number> = {}
            
            batteries.forEach(battery => {
              typeDistribution[battery.type] = (typeDistribution[battery.type] || 0) + 1
              brandDistribution[battery.brand] = (brandDistribution[battery.brand] || 0) + 1
              availabilityDistribution[battery.availability] = (availabilityDistribution[battery.availability] || 0) + 1
            })
            
            return {
              totalBatteries: batteries.length,
              averagePrice: totalPrice / batteries.length,
              averageRating: totalRating / batteries.length,
              typeDistribution,
              brandDistribution,
              availabilityDistribution
            }
          }
        }))
      ),
      {
        name: 'battery-store',
        partialize: (state) => ({
          favoriteBatteries: state.favoriteBatteries,
          searchHistory: state.searchHistory,
          viewMode: state.viewMode,
          itemsPerPage: state.itemsPerPage,
          comparisons: state.comparisons
        })
      }
    ),
    {
      name: 'battery-store'
    }
  )
)

// Selectors
export const useBatterySelectors = () => {
  const store = useBatteryStore()
  
  return {
    // Computed values
    paginatedBatteries: store.filteredBatteries.slice(
      (store.currentPage - 1) * store.itemsPerPage,
      store.currentPage * store.itemsPerPage
    ),
    
    totalPages: Math.ceil(store.totalItems / store.itemsPerPage),
    
    hasFilters: Object.keys(store.filters).length > 0,
    
    selectedBatteryIsFavorite: store.selectedBattery 
      ? store.favoriteBatteries.includes(store.selectedBattery.id)
      : false,
    
    filterStats: {
      total: store.batteries.length,
      filtered: store.filteredBatteries.length,
      showing: Math.min(store.itemsPerPage, store.filteredBatteries.length - (store.currentPage - 1) * store.itemsPerPage)
    }
  }
}