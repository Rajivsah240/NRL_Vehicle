import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const VehicleInfoCard = ({ vehicle, onRequestPickup }) => {
  if (!vehicle) {
    return (
      <div className="bg-surface-4dp rounded-2xl shadow-sm border border-white/5 p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-on-surface mb-2">Select a Vehicle</h3>
        <p className="text-on-surface-disabled text-sm">Click on any vehicle marker on the map to view its details</p>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      'Available': {
        bg: 'bg-secondary/10',
        border: 'border-secondary/20',
        text: 'text-secondary',
        dot: 'bg-secondary',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      },
      'Busy': {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        dot: 'bg-amber-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      },
      'In Transit': {
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        text: 'text-primary',
        dot: 'bg-primary animate-pulse',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
        )
      },
      'Not Available': {
        bg: 'bg-error/10',
        border: 'border-error/20',
        text: 'text-error',
        dot: 'bg-error',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      },
      'No Driver': {
        bg: 'bg-on-surface-disabled/10',
        border: 'border-on-surface-disabled/20',
        text: 'text-on-surface-medium',
        dot: 'bg-on-surface-disabled',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      }
    };
    return configs[status] || configs['Not Available'];
  };

  // Get effective status - if no driver, show as "No Driver"
  const effectiveStatus = !vehicle.currentDriver ? 'No Driver' : vehicle.status;
  const statusConfig = getStatusConfig(effectiveStatus);

  return (
    <div className="bg-surface-4dp rounded-2xl shadow-sm border border-white/5 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-surface-8dp p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-2xl"></div>
        </div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-white/5 backdrop-blur rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
              <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
              <span className={`text-xs font-semibold ${statusConfig.text}`}>{effectiveStatus}</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-on-surface mb-1">{vehicle.vehicleNumber}</h3>
          <p className="text-on-surface-medium text-sm">{vehicle.vehicleType}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5 flex-1">
        {/* Driver Info */}
        {vehicle.currentDriver ? (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-on-surface-disabled uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Driver Information
            </h4>
            <div className="bg-surface-6dp rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold text-lg shadow-lg shadow-primary/20">
                  {vehicle.currentDriver.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface truncate">{vehicle.currentDriver.name}</p>
                  <a 
                    href={`tel:${vehicle.currentDriver.phone}`} 
                    className="text-sm text-primary hover:text-primary-light flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {vehicle.currentDriver.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-amber-400">No Driver Assigned</p>
              <p className="text-sm text-amber-400/70">This vehicle is currently without a driver</p>
            </div>
          </div>
        )}

        {/* Location */}
        {vehicle.location?.address && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-on-surface-disabled uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Current Location
            </h4>
            <div className="bg-surface-6dp rounded-xl p-4 border border-white/5">
              <p className="text-sm text-on-surface-medium leading-relaxed">{vehicle.location.address}</p>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-on-surface-disabled">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
          <span>Updated {formatDistanceToNow(new Date(vehicle.lastUpdated), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-0 mt-auto">
        {vehicle.status === 'Available' && vehicle.currentDriver ? (
          <button
            onClick={() => onRequestPickup(vehicle)}
            className="w-full bg-primary hover:bg-primary-light text-on-primary font-semibold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Request Pickup
          </button>
        ) : vehicle.status !== 'Available' && vehicle.status !== 'Not Available' ? (
          <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {statusConfig.icon}
            </div>
            <div>
              <p className="font-medium text-primary">Vehicle {vehicle.status}</p>
              <p className="text-sm text-primary/70">Check back later for availability</p>
            </div>
          </div>
        ) : !vehicle.currentDriver ? (
          <div className="flex items-center gap-3 p-4 bg-surface-6dp border border-white/5 rounded-xl">
            <div className="w-10 h-10 bg-on-surface-disabled/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-on-surface-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-on-surface-medium">Unavailable for Booking</p>
              <p className="text-sm text-on-surface-disabled">No driver assigned to this vehicle</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VehicleInfoCard;
