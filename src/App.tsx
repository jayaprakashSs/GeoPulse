import React, { useEffect, useState } from 'react';
import { LocationPoint, DrawnShape } from './types';
import { fetchLocations } from './services/api';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<LocationPoint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Category Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Advanced GIS States
  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Load locations on component mount
  const loadLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocations();
      setPoints(data);
      if (data.length > 0) {
        setSelectedPoint(data[0]);
        setMapCenter([data[0].lat, data[0].lon]);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load location coordinates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleSelectPoint = (point: LocationPoint) => {
    setSelectedPoint(point);
    setMapCenter([point.lat, point.lon]);
  };

  // Add drawn shape to state
  const handleAddDrawnShape = (shape: DrawnShape) => {
    setDrawnShapes((prev) => [shape, ...prev]);
  };

  // Delete drawn shape from state
  const handleDeleteDrawnShape = (id: string) => {
    setDrawnShapes((prev) => prev.filter((shape) => shape.id !== id));
  };

  // Set user coordinate and center map on it
  const handleSetUserLocation = (coords: [number, number] | null) => {
    setUserLocation(coords);
    if (coords) {
      setMapCenter(coords);
    }
  };

  // Center map on user drawn shape
  const handleSelectDrawnShape = (shape: DrawnShape) => {
    setSelectedPoint(null); // Clear selected point card highlight
    setMapCenter(shape.coordinates[0]);
  };

  return (
    <div className="dashboard-container">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay" role="status" aria-busy="true">
          <div className="spinner"></div>
          <p style={{ fontWeight: 500, letterSpacing: '0.025em' }}>Loading spatial data...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="loading-overlay" role="alert">
          <div className="error-card">
            <AlertCircle size={40} className="state-icon" style={{ color: 'var(--status-error)' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Connection Failure</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
            </div>
            <button className="retry-btn" onClick={loadLocations}>
              <RefreshCw size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Retry Fetch
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      {!loading && !error && (
        <>
          {/* Collapsible/Responsive Left Sidebar */}
          <Sidebar
            points={points}
            selectedPoint={selectedPoint}
            onSelectPoint={handleSelectPoint}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            drawnShapes={drawnShapes}
            onSelectDrawnShape={handleSelectDrawnShape}
            onDeleteDrawnShape={handleDeleteDrawnShape}
          />

          {/* Interactive Leaflet Map Layer */}
          <MapView
            points={points}
            selectedPoint={selectedPoint}
            onSelectPoint={handleSelectPoint}
            drawnShapes={drawnShapes}
            onAddDrawnShape={handleAddDrawnShape}
            onDeleteDrawnShape={handleDeleteDrawnShape}
            userLocation={userLocation}
            onSetUserLocation={handleSetUserLocation}
            mapCenter={mapCenter}
          />
        </>
      )}
    </div>
  );
};

export default App;
