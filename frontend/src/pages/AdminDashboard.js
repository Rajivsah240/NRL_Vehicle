import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// NRL Refinery default coordinates
const NRL_LOCATION = {
  lat: 26.7557,
  lng: 93.8457,
  address: 'NRL Refinery, Numaligarh, Assam'
};

// Custom marker icon for vehicle location
const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map click events for location picking
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newVehicleForm, setNewVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'Sedan',
    capacity: 4,
    status: 'Not Available',
    location: {
      coordinates: [NRL_LOCATION.lng, NRL_LOCATION.lat],
      address: NRL_LOCATION.address
    }
  });
  const [mapCenter, setMapCenter] = useState([NRL_LOCATION.lat, NRL_LOCATION.lng]);

  const loadDepartmentData = useCallback(async () => {
    try {
      const response = await api.get('/vehicles/admin/department-stats');
      setStats(response.data.stats);
      setVehicles(response.data.vehicles);
      setLoading(false);
    } catch (error) {
      console.error('Error loading department data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartmentData();
  }, [loadDepartmentData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDepartmentData();
    setRefreshing(false);
    showNotification('success', '✅ Refreshed', 'Data updated successfully');
  };

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      await api.put('/vehicles/admin/status', { vehicleId, status: newStatus });
      showNotification('success', '✅ Status Updated', `Vehicle status changed to ${newStatus}`);
      loadDepartmentData();
    } catch (error) {
      showNotification('error', '❌ Update Failed', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditForm({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      status: vehicle.status,
      isActive: vehicle.isActive
    });
    setShowEditModal(true);
  };

  const handleSaveVehicle = async () => {
    try {
      await api.put(`/vehicles/admin/${selectedVehicle._id}`, editForm);
      showNotification('success', '✅ Vehicle Updated', 'Vehicle details saved successfully');
      setShowEditModal(false);
      loadDepartmentData();
    } catch (error) {
      showNotification('error', '❌ Update Failed', error.response?.data?.message || 'Failed to update vehicle');
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicleForm.vehicleNumber.trim()) {
      showNotification('error', '❌ Error', 'Vehicle number is required');
      return;
    }

    try {
      await api.post('/vehicles', {
        ...newVehicleForm,
        department: user.department
      });
      showNotification('success', '✅ Vehicle Added', 'New vehicle added successfully');
      setShowAddModal(false);
      setNewVehicleForm({
        vehicleNumber: '',
        vehicleType: 'Sedan',
        capacity: 4,
        status: 'Not Available',
        location: {
          coordinates: [NRL_LOCATION.lng, NRL_LOCATION.lat],
          address: NRL_LOCATION.address
        }
      });
      setMapCenter([NRL_LOCATION.lat, NRL_LOCATION.lng]);
      loadDepartmentData();
    } catch (error) {
      showNotification('error', '❌ Add Failed', error.response?.data?.message || 'Failed to add vehicle');
    }
  };

  const statusConfig = {
    'Available': { bg: 'bg-secondary/20', text: 'text-secondary', icon: '✓' },
    'Busy': { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: '⏳' },
    'In Transit': { bg: 'bg-primary/20', text: 'text-primary', icon: '🚗' },
    'Not Available': { bg: 'bg-error/20', text: 'text-error', icon: '✕' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface-4dp border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-on-surface">Admin Dashboard</h1>
                <p className="text-sm text-on-surface-disabled">{user?.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-surface-6dp hover:bg-surface-8dp rounded-lg transition-all"
              >
                <svg className={`w-5 h-5 text-on-surface ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-on-surface">{user?.name}</p>
                  <p className="text-xs text-primary">Admin</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-error/20 rounded-lg transition-all group"
                  title="Logout"
                >
                  <svg className="w-5 h-5 text-on-surface-disabled group-hover:text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-surface-4dp rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚗</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-on-surface">{stats.totalVehicles}</p>
                  <p className="text-xs text-on-surface-disabled">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-4dp rounded-xl p-4 border border-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-secondary">✓</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">{stats.available}</p>
                  <p className="text-xs text-on-surface-disabled">Available</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-4dp rounded-xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{stats.busy}</p>
                  <p className="text-xs text-on-surface-disabled">Busy</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-4dp rounded-xl p-4 border border-primary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚗</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.inTransit}</p>
                  <p className="text-xs text-on-surface-disabled">In Transit</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-4dp rounded-xl p-4 border border-error/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-error/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl text-error">✕</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-error">{stats.notAvailable}</p>
                  <p className="text-xs text-on-surface-disabled">Not Available</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-4dp rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-on-surface">{stats.withDriver}</p>
                  <p className="text-xs text-on-surface-disabled">With Driver</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-4dp rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-8dp rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚫</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-on-surface-disabled">{stats.withoutDriver}</p>
                  <p className="text-xs text-on-surface-disabled">No Driver</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Management */}
        <div className="bg-surface-4dp rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-xl">🚗</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Department Vehicles</h2>
                <p className="text-sm text-on-surface-disabled">Manage vehicles in {user?.department}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewVehicleForm({
                  vehicleNumber: '',
                  vehicleType: 'Sedan',
                  capacity: 4,
                  status: 'Not Available',
                  location: {
                    coordinates: [NRL_LOCATION.lng, NRL_LOCATION.lat],
                    address: NRL_LOCATION.address
                  }
                });
                setMapCenter([NRL_LOCATION.lat, NRL_LOCATION.lng]);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-on-primary rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Vehicle
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface-8dp rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚗</span>
              </div>
              <p className="text-on-surface-medium">No vehicles in your department</p>
              <p className="text-sm text-on-surface-disabled mt-1">Click "Add Vehicle" to add your first vehicle</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-primary hover:bg-primary-light text-on-primary rounded-lg font-medium transition-all"
              >
                + Add Your First Vehicle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-disabled uppercase tracking-wider">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-disabled uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-disabled uppercase tracking-wider">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-disabled uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-disabled uppercase tracking-wider">Last Updated</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-disabled uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-on-surface">{vehicle.vehicleNumber}</p>
                          <p className="text-xs text-on-surface-disabled">Capacity: {vehicle.capacity}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-on-surface-medium">{vehicle.vehicleType}</span>
                      </td>
                      <td className="px-4 py-4">
                        {vehicle.currentDriver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-medium">
                              {vehicle.currentDriver.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-on-surface text-sm">{vehicle.currentDriver.name}</p>
                              <p className="text-xs text-on-surface-disabled">{vehicle.currentDriver.phone}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-on-surface-disabled text-sm italic">No driver assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={vehicle.status}
                          onChange={(e) => handleStatusChange(vehicle._id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer ${statusConfig[vehicle.status]?.bg} ${statusConfig[vehicle.status]?.text}`}
                        >
                          <option value="Available" className="bg-surface text-on-surface">✓ Available</option>
                          <option value="Busy" className="bg-surface text-on-surface">⏳ Busy</option>
                          <option value="In Transit" className="bg-surface text-on-surface">🚗 In Transit</option>
                          <option value="Not Available" className="bg-surface text-on-surface">✕ Not Available</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-on-surface-disabled">
                        {format(new Date(vehicle.lastUpdated || vehicle.updatedAt), 'MMM d, hh:mm a')}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-all"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions Info */}
        <div className="bg-surface-4dp rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Admin Tips</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-surface-6dp rounded-xl p-4 border border-white/5">
              <h4 className="font-medium text-on-surface mb-2">🔴 Not Available Status</h4>
              <p className="text-sm text-on-surface-disabled">
                Set a vehicle to "Not Available" when it's under maintenance, being serviced, or should not be used. 
                Drivers cannot override this status.
              </p>
            </div>
            <div className="bg-surface-6dp rounded-xl p-4 border border-white/5">
              <h4 className="font-medium text-on-surface mb-2">✅ Available Status</h4>
              <p className="text-sm text-on-surface-disabled">
                Set to "Available" when the vehicle is ready for use. Drivers can then change between Available, 
                Busy, and In Transit as needed.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-4dp rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-on-surface">Edit Vehicle</h3>
              <p className="text-sm text-on-surface-disabled mt-1">{selectedVehicle.vehicleNumber}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-medium mb-2">Vehicle Number</label>
                <input
                  type="text"
                  value={editForm.vehicleNumber}
                  onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                  className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-medium mb-2">Vehicle Type</label>
                <select
                  value={editForm.vehicleType}
                  onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                  className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                  <option value="Bus">Bus</option>
                  <option value="Pickup Truck">Pickup Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-medium mb-2">Capacity</label>
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-medium mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Available">Available</option>
                  <option value="Busy">Busy</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-surface-6dp text-primary focus:ring-primary focus:ring-offset-0"
                />
                <label htmlFor="isActive" className="text-sm text-on-surface-medium">Vehicle is active</label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-surface-6dp hover:bg-surface-8dp text-on-surface rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVehicle}
                className="px-4 py-2 bg-primary hover:bg-primary-light text-on-primary rounded-lg font-medium transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-4dp rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-on-surface">Add New Vehicle</h3>
              <p className="text-sm text-on-surface-disabled mt-1">Add a vehicle to {user?.department}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-medium mb-2">Vehicle Number *</label>
                  <input
                    type="text"
                    value={newVehicleForm.vehicleNumber}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g., AS01AB1234"
                    className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-disabled"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-medium mb-2">Vehicle Type</label>
                  <select
                    value={newVehicleForm.vehicleType}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicleType: e.target.value })}
                    className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                    <option value="Pickup Truck">Pickup Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-medium mb-2">Seating Capacity</label>
                  <input
                    type="number"
                    value={newVehicleForm.capacity}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, capacity: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="50"
                    className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface-medium mb-2">Initial Status</label>
                  <select
                    value={newVehicleForm.status}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, status: e.target.value })}
                    className="w-full bg-surface-6dp border border-white/10 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available (Recommended)</option>
                  </select>
                </div>
              </div>

              {/* Location Picker Section */}
              <div>
                <label className="block text-sm font-medium text-on-surface-medium mb-2">
                  📍 Vehicle Location (Click on map to set)
                </label>
                <div className="h-64 rounded-lg overflow-hidden border border-white/10">
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker 
                      position={[
                        newVehicleForm.location?.coordinates?.[1] || NRL_LOCATION.lat, 
                        newVehicleForm.location?.coordinates?.[0] || NRL_LOCATION.lng
                      ]} 
                      icon={vehicleIcon}
                    />
                    <LocationPicker 
                      onLocationSelect={(lat, lng) => {
                        setNewVehicleForm({
                          ...newVehicleForm,
                          location: {
                            ...newVehicleForm.location,
                            coordinates: [lng, lat]
                          }
                        });
                      }}
                    />
                  </MapContainer>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={newVehicleForm.location?.address || ''}
                    onChange={(e) => setNewVehicleForm({
                      ...newVehicleForm,
                      location: { ...newVehicleForm.location, address: e.target.value }
                    })}
                    placeholder="Location address/description"
                    className="flex-1 bg-surface-6dp border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewVehicleForm({
                        ...newVehicleForm,
                        location: {
                          coordinates: [NRL_LOCATION.lng, NRL_LOCATION.lat],
                          address: NRL_LOCATION.address
                        }
                      });
                      setMapCenter([NRL_LOCATION.lat, NRL_LOCATION.lng]);
                    }}
                    className="px-3 py-2 bg-surface-6dp hover:bg-surface-8dp text-on-surface-medium text-sm rounded-lg border border-white/10 whitespace-nowrap"
                  >
                    Reset to NRL
                  </button>
                </div>
                <p className="text-xs text-on-surface-disabled mt-1">
                  Coordinates: {(newVehicleForm.location?.coordinates?.[1] || NRL_LOCATION.lat).toFixed(4)}°N, {(newVehicleForm.location?.coordinates?.[0] || NRL_LOCATION.lng).toFixed(4)}°E
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-surface-6dp hover:bg-surface-8dp text-on-surface rounded-lg font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVehicle}
                className="px-4 py-2 bg-primary hover:bg-primary-light text-on-primary rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className={`bg-surface-8dp backdrop-blur rounded-xl p-4 shadow-2xl border max-w-sm ${
            notification.type === 'success' ? 'border-secondary/50 shadow-secondary/20' :
            notification.type === 'error' ? 'border-error/50 shadow-error/20' :
            'border-primary/50 shadow-primary/20'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                notification.type === 'success' ? 'bg-secondary/20' :
                notification.type === 'error' ? 'bg-error/20' :
                'bg-primary/20'
              }`}>
                {notification.type === 'success' ? '✅' :
                 notification.type === 'error' ? '❌' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-on-surface text-sm">{notification.title}</h4>
                <p className="text-on-surface-medium text-sm mt-0.5">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-on-surface-disabled hover:text-on-surface transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
