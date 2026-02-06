import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import MapView from '../components/MapView';
import VehicleInfoCard from '../components/VehicleInfoCard';
import TripRequestModal from '../components/TripRequestModal';
import AddVehicleModal from '../components/AddVehicleModal';
import { formatDistanceToNow } from 'date-fns';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles);
      setLoading(false);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setLoading(false);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      const response = await api.get('/trips/employee/my-trips');
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }, []);

  const setupSocketListeners = useCallback(() => {
    const socket = getSocket();

    socket.on('vehicle_location_updated', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v._id === data.vehicleId
            ? { ...v, location: data.location, lastUpdated: new Date() }
            : v
        )
      );
    });

    socket.on('vehicle_status_updated', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v._id === data.vehicleId ? { ...v, status: data.status } : v
        )
      );
    });

    socket.on('vehicle_driver_updated', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v._id === data.vehicleId 
            ? { ...v, currentDriver: data.currentDriver }
            : v
        )
      );
      
      setSelectedVehicle(prev => {
        if (prev && prev._id === data.vehicleId) {
          return { ...prev, currentDriver: data.currentDriver };
        }
        return prev;
      });
    });

    socket.on('trip_accepted', () => {
      showNotification('Trip Accepted!', 'Driver has accepted your trip request', 'success');
      loadTrips();
    });

    socket.on('trip_rejected', (data) => {
      showNotification('Trip Rejected', `Driver rejected: ${data.rejectionReason}`, 'error');
      loadTrips();
    });

    socket.on('trip_started', () => {
      showNotification('Trip Started', 'Your trip has started', 'info');
      loadTrips();
    });

    socket.on('trip_completed', () => {
      showNotification('Trip Completed', 'Your trip has been completed', 'success');
      loadTrips();
    });
  }, [loadTrips]);

  useEffect(() => {
    loadVehicles();
    loadTrips();
    setupSocketListeners();
  }, [loadVehicles, loadTrips, setupSocketListeners]);

  const showNotification = (title, message, type) => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVehicles(), loadTrips()]);
    setRefreshing(false);
    showNotification('Refreshed', 'Data updated successfully', 'success');
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleRequestPickup = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowTripModal(true);
  };

  const handleSubmitTrip = async (tripData) => {
    try {
      const response = await api.post('/trips', tripData);
      
      if (response.data.success) {
        showNotification('Request Sent', 'Trip request sent to driver', 'success');
        setShowTripModal(false);
        loadTrips();
        loadVehicles();
        // Socket event is now emitted server-side for reliability
      }
    } catch (error) {
      showNotification('Error', error.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;

    try {
      await api.put(`/trips/${tripId}/cancel`);
      showNotification('Trip Cancelled', 'Your trip has been cancelled', 'info');
      loadTrips();
      loadVehicles();
    } catch (error) {
      showNotification('Error', error.response?.data?.message || 'Failed to cancel trip', 'error');
    }
  };

  const getTripStatusBadge = (status) => {
    const styles = {
      'Requested': 'bg-amber-100 text-amber-700 border-amber-200',
      'Accepted': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Rejected': 'bg-red-100 text-red-700 border-red-200',
      'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completed': 'bg-gray-100 text-gray-600 border-gray-200',
      'Cancelled': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return styles[status] || styles['Completed'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Requested': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      'Accepted': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      'In Progress': (
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
        </svg>
      ),
      'Completed': (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    };
    return icons[status] || icons['Completed'];
  };

  // Only count vehicles as available if they have a driver assigned
  const availableVehicles = vehicles.filter(v => v.status === 'Available' && v.currentDriver).length;
  const activeTrips = trips.filter(t => ['Requested', 'Accepted', 'In Progress'].includes(t.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-on-surface-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-2dp backdrop-blur-lg border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-surface-4dp transition"
              >
                <svg className="w-6 h-6 text-on-surface-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <svg className="w-6 h-6 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-on-surface">NumaliRide</h1>

                </div>
              </div>
            </div>

            {/* Center - Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-xl border border-secondary/20">
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                <span className="text-sm font-medium text-secondary">{availableVehicles} Available</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm font-medium text-primary">{activeTrips} Active Trips</span>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl hover:bg-surface-4dp transition text-on-surface-medium hover:text-on-surface"
                title="Refresh data"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary-light text-on-secondary rounded-xl shadow-lg shadow-secondary/20 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Add Vehicle</span>
                </button>
              )}

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-disabled">{user.department}</p>
                </div>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-on-primary font-semibold text-sm shadow">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl hover:bg-error/10 text-on-surface-disabled hover:text-error transition"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-surface-1dp backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('map')}
              className={`relative py-4 px-6 font-medium text-sm transition-all duration-300 ${
                activeTab === 'map'
                  ? 'text-primary'
                  : 'text-on-surface-medium hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Live Map
              </div>
              {activeTab === 'map' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`relative py-4 px-6 font-medium text-sm transition-all duration-300 ${
                activeTab === 'trips'
                  ? 'text-primary'
                  : 'text-on-surface-medium hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Trips
                {trips.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                    {trips.length}
                  </span>
                )}
              </div>
              {activeTab === 'trips' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-surface-4dp rounded-2xl shadow-sm border border-white/5 overflow-hidden h-[calc(100vh-280px)] min-h-[500px]">
                <MapView
                  vehicles={vehicles}
                  onVehicleClick={handleVehicleClick}
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="lg:col-span-1">
              <VehicleInfoCard
                vehicle={selectedVehicle}
                onRequestPickup={handleRequestPickup}
              />
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <div className="bg-surface-4dp rounded-2xl shadow-sm border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Trip History</h2>
                    <p className="text-sm text-on-surface-disabled mt-1">View and manage your trip requests</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge badge-info">{trips.filter(t => t.status === 'Requested').length} Pending</span>
                    <span className="badge badge-success">{trips.filter(t => t.status === 'Completed').length} Completed</span>
                  </div>
                </div>
              </div>
              
              {trips.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-20 h-20 bg-surface-8dp rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-on-surface-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-on-surface mb-2">No trips yet</h3>
                  <p className="text-on-surface-disabled mb-6">Start by requesting a ride from the Live Map tab</p>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    View Map
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {trips.map((trip, index) => (
                    <div 
                      key={trip._id} 
                      className="p-5 hover:bg-surface-6dp transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-on-surface">{trip.vehicleId?.vehicleNumber}</h3>
                              <p className="text-sm text-on-surface-disabled">{trip.vehicleId?.vehicleType}</p>
                            </div>
                            <span className={`badge border ${getTripStatusBadge(trip.status)} flex items-center gap-1.5`}>
                              {getStatusIcon(trip.status)}
                              {trip.status}
                            </span>
                          </div>

                          <div className="space-y-2 pl-0 sm:pl-13">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-secondary shadow-lg shadow-secondary/50"></div>
                                <div className="w-0.5 h-8 bg-gradient-to-b from-secondary to-error"></div>
                                <div className="w-3 h-3 rounded-full bg-error shadow-lg shadow-error/50"></div>
                              </div>
                              <div className="space-y-4 flex-1 min-w-0">
                                <div>
                                  <p className="text-xs text-on-surface-disabled uppercase tracking-wide mb-0.5">Pickup</p>
                                  <p className="text-sm font-medium text-on-surface truncate">{trip.pickupLocation?.address}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-on-surface-disabled uppercase tracking-wide mb-0.5">Drop-off</p>
                                  <p className="text-sm font-medium text-on-surface truncate">{trip.dropLocation?.address}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-medium pt-2">
                              {trip.driverId && (
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{trip.driverId.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formatDistanceToNow(new Date(trip.requestTime), { addSuffix: true })}</span>
                              </div>
                            </div>

                            {trip.status === 'Rejected' && trip.rejectionReason && (
                              <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2">
                                <svg className="w-5 h-5 text-error flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  <p className="text-xs font-medium text-error">Rejection Reason</p>
                                  <p className="text-sm text-error/80">{trip.rejectionReason}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {['Requested', 'Accepted'].includes(trip.status) && (
                          <button
                            onClick={() => handleCancelTrip(trip._id)}
                            className="flex-shrink-0 px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-xl font-medium text-sm transition-colors duration-200 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Trip Request Modal */}
      {showTripModal && (
        <TripRequestModal
          vehicle={selectedVehicle}
          onClose={() => setShowTripModal(false)}
          onSubmit={handleSubmitTrip}
        />
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <AddVehicleModal
          isOpen={showAddVehicleModal}
          onClose={() => setShowAddVehicleModal(false)}
          onVehicleAdded={() => {
            loadVehicles();
            showNotification('Vehicle Added', 'New vehicle added successfully', 'success');
          }}
          department={user.department}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 notification">
          <div className={`flex items-start gap-3 rounded-2xl shadow-2xl p-4 min-w-[320px] border ${
            notification.type === 'success' 
              ? 'bg-secondary/10 border-secondary/20 text-secondary' 
              : notification.type === 'error' 
              ? 'bg-error/10 border-error/20 text-error' 
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              notification.type === 'success' 
                ? 'bg-secondary' 
                : notification.type === 'error' 
                ? 'bg-error' 
                : 'bg-primary'
            }`}>
              {notification.type === 'success' ? (
                <svg className="w-5 h-5 text-on-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : notification.type === 'error' ? (
                <svg className="w-5 h-5 text-on-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-on-surface">{notification.title}</h4>
              <p className="text-sm text-on-surface-medium">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-on-surface-disabled hover:text-on-surface transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
