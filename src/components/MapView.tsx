import React, { useEffect, useState, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Tooltip, 
  Polygon, 
  Circle, 
  Polyline, 
  Rectangle, 
  LayersControl, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { LocationPoint, DrawnShape, ShapeType } from '../types';
import { 
  Star, 
  Maximize, 
  Minimize, 
  Navigation, 
  Edit3, 
  Check, 
  X, 
  Trash2
} from 'lucide-react';

// Import Leaflet styles
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  points: LocationPoint[];
  selectedPoint: LocationPoint | null;
  onSelectPoint: (point: LocationPoint) => void;
  drawnShapes: DrawnShape[];
  onAddDrawnShape: (shape: DrawnShape) => void;
  onDeleteDrawnShape: (id: string) => void;
  userLocation: [number, number] | null;
  onSetUserLocation: (coords: [number, number] | null) => void;
  mapCenter: [number, number] | null;
}

/**
 * Controller to handle panning/flying the map to coordinates
 */
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [center, map]);
  return null;
}

/**
 * Helper component to pan and zoom the map to a cluster center coordinates
 */
function ZoomToCluster({ center, zoomLevel }: { center: [number, number]; zoomLevel: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoomLevel);
  }, [map, center, zoomLevel]);
  return null;
}

/**
 * Leaflet event handler component for map interactions (zooms, clicks for drawing)
 */
interface MapEventsHandlerProps {
  onZoomChange: (zoom: number) => void;
  onMapClick: (lat: number, lon: number) => void;
  drawMode: 'off' | ShapeType;
}

function MapEventsHandler({ onZoomChange, onMapClick, drawMode }: MapEventsHandlerProps) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    click: (e) => {
      if (drawMode !== 'off') {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  // Temporarily disable double-click zoom if we are actively drawing a shape
  useEffect(() => {
    if (drawMode !== 'off') {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [drawMode, map]);

  return null;
}

/**
 * Creates a custom marker icon with pulsing effect
 */
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="marker-pin-wrapper ${isSelected ? 'selected' : ''}">
        <div class="marker-pulse"></div>
        <div class="marker-dot"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -12]
  });
};

/**
 * Creates a custom marker icon for the user's geolocated position
 */
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-location-icon',
    html: `
      <div class="marker-pin-wrapper">
        <div class="user-pulse"></div>
        <div class="user-dot"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -12]
  });
};

/**
 * Creates custom cluster icons showing location density count
 */
const createClusterIcon = (count: number) => {
  let sizeClass = 'small';
  if (count >= 50) {
    sizeClass = 'large';
  } else if (count >= 10) {
    sizeClass = 'medium';
  }

  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `
      <div class="cluster-circle cluster-${sizeClass}">
        <div class="cluster-pulse"></div>
        <div class="cluster-inner">
          <span>${count}</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

