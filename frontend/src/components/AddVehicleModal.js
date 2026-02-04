import React, { useState } from 'react';
import api from '../utils/api';

const AddVehicleModal = ({ isOpen, onClose, onVehicleAdded, department }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'Sedan',
    department: department || '',
    capacity: 4,
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleTypes = [
    { type: 'Sedan', icon: '🚗', description: 'Standard 4-seater' },
    { type: 'SUV', icon: '🚙', description: 'Spacious 5-7 seater' },
    { type: 'Van', icon: '🚐', description: '8-12 passengers' },
    { type: 'Bus', icon: '🚌', description: 'Large capacity' },
    { type: 'Pickup Truck', icon: '🛻', description: 'Utility vehicle' }
  ];

  const departments = [
    { name: 'Mechanical Maintenance', icon: '🔧' },
    { name: 'Civil Maintenance', icon: '🏗️' },
    { name: 'Electrical Maintenance', icon: '⚡' },
    { name: 'Instrumentation', icon: '📊' },
    { name: 'Production', icon: '🏭' },
    { name: 'Safety', icon: '🦺' },
    { name: 'HR', icon: '👥' },
    { name: 'Admin', icon: '📋' },
    { name: 'Finance', icon: '💰' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const vehicleData = {
              ...formData,
              location: {
                type: 'Point',
                coordinates: [position.coords.longitude, position.coords.latitude],
                address: formData.address || 'Current Location'
              },
              status: 'Available'
            };

            try {
              await api.post('/vehicles', vehicleData);
              onVehicleAdded();
              onClose();
              setFormData({
                vehicleNumber: '',
                vehicleType: 'Sedan',
                department: department || '',
                capacity: 4,
                address: ''
              });
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to add vehicle');
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            setError('Location access denied. Please enable location services.');
            setLoading(false);
          }
        );
      } else {
        setError('Geolocation is not supported by this browser');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-4dp rounded-2xl shadow-2xl shadow-primary/10 max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/5 animate-scale-in">
        {/* Header */}
        <div className="bg-primary p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-on-primary">Add New Vehicle</h2>
                <p className="text-on-primary/80 text-sm">Register a vehicle to the fleet</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-on-primary transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 bg-error/20 border border-error/50 rounded-xl flex items-start gap-3 animate-shake">
              <span className="text-error text-lg">⚠️</span>
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Vehicle Number */}
            <div>
              <label htmlFor="vehicleNumber" className="block text-sm font-medium text-on-surface-medium mb-2">
                Vehicle Number <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-disabled">🔢</span>
                <input
                  type="text"
                  id="vehicleNumber"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-surface-6dp border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-on-surface placeholder-on-surface-disabled transition-all"
                  placeholder="e.g., NRL-MM-001"
                />
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-sm font-medium text-on-surface-medium mb-2">
                Vehicle Type <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {vehicleTypes.map(({ type, icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicleType: type })}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                      formData.vehicleType === type
                        ? 'bg-primary/20 border-primary text-on-surface shadow-lg shadow-primary/20'
                        : 'bg-surface-6dp border-white/10 text-on-surface-disabled hover:border-white/20 hover:bg-surface-8dp'
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-xs font-medium">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-on-surface-medium mb-2">
                Department <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-disabled">🏢</span>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-surface-6dp border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-on-surface appearance-none cursor-pointer transition-all"
                >
                  <option value="" className="bg-surface">Select Department</option>
                  {departments.map(({ name, icon }) => (
                    <option key={name} value={name} className="bg-surface">{icon} {name}</option>
                  ))}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-disabled pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-on-surface-medium mb-2">
                Capacity (persons) <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-disabled">👥</span>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  max="50"
                  className="w-full pl-12 pr-4 py-3 bg-surface-6dp border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-on-surface transition-all"
                />
              </div>
            </div>

            {/* Location Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-on-surface-medium mb-2">
                Location Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-disabled">📍</span>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-surface-6dp border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-on-surface placeholder-on-surface-disabled transition-all"
                  placeholder="e.g., Main Gate, Admin Block"
                />
              </div>
              <p className="text-xs text-on-surface-disabled mt-2 flex items-center gap-1">
                <span>💡</span> Current GPS location will be used if left blank
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-surface-6dp hover:bg-surface-8dp border border-white/10 text-on-surface-medium hover:text-on-surface rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-light text-on-primary font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <span>➕</span> Add Vehicle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
