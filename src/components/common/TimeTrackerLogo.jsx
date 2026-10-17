import React from 'react';

export default function TimeTrackerLogo({ className = 'h-10 w-auto text-primary' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg viewBox="0 0 48 48" className="h-10 w-10 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
        <circle cx="24" cy="24" r="18" strokeWidth="2" className="text-primary" />
        <path d="M24 14v10l6 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-2xl font-bold text-white-900">TimeTracker</span>
    </div>
  );
}
