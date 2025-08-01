'use client';

import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Custom nameplate geometry that exactly matches the reference image
const NameplateGeometry = () => {
  return useMemo(() => {
    // Create the exact shape from the reference image
    const shape = new THREE.Shape();
    
    // Create the exact nameplate shape from your reference images
    // This matches the curved left side and straight right side design
    shape.moveTo(-50, -12);
    
    // Bottom edge - straight across
    shape.lineTo(42, -12);
    
    // Right edge - straight vertical with small radius corners
    shape.quadraticCurveTo(45, -12, 45, -9);
    shape.lineTo(45, 9);
    shape.quadraticCurveTo(45, 12, 42, 12);
    
    // Top edge - straight across most of the way
    shape.lineTo(-35, 12);
    
    // Distinctive curved left side that matches your reference
    // This creates the signature curved profile
    shape.quadraticCurveTo(-40, 12, -42, 8);
    shape.quadraticCurveTo(-46, 4, -48, 0);
    shape.quadraticCurveTo(-50, -4, -48, -8);
    shape.quadraticCurveTo(-46, -10, -44, -11);
    shape.quadraticCurveTo(-47, -12, -50, -12);
    
    // Extrude settings for proper 3D depth
    const extrudeSettings = {
      depth: 2.5,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.2,
      bevelSegments: 12,
      curveSegments: 32
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);
};

// Realistic stainless steel material
const StainlessSteelMaterial = () => {
  return useMemo(() => {
    // Create brushed metal texture pattern
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create horizontal brushed pattern
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    for (let i = 0; i < 100; i++) {
      const y = Math.random() * 256;
      const opacity = 0.1 + Math.random() * 0.3;
      gradient.addColorStop(y / 256, `rgba(255,255,255,${opacity})`);
    }
    
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 256);
    
    // Add fine horizontal lines for brushed effect
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 256; i += 2) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i + Math.random() * 2 - 1);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    
    return new THREE.MeshStandardMaterial({
      color: 0xc5c5c5,
      metalness: 0.95,
      roughness: 0.15,
      map: texture,
      envMapIntensity: 1.5,
      transparent: false
    });
  }, []);
};

// Engraved text material (darker, less reflective)
const EngravedTextMaterial = () => {
  return useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.3,
      roughness: 0.8,
      transparent: false
    });
  }, []);
};

// Main nameplate mesh component
const NameplateMesh = ({ children }) => {
  const meshRef = useRef();
  const geometry = NameplateGeometry();
  const material = StainlessSteelMaterial();
  
  return (
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow>
      {children}
    </mesh>
  );
};

// Engraved text component with proper depth
const EngravedText = ({ text, position, size = 4 }) => {
  const textRef = useRef();
  const material = EngravedTextMaterial();
  
  if (!text) return null;
  
  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={size}
      maxWidth={80}
      lineHeight={1}
      letterSpacing={0.02}
      textAlign="center"
      font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff"
      anchorX="center"
      anchorY="middle"
      material={material}
      outlineWidth={0.1}
      outlineColor="#000000"
    >
      {text}
    </Text>
  );
};

// Multi-line text layout for the nameplate
const EngravingLayout = ({ batteryData, text }) => {
  const lines = [];
  let yOffset = 5; // Start from top
  
  // Company name (largest, top)
  if (batteryData.companyName) {
    lines.push(
      <EngravedText
        key="company"
        text={batteryData.companyName}
        position={[0, yOffset, 0.3]}
        size={5}
      />
    );
    yOffset -= 8;
  }
  
  // Full name (medium, middle)
  const fullName = `${batteryData.firstName || ''} ${batteryData.lastName || ''}`.trim();
  if (fullName) {
    lines.push(
      <EngravedText
        key="name"
        text={fullName}
        position={[0, yOffset, 0.3]}
        size={3.5}
      />
    );
    yOffset -= 6;
  }
  
  // Contact info (smallest, bottom)
  const contacts = [batteryData.phoneNumber, batteryData.website].filter(Boolean);
  if (contacts.length > 0) {
    lines.push(
      <EngravedText
        key="contact"
        text={contacts.join(' • ')}
        position={[0, yOffset, 0.3]}
        size={2.5}
      />
    );
    yOffset -= 5;
  }
  
  // Fallback for direct text input
  if (!Object.values(batteryData).some(value => value) && text) {
    lines.push(
      <EngravedText
        key="fallback"
        text={text}
        position={[0, 0, 0.3]}
        size={4}
      />
    );
  }
  
  // Add "Theft Proof Engraving" subtitle
  lines.push(
    <EngravedText
      key="subtitle"
      text="Theft Proof Engraving"
      position={[0, -12, 0.3]}
      size={2}
    />
  );
  
  return <>{lines}</>;
};

