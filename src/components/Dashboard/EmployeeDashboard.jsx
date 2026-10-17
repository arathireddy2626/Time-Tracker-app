import React, { useState, useEffect } from 'react';
const EmployeeDashboard = ({ user, setActiveView }) => {
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [activeTimeEntry, setActiveTimeEntry] = useState(null);
    const [weekHours, setWeekHours] = useState(0);

    useEffect(() => {
        if (!user) return;

        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1';

        // Fetch assigned projects from backend
        // Use document ID first since most time entries/assignments use it
        const employeeId = user.id || user.employeeId;
        fetch(`${API_BASE}/projects/assigned?employeeId=${encodeURIComponent(employeeId)}`)
            .then(res => res.json())
            .then(data => setAssignedProjects(Array.isArray(data) ? data : []))
            .catch(() => setAssignedProjects([]));

        // Fetch active time entry
        fetch(`${API_BASE}/clock/active/${encodeURIComponent(employeeId)}`)
            .then(res => res.json())
            .then(entry => setActiveTimeEntry(entry && entry.id ? entry : null))
            .catch(() => setActiveTimeEntry(null));

        // Fetch hours in last 7 days
    fetch(`${API_BASE}/reports/timesheet/${encodeURIComponent(employeeId)}?days=7`)
            .then(res => res.json())
            .then(entries => {
                if (!Array.isArray(entries)) return setWeekHours(0);
                let totalSeconds = 0;
                entries.forEach(entry => {
                    if (entry.clockOutTime && entry.clockInTime) {
                        // assume timestamps are in seconds when returned
                        const out = entry.clockOutTime.seconds ?? (new Date(entry.clockOutTime).getTime() / 1000);
                        const inT = entry.clockInTime.seconds ?? (new Date(entry.clockInTime).getTime() / 1000);
                        totalSeconds += out - inT;
                    }
                });
                setWeekHours(totalSeconds / 3600);
            })
            .catch(() => setWeekHours(0));

    }, [user]);

    return (
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            <h2 className="text-3xl font-bold mb-2">Welcome, {user?.firstName}!</h2>
            <p className="text-gray-600 mb-8">Here's a summary of your activity.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">Currently Clocked In</h3>
                    {activeTimeEntry ? (
                        <div>
                            <p className="text-2xl font-bold text-indigo-600">{assignedProjects.find(p => p.id === activeTimeEntry.projectId)?.name || '...'}</p>
                            <button onClick={() => setActiveView('clock')} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Clock Out</button>
                        </div>
                    ) : (
                         <div>
                            <p className="text-2xl font-bold text-gray-400">Not Clocked In</p>
                             <button onClick={() => setActiveView('clock')} className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Clock In</button>
                        </div>
                    )}
                </div>
                 <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                     <h3 className="text-lg font-semibold text-gray-500 mb-2">Assigned Projects</h3>
                     <p className="text-5xl font-bold text-gray-800">{assignedProjects.length}</p>
                </div>
                 <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                     <h3 className="text-lg font-semibold text-gray-500 mb-2">Hours This Week</h3>
                     <p className="text-5xl font-bold text-gray-800">{weekHours.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;