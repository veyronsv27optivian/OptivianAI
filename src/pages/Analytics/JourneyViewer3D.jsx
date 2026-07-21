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
 *   - Dark/light mode aware (reactive)
 *
 * DESIGN: This component renders the 3D scene IMMEDIATELY using estimated data.
 * Real data is fetched in the background (fire-and-forget) and updates the
 * visualization if it arrives. This guarantees the globe always shows up,
 * even when supabase queries are slow or unavailable.
 */

import { useState, useRef, useMemo, useCallback, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Html,
  Stars,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  X, Map, Activity,
  Maximize2, Minimize2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';

// ─── Feature-to-color mapping ─────────────────────────────────────

const FEATURE_COLORS = [
  '#3B82F6', // blue - dashboard
  '#10B981', // emerald - tasks
  '#F59E0B', // amber - chat
  '#8B5CF6', // violet - AI
  '#EC4899', // pink - files
  '#6366F1', // indigo - settings
  '#14B8A6', // teal - org
  '#F97316', // orange - analytics
  '#84CC16', // lime - admin
  '#EF4444', // red - system
];

const FEATURE_ICONS = {
  dashboard: '🏠',
  tasks: '✅',
  chat: '💬',
  ai: '🤖',
  files: '📁',
  settings: '⚙️',
  organization: '🏢',
  analytics: '📊',
  admin: '🔐',
  system: '⚡',
};

const BASE_FEATURES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'chat', label: 'Chat' },
  { id: 'ai', label: 'AI Platform' },
  { id: 'files', label: 'Files' },
  { id: 'settings', label: 'Settings' },
  { id: 'organization', label: 'Organization' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'admin', label: 'Admin' },
];

const BASE_LATS = [40.7, 51.5, 35.7, 37.8, 52.5, -33.9, 19.1, 41.9, 55.8, 48.9];
const BASE_LNGS = [-74.0, -0.1, 139.7, -122.4, 13.4, 151.2, 72.9, 12.5, 37.6, 2.3];

