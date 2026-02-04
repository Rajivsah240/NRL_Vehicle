import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom vehicle marker icons based on status - Custom Palette colors
const getVehicleIcon = (status) => {
  const configs = {
    'Available': { color: '#B0D19A', glow: 'rgba(176, 209, 154, 0.4)' },      // Secondary (Green)
    'Busy': { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },            // Amber
    'In Transit': { color: '#CC2454', glow: 'rgba(204, 36, 84, 0.4)' },       // Primary (Crimson)
    'Not Available': { color: '#CF6679', glow: 'rgba(207, 102, 121, 0.4)' }   // Error
  };

  const config = configs[status] || { color: '#6b7280', glow: 'rgba(107, 114, 128, 0.4)' };

  return L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div style="position: relative; filter: drop-shadow(0 4px 6px ${config.glow});">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, ${config.color}, ${config.color}dd); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px ${config.glow};">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

const MapView = ({ vehicles, onVehicleClick, center = [26.5785, 93.7859], zoom = 15 }) => {
  // Helper to get effective status (no driver = not available)
  const getEffectiveStatus = (vehicle) => {
    if (!vehicle.currentDriver) return 'No Driver';
    return vehicle.status;
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {vehicles.map((vehicle) => {
        const lat = vehicle.location?.coordinates?.[1] || center[0];
        const lng = vehicle.location?.coordinates?.[0] || center[1];
        const effectiveStatus = getEffectiveStatus(vehicle);
        // Use 'Not Available' icon for vehicles without drivers
        const iconStatus = vehicle.currentDriver ? vehicle.status : 'Not Available';

        return (
          <Marker
            key={vehicle._id}
            position={[lat, lng]}
            icon={getVehicleIcon(iconStatus)}
            eventHandlers={{
              click: () => onVehicleClick(vehicle)
            }}
          >
            <Popup>
              <div className="p-3 min-w-[220px]">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    effectiveStatus === 'Available' ? 'bg-green-100' :
                    effectiveStatus === 'Busy' ? 'bg-amber-100' :
                    effectiveStatus === 'In Transit' ? 'bg-red-100' :
                    'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      effectiveStatus === 'Available' ? 'text-green-600' :
                      effectiveStatus === 'Busy' ? 'text-amber-600' :
                      effectiveStatus === 'In Transit' ? 'text-red-600' :
                      'text-red-600'
                    }`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{vehicle.vehicleNumber}</h3>
                    <p className="text-xs text-gray-500">{vehicle.vehicleType}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      effectiveStatus === 'Available' ? 'bg-green-100 text-green-700' :
                      effectiveStatus === 'Busy' ? 'bg-amber-100 text-amber-700' :
                      effectiveStatus === 'In Transit' ? 'bg-red-100 text-red-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {effectiveStatus}
                    </span>
                  </div>
                  
                  {vehicle.currentDriver ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Driver</span>
                        <span className="font-medium text-gray-900">{vehicle.currentDriver.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Phone</span>
                        <a href={`tel:${vehicle.currentDriver.phone}`} className="font-medium text-primary hover:underline">
                          {vehicle.currentDriver.phone}
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-medium">No driver assigned</span>
                    </div>
                  )}
                  
                  {vehicle.location?.address && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-gray-700 text-xs leading-relaxed">{vehicle.location.address}</p>
                    </div>
                  )}
                </div>
                
                <button 
                  className="w-full mt-3 py-2 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-light transition-all"
                  onClick={() => onVehicleClick(vehicle)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapView;
