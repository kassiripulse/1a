/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

// Natively handles Polyline for real Google Maps if APIProvider is loaded
function GoogleMapPolyline({ path, strokeColor = '#059669', strokeWidth = 5 }: { path: Array<{ lat: number; lng: number }>; strokeColor?: string; strokeWidth?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google) return;
    const poly = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor,
      strokeOpacity: 1.0,
      strokeWeight: strokeWidth,
      map,
    });
    return () => {
      poly.setMap(null);
    };
  }, [map, path, strokeColor, strokeWidth]);
  return null;
}

interface DodoLiveGoogleMapProps {
  simulationProgress?: number; // 0 to 100
  height?: string;
  viewMode?: 'client' | 'driver' | 'driver_mission';
  restaurantId?: string;
  restaurantName?: string;
  className?: string;
  showFullRouteTracing?: boolean;
}

export default function DodoLiveGoogleMap({
  simulationProgress = 0,
  height = "190px",
  viewMode = 'client',
  restaurantName = "Chez Fatou",
  className = "",
  showFullRouteTracing = false,
}: DodoLiveGoogleMapProps) {
  
  // Read key from process.env, Vite public, or LocalStorage
  const API_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    localStorage.getItem('GOOGLE_MAPS_PLATFORM_KEY') ||
    '';

  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  // Coords for Maquis Chez Fatou & Customer (1200 Logements, Ouagadougou)
  const fatouCoords = { lat: 12.3789, lng: -1.5147 };
  const clientCoords = { lat: 12.3685, lng: -1.4985 };

  // Smooth glider state animation loop for simulationProgress
  const [animatedProgress, setAnimatedProgress] = useState(simulationProgress);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setAnimatedProgress((prev) => {
        if (Math.abs(prev - simulationProgress) < 0.1) {
          return simulationProgress;
        }
        // Smooth ease-out sliding effect
        const diff = simulationProgress - prev;
        const step = diff * 0.05; // 5% of distance per frame (very smooth gliding)
        animationFrameId = requestAnimationFrame(animate);
        return prev + step;
      });
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [simulationProgress]);

  // Calculate remaining ETA based on the smooth animated progress (starts at 25 mins down to 0)
  const minutesRemaining = Math.max(0, Math.ceil(((100 - animatedProgress) / 100) * 25));

  // Calculate live position of the delivery rider based on animated progress (0 to 100)
  const getSimulatedRiderCoords = (progressPct: number) => {
    const ratio = progressPct / 100;
    // Walk along simulated roads (L-shape to make it look like tracking streets)
    if (ratio < 0.5) {
      // First leg (southwards)
      const subRatio = ratio / 0.5;
      return {
        lat: fatouCoords.lat + (clientCoords.lat - fatouCoords.lat) * subRatio,
        lng: fatouCoords.lng
      };
    } else {
      // Second leg (eastwards)
      const subRatio = (ratio - 0.5) / 0.5;
      return {
        lat: clientCoords.lat,
        lng: fatouCoords.lng + (clientCoords.lng - fatouCoords.lng) * subRatio
      };
    }
  };

  const riderCoords = getSimulatedRiderCoords(animatedProgress);

  // Boolean flags to clean up conditional queries for different styles of views
  const isDriverView = viewMode === 'driver';
  const isDriverMissionView = viewMode === 'driver_mission';
  const showRestaurantPin = !isDriverView || showFullRouteTracing || isDriverMissionView;
  const showClientPin = !isDriverMissionView && (!isDriverView || showFullRouteTracing);
  const showConnectingRoute = !isDriverMissionView && (!isDriverView || showFullRouteTracing);
  const showRiderMarker = !isDriverMissionView && (!isDriverView || showFullRouteTracing);

  // Outer Wrapper with Flex Column to stack ETA header above the map viewport
  return (
    <div 
      className={`flex flex-col w-full rounded-2xl overflow-hidden border border-gray-250 bg-white shadow-sm font-sans ${className}`}
      style={{ height }}
    >
      {/* ⏱️ Temps restant estimé (ETA) Indicator above the Map */}
      {!isDriverMissionView && (
        <div className="bg-slate-950 px-4 py-2.5 flex flex-col gap-2 text-white shrink-0 shadow-sm relative z-20 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 font-bold">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E52327]"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-200">
                {isDriverView ? 'Itinéraire Livreur (GPS)' : 'Suivi de commande Dodo'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#E52327]/10 border border-[#E52327]/30 px-2.5 py-0.5 rounded-full text-[11px] font-black">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wide">Échéance :</span>
              <span className="text-[#E52327] animate-pulse">~{minutesRemaining} min</span>
            </div>
          </div>

          {/* Uber Eats Scooter milestones stepper */}
          <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-black select-none pt-0.5">
            <div className={`py-1 rounded-l-md transition duration-300 font-extrabold ${animatedProgress < 25 ? 'bg-[#E52327] text-white animate-pulse' : 'bg-slate-800/80 text-gray-500'}`}>
              🍳 En cuisine
            </div>
            <div className={`py-1 transition duration-300 font-extrabold ${animatedProgress >= 25 && animatedProgress < 90 ? 'bg-amber-500 text-slate-950 animate-pulse' : animatedProgress >= 90 ? 'bg-slate-800/80 text-gray-500' : 'bg-slate-800/50 text-gray-650'}`}>
              🏍️ En route
            </div>
            <div className={`py-1 rounded-r-md transition duration-300 font-extrabold ${animatedProgress >= 90 ? 'bg-emerald-600 text-white animate-bounce' : 'bg-slate-800/50 text-gray-650'}`}>
              🏁 Arrivé
            </div>
          </div>
        </div>
      )}

      {/* Map Viewport Field */}
      <div className="flex-1 relative w-full overflow-hidden bg-slate-100">
        
        {/* FALLBACK MODE: DEMO OUAGA VECTOR MAP */}
        {!hasValidKey ? (
          <div className="absolute inset-0 w-full h-full select-none bg-[#EAEAED]">
            {/* Mock Streets Design */}
            <div className="absolute inset-0 opacity-45 bg-[#EAEAED]">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="40" x2="400" y2="40" stroke="#FFFFFF" strokeWidth="8" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#FFFFFF" strokeWidth="12" />
                <line x1="0" y1="210" x2="400" y2="190" stroke="#FFFFFF" strokeWidth="6" />
                <line x1="80" y1="0" x2="80" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                <line x1="220" y1="0" x2="220" y2="300" stroke="#FFFFFF" strokeWidth="8" />
                <line x1="310" y1="0" x2="310" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                <circle cx="150" cy="110" r="75" fill="none" stroke="#FFFFFF" strokeWidth="7" />
              </svg>
            </div>

            {/* Route Connecting path */}
            {showConnectingRoute && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Dashed background path */}
                <path 
                  d="M 80,45 L 80,120 L 220,120 L 220,195" 
                  fill="none" 
                  stroke="#E52327" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeDasharray="6 3"
                  className={animatedProgress >= 100 ? "opacity-30" : "animate-pulse"}
                />
                
                {/* Completed Trajectory solid polyline once fully or partially traveled */}
                <path 
                  d="M 80,45 L 80,120 L 220,120 L 220,195" 
                  fill="none" 
                  stroke="#059669" 
                  strokeWidth="5" 
                  strokeLinecap="round" 
                  strokeDashoffset={100 - animatedProgress}
                  className="transition-all duration-300"
                  style={{
                    strokeDasharray: "300",
                    strokeDashoffset: `${300 - (300 * (animatedProgress / 100))}`
                  }}
                />
              </svg>
            )}

            {/* Informative Config Badge */}
            <div className="absolute top-2.5 right-2 px-2 py-0.5 bg-slate-900/80 text-[8px] text-amber-300 font-bold rounded flex items-center gap-1 shadow-md z-10">
              <span>💡 Mode Démo (Maquette d'Ouaga)</span>
            </div>

            {/* Coordinates Label Overlay */}
            <div className="absolute bottom-2 left-2 bg-slate-950/70 text-white font-mono text-[7.5px] px-1.5 py-0.5 rounded shadow-sm z-10">
              Lat/Lng: 12.3789° N, 1.5147° W
            </div>

            {/* Place Markers mockups */}
            {/* 1. Restaurant Pin */}
            {showRestaurantPin && (
              <div className="absolute top-[32px] left-[62px] flex flex-col items-center">
                <div className="bg-[#E52327] text-white p-1 rounded-full shadow-lg border border-white flex items-center justify-center font-bold text-xs scale-90">
                  🍳
                </div>
                <span className="bg-white text-[7.5px] font-black tracking-tight text-gray-950 px-1 py-0.2 rounded shadow-2xs border border-gray-100 mt-0.5">
                  {restaurantName}
                </span>
              </div>
            )}

            {/* 2. Client Pin */}
            {showClientPin && (
              <div className="absolute top-[182px] left-[202px] flex flex-col items-center">
                <div className="bg-emerald-600 text-white p-1 rounded-full shadow-lg border border-white flex items-center justify-center font-bold text-xs scale-90">
                  🏠
                </div>
                <span className="bg-white text-[7.5px] font-black tracking-tight text-gray-950 px-1 py-0.2 rounded shadow-2xs border border-gray-100 mt-0.5">
                  Client (Burkina Traoré)
                </span>
              </div>
            )}

            {/* 3. Rider Icon with smooth transition path */}
            {showRiderMarker && (
              (() => {
                // Coordinate points mapping on the mock canvas
                const p1 = { x: 80, y: 45 };
                const p2 = { x: 80, y: 120 };
                const p3 = { x: 220, y: 120 };
                const p4 = { x: 220, y: 195 };

                let rx = p1.x;
                let ry = p1.y;

                const ratio = animatedProgress / 100;
                if (ratio < 0.33) {
                  const sub = ratio / 0.33;
                  rx = p1.x;
                  ry = p1.y + (p2.y - p1.y) * sub;
                } else if (ratio < 0.66) {
                  const sub = (ratio - 0.33) / 0.33;
                  rx = p2.x + (p3.x - p2.x) * sub;
                  ry = p2.y;
                } else {
                  const sub = (ratio - 0.66) / 0.34;
                  rx = p3.x;
                  ry = p3.y + (p4.y - p3.y) * sub;
                }

                return (
                  <div 
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${rx}px`, top: `${ry}px` }}
                  >
                    <div className="w-6.5 h-6.5 bg-yellow-400 text-slate-900 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs animate-bounce">
                      🏍️
                    </div>
                  </div>
                );
              })()
            )}

            {/* If viewMode is driver navigation and we do not show full tracing: center pin shows static route tracker */}
            {isDriverView && !showFullRouteTracing && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs">
                  🏍️
                </div>
                <div className="bg-white text-[7.5px] font-black tracking-tight text-gray-950 px-1 py-0.2 rounded shadow-2xs border border-gray-100 mt-2">
                  En route...
                </div>
              </div>
            )}

          </div>
        ) : (
          /* INTERACTIVE REAL GOOGLE MAPS COMPONENT */
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={{ lat: 12.3737, lng: -1.5066 }} 
              defaultZoom={14}
              mapId="DODO_DELIVERY_TRACK"
              gestureHandling="cooperative"
              disableDefaultUI={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Restaurant Marker */}
              {showRestaurantPin && (
                <AdvancedMarker position={fatouCoords} title={restaurantName}>
                  <div className="bg-[#E52327] text-white p-1.5 rounded-full shadow-lg border border-white flex items-center justify-center text-center font-bold text-lg hover:scale-110 transition cursor-pointer">
                    🍳
                  </div>
                </AdvancedMarker>
              )}

              {/* Client Marker */}
              {showClientPin && (
                <AdvancedMarker position={clientCoords} title="Client">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border border-white flex items-center justify-center text-center font-bold text-lg hover:scale-110 transition cursor-pointer">
                    🏠
                  </div>
                </AdvancedMarker>
              )}

              {/* Dynamic Polylines on real Google Map */}
              {showConnectingRoute && (
                <>
                  <GoogleMapPolyline 
                    path={[fatouCoords, { lat: clientCoords.lat, lng: fatouCoords.lng }, clientCoords]} 
                    strokeColor="#fca5a5"
                    strokeWidth={3}
                  />
                  <GoogleMapPolyline 
                    path={(() => {
                      const travelled = [fatouCoords];
                      const ratio = animatedProgress / 100;
                      if (ratio >= 0.5) {
                        travelled.push({ lat: clientCoords.lat, lng: fatouCoords.lng });
                      }
                      travelled.push(riderCoords);
                      return travelled;
                    })()} 
                    strokeColor="#059669"
                    strokeWidth={5}
                  />
                </>
              )}

              {/* Delivery Rider Marker with GLIDING motion coordinates */}
              {showRiderMarker && (
                <AdvancedMarker position={riderCoords} title="Livreur Dodo">
                  <div className="bg-yellow-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-center font-bold text-lg hover:scale-115 transition animate-pulse">
                    🏍️
                  </div>
                </AdvancedMarker>
              )}

              {/* Driver-centric navigation circle pin if no full route checked */}
              {isDriverView && !showFullRouteTracing && (
                <AdvancedMarker position={riderCoords} title="Ma Position (Glissement Live)">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-ping"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-xs">
                      🏍️
                    </div>
                  </div>
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        )}

        {/* Floating Simulation Stats Label Overlay */}
        {viewMode !== 'driver_mission' && (
          <div className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-xs text-[10px] text-white font-bold p-2.5 rounded-xl border border-slate-800 shadow-lg pointer-events-none select-none z-10 max-w-[130px] leading-tight flex flex-col gap-0.5">
            <span className="text-[8px] text-emerald-400 font-extrabold tracking-wider uppercase">📡 GPS GLISSANT ACTIF</span>
            <span className="font-semibold text-gray-300 mt-1">Progression : {Math.round(animatedProgress)}%</span>
          </div>
        )}

      </div>
    </div>
  );
}