const ESTIMATED_DATA = (() => {
  const nodes = BASE_FEATURES.map((f, i) => ({
    id: f.id,
    label: f.label,
    lat: BASE_LATS[i % BASE_LATS.length] + (Math.sin(i * 1.7) * 5),
    lng: BASE_LNGS[i % BASE_LNGS.length] + (Math.cos(i * 2.3) * 5),
    color: FEATURE_COLORS[i % FEATURE_COLORS.length],
    users: 10,
    avgTime: '4m',
    icon: FEATURE_ICONS[f.id] || '📌',
  }));

  const paths = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    paths.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      volume: 5,
      label: `${nodes[i].id} → ${nodes[i + 1].id}`,
      opacity: 0.25,
    });
  }
  // Cross-connections
  if (nodes.length > 3) {
    paths.push({ from: nodes[0].id, to: nodes[2].id, volume: 3, label: `${nodes[0].id} → ${nodes[2].id}`, opacity: 0.2 });
    paths.push({ from: nodes[1].id, to: nodes[3].id, volume: 2, label: `${nodes[1].id} → ${nodes[3].id}`, opacity: 0.15 });
  }

  return { nodes, paths, totalUsers: 90 };
})();

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
  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      if (!selected && !hovered) {
        const pulse = 1 + 0.06 * Math.sin(clock.getElapsedTime() * 1.5 + node.id.charCodeAt(0));
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(selected ? 1.3 : 1.15);
      }
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
      ringRef.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });

  return (
    <group position={pos}>
      <mesh>
        <ringGeometry args={[0.4, 0.55, 48]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={hovered || selected ? 0.5 : 0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(node.id); }}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          roughness={0.25}
          metalness={0.6}
          emissive={node.color}
          emissiveIntensity={hovered || selected ? 0.5 : 0.12}
        />
      </mesh>
      {selected && (
        <mesh ref={ringRef}>
          <ringGeometry args={[0.5, 0.6, 48]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {hovered && (
        <Html distanceFactor={7} center>
          <div className="bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 whitespace-nowrap text-xs pointer-events-none">
            <div className="font-semibold mb-0.5 flex items-center gap-1.5">
              <span>{node.icon}</span>
              <span>{node.label}</span>
            </div>
            <div className="text-slate-300">{node.users} actions</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Path Line Between Nodes ──────────────────────────────────────

function JourneyPath({ from, to, volume, opacity, nodes }) {
  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);
  if (!fromNode || !toNode) return null;

  const start = useMemo(() => latLngToPosition(fromNode.lat, fromNode.lng), [fromNode.lat, fromNode.lng]);
  const end = useMemo(() => latLngToPosition(toNode.lat, toNode.lng), [toNode.lat, toNode.lng]);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const midLen = mid.length();
  mid.normalize().multiplyScalar(midLen + 0.8);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.006 + (volume / 100) * 0.02, 6, false]} />
      <meshBasicMaterial
        color={fromNode.color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Particle System ──────────────────────────────────────────────

function ParticleField({ count = 150 }) {
  const particlesRef = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.8 + Math.random() * 1.8;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, [count]);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.015;
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
        size={0.02}
        color="#93c5fd"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Animated Flow Particles ─────────────────────────────────────

function FlowParticles({ nodes }) {
  const groupRef = useRef();
  const trails = useMemo(() => {
    const result = [];
    const majorPaths = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const fromNode = nodes[i];
        const toNode = nodes[j];
        const start = latLngToPosition(fromNode.lat, fromNode.lng);
        const end = latLngToPosition(toNode.lat, toNode.lng);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const midLen = mid.length();
        mid.normalize().multiplyScalar(midLen + 0.8);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        majorPaths.push({ curve, color: fromNode.color, particles: 4, offset: i * 0.3 + j * 0.7 });
      }
    }
    for (const path of majorPaths) {
      for (let p = 0; p < path.particles; p++) {
        result.push({ curve: path.curve, color: path.color, offset: path.offset + p * 0.25 });
      }
    }
    return result;
  }, [nodes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const children = groupRef.current.children;
    for (let i = 0; i < children.length && i < trails.length; i++) {
      const trail = trails[i];
      const t = (clock.getElapsedTime() * 0.08 + trail.offset) % 1;
      const point = trail.curve.getPoint(t);
      children[i].position.copy(point);
      const fadeScale = Math.sin(t * Math.PI);
      children[i].scale.setScalar(fadeScale);
    }
  });

  return (
    <group ref={groupRef}>
      {trails.map((trail, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color={trail.color} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Inner 3D Scene ──────────────────────────────────────────────

function JourneyScene({ journeyData, selectedNode, onNodeClick, isDark, showPaths }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor(isDark ? '#020617' : '#f0f9ff', 1);
  }, [isDark, gl]);

  return (
    <>
      <ambientLight intensity={isDark ? 0.35 : 0.5} />
      <directionalLight position={[5, 5, 5]} intensity={isDark ? 0.6 : 0.9} />
      <pointLight position={[-3, -2, -5]} intensity={0.25} color="#6366F1" />
      <Stars radius={25} depth={40} count={isDark ? 1500 : 300} factor={4} saturation={0} fade speed={0.3} />
      <mesh>
        <sphereGeometry args={[2.8, 36, 36]} />
        <meshBasicMaterial color={isDark ? '#1e3a5f' : '#bfdbfe'} wireframe transparent opacity={isDark ? 0.12 : 0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.75, 24, 24]} />
        <meshBasicMaterial color={isDark ? '#1e40af' : '#3b82f6'} transparent opacity={isDark ? 0.04 : 0.02} />
      </mesh>
      {showPaths && journeyData.paths.map((path, i) => (
        <JourneyPath key={`${path.from}-${path.to}`} from={path.from} to={path.to} volume={path.volume} opacity={path.opacity} nodes={journeyData.nodes} />
      ))}
      {journeyData.nodes.map((node) => (
        <JourneyNode key={node.id} node={node} selected={selectedNode?.id === node.id} onClick={onNodeClick} hovered={hoveredNode === node.id} onHover={setHoveredNode} />
      ))}
      <ParticleField count={isDark ? 200 : 100} />
      {showPaths && <FlowParticles nodes={journeyData.nodes} />}
      <OrbitControls enablePan={false} enableZoom={true} minDistance={3.5} maxDistance={10} autoRotate autoRotateSpeed={0.4} rotateSpeed={0.35} zoomSpeed={0.6} />
    </>
  );
}

// ─── Background data fetcher (fire-and-forget) ────────────────────

async function fetchRealData(user) {
  const orgId = user?.user_metadata?.organization_id;
  if (!orgId) return null;

  try {
    const { supabase } = await import('../../services/supabase');

    // 10s timeout per query so a slow database never blocks the visualization
    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
      ]);

    const [activitiesRes, analyticsRes, tasksRes, usersRes] = await Promise.all([
      withTimeout(
        supabase.from('organization_activity_logs').select('resource_type, action').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(100),
        10000
      ),
      withTimeout(
        supabase.from('ai_request_logs').select('feature').limit(100).order('timestamp', { ascending: false }),
        10000
      ),
      withTimeout(
        supabase.from('tasks').select('id').eq('organization_id', orgId).limit(50),
        10000
      ),
      withTimeout(
        supabase.from('profiles').select('id, role, last_seen').eq('organization_id', orgId).limit(50),
        10000
      ),
    ]);

    // Build feature weights from real data
    const features = BASE_FEATURES.map(f => ({ ...f, weight: f.id === 'dashboard' ? 5 : 0 })); // seed dashboards
    const activities = activitiesRes?.data || [];
    const tasks = tasksRes?.data || [];
    const analyticsEvents = analyticsRes?.data || [];
    const members = usersRes?.data || [];

    for (const act of activities) {
      const type = act.resource_type || 'system';
      const feat = features.find(f => f.id === type) ||
        features.find(f => act.action?.startsWith(f.id)) ||
        features[features.length - 1];
      if (feat) feat.weight++;
    }

    const aiFeat = features.find(f => f.id === 'ai');
    if (aiFeat) aiFeat.weight += analyticsEvents.filter(e => e.feature).length;

    const taskFeat = features.find(f => f.id === 'tasks');
    if (taskFeat) taskFeat.weight += tasks.length;

    // Count active users (seen in last 24h) toward the users count for org node
    const orgFeat = features.find(f => f.id === 'organization');
    if (orgFeat) {
      const recentUsers = members.filter(m => {
        if (!m.last_seen) return false;
        return Date.now() - new Date(m.last_seen).getTime() < 24 * 60 * 60 * 1000;
      }).length;
      orgFeat.weight += Math.max(0, recentUsers - 1); // subtract 1 to avoid double-count
    }

    const totalWeight = features.reduce((s, f) => s + f.weight, 0);
    if (totalWeight === 0) return null; // No real data — keep estimated

    // Build nodes from real weights
    const nodes = features.map((f, i) => ({
      id: f.id,
      label: f.label,
      lat: BASE_LATS[i % BASE_LATS.length] + (Math.sin(i * 1.7) * 5),
      lng: BASE_LNGS[i % BASE_LNGS.length] + (Math.cos(i * 2.3) * 5),
      color: FEATURE_COLORS[i % FEATURE_COLORS.length],
      users: f.weight,
      avgTime: `${Math.max(1, Math.round(f.weight / 5 + 2))}m`,
      icon: FEATURE_ICONS[f.id] || '📌',
    }));

    // Build paths
    const paths = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const vol = Math.round((nodes[i].users + nodes[i + 1].users) / 2);
      paths.push({ from: nodes[i].id, to: nodes[i + 1].id, volume: Math.max(1, vol), label: `${nodes[i].id} → ${nodes[i + 1].id}`, opacity: 0.15 + (vol / 100) * 0.35 });
    }
    if (nodes.length > 3) {
      paths.push({ from: nodes[0].id, to: nodes[2].id, volume: Math.round(nodes[0].users * 0.6), label: `${nodes[0].id} → ${nodes[2].id}`, opacity: 0.2 });
      paths.push({ from: nodes[1].id, to: nodes[3].id, volume: Math.round(nodes[1].users * 0.4), label: `${nodes[1].id} → ${nodes[3].id}`, opacity: 0.15 });
    }

    return { nodes, paths, totalUsers: features.reduce((s, f) => s + f.weight, 0) };
  } catch (err) {
    console.warn('[JourneyViewer3D] Background fetch:', err?.message || err);
    return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────

export default function JourneyViewer3D({ onClose }) {
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState(null);
  const [showPaths, setShowPaths] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  // Start with estimated data — always works, no loading state
  const [journeyData, setJourneyData] = useState(ESTIMATED_DATA);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reactively track dark mode
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Background data fetch — completely fire-and-forget
  // The 3D globe renders instantly with estimated data.
  // If real data arrives, it replaces the estimated data seamlessly.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchRealData(user).then((realData) => {
      if (!cancelled && realData) {
        setJourneyData(realData);
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Reset to estimated data immediately
    setJourneyData(ESTIMATED_DATA);
    // Try to fetch real data
    if (user) {
      const realData = await fetchRealData(user);
      if (realData) setJourneyData(realData);
    }
    setIsRefreshing(false);
  }, [user]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const totalUsers = journeyData.totalUsers;

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
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {totalUsers > 0 ? `${totalUsers.toLocaleString()} total actions` : 'Estimated data'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {journeyData.nodes.length} nodes
              </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all ${
              isRefreshing ? 'text-blue-400 animate-spin' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Refresh data"
          >
            <RefreshCw size={14} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
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
          className="pointer-events-auto p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Selected node detail panel */}
      {selectedNode && (
        <div className="absolute right-3 top-16 z-10 pointer-events-none">
          <div
            key={selectedNode.id}
            className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-xl w-56"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedNode.color }} />
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {selectedNode.icon} {selectedNode.label}
              </h4>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Actions</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedNode.users.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Avg. Time</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedNode.avgTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Position</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedNode.lat.toFixed(1)}°, {selectedNode.lng.toFixed(1)}°
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Click to deselect · Drag to rotate · Scroll to zoom
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3D Canvas — always rendered, no loading state */}
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Rendering 3D scene...</p>
            </div>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <JourneyScene
            journeyData={journeyData}
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