export const MapView: React.FC<MapViewProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  drawnShapes,
  onAddDrawnShape,
  onDeleteDrawnShape,
  userLocation,
  onSetUserLocation,
  mapCenter
}) => {
  const defaultCenter: [number, number] = [13.0827, 80.2707]; // Chennai
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // States
  const [zoom, setZoom] = useState<number>(12);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<'off' | ShapeType>('off');
  const [tempCoords, setTempCoords] = useState<[number, number][]>([]);

  // Built-in Static Vector Shapes (Tamil Nadu Coordinates)
  const builtInPolygon: [number, number][] = [
    [13.12, 80.20],
    [13.12, 80.30],
    [13.00, 80.30],
    [13.00, 80.20]
  ];
  const builtInCircleCenter: [number, number] = [12.6163, 80.1991]; // Shore Temple
  const builtInCircleRadius = 1000; // meters
  
  const builtInRectangleBounds: [[number, number], [number, number]] = [
    [13.005, 80.205],
    [13.015, 80.220]
  ];
  const builtInPolylinePoints: [number, number][] = [
    [13.0500, 80.2824], // Marina Beach
    [12.7900, 80.2500], // Kovalam
    [12.6163, 80.1991]  // Shore Temple
  ];

  // Geolocation Handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude
        ];
        onSetUserLocation(coords);
      },
      (error) => {
        console.error('Error obtaining geolocation:', error);
        alert(`Geolocation failed: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        alert(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen to fullscreen changes outside the trigger (e.g. Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Map click handler (used specifically when drawing is active)
  const handleMapClick = (lat: number, lon: number) => {
    const newCoord: [number, number] = [lat, lon];
    
    if (drawMode === 'marker') {
      // Place marker immediately and finish
      const label = `Pin Point #${drawnShapes.length + 1}`;
      const newShape: DrawnShape = {
        id: `shape_${Date.now()}`,
        type: 'marker',
        coordinates: [newCoord],
        color: '#ef4444',
        label,
        timestamp: new Date().toLocaleTimeString()
      };
      onAddDrawnShape(newShape);
      setDrawMode('off');
    } else if (drawMode === 'polyline' || drawMode === 'polygon') {
      // Accumulate coordinates
      setTempCoords((prev) => [...prev, newCoord]);
    }
  };

  // Finish shape drawing
  const handleFinishDrawing = () => {
    if (tempCoords.length < (drawMode === 'polygon' ? 3 : 2)) {
      alert(`Please plot at least ${drawMode === 'polygon' ? '3' : '2'} points before completing.`);
      return;
    }

    const label = `${drawMode === 'polygon' ? 'Area Zone' : 'Route Path'} #${drawnShapes.length + 1}`;
    const newShape: DrawnShape = {
      id: `shape_${Date.now()}`,
      type: drawMode as ShapeType,
      coordinates: tempCoords,
      color: drawMode === 'polygon' ? '#10b981' : '#3b82f6',
      label,
      timestamp: new Date().toLocaleTimeString()
    };

    onAddDrawnShape(newShape);
    setTempCoords([]);
    setDrawMode('off');
  };

  // Cancel shape drawing
  const handleCancelDrawing = () => {
    setTempCoords([]);
    setDrawMode('off');
  };

  // Custom Grid Clustering Algorithm
  const getClusteredPoints = () => {
    if (zoom >= 13) {
      // Return single items when zoomed in
      return points.map(p => ({ type: 'point' as const, data: p }));
    }

    // Grid cell size scaled by zoom level
    const gridSize = 0.04 * Math.pow(2, 12 - zoom);
    const clusters: { [key: string]: LocationPoint[] } = {};

    points.forEach((point) => {
      const gridX = Math.round(point.lat / gridSize);
      const gridY = Math.round(point.lon / gridSize);
      const key = `${gridX}_${gridY}`;
      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(point);
    });

    return Object.values(clusters).map((clusterPoints) => {
      if (clusterPoints.length === 1) {
        return { type: 'point' as const, data: clusterPoints[0] };
      }
      
      const avgLat = clusterPoints.reduce((sum, p) => sum + p.lat, 0) / clusterPoints.length;
      const avgLon = clusterPoints.reduce((sum, p) => sum + p.lon, 0) / clusterPoints.length;
      
      return {
        type: 'cluster' as const,
        id: `cluster_${clusterPoints[0].id}`,
        lat: avgLat,
        lon: avgLon,
        count: clusterPoints.length,
        points: clusterPoints
      };
    });
  };



  const [expandedCluster, setExpandedCluster] = useState<{ lat: number; lon: number } | null>(null);

  const handleClusterMarkerClick = (lat: number, lon: number) => {
    setExpandedCluster({ lat, lon });
    // Reset cluster trigger after render
    setTimeout(() => setExpandedCluster(null), 100);
  };

  const clusteredItems = getClusteredPoints();

  return (
    <div 
      className={`map-container ${isFullscreen ? 'fullscreen-mode' : ''}`} 
      ref={mapContainerRef}
    >
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Disable default zoom control to render our custom position zoom control
      >
        {/* Base Layer & Overlay layer controls */}
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer name="CartoDB Dark Matter">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="CartoDB Positron (Light)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap Standard">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Esri Satellite Imagery">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* Overlays */}
          <LayersControl.Overlay checked name="Built-in Shapes">
            <Polygon
              positions={builtInPolygon}
              pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.1, weight: 2 }}
            >
              <Tooltip sticky>Chennai Metro Zone (சென்னை பெருநகர பகுதி)</Tooltip>
              <Popup>
                <div style={{ padding: '8px' }}>
                  <h4 style={{ color: 'var(--primary-accent)', marginBottom: '4px' }}>Chennai Metro Area</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    High-density urban limits in Chennai. (அதிக மக்கள் தொகை கொண்ட சென்னையின் முக்கிய பெருநகரப் பகுதி).
                  </p>
                </div>
              </Popup>
            </Polygon>

            <Circle
              center={builtInCircleCenter}
              radius={builtInCircleRadius}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 2 }}
            >
              <Tooltip sticky>Tourism Buffer Zone (சுற்றுலா மண்டலம்)</Tooltip>
              <Popup>
                <div style={{ padding: '8px' }}>
                  <h4 style={{ color: 'var(--status-success)', marginBottom: '4px' }}>Shore Temple Buffer (1km)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Protected conservation area around the Shore Temple monuments. (யுனெஸ்கோ நினைவுச் சின்னத்தைச் சுற்றியுள்ள 1 கி.மீ பாதுகாப்புப் பகுதி).
                  </p>
                </div>
              </Popup>
            </Circle>

            <Rectangle
              bounds={builtInRectangleBounds}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 2 }}
            >
              <Tooltip sticky>Guindy National Park (கிண்டி தேசிய பூங்கா)</Tooltip>
              <Popup>
                <div style={{ padding: '8px' }}>
                  <h4 style={{ color: 'var(--status-warning)', marginBottom: '4px' }}>Guindy Forest Area</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Indicates protected wilderness bounds in Chennai. (சென்னையின் மையப்பகுதியில் அமைந்துள்ள கிண்டி தேசிய பூங்காவின் பாதுகாக்கப்பட்ட வனப்பகுதி).
                  </p>
                </div>
              </Popup>
            </Rectangle>

            <Polyline
              positions={builtInPolylinePoints}
              pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.8 }}
            >
              <Tooltip sticky>ECR Scenic Route (கிழக்கு கடற்கரை சாலை)</Tooltip>
              <Popup>
                <div style={{ padding: '8px' }}>
                  <h4 style={{ color: '#ef4444', marginBottom: '4px' }}>Scenic Coastal Drive</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ECR tourist route connecting Marina Beach down to Mahabalipuram. (சென்னையையும் மாமல்லபுரத்தையும் இணைக்கும் கிழக்கு கடற்கரை சுற்றுலா சாலை).
                  </p>
                </div>
              </Popup>
            </Polyline>
          </LayersControl.Overlay>
        </LayersControl>

        {/* Listen to zoom changes and clicks for shape drawing */}
        <MapEventsHandler 
          onZoomChange={setZoom} 
          onMapClick={handleMapClick}
          drawMode={drawMode}
        />

        {/* Change map view smoothly when mapCenter changes */}
        {mapCenter && (
          <ChangeMapView center={mapCenter} />
        )}

        {/* Cluster map zooming helper */}
        {expandedCluster && (
          <ZoomToCluster 
            center={[expandedCluster.lat, expandedCluster.lon]} 
            zoomLevel={zoom + 2} 
          />
        )}

        {/* Render Locations (Clustered or Markers) */}
        {clusteredItems.map((item) => {
          if (item.type === 'cluster') {
            return (
              <Marker
                key={item.id}
                position={[item.lat, item.lon]}
                icon={createClusterIcon(item.count)}
                eventHandlers={{
                  click: () => handleClusterMarkerClick(item.lat, item.lon)
                }}
              />
            );
          } else {
            const point = item.data;
            const isSelected = selectedPoint?.id === point.id;
            return (
              <Marker
                key={point.id}
                position={[point.lat, point.lon]}
                icon={createCustomIcon(isSelected)}
                eventHandlers={{
                  click: () => onSelectPoint(point)
                }}
              >
                <Popup closeButton={false}>
                  <div className="popup-card">
                    {point.imageUrl && (
                      <img 
                        src={point.imageUrl} 
                        alt={point.name} 
                        className="popup-image"
                        loading="lazy"
                      />
                    )}
                    <div className="popup-details">
                      <span className="popup-category">{point.category}</span>
                      <h3 className="popup-title">{point.name}</h3>
                      {point.description && <p className="popup-desc">{point.description}</p>}
                      <div className="popup-meta-row">
                        {point.rating && (
                          <div className="card-rating-row">
                            <Star size={14} className="rating-star" fill="currentColor" />
                            <span className="rating-value">{point.rating}</span>
                          </div>
                        )}
                        <span className="popup-coords">
                          {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }
        })}

        {/* User Geolocation Pin */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()}>
            <Popup>
              <div style={{ padding: '6px' }}>
                <h4 style={{ color: '#007aff' }}>Your Current Location</h4>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Coordinates: {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render User Drawn Shapes */}
        {drawnShapes.map((shape) => {
          if (shape.type === 'marker') {
            return (
              <Marker 
                key={shape.id} 
                position={shape.coordinates[0]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="marker-pin-wrapper">
                      <div class="marker-dot" style="background: ${shape.color}; box-shadow: 0 0 10px ${shape.color};"></div>
                    </div>
                  `,
                  iconSize: [24, 24]
                })}
              >
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <h4 style={{ color: shape.color }}>{shape.label}</h4>
                    <p style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      Drawn on: {shape.timestamp}
                    </p>
                    <button 
                      className="hud-btn" 
                      style={{ marginTop: '8px', width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => onDeleteDrawnShape(shape.id)}
                    >
                      <Trash2 size={12} style={{ color: 'var(--status-error)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--status-error)' }}>Remove Node</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          } else if (shape.type === 'polyline') {
            return (
              <Polyline 
                key={shape.id} 
                positions={shape.coordinates} 
                pathOptions={{ color: shape.color, weight: 3 }}
              >
                <Tooltip>{shape.label}</Tooltip>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <h4 style={{ color: shape.color }}>{shape.label}</h4>
                    <p style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      Line Route with {shape.coordinates.length} points.
                    </p>
                    <button 
                      className="hud-btn" 
                      style={{ marginTop: '8px', width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => onDeleteDrawnShape(shape.id)}
                    >
                      <Trash2 size={12} style={{ color: 'var(--status-error)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--status-error)' }}>Delete Line</span>
                    </button>
                  </div>
                </Popup>
              </Polyline>
            );
          } else if (shape.type === 'polygon') {
            return (
              <Polygon 
                key={shape.id} 
                positions={shape.coordinates} 
                pathOptions={{ color: shape.color, fillColor: shape.color, fillOpacity: 0.15, weight: 2 }}
              >
                <Tooltip>{shape.label}</Tooltip>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <h4 style={{ color: shape.color }}>{shape.label}</h4>
                    <p style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      Drawn area with {shape.coordinates.length} vertices.
                    </p>
                    <button 
                      className="hud-btn" 
                      style={{ marginTop: '8px', width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => onDeleteDrawnShape(shape.id)}
                    >
                      <Trash2 size={12} style={{ color: 'var(--status-error)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--status-error)' }}>Delete Area</span>
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          }
          return null;
        })}

        {/* Temporary vertices rendering during live drawing */}
        {drawMode !== 'off' && tempCoords.length > 0 && (
          <>
            {/* Draw active line connectors */}
            {tempCoords.length >= 2 && (
              <Polyline 
                positions={tempCoords} 
                pathOptions={{ color: '#ff3b30', weight: 2, dashArray: '6, 6' }} 
              />
            )}
            
            {/* Draw active polygon fill */}
            {drawMode === 'polygon' && tempCoords.length >= 3 && (
              <Polygon 
                positions={tempCoords} 
                pathOptions={{ color: '#ff3b30', fillColor: '#ff3b30', fillOpacity: 0.08, weight: 1, dashArray: '6, 6' }} 
              />
            )}

            {/* Draw active node pins */}
            {tempCoords.map((coord, idx) => (
              <Marker
                key={`temp_${idx}`}
                position={coord}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="marker-pin-wrapper">
                      <div class="marker-dot" style="background: #ff3b30; width: 8px; height: 8px; border-radius: 50%;"></div>
                    </div>
                  `,
                  iconSize: [16, 16]
                })}
              />
            ))}
          </>
        )}
      </MapContainer>

      {/* Advanced Custom Overlay HUD - Renders React overlay elements directly over Leaflet */}
      <div className="map-hud-container">
        {/* Navigation & Controls panel */}
        <div className="hud-panel">
          <div className="hud-title">Map Actions</div>
          <div className="hud-row">
            <button 
              className="hud-btn hud-btn-large" 
              onClick={handleLocateMe}
              title="Locate user coordinates"
            >
              <Navigation size={14} />
              Locate Me
            </button>
            <button 
              className="hud-btn" 
              onClick={toggleFullscreen}
              title="Toggle Fullscreen Map"
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          </div>
        </div>

        {/* Drawing Controls Panel */}
        <div className="hud-panel">
          <div className="hud-title">Vector Drawing Controls</div>
          <div className="hud-row" style={{ flexWrap: 'wrap' }}>
            <button 
              className={`hud-btn ${drawMode === 'off' ? 'active' : ''}`} 
              onClick={handleCancelDrawing}
            >
              Navigate
            </button>
            <button 
              className={`hud-btn ${drawMode === 'marker' ? 'active' : ''}`} 
              onClick={() => { setTempCoords([]); setDrawMode('marker'); }}
              title="Draw a pin point"
            >
              <Edit3 size={12} />
              Pin
            </button>
            <button 
              className={`hud-btn ${drawMode === 'polyline' ? 'active' : ''}`} 
              onClick={() => { setTempCoords([]); setDrawMode('polyline'); }}
              title="Draw a line route"
            >
              <Edit3 size={12} />
              Line
            </button>
            <button 
              className={`hud-btn ${drawMode === 'polygon' ? 'active' : ''}`} 
              onClick={() => { setTempCoords([]); setDrawMode('polygon'); }}
              title="Draw a polygon area"
            >
              <Edit3 size={12} />
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Active Prompts (Overlay HUD at bottom-center) */}
      {drawMode !== 'off' && (
        <div className="draw-status-prompt">
          <div className="draw-pulse-indicator"></div>
          <span>
            {drawMode === 'marker' && 'Click on the map to place your pin marker.'}
            {drawMode === 'polyline' && `Drawing Line (${tempCoords.length} points). Click to add nodes.`}
            {drawMode === 'polygon' && `Drawing Area (${tempCoords.length} points). Click to add nodes.`}
          </span>
          
          {(drawMode === 'polyline' || drawMode === 'polygon') && tempCoords.length > 0 && (
            <div className="hud-row" style={{ marginLeft: '1rem' }}>
              <button 
                className="hud-btn active" 
                style={{ background: 'var(--status-success)', padding: '0.2rem 0.6rem' }}
                onClick={handleFinishDrawing}
              >
                <Check size={14} />
                Done
              </button>
              <button 
                className="hud-btn" 
                style={{ padding: '0.2rem 0.6rem' }}
                onClick={handleCancelDrawing}
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
