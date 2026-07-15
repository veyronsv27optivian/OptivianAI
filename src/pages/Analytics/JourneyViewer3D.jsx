/**
 * JourneyViewer3D — Phase D4.7
 *
 * Immersive 3D visualization of user journeys through the platform.
 * Uses @react-three/fiber and @react-three/drei with Three.js.
 *
 * Features:
 *   - Interactive 3D globe with user activity nodes
 *   - Particle flow animations showing journey paths
 *   - Auto-rotation with mouse interaction
 *   - Click-to-inspect nodes
 *   - Hover tooltips with activity details
 *   - Dark/light mode aware
 */

import { useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Float,
  Html,
  Stars,
  MeshDistortMaterial,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  X, Map, ZoomIn, ZoomOut, RotateCw, Users, Activity,
  MousePointerClick, Maximize2, Minimize2,
} from 'lucide-react';

// ─── Demo Visualization Data ────────────────────────
// ⚠️ Replace with real analytics API data for production use.
// These are static examples showing the 3D visualization capability.

const JOURNEY_NODES = [
  { id: 'login', label: 'Login', lat: 40.7128, lng: -74.0060, color: '#3B82F6', users: 1240, avgTime: '12s' },
  { id: 'dashboard', label: 'Dashboard', lat: 48.8566, lng: 2.3522, color: '#10B981', users: 1180, avgTime: '2m' },
  { id: 'tasks', label: 'Tasks View', lat: 51.5074, lng: -0.1278, color: '#F59E0B', users: 920, avgTime: '4m' },
  { id: 'chat', label: 'Chat', lat: 35.6762, lng: 139.6503, color: '#8B5CF6', users: 850, avgTime: '6m' },
  { id: 'ai', label: 'AI Platform', lat: 37.7749, lng: -122.4194, color: '#EC4899', users: 620, avgTime: '8m' },
  { id: 'settings', label: 'Settings', lat: -33.8688, lng: 151.2093, color: '#6366F1', users: 340, avgTime: '3m' },
  { id: 'org', label: 'Organization', lat: 19.0760, lng: 72.8777, color: '#14B8A6', users: 280, avgTime: '5m' },
  { id: 'analytics', label: 'Analytics', lat: 41.9028, lng: 12.4964, color: '#F97316', users: 410, avgTime: '7m' },
  { id: 'files', label: 'File Manager', lat: 52.5200, lng: 13.4050, color: '#84CC16', users: 310, avgTime: '4m' },
  { id: 'admin', label: 'Admin Panel', lat: 55.7558, lng: 37.6173, color: '#EF4444', users: 150, avgTime: '10m' },
];

const JOURNEY_PATHS = [
  { from: 'login', to: 'dashboard', volume: 980, label: 'Main flow' },
  { from: 'dashboard', to: 'tasks', volume: 750, label: 'Task management' },
  { from: 'dashboard', to: 'chat', volume: 680, label: 'Communication' },
  { from: 'dashboard', to: 'ai', volume: 500, label: 'AI tools' },
  { from: 'tasks', to: 'chat', volume: 320, label: 'Task discussion' },
  { from: 'chat', to: 'tasks', volume: 280, label: 'Task creation' },
  { from: 'ai', to: 'analytics', volume: 250, label: 'Report view' },
  { from: 'dashboard', to: 'analytics', volume: 220, label: 'Analytics' },
  { from: 'dashboard', to: 'org', volume: 180, label: 'Org settings' },
  { from: 'dashboard', to: 'files', volume: 200, label: 'File access' },
  { from: 'tasks', to: 'files', volume: 150, label: 'Task files' },
  { from: 'dashboard', to: 'settings', volume: 280, label: 'Settings' },
  { from: 'admin', to: 'dashboard', volume: 100, label: 'Admin return' },
];

// ─── Lat/Lng to 3D position on a sphere ──────────────────────────

function latLngToPosition(lat, lng, radius = 2.8) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

// ─── Scene Node Component ─────────────────────────────────────────

function JourneyNode({ node, selected, onClick, hovered, onHover }) {
  const pos = useMemo(() => latLngToPosition(node.lat, node.lng), [node.lat, node.lng]);
  const meshRef = useRef();
  const [hoverTimer, setHoverTimer] = useState(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = 1 + 0.08 * Math.sin(clock.getElapsedTime() * 2 + node.id.charCodeAt(0));
      meshRef.current.scale.setScalar(selected ? 1.3 : pulse);
    }
  });

  const color = new THREE.Color(node.color);

  return (
    <group position={pos}>
      {/* Glow ring */}
      <mesh>
        <ringGeometry args={[0.35, 0.5, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={hovered || selected ? 0.6 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(node.id); }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[selected ? 0.3 : 0.2, 24, 24]} />
        <MeshDistortMaterial
          color={node.color}
          roughness={0.3}
          metalness={0.7}
          distort={0.15}
          speed={1.2}
          emissive={node.color}
          emissiveIntensity={hovered || selected ? 0.6 : 0.15}
        />
      </mesh>

      {/* Label */}
      {hovered && (
        <Html distanceFactor={8} center>
          <div className="bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 whitespace-nowrap text-xs">
            <div className="font-semibold mb-0.5">{node.label}</div>
            <div className="text-slate-300">{node.users} users · avg {node.avgTime}</div>
          </div>
        </Html>
      )}

      {/* Orbits */}
      {selected && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh>
            <ringGeometry args={[0.5, 0.55, 32]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </Float>
      )}
    </group>
  );
}

// ─── Path Line Between Nodes ──────────────────────────────────────

