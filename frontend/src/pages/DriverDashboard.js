import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import { formatDistanceToNow, format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [trips, setTrips] = useState([]);
  const [vehicleTrips, setVehicleTrips] = useState([]); // Trips for current vehicle (history)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleStatus, setVehicleStatus] = useState('Available');
  const [notification, setNotification] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Status configurations for consistent theming
  const tripStatusConfig = {
    'Requested': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', icon: '⏳' },
    'Accepted': { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/50', icon: '✓' },
    'In Progress': { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/50', icon: '🚗' },
    'Completed': { bg: 'bg-secondary/20', text: 'text-secondary', border: 'border-secondary/50', icon: '✅' },
    'Cancelled': { bg: 'bg-error/20', text: 'text-error', border: 'border-error/50', icon: '✕' }
  };

  const vehicleStatusConfig = {
    'Available': { bg: 'bg-secondary', text: 'text-secondary', glow: 'shadow-secondary/50', icon: '✓' },
    'Busy': { bg: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/50', icon: '⏳' },
    'In Transit': { bg: 'bg-primary', text: 'text-primary', glow: 'shadow-primary/50', icon: '🚗' },
    'Not Available': { bg: 'bg-error', text: 'text-error', glow: 'shadow-error/50', icon: '✕' }
  };

  const getTripStatusColor = useCallback((status) => {
    const config = tripStatusConfig[status] || tripStatusConfig['Requested'];
    return `${config.bg} ${config.text} ${config.border}`;
  }, []);

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

  const loadAssignedVehicle = useCallback(async () => {
    try {
      const response = await api.get('/vehicles/driver/my-vehicle');
      setAssignedVehicle(response.data.vehicle);
      setVehicleStatus(response.data.vehicle.status);
      
      // Load trips for this vehicle
      if (response.data.vehicle?._id) {
        try {
          const tripsResponse = await api.get(`/trips/vehicle/${response.data.vehicle._id}`);
          setVehicleTrips(tripsResponse.data.trips);
        } catch (tripError) {
          console.error('Error loading vehicle trips:', tripError);
          setVehicleTrips([]);
        }
      }
    } catch (error) {
      setAssignedVehicle(null);
      setVehicleTrips([]);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    try {
      const response = await api.get('/trips/driver/my-trips');
      setTrips(response.data.trips);
      
      const pending = response.data.trips.filter(t => t.status === 'Requested');
      setPendingRequests(pending);
      
      const active = response.data.trips.find(t => ['Accepted', 'In Progress'].includes(t.status));
      setActiveTrip(active || null);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }, []);

  const setupSocketListeners = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      console.log('Setting up socket listeners for driver');
      
      // Remove existing listeners to avoid duplicates
      socket.off('new_trip_request');
      socket.off('tripUpdated');
      socket.off('tripCancelled');
      socket.off('trip_status_updated');
      
      // Listen for new trip requests
      socket.on('new_trip_request', (data) => {
        console.log('New trip request received:', data);
        showNotification('info', '🚗 New Trip Request', `New trip request: ${data.pickupLocation} → ${data.dropLocation}`);
        loadTrips();
      });

      socket.on('tripUpdated', (data) => {
        loadTrips();
        loadAssignedVehicle();
      });

      socket.on('tripCancelled', (data) => {
        showNotification('warning', '❌ Trip Cancelled', `Trip has been cancelled by the employee`);
        loadTrips();
        loadAssignedVehicle();
      });

      // Listen for trip status updates
      socket.on('trip_status_updated', (data) => {
        loadTrips();
        loadAssignedVehicle();
      });
      
      // Listen for socket reconnection
      socket.on('connect', () => {
        console.log('Socket reconnected, reloading trips...');
        loadTrips();
      });
    } else {
      console.warn('Socket not available for driver, retrying in 1 second...');
      // Retry socket setup after a short delay
      setTimeout(setupSocketListeners, 1000);
    }
  }, [loadTrips, loadAssignedVehicle]);

  const startLocationTracking = useCallback(() => {
    if (navigator.geolocation && assignedVehicle) {
      window.locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await api.put(`/vehicles/${assignedVehicle._id}/location`, {
                coordinates: [position.coords.longitude, position.coords.latitude]
              });
            } catch (error) {
              console.error('Error updating location:', error);
            }
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true }
        );
      }, 30000);
    }
  }, [assignedVehicle]);

  useEffect(() => {
    loadVehicles();
    loadAssignedVehicle();
    loadTrips();
    setupSocketListeners();

    return () => {
      if (window.locationInterval) {
        clearInterval(window.locationInterval);
      }
      // Clean up socket listeners on unmount
      const socket = getSocket();
      if (socket) {
        socket.off('new_trip_request');
        socket.off('tripUpdated');
        socket.off('tripCancelled');
        socket.off('trip_status_updated');
      }
    };
  }, [loadVehicles, loadAssignedVehicle, loadTrips, setupSocketListeners]);

  useEffect(() => {
    if (assignedVehicle) {
      startLocationTracking();
    }
  }, [assignedVehicle, startLocationTracking]);

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVehicles(), loadAssignedVehicle(), loadTrips()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAssignVehicle = async (vehicleId) => {
    try {
      await api.post('/vehicles/assign', { vehicleId });
      showNotification('success', '✅ Vehicle Assigned', 'You have been assigned to the vehicle');
      loadVehicles();
      loadAssignedVehicle();
    } catch (error) {
      showNotification('error', '❌ Assignment Failed', error.response?.data?.message || 'Failed to assign vehicle');
    }
  };

  const handleUnassignVehicle = async () => {
    try {
      await api.post('/vehicles/unassign', { vehicleId: assignedVehicle._id });
      showNotification('success', '✅ Vehicle Released', 'You have been unassigned from the vehicle');
      setAssignedVehicle(null);
      loadVehicles();
    } catch (error) {
      showNotification('error', '❌ Release Failed', error.response?.data?.message || 'Failed to unassign vehicle');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put('/vehicles/status', { vehicleId: assignedVehicle._id, status: newStatus });
      setVehicleStatus(newStatus);
      showNotification('success', '✅ Status Updated', `Vehicle status changed to ${newStatus}`);
    } catch (error) {
      showNotification('error', '❌ Update Failed', error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAcceptTrip = async (tripId) => {
    try {
      await api.put(`/trips/${tripId}/accept`);
      showNotification('success', '✅ Trip Accepted', 'You have accepted the trip request');
      loadTrips();
      loadAssignedVehicle();
    } catch (error) {
      showNotification('error', '❌ Accept Failed', error.response?.data?.message || 'Failed to accept trip');
    }
  };

  const handleRejectTrip = async (tripId) => {
    try {
      await api.put(`/trips/${tripId}/reject`);
      showNotification('info', 'ℹ️ Trip Rejected', 'Trip request has been rejected');
      loadTrips();
    } catch (error) {
      showNotification('error', '❌ Reject Failed', error.response?.data?.message || 'Failed to reject trip');
    }
  };

  const handleStartTrip = async (tripId) => {
    try {
      await api.put(`/trips/${tripId}/start`);
      showNotification('success', '🚗 Trip Started', 'Trip is now in progress');
      loadTrips();
      loadAssignedVehicle();
    } catch (error) {
      showNotification('error', '❌ Start Failed', error.response?.data?.message || 'Failed to start trip');
    }
  };

  const handleCompleteTrip = async (tripId) => {
    try {
      await api.put(`/trips/${tripId}/complete`);
      showNotification('success', '✅ Trip Completed', 'Trip has been completed successfully');
      loadTrips();
      loadAssignedVehicle();
    } catch (error) {
      showNotification('error', '❌ Complete Failed', error.response?.data?.message || 'Failed to complete trip');
    }
  };

  // Show all unassigned vehicles (not just 'Available' status)
  const availableVehicles = vehicles.filter(v => !v.driverId);
  
  // Get unique departments for filter dropdown
  const departments = [...new Set(availableVehicles.map(v => v.department).filter(Boolean))];
  
  // Get unique statuses for filter dropdown
  const statuses = [...new Set(availableVehicles.map(v => v.status).filter(Boolean))];
  
  // Filtered vehicles based on search and filters
  const filteredVehicles = availableVehicles.filter(vehicle => {
    const matchesSearch = searchQuery === '' || 
      vehicle.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = filterDepartment === '' || vehicle.department === filterDepartment;
    const matchesStatus = filterStatus === '' || vehicle.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterDepartment('');
    setFilterStatus('');
  };
  
  const hasActiveFilters = searchQuery || filterDepartment || filterStatus;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-medium text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-2dp border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-on-primary font-bold text-lg">🚗</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-on-surface">Driver Dashboard</h1>
                <p className="text-xs text-primary">NRL Vehicle Dispatch</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{pendingRequests.length}</p>
                <p className="text-xs text-on-surface-disabled">Pending Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{trips.filter(t => t.status === 'Completed').length}</p>
                <p className="text-xs text-on-surface-disabled">Completed Today</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-medium hover:text-on-surface transition-all"
              >
                <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-on-primary font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-on-surface">{user?.name}</p>
                  <p className="text-xs text-on-surface-disabled">Driver</p>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Assignment Section */}
        {!assignedVehicle ? (
          <div className="bg-surface-4dp rounded-2xl border border-white/5 p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-xl">🚙</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Select a Vehicle</h2>
                  <p className="text-sm text-on-surface-disabled">Choose an available vehicle to start accepting rides</p>
                </div>
              </div>
              <div className="text-sm text-on-surface-disabled">
                {filteredVehicles.length} of {availableVehicles.length} vehicles
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-on-surface-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by vehicle number, type, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-6dp border border-white/10 rounded-xl text-on-surface placeholder:text-on-surface-disabled focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-disabled hover:text-on-surface"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    showFilters || hasActiveFilters 
                      ? 'bg-primary text-white' 
                      : 'bg-surface-6dp text-on-surface-medium hover:bg-surface-8dp border border-white/10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  )}
                </button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="bg-surface-6dp rounded-xl p-4 border border-white/10 animate-fade-in">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Department Filter */}
                    <div className="flex-1">
                      <label className="block text-sm text-on-surface-disabled mb-2">Department</label>
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-8dp border border-white/10 rounded-lg text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="" className="bg-surface">All Departments</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept} className="bg-surface">{dept}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex-1">
                      <label className="block text-sm text-on-surface-disabled mb-2">Availability Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-2.5 bg-surface-8dp border border-white/10 rounded-lg text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="" className="bg-surface">All Status</option>
                        {statuses.map(status => (
                          <option key={status} value={status} className="bg-surface">{status}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Clear Filters */}
                    {hasActiveFilters && (
                      <div className="flex items-end">
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2.5 bg-error/20 hover:bg-error/30 text-error rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Filter Chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs text-on-surface-disabled mr-2">Quick filters:</span>
                    <button
                      onClick={() => { setFilterStatus('Available'); setFilterDepartment(''); }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                        filterStatus === 'Available' && !filterDepartment
                          ? 'bg-secondary text-black'
                          : 'bg-secondary/20 text-secondary hover:bg-secondary/30'
                      }`}
                    >
                      ✓ Available Only
                    </button>
                    {departments.slice(0, 3).map(dept => (
                      <button
                        key={dept}
                        onClick={() => { setFilterDepartment(dept); setFilterStatus(''); }}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                          filterDepartment === dept && !filterStatus
                            ? 'bg-primary text-white'
                            : 'bg-primary/20 text-primary hover:bg-primary/30'
                        }`}
                      >
                        🏢 {dept}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {availableVehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface-8dp rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚗</span>
                </div>
                <p className="text-on-surface-medium">No vehicles available at the moment</p>
                <p className="text-sm text-on-surface-disabled mt-1">Please check back later</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-surface-8dp rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔍</span>
                </div>
                <p className="text-on-surface-medium">No vehicles match your search</p>
                <p className="text-sm text-on-surface-disabled mt-1">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVehicles.map((vehicle) => {
                  const statusColors = {
                    'Available': 'bg-secondary/20 text-secondary',
                    'Busy': 'bg-amber-500/20 text-amber-400',
                    'In Transit': 'bg-primary/20 text-primary',
                    'Not Available': 'bg-error/20 text-error'
                  };
                  return (
                  <div key={vehicle._id} className="bg-surface-6dp backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-on-surface text-lg">{vehicle.vehicleNumber}</h3>
                        <p className="text-sm text-on-surface-disabled">{vehicle.vehicleType}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[vehicle.status] || statusColors['Available']}`}>
                        {vehicle.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-on-surface-disabled">
                        <span>👥</span>
                        <span>Capacity: {vehicle.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-disabled">
                        <span>🏢</span>
                        <span>{vehicle.department}</span>
                      </div>
                      {vehicle.status === 'Not Available' && (
                        <div className="flex items-center gap-2 text-error text-xs">
                          <span>⚠️</span>
                          <span>Marked unavailable by admin</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleAssignVehicle(vehicle._id)}
                      disabled={vehicle.status === 'Not Available' || vehicle.currentDriver}
                      className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                        vehicle.status === 'Not Available' || vehicle.currentDriver
                          ? 'bg-surface-8dp text-on-surface-disabled cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-light text-on-primary shadow-lg shadow-primary/25'
                      }`}
                    >
                      {vehicle.status === 'Not Available' 
                        ? 'Not Available' 
                        : vehicle.currentDriver 
                          ? 'Already Assigned' 
                          : 'Assign to Me'}
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* My Vehicle Card */}
            <div className="bg-surface-4dp rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-primary p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🚗</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-on-primary">{assignedVehicle.vehicleNumber}</h2>
                      <p className="text-on-primary/80">{assignedVehicle.vehicleType} • {assignedVehicle.capacity} seats</p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${vehicleStatusConfig[vehicleStatus]?.bg} text-white shadow-lg ${vehicleStatusConfig[vehicleStatus]?.glow}`}>
                    {vehicleStatusConfig[vehicleStatus]?.icon} {vehicleStatus}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="text-on-surface-disabled text-sm">Update Status:</label>
                    <select
                      value={vehicleStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={assignedVehicle?.status === 'Not Available'}
                      className={`bg-surface-6dp border border-white/10 rounded-lg px-4 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${assignedVehicle?.status === 'Not Available' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="Available" className="bg-surface">Available</option>
                      <option value="Busy" className="bg-surface">Busy</option>
                      <option value="In Transit" className="bg-surface">In Transit</option>
                    </select>
                    {assignedVehicle?.status === 'Not Available' && (
                      <span className="text-xs text-error">Vehicle marked unavailable by admin</span>
                    )}
                  </div>

                  <button
                    onClick={handleUnassignVehicle}
                    className="px-4 py-2 bg-error/20 hover:bg-error/30 text-error rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Release Vehicle
                  </button>
                </div>
              </div>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-surface-4dp rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                      {pendingRequests.length}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Pending Requests</h2>
                    <p className="text-sm text-on-surface-disabled">Accept or reject incoming ride requests</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="bg-primary/10 border border-primary/30 rounded-xl p-5 animate-pulse-slow">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold">
                              {request.employeeId?.name?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-on-surface">{request.employeeId?.name}</h3>
                              <p className="text-sm text-on-surface-disabled">{request.employeeId?.department}</p>
                            </div>
                            <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-full">
                              {formatDistanceToNow(new Date(request.requestTime), { addSuffix: true })}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-secondary rounded-full"></div>
                              <span className="text-on-surface-medium">{request.pickupLocation?.address}</span>
                            </div>
                            <svg className="w-4 h-4 text-on-surface-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-error rounded-full"></div>
                              <span className="text-on-surface-medium">{request.dropLocation?.address}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleRejectTrip(request._id)}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-error/20 hover:bg-error/30 text-error rounded-lg font-medium transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAcceptTrip(request._id)}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-lg font-medium transition-all shadow-lg shadow-secondary/25"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Trip */}
            {activeTrip && (
              <div className="bg-surface-4dp rounded-2xl border border-white/5 overflow-hidden">
                <div className="bg-primary p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🚗</span>
                    </div>
                    <h2 className="text-lg font-bold text-on-primary">Active Trip</h2>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm text-on-primary/80">{activeTrip.status}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-on-primary font-bold text-lg">
                        {activeTrip.employeeId?.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-lg">{activeTrip.employeeId?.name}</h3>
                        <p className="text-sm text-on-surface-disabled">{activeTrip.employeeId?.phone}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getTripStatusColor(activeTrip.status)}`}>
                      {tripStatusConfig[activeTrip.status]?.icon} {activeTrip.status}
                    </span>
                  </div>

                  {/* Route Visualization */}
                  <div className="bg-surface-6dp rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-secondary rounded-full shadow-lg shadow-secondary/50"></div>
                        <div className="w-0.5 h-12 bg-gradient-to-b from-secondary to-error"></div>
                        <div className="w-4 h-4 bg-error rounded-full shadow-lg shadow-error/50"></div>
                      </div>
                      <div className="flex-1 space-y-8">
                        <div>
                          <p className="text-xs text-on-surface-disabled mb-1">PICKUP</p>
                          <p className="text-on-surface font-medium">{activeTrip.pickupLocation?.address}</p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-disabled mb-1">DROP-OFF</p>
                          <p className="text-on-surface font-medium">{activeTrip.dropLocation?.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    {activeTrip.status === 'Accepted' && (
                      <button
                        onClick={() => handleStartTrip(activeTrip._id)}
                        className="flex-1 py-3 bg-primary hover:bg-primary-light text-on-primary rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                      >
                        <span>🚗</span> Start Trip
                      </button>
                    )}
                    {activeTrip.status === 'In Progress' && (
                      <button
                        onClick={() => handleCompleteTrip(activeTrip._id)}
                        className="flex-1 py-3 bg-secondary hover:bg-secondary/90 text-on-secondary rounded-xl font-semibold transition-all shadow-lg shadow-secondary/25 flex items-center justify-center gap-2"
                      >
                        <span>✅</span> Complete Trip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Trip History - Date Wise */}
            <div className="bg-surface-4dp rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface">Vehicle Trip History</h2>
                    <p className="text-sm text-on-surface-disabled">
                      {assignedVehicle ? `All trips for ${assignedVehicle.vehicleNumber}` : 'Trip history for your assigned vehicle'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-disabled">
                  <span className="px-2 py-1 bg-secondary/20 text-secondary rounded-full text-xs">
                    {vehicleTrips.filter(t => t.status === 'Completed').length} Completed
                  </span>
                  <span className="px-2 py-1 bg-error/20 text-error rounded-full text-xs">
                    {vehicleTrips.filter(t => ['Rejected', 'Cancelled'].includes(t.status)).length} Cancelled
                  </span>
                </div>
              </div>

              {vehicleTrips.filter(t => t.status !== 'Requested').length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-surface-8dp rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <p className="text-on-surface-medium">No trips in history yet</p>
                  <p className="text-sm text-on-surface-disabled mt-1">Completed trips for this vehicle will appear here</p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    // Group trips by date
                    const historyTrips = vehicleTrips.filter(t => t.status !== 'Requested');
                    const groupedTrips = historyTrips.reduce((groups, trip) => {
                      const date = startOfDay(new Date(trip.requestTime)).toISOString();
                      if (!groups[date]) {
                        groups[date] = [];
                      }
                      groups[date].push(trip);
                      return groups;
                    }, {});

                    // Sort dates in descending order (newest first)
                    const sortedDates = Object.keys(groupedTrips).sort((a, b) => new Date(b) - new Date(a));

                    const getDateLabel = (dateStr) => {
                      const date = new Date(dateStr);
                      if (isToday(date)) return 'Today';
                      if (isYesterday(date)) return 'Yesterday';
                      return format(date, 'EEEE, MMMM d, yyyy');
                    };

                    const formatDuration = (minutes) => {
                      if (!minutes || minutes <= 0) return null;
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      if (hours > 0) {
                        return `${hours}h ${mins}m`;
                      }
                      return `${mins} min`;
                    };

                    return sortedDates.map((dateStr) => (
                      <div key={dateStr} className="space-y-3">
                        {/* Date Header */}
                        <div className="flex items-center gap-3 sticky top-0 bg-surface-4dp py-2 z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-surface-8dp rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-semibold text-on-surface">{getDateLabel(dateStr)}</span>
                          </div>
                          <div className="flex-1 h-px bg-white/10"></div>
                          <span className="text-xs text-on-surface-disabled bg-surface-8dp px-2 py-1 rounded-full">
                            {groupedTrips[dateStr].length} trip{groupedTrips[dateStr].length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Trips for this date */}
                        <div className="space-y-2 pl-2">
                          {groupedTrips[dateStr].map((trip) => (
                            <div 
                              key={trip._id} 
                              className="bg-surface-6dp rounded-xl p-4 border border-white/5 hover:border-primary/30 transition-all"
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left: Employee, Driver & Route Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-semibold">
                                      {trip.employeeId?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-on-surface">{trip.employeeId?.name}</p>
                                      <p className="text-xs text-on-surface-disabled">{trip.employeeId?.department}</p>
                                    </div>
                                    {/* Driver info */}
                                    {trip.driverId && (
                                      <div className="flex items-center gap-2 bg-surface-8dp rounded-lg px-2 py-1">
                                        <svg className="w-4 h-4 text-on-surface-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-xs text-on-surface-medium">{trip.driverId?.name || 'Unknown Driver'}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Route */}
                                  <div className="flex items-start gap-2 mt-3">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                      <div className="w-0.5 h-6 bg-white/20"></div>
                                      <div className="w-2 h-2 bg-error rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-on-surface-medium truncate" title={trip.pickupLocation?.address}>
                                        {trip.pickupLocation?.address}
                                      </p>
                                      <div className="h-4"></div>
                                      <p className="text-sm text-on-surface-medium truncate" title={trip.dropLocation?.address}>
                                        {trip.dropLocation?.address}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Status, Duration & Time */}
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTripStatusColor(trip.status)}`}>
                                    {tripStatusConfig[trip.status]?.icon} {trip.status}
                                  </span>
                                  
                                  {/* Duration */}
                                  {(trip.actualDuration > 0 || (trip.startTime && trip.endTime)) && (
                                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-xs font-medium">
                                        {formatDuration(trip.actualDuration) || 
                                          formatDuration(Math.round((new Date(trip.endTime) - new Date(trip.startTime)) / 60000))}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-on-surface">
                                      {format(new Date(trip.requestTime), 'hh:mm a')}
                                    </p>
                                    {trip.startTime && (
                                      <p className="text-xs text-on-surface-disabled">
                                        Started: {format(new Date(trip.startTime), 'hh:mm a')}
                                      </p>
                                    )}
                                    {trip.endTime && (
                                      <p className="text-xs text-secondary">
                                        Ended: {format(new Date(trip.endTime), 'hh:mm a')}
                                      </p>
                                    )}
                                  </div>
                                  {trip.reason && (
                                    <p className="text-xs text-on-surface-disabled italic max-w-[150px] truncate" title={trip.reason}>
                                      "{trip.reason}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className={`bg-surface-8dp backdrop-blur rounded-xl p-4 shadow-2xl border max-w-sm ${
            notification.type === 'success' ? 'border-secondary/50 shadow-secondary/20' :
            notification.type === 'error' ? 'border-error/50 shadow-error/20' :
            notification.type === 'warning' ? 'border-amber-500/50 shadow-amber-500/20' :
            'border-primary/50 shadow-primary/20'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                notification.type === 'success' ? 'bg-secondary/20' :
                notification.type === 'error' ? 'bg-error/20' :
                notification.type === 'warning' ? 'bg-amber-500/20' :
                'bg-primary/20'
              }`}>
                {notification.type === 'success' ? '✅' :
                 notification.type === 'error' ? '❌' :
                 notification.type === 'warning' ? '⚠️' : 'ℹ️'}
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

export default DriverDashboard;
