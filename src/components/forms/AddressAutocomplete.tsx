'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MapPin, Check, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAnimation, useStaggeredChildren } from '@/hooks/useAnimation'
import { useToast } from '@/hooks/useToast'
import { debounce } from 'lodash'

export interface AddressResult {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  formatted: string
  placeId?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface AddressAutocompleteProps {
  value: string
  onChange: (address: AddressResult) => void
  onInputChange?: (value: string) => void
  apiKey?: string
  countries?: string[]
  types?: 'address' | 'establishment' | 'geocode'
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  maxSuggestions?: number
  className?: string
  internationalFormat?: boolean
}

// Google Maps types declaration
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          AutocompleteService: any
          PlacesService: any
          PlacesServiceStatus: any
        }
      }
    }
  }
}

// Mock address suggestions for fallback
const generateMockSuggestions = (query: string): AddressResult[] => {
  if (query.length < 3) return []
  
  const mockAddresses: AddressResult[] = [
    {
      street: `${query} Main Street`,
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US',
      formatted: `${query} Main Street, San Francisco, CA 94102`,
      placeId: 'mock-1',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
      street: `${query} Oak Avenue`,
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
      formatted: `${query} Oak Avenue, Los Angeles, CA 90210`,
      placeId: 'mock-2',
      coordinates: { lat: 34.0522, lng: -118.2437 }
    },
    {
      street: `${query} Pine Road`,
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      formatted: `${query} Pine Road, New York, NY 10001`,
      placeId: 'mock-3',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      street: `${query} Cedar Lane`,
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      country: 'US',
      formatted: `${query} Cedar Lane, Miami, FL 33101`,
      placeId: 'mock-4',
      coordinates: { lat: 25.7617, lng: -80.1918 }
    },
    {
      street: `${query} Elm Street`,
      city: 'Austin',
      state: 'TX',
      zipCode: '73301',
      country: 'US',
      formatted: `${query} Elm Street, Austin, TX 73301`,
      placeId: 'mock-5',
      coordinates: { lat: 30.2672, lng: -97.7431 }
    }
  ]
  
  return mockAddresses.slice(0, 4)
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onInputChange,
  apiKey,
  countries = ['US'],
  types = 'address',
  placeholder = "Enter your address...",
  error,
  required = false,
  disabled = false,
  maxSuggestions = 5,
  className = '',
  internationalFormat = false,
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()
  const { style: dropdownStyle } = useAnimation('slideInDown', { 
    trigger: isOpen, 
    once: false 
  })
  const { getChildStyle } = useStaggeredChildren(suggestions.length, 50)

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    if (typeof window === 'undefined' || !apiKey) return Promise.resolve()

    // Check if already loaded
    if (window.google?.maps?.places) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Maps'))
      document.head.appendChild(script)
    })
  }, [apiKey])

  // Initialize Google Places services
  useEffect(() => {
    if (apiKey) {
      loadGoogleMapsScript()
        .then(() => {
          if (window.google?.maps?.places) {
            setAutocompleteService(new window.google.maps.places.AutocompleteService())
            const div = document.createElement('div')
            setPlacesService(new window.google.maps.places.PlacesService(div))
          }
        })
        .catch(error => {
          console.error('Failed to initialize Google Maps:', error)
          showToast({
            variant: 'error',
            title: 'Address Service Error',
            description: 'Failed to load address autocomplete service'
          })
        })
    }
  }, [apiKey, loadGoogleMapsScript, showToast])

  // Search for addresses
  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)

    // Use Google Places API if available
    if (autocompleteService && apiKey) {
      try {
        const request = {
          input: query,
          types: [types],
          componentRestrictions: { country: countries },
        }

        autocompleteService.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Get details for each prediction
            const detailPromises = predictions.slice(0, maxSuggestions).map(prediction => {
              return new Promise<AddressResult>((resolve) => {
                placesService?.getDetails(
                  {
                    placeId: prediction.place_id,
                    fields: ['address_components', 'geometry', 'formatted_address'],
                  },
                  (place, detailStatus) => {
                    if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                      const address = parseGooglePlaceResult(place)
                      resolve(address)
                    } else {
                      // Fallback if details fail
                      resolve({
                        street: prediction.structured_formatting.main_text,
                        city: '',
                        state: '',
                        zipCode: '',
                        country: '',
                        formatted: prediction.description,
                        placeId: prediction.place_id,
                      })
                    }
                  }
                )
              })
            })

            Promise.all(detailPromises).then(addresses => {
              setSuggestions(addresses)
              setIsOpen(true)
              setIsLoading(false)
            })
          } else {
            // Fallback to mock data
            const results = generateMockSuggestions(query)
            setSuggestions(results.slice(0, maxSuggestions))
            setIsOpen(results.length > 0)
            setIsLoading(false)
          }
        })
      } catch (error) {
        console.error('Google Places API error:', error)
        // Fallback to mock data
        const results = generateMockSuggestions(query)
        setSuggestions(results.slice(0, maxSuggestions))
        setIsOpen(results.length > 0)
        setIsLoading(false)
      }
    } else {
      // Use mock data when no API key
      const results = generateMockSuggestions(query)
      setSuggestions(results.slice(0, maxSuggestions))
      setIsOpen(results.length > 0)
      setIsLoading(false)
    }
  }, [autocompleteService, placesService, apiKey, types, countries, maxSuggestions])

  // Parse Google Place result into our format
  const parseGooglePlaceResult = (place: google.maps.places.PlaceResult): AddressResult => {
    const components = place.address_components || []
    const getComponent = (types: string[]) => {
      const component = components.find(c => 
        types.some(type => c.types.includes(type))
      )
      return component?.long_name || ''
    }

    const street = `${getComponent(['street_number'])} ${getComponent(['route'])}`.trim()
    const city = getComponent(['locality', 'sublocality'])
    const state = getComponent(['administrative_area_level_1'])
    const zipCode = getComponent(['postal_code'])
    const country = getComponent(['country'])

    return {
      street,
      city,
      state,
      zipCode,
      country,
      formatted: place.formatted_address || '',
      placeId: place.place_id,
      coordinates: place.geometry?.location ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      } : undefined,
    }
  }

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchAddresses(query)
    }, 300),
    [searchAddresses]
  )

  useEffect(() => {
    debouncedSearch(inputValue)
  }, [inputValue, debouncedSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsValidated(false)
    setSelectedIndex(-1)
    onInputChange?.(newValue)
  }

  const handleSelectAddress = (address: AddressResult) => {
    setInputValue(address.formatted)
    setIsOpen(false)
    setSelectedIndex(-1)
    setIsValidated(true)
    onChange(address)
    
    showToast({
      variant: 'success',
      title: 'Address Selected',
      description: `Selected: ${address.formatted}`
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectAddress(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const validateZipCode = (zipCode: string): boolean => {
    // US ZIP code validation (5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/
    return zipRegex.test(zipCode)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 3 && setIsOpen(suggestions.length > 0)}
          placeholder={placeholder}
          error={!!error}
          success={isValidated && !error}
          disabled={disabled}
          required={required}
          icon={
            isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-[#006FEE] border-t-transparent rounded-full" />
            ) : isValidated ? (
              <Check className="w-4 h-4 text-[#10B981]" />
            ) : (
              <Search className="w-4 h-4" />
            )
          }
          iconPosition="left"
          className="pr-12"
        />
        
        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {error && <AlertCircle className="w-4 h-4 text-[#EF4444]" />}
          {isValidated && !error && (
            <div className="w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-[#EF4444] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-[#E6F4FF] rounded-lg shadow-lg max-h-64 overflow-y-auto"
          style={dropdownStyle}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId || index}
              className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-[#F1F5F9] last:border-b-0 ${
                selectedIndex === index
                  ? 'bg-[#E6F4FF] border-l-4 border-l-[#006FEE]'
                  : 'hover:bg-[#F8FAFC]'
              }`}
              onClick={() => handleSelectAddress(suggestion)}
              style={getChildStyle(index)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#006FEE] mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#0A051E] truncate">
                    {suggestion.street}
                  </div>
                  <div className="text-sm text-[#64748B] truncate">
                    {suggestion.city}, {suggestion.state} {suggestion.zipCode}
                  </div>
                  
                  {/* Validation indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    {validateZipCode(suggestion.zipCode) ? (
                      <span className="text-xs text-[#10B981] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Valid ZIP
                      </span>
                    ) : (
                      <span className="text-xs text-[#F59E0B] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Verify ZIP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Powered by notice */}
          <div className="px-4 py-2 text-xs text-[#94A3B8] text-center border-t border-[#F1F5F9] bg-[#F8FAFC]">
            Address validation powered by Battery Department
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute z-40 w-full mt-2 bg-white border-2 border-[#E6F4FF] rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-center gap-3 text-[#64748B]">
            <div className="animate-spin w-5 h-5 border-2 border-[#006FEE] border-t-transparent rounded-full" />
            <span className="text-sm">Searching addresses...</span>
          </div>
        </div>
      )}
    </div>
  )
}