// Professional lighting setup
const SceneLighting = () => {
  return (
    <>
      {/* Key light - main illumination from top-right */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Fill light - soften shadows */}
      <directionalLight
        position={[-5, 5, 0]}
        intensity={0.4}
        color="#ffffff"
      />
      
      {/* Rim light - edge definition */}
      <spotLight
        position={[0, 15, -10]}
        angle={Math.PI / 6}
        intensity={0.8}
        penumbra={0.2}
        castShadow
      />
      
      {/* Ambient light - overall soft illumination */}
      <ambientLight intensity={0.3} />
    </>
  );
};

// Main nameplate scene component
const NameplateScene = ({ batteryData, text, isDesignUpdating }) => {
  const groupRef = useRef();
  
  // Subtle animation for realism
  useFrame((state) => {
    if (groupRef.current) {
      // Very subtle breathing motion
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.01;
    }
  });
  
  return (
    <group ref={groupRef}>
      <SceneLighting />
      
      {/* Environment map for realistic reflections */}
      <Environment preset="warehouse" background={false} />
      
      {/* Main nameplate with engravings */}
      <NameplateMesh>
        <EngravingLayout batteryData={batteryData} text={text} />
      </NameplateMesh>
      
      {/* Invisible ground plane for shadow casting */}
      <mesh position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
    <div className="text-gray-500">Loading 3D Preview...</div>
  </div>
);

// Error boundary for Three.js
class ThreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Three.js Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 text-center">
            <div>3D Preview Unavailable</div>
            <div className="text-sm mt-1">Using fallback display</div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Main exported component
const ThreeJSNameplate = ({ 
  batteryData = {}, 
  text = '', 
  isDesignUpdating = false,
  width = '100%',
  height = '200px'
}) => {
  // Check for WebGL support
  const hasWebGL = useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }, []);
  
  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-yellow-700 text-center">
          <div>3D Preview Requires WebGL</div>
          <div className="text-sm mt-1">Please use a modern browser</div>
        </div>
      </div>
    );
  }
  
  return (
    <ThreeErrorBoundary>
      <div style={{ width, height }} className="rounded-lg overflow-hidden relative">
        {/* 3D Status Indicator */}
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs px-2 py-1 rounded">
          3D Active
        </div>
        <Canvas
          camera={{ 
            position: [0, 0, 80], 
            fov: 45,
            near: 0.1,
            far: 1000 
          }}
          shadows
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
          }}
          onCreated={({ gl }) => {
            try {
              if (gl && THREE) {
                gl.shadowMap.enabled = true;
                if (THREE.PCFSoftShadowMap) gl.shadowMap.type = THREE.PCFSoftShadowMap;
                if (THREE.SRGBColorSpace) gl.outputColorSpace = THREE.SRGBColorSpace;
                if (THREE.ACESFilmicToneMapping) gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.0;
              }
            } catch (error) {
              console.error('Error setting up WebGL:', error);
            }
          }}
        >
          <Suspense fallback={null}>
            <NameplateScene 
              batteryData={batteryData}
              text={text}
              isDesignUpdating={isDesignUpdating}
            />
          </Suspense>
          
          {/* Subtle camera controls for enhanced realism */}
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 2.8}
            autoRotate={false}
            rotateSpeed={0.5}
          />
        </Canvas>
      </div>
    </ThreeErrorBoundary>
  );
};

export default ThreeJSNameplate;