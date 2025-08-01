'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export function ProductSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-3 animate-pulse" />
            <div className="flex items-baseline gap-2 mb-1">
              <div className="h-8 bg-gray-200 rounded-md w-20 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-md w-16 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse" />
            </div>
          </div>
          <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-md flex-1 animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="flex items-center gap-2 w-full">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}