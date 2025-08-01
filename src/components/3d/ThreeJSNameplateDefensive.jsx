'use client';

import React, { Suspense, useRef, useMemo } from 'react';

// Defensive Three.js component with comprehensive error handling
const ThreeJSNameplateDefensive = ({ 
  batteryData = {}, 
  text = '', 
  isDesignUpdating = false,
  width = '100%',
  height = '200px'
}) => {
  // Check for required modules first
  const { isModuleReady, Canvas, useFrame, Text, Environment, OrbitControls, THREE } = useMemo(() => {
    try {
      console.log('🔍 Checking Three.js modules...');
      
      const fiberModule = require('@react-three/fiber');
      const dreiModule = require('@react-three/drei');
      const threeModule = require('three');
      
      if (!fiberModule.Canvas) throw new Error('Canvas not found');
      if (!fiberModule.useFrame) throw new Error('useFrame not found');
      if (!dreiModule.Text) throw new Error('Text not found');
      if (!dreiModule.Environment) throw new Error('Environment not found');
      if (!dreiModule.OrbitControls) throw new Error('OrbitControls not found');
      if (!threeModule.Shape) throw new Error('THREE.Shape not found');
      if (!threeModule.ExtrudeGeometry) throw new Error('THREE.ExtrudeGeometry not found');
      if (!threeModule.MeshStandardMaterial) throw new Error('THREE.MeshStandardMaterial not found');
      
      console.log('✅ All Three.js modules loaded successfully');
      
      return {
        isModuleReady: true,
        Canvas: fiberModule.Canvas,
        useFrame: fiberModule.useFrame,
        Text: dreiModule.Text,
        Environment: dreiModule.Environment,
        OrbitControls: dreiModule.OrbitControls,
        THREE: threeModule
      };
    } catch (error) {
      console.error('❌ Three.js module loading failed:', error);
      return {
        isModuleReady: false,
        error: error.message
      };
    }
  }, []);

  // If modules failed to load, return fallback immediately
  if (!isModuleReady) {
    return (
      <div style={{ width, height }} className="rounded-lg overflow-hidden relative bg-red-50 border border-red-200">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-red-600 text-center">
            <div className="text-lg font-semibold">3D Preview Unavailable</div>
            <div className="text-sm mt-2">Three.js modules failed to load</div>
            <div className="text-xs mt-1 text-red-500">Using fallback display</div>
          </div>
        </div>
      </div>
    );
  }

  // Check WebGL support
  const hasWebGL = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!(window.WebGLRenderingContext && context);
    } catch (e) {
      console.error('WebGL check failed:', e);
      return false;
    }
  }, []);

  if (!hasWebGL) {
    return (
      <div style={{ width, height }} className="rounded-lg overflow-hidden relative bg-yellow-50 border border-yellow-200">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-yellow-700 text-center">
            <div className="text-lg font-semibold">WebGL Required</div>
            <div className="text-sm mt-2">3D Preview requires WebGL support</div>
            <div className="text-xs mt-1">Please use a modern browser</div>
          </div>
        </div>
      </div>
    );
  }

  // Simple nameplate geometry
  const SimpleNameplateGeometry = () => {
    return useMemo(() => {
      try {
        // Create a simple rounded rectangle shape
        const shape = new THREE.Shape();
        
        const width = 90;
        const height = 24;
        const radius = 3;
        
        shape.moveTo(-width/2 + radius, -height/2);
        shape.lineTo(width/2 - radius, -height/2);
        shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
        shape.lineTo(width/2, height/2 - radius);
        shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
        shape.lineTo(-width/2 + radius, height/2);
        shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
        shape.lineTo(-width/2, -height/2 + radius);
        shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);
        
        const extrudeSettings = {
          depth: 2,
          bevelEnabled: true,
          bevelThickness: 0.2,
          bevelSize: 0.1,
          bevelSegments: 8
        };
        
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
      } catch (error) {
        console.error('Error creating geometry:', error);
        return new THREE.BoxGeometry(90, 24, 2);
      }
    }, [THREE]);
  };

  // Simple material
  const SimpleMaterial = () => {
    return useMemo(() => {
      try {
        return new THREE.MeshStandardMaterial({
          color: 0xc0c0c0,
          metalness: 0.8,
          roughness: 0.2
        });
      } catch (error) {
        console.error('Error creating material:', error);
        return null;
      }
    }, [THREE]);
  };

  // Simple nameplate mesh
  const SimpleNameplate = ({ children }) => {
    const meshRef = useRef();
    const geometry = SimpleNameplateGeometry();
    const material = SimpleMaterial();
    
    if (!geometry || !material) {
      return null;
    }
    
    return (
      <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow>
        {children}
      </mesh>
    );
  };

  // Simple text display
  const SimpleText = ({ displayText }) => {
    if (!displayText) return null;
    
    try {
      return (
        <Text
          position={[0, 0, 1.1]}
          fontSize={4}
          color="#333333"
          anchorX="center"
          anchorY="middle"
          maxWidth={80}
        >
          {displayText}
        </Text>
      );
    } catch (error) {
      console.error('Error creating text:', error);
      return null;
    }
  };

  // Simple scene component
  const SimpleScene = ({ displayText }) => {
    return (
      <>
        {/* Basic lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        {/* Nameplate */}
        <SimpleNameplate>
          <SimpleText displayText={displayText} />
        </SimpleNameplate>
        
        {/* Ground plane for shadows */}
        <mesh position={[0, 0, -3]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#f0f0f0" transparent opacity={0.5} />
        </mesh>
      </>
    );
  };

  // Generate display text
  const displayText = useMemo(() => {
    if (batteryData.companyName) return batteryData.companyName;
    const fullName = `${batteryData.firstName || ''} ${batteryData.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (text) return text;
    return 'FlexVolt Battery';
  }, [batteryData, text]);

  // Error boundary wrapper
  const ErrorBoundary = ({ children }) => {
    try {
      return children;
    } catch (error) {
      console.error('Render error:', error);
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 text-center">
            <div>Render Error</div>
            <div className="text-sm mt-1">3D preview failed</div>
          </div>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <div style={{ width, height }} className="rounded-lg overflow-hidden relative">
        {/* Status indicator */}
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded">
          3D Active (Safe Mode)
        </div>
        
        <Canvas
          camera={{ 
            position: [0, 0, 80], 
            fov: 45 
          }}
          shadows
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
          }}
          onError={(error) => {
            console.error('Canvas error:', error);
          }}
        >
          <Suspense fallback={null}>
            <SimpleScene displayText={displayText} />
          </Suspense>
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 2.8}
            autoRotate={false}
          />
        </Canvas>
      </div>
    </ErrorBoundary>
  );
};

export default ThreeJSNameplateDefensive;