import React from 'react';
import { LocationPoint, DrawnShape } from '../types';
import { Search, Star, MapPin, Compass, Trash2, Edit } from 'lucide-react';

interface SidebarProps {
  points: LocationPoint[];
  selectedPoint: LocationPoint | null;
  onSelectPoint: (point: LocationPoint) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  drawnShapes: DrawnShape[];
  onSelectDrawnShape: (shape: DrawnShape) => void;
  onDeleteDrawnShape: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  points,
  selectedPoint,
  onSelectPoint,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  drawnShapes,
  onSelectDrawnShape,
  onDeleteDrawnShape
}) => {
  // Extract unique categories for filter tabs
  const categories = ['All', ...Array.from(new Set(points.map((p) => p.category)))];

  // Filter points based on search query and category tab
  const filteredPoints = points.filter((point) => {
    const matchesSearch =
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (point.description && point.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      point.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || point.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const displayedPoints = filteredPoints.slice(0, 150);

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <Compass className="logo-icon" size={28} />
        <h1 className="logo-text">GeoPulse</h1>
      </div>

      {/* Controls Container */}
      <div className="sidebar-controls">
        {/* Search */}
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search locations, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search locations"
          />
        </div>

        {/* Categories Tab Row */}
        <div className="categories-filter">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Lists Container */}
      <div className="location-list-container">
        {/* Locations List */}
        <div className="location-list">
          {displayedPoints.length > 0 ? (
            displayedPoints.map((point) => {
              const isSelected = selectedPoint?.id === point.id;
              return (
                <div
                  key={point.id}
                  className={`location-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectPoint(point)}
                >
                  {point.imageUrl && (
                    <img
                      src={point.imageUrl}
                      alt={point.name}
                      className="card-image"
                      loading="lazy"
                    />
                  )}
                  <div className="card-info">
                    <span className="card-category">{point.category}</span>
                    <h2 className="card-title">{point.name}</h2>
                    {point.address && (
                      <span className="card-address" title={point.address}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                        {point.address}
                      </span>
                    )}
                    {point.rating && (
                      <div className="card-rating-row">
                        <Star size={12} className="rating-star" fill="currentColor" />
                        <span className="rating-value">{point.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <Search className="state-icon" size={48} />
              <div>
                <h3>No locations found</h3>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Try adjusting your search filters.
                </p>
              </div>
            </div>
          )}
          {filteredPoints.length > 150 && (
            <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)', borderRadius: '8px', marginTop: '0.5rem' }}>
              Showing top 150 of {filteredPoints.length} locations. Refine search to see others.
            </div>
          )}
        </div>

        {/* User Drawn Shapes Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3 className="sidebar-section-title">Drawn Shapes ({drawnShapes.length})</h3>
          </div>
          
          <div className="drawn-shapes-list">
            {drawnShapes.length > 0 ? (
              drawnShapes.map((shape) => (
                <div key={shape.id} className="drawn-shape-item">
                  <div 
                    className="drawn-shape-info" 
                    onClick={() => onSelectDrawnShape(shape)}
                    title="Zoom and center on shape"
                  >
                    <span className="drawn-shape-name">{shape.label}</span>
                    <span className="drawn-shape-meta">
                      <span 
                        style={{ 
                          display: 'inline-block', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: shape.color,
                          marginRight: '2px' 
                        }} 
                      />
                      {shape.type.toUpperCase()} &bull; {shape.timestamp}
                    </span>
                  </div>
                  <button 
                    className="delete-shape-btn" 
                    onClick={() => onDeleteDrawnShape(shape.id)}
                    title="Delete drawn shape"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Edit size={14} />
                <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                  No custom shapes drawn. Use the toolbar on the map to draw.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
