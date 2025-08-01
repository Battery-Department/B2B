'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ContractorResult {
  contractorName: string;
  success: boolean;
  imageBase64?: string;
  error?: string;
}

export default function TestBatteryCustomization() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ContractorResult[]>([]);
  const [error, setError] = useState<string>('');

  const testContractors = [
    { name: 'RH White', logoUrl: 'https://rhwhite.com/logo.png', phoneNumber: '(555) 123-4567' },
    { name: 'GLC CMA', logoUrl: 'https://glccma.com/logo.png', phoneNumber: '(555) 234-5678' },
    { name: 'Mid-State Kitchens', logoUrl: 'https://mid-statekitchens.com/logo.png', phoneNumber: '(555) 345-6789' },
  ];

  const handleTestCustomization = async () => {
    setLoading(true);
    setError('');
    setResults([]);

    try {
      // Get the battery base image (you'll need to provide this)
      const batteryImageUrl = '/images/battery-base.png'; // Update this path

      const response = await fetch('/api/battery/customize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractors: testContractors,
          batteryImageUrl: batteryImageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        setResults(data.results);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to customize batteries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Battery Customization Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the OpenAI image edit API for battery customization
          </p>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={handleTestCustomization}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Test Battery Customization'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{result.contractorName}</h3>
                  {result.success ? (
                    <>
                      <p className="text-green-600 text-sm mb-4">✓ Successfully customized</p>
                      {result.imageBase64 && (
                        <div className="relative aspect-square bg-gray-100 rounded">
                          <img
                            src={`data:image/png;base64,${result.imageBase64}`}
                            alt={`Customized battery for ${result.contractorName}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-600 text-sm">
                      ✗ Failed: {result.error || 'Unknown error'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Ensure your OpenAI API key is set in <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
            <li>Place your battery base image at <code className="bg-gray-100 px-2 py-1 rounded">/public/images/battery-base.png</code></li>
            <li>The API will attempt to fetch logos from the contractor websites</li>
            <li>Logos will be converted to black and white for engraving</li>
            <li>Phone numbers will be added to the right side of the nameplate</li>
          </ol>
        </div>

        {/* Python Script Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Using the Python Script:</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
            <code>{`# Install dependencies
pip install requests beautifulsoup4

# Run the scraper and customizer
python scripts/contractor-battery-customizer.py

# The script will:
# 1. Scrape contractor websites for logos and phone numbers
# 2. Save the data to contractors_scraped_data.json
# 3. Call the API to create customized batteries
# 4. Save the results as PNG files`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}