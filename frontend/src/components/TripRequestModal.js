import React, { useState } from 'react';

const locations = [
  { name: 'Main Gate', coordinates: [26.5780, 93.7855], icon: '🚪' },
  { name: 'Admin Block', coordinates: [26.5785, 93.7860], icon: '🏢' },
  { name: 'Production Unit 1', coordinates: [26.5790, 93.7858], icon: '🏭' },
  { name: 'Production Unit 2', coordinates: [26.5788, 93.7865], icon: '🏭' },
  { name: 'Maintenance Workshop', coordinates: [26.5782, 93.7862], icon: '🔧' },
  { name: 'Storage Facility', coordinates: [26.5792, 93.7857], icon: '📦' },
  { name: 'Employee Canteen', coordinates: [26.5784, 93.7856], icon: '🍽️' },
  { name: 'Safety Office', coordinates: [26.5786, 93.7868], icon: '🦺' },
];

const TripRequestModal = ({ vehicle, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    pickupCoordinates: [],
    dropLocation: '',
    dropCoordinates: [],
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleLocationSelect = (field, location) => {
    if (field === 'pickup') {
      setFormData({
        ...formData,
        pickupLocation: location.name,
        pickupCoordinates: location.coordinates
      });
    } else {
      setFormData({
        ...formData,
        dropLocation: location.name,
        dropCoordinates: location.coordinates
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.pickupLocation || !formData.dropLocation) {
      return;
    }

    setLoading(true);

    const tripData = {
      vehicleId: vehicle._id,
      pickupLocation: {
        type: 'Point',
        coordinates: [formData.pickupCoordinates[1], formData.pickupCoordinates[0]],
        address: formData.pickupLocation
      },
      dropLocation: {
        type: 'Point',
        coordinates: [formData.dropCoordinates[1], formData.dropCoordinates[0]],
        address: formData.dropLocation
      },
      reason: formData.reason
    };

    await onSubmit(tripData);
    setLoading(false);
  };

  const canProceed = step === 1 ? formData.pickupLocation : formData.dropLocation;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-4dp rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden scale-in border border-white/5">
        {/* Header */}
        <div className="bg-surface-8dp p-6 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-2xl"></div>
          </div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-on-surface mb-1">Request Vehicle</h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-primary/20 rounded-lg text-sm text-primary">
                  {vehicle.vehicleNumber}
                </span>
                <span className="text-on-surface-medium text-sm">{vehicle.vehicleType}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${step === 1 ? 'bg-primary/20 text-on-surface' : 'bg-white/5 text-on-surface-medium'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary text-on-primary' : 'bg-white/10'}`}>
                {formData.pickupLocation ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium">Pickup</span>
            </div>
            <div className="w-8 h-0.5 bg-white/10"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${step === 2 ? 'bg-primary/20 text-on-surface' : 'bg-white/5 text-on-surface-medium'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary text-on-primary' : 'bg-white/10'}`}>
                {formData.dropLocation ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium">Drop-off</span>
            </div>
            <div className="w-8 h-0.5 bg-white/10"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${step === 3 ? 'bg-primary/20 text-on-surface' : 'bg-white/5 text-on-surface-medium'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-primary text-on-primary' : 'bg-white/10'}`}>
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Select Pickup Location</h3>
                  <p className="text-sm text-on-surface-disabled">Where should the driver pick you up?</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {locations.map((location) => (
                  <button
                    key={`pickup-${location.name}`}
                    type="button"
                    onClick={() => handleLocationSelect('pickup', location)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                      formData.pickupLocation === location.name
                        ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/20'
                        : 'border-white/10 hover:border-secondary/50 hover:bg-secondary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{location.icon}</span>
                      <span className={`text-sm font-medium ${formData.pickupLocation === location.name ? 'text-secondary' : 'text-on-surface-medium group-hover:text-secondary'}`}>
                        {location.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-error/20 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-error rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Select Drop-off Location</h3>
                  <p className="text-sm text-on-surface-disabled">Where do you need to go?</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {locations.filter(l => l.name !== formData.pickupLocation).map((location) => (
                  <button
                    key={`drop-${location.name}`}
                    type="button"
                    onClick={() => handleLocationSelect('drop', location)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                      formData.dropLocation === location.name
                        ? 'border-error bg-error/10 ring-2 ring-error/20'
                        : 'border-white/10 hover:border-error/50 hover:bg-error/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{location.icon}</span>
                      <span className={`text-sm font-medium ${formData.dropLocation === location.name ? 'text-error' : 'text-on-surface-medium group-hover:text-error'}`}>
                        {location.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 fade-in">
              {/* Trip Summary */}
              <div className="bg-surface-6dp rounded-2xl p-5 border border-white/5">
                <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Trip Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-secondary shadow-lg shadow-secondary/50"></div>
                      <div className="w-0.5 h-10 bg-gradient-to-b from-secondary to-error"></div>
                      <div className="w-4 h-4 rounded-full bg-error shadow-lg shadow-error/50"></div>
                    </div>
                    <div className="flex-1 space-y-6">
                      <div>
                        <p className="text-xs text-on-surface-disabled uppercase tracking-wide">Pickup</p>
                        <p className="font-medium text-on-surface">{formData.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-disabled uppercase tracking-wide">Drop-off</p>
                        <p className="font-medium text-on-surface">{formData.dropLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold shadow-lg shadow-primary/20">
                      {vehicle.currentDriver?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-disabled">Your Driver</p>
                      <p className="font-medium text-on-surface">{vehicle.currentDriver?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-on-surface-medium mb-2">
                  Reason for Trip <span className="text-on-surface-disabled">(Optional)</span>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-surface-6dp border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface placeholder-on-surface-disabled outline-none transition-all resize-none"
                  placeholder="e.g., Equipment inspection, Site visit, Meeting..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0">
          <div className="flex gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-6 py-4 bg-surface-6dp hover:bg-surface-8dp text-on-surface-medium font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-surface-6dp hover:bg-surface-8dp text-on-surface-medium font-semibold rounded-xl transition-colors border border-white/5"
              >
                Cancel
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
                className="flex-1 px-6 py-4 bg-primary hover:bg-primary-light text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold rounded-xl shadow-lg shadow-secondary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm border-white/30 border-t-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Request
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripRequestModal;