function JourneyPath({ from, to, volume, visible }) {
  const fromNode = JOURNEY_NODES.find(n => n.id === from);
  const toNode = JOURNEY_NODES.find(n => n.id === to);
  if (!fromNode || !toNode) return null;

  const start = useMemo(() => latLngToPosition(fromNode.lat, fromNode.lng), [fromNode.lat, fromNode.lng]);
  const end = useMemo(() => latLngToPosition(toNode.lat, toNode.lng), [toNode.lat, toNode.lng]);

  // Create curved path
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.6);
  const midLength = mid.length();
  mid.normalize().multiplyScalar(midLength + 0.5);

  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(30);

  const opacity = Math.min(0.15 + (volume / 980) * 0.35, 0.5);
  const color = new THREE.Color(fromNode.color);

  return (
    <group visible={visible}>
      <mesh>
        <tubeGeometry args={[curve, 30, 0.008 + (volume / 980) * 0.025, 8, false]} />
        <meshBasicMaterial
          color={fromNode.color}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
}

// ─── Particle System ──────────────────────────────────────────────

function ParticleField({ count = 200 }) {
  const particlesRef = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 1.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#93c5fd"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Connection Arrows ────────────────────────────────────────────

function AnimatedArrows({ visible }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const t = (clock.getElapsedTime() * 0.15 + i * 0.1) % 1;
        child.position.copy(child.userData.curve?.getPoint(t) || new THREE.Vector3());
      });
    }
  });

  const arrows = useMemo(() => {
    return JOURNEY_PATHS.filter((_, i) => i < 8).map((path) => {
      const fromNode = JOURNEY_NODES.find(n => n.id === path.from);
      const toNode = JOURNEY_NODES.find(n => n.id === path.to);
      if (!fromNode || !toNode) return null;
      const start = latLngToPosition(fromNode.lat, fromNode.lng);
      const end = latLngToPosition(toNode.lat, toNode.lng);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.6);
      const midLen = mid.length();
      mid.normalize().multiplyScalar(midLen + 0.5);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return { curve };
    }).filter(Boolean);
  }, []);

  return (
    <group ref={groupRef} visible={visible}>
      {arrows.map((a, i) => (
        <mesh key={i} userData={{ curve: a.curve }}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={JOURNEY_NODES[i]?.color || '#3B82F6'} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Inner 3D Scene ──────────────────────────────────────────────

function JourneyScene({ selectedNode, onNodeClick, isDark, showPaths }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  return (
    <>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={isDark ? 0.4 : 0.6} />
      <directionalLight position={[5, 5, 5]} intensity={isDark ? 0.8 : 1.2} />
      <pointLight position={[-3, -2, -5]} intensity={0.3} color="#6366F1" />

      {/* Stars background (space theme) */}
      <Stars
        radius={30}
        depth={50}
        count={isDark ? 2000 : 500}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Globe wireframe */}
      <mesh>
        <sphereGeometry args={[2.8, 48, 48]} />
        <meshBasicMaterial
          color={isDark ? '#1e3a5f' : '#bfdbfe'}
          wireframe
          transparent
          opacity={isDark ? 0.15 : 0.1}
        />
      </mesh>

      {/* Inner sphere glow */}
      <mesh>
        <sphereGeometry args={[2.75, 32, 32]} />
        <meshBasicMaterial
          color={isDark ? '#1e40af' : '#3b82f6'}
          transparent
          opacity={isDark ? 0.05 : 0.03}
        />
      </mesh>

      {/* Nodes */}
      {JOURNEY_NODES.map((node) => (
        <JourneyNode
          key={node.id}
          node={node}
          selected={selectedNode?.id === node.id}
          onClick={onNodeClick}
          hovered={hoveredNode === node.id}
          onHover={setHoveredNode}
        />
      ))}

      {/* Path connections */}
      {JOURNEY_PATHS.map((path, i) => (
        <JourneyPath
          key={`${path.from}-${path.to}`}
          from={path.from}
          to={path.to}
          volume={path.volume}
          visible={showPaths}
        />
      ))}

      {/* Animated particles */}
      <ParticleField count={isDark ? 300 : 150} />

      {/* Animated arrows */}
      <AnimatedArrows visible={showPaths} />

      {/* Orbit controls with bounds */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.5}
        rotateSpeed={0.4}
        zoomSpeed={0.8}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function JourneyViewer3D({ onClose }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showPaths, setShowPaths] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(5);
  // Detect dark mode
  const isDark = typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const totalUsers = useMemo(
    () => JOURNEY_NODES.reduce((sum, n) => sum + n.users, 0),
    [],
  );

  const handleNodeClick = (node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950'
    : 'w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50';

  return (
    <div className={containerClass}>
      {/* Header controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Map size={14} className="text-blue-500" />
              Journey Map
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-slate-400">{totalUsers.toLocaleString()} active users</span>
              <span className="text-[10px] text-slate-400">{JOURNEY_NODES.length} nodes</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="pointer-events-auto p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
        <button
          onClick={() => setShowPaths(!showPaths)}
          className="pointer-events-auto px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
        >
          <Activity size={12} />
          {showPaths ? 'Hide Paths' : 'Show Paths'}
        </button>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="pointer-events-auto p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Selected node detail panel */}
      {selectedNode && (
        <div className="absolute right-3 top-16 z-10 pointer-events-none">
          <div
            key={selectedNode.id}
            className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-xl w-56 animate-fade-in-up"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {selectedNode.label}
              </h4>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Users</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedNode.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg. Time</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedNode.avgTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedNode.lat.toFixed(1)}°, {selectedNode.lng.toFixed(1)}°
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-400">
                Click node to deselect · Drag to rotate · Scroll to zoom
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading fallback */}
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading 3D Journey Map...</p>
            </div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.setClearColor(isDark ? '#020617' : '#f0f9ff', 1);
          }}
        >
          <JourneyScene
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
            isDark={isDark}
            showPaths={showPaths}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
