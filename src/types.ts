export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  description?: string;
  rating?: number;
  imageUrl?: string;
  address?: string;
}

export type ShapeType = 'marker' | 'polyline' | 'polygon';

export interface DrawnShape {
  id: string;
  type: ShapeType;
  coordinates: [number, number][]; // Array of [lat, lon] coordinates
  color: string;
  label: string;
  timestamp: string;
}
