import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: 
// import { db, appId, collection, query, where, orderBy, onSnapshot } from '../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204 || response.status === 404) return []; // Return empty array if no content/not found
    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
    }
    return response.json();
};

// REMOVED db prop
const MyTimesheet = ({ employee }) => {
    const [timeEntries, setTimeEntries] = useState([]);
    const [projects, setProjects] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // REMOVED paths: const timeEntriesCollectionPath = ...; const projectsCollectionPath = ...;

    const calculateHours = (entry) => {
        // Display as hours and minutes (e.g., "3 hr 45 min"), supporting nanos when present
        if (!entry.clockOutTime || !entry.clockInTime) return "N/A";
        const toMs = (ts) => {
            if (ts && typeof ts.seconds === 'number') {
                const nanos = typeof ts.nanos === 'number' ? ts.nanos : 0;
                return ts.seconds * 1000 + Math.floor(nanos / 1_000_000);
            }
            const d = new Date(ts);
            return isNaN(d.getTime()) ? null : d.getTime();
        };
        const inMs = toMs(entry.clockInTime);
        const outMs = toMs(entry.clockOutTime);
        if (inMs == null || outMs == null) return "N/A";
        const diffMs = Math.max(0, outMs - inMs);
        const totalMinutes = Math.round(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours} hr ${minutes} min`;
    };
    
    // REPLACED two onSnapshot listeners with one asynchronous fetch
    const fetchTimesheetData = useCallback(async () => {
        if (!employee) return;
        setIsLoading(true);

        try {
            // 1. Fetch all projects to map IDs to names
            const allProjects = await apiFetch('/projects');
            const projectsData = {};
            allProjects.forEach(p => {
                // Project name field is now 'projectTitle'
                projectsData[p.id] = p.projectTitle; 
            });
            setProjects(projectsData);
            
            // 2. Fetch employee's completed time entries (Requires backend endpoint: /reports/timesheet/{id})
            // This backend endpoint must handle the filtering by employeeId, status='clocked-out', and ordering.
            // Try document ID first (most time entries use this), then fall back to employeeId
            const empIdentifier = employee.id || employee.employeeId; // prefer document ID
            const entries = await apiFetch(`/reports/timesheet/${empIdentifier}`);
            
            setTimeEntries(entries);
        } catch(e) {
            console.error("Failed to fetch timesheet data:", e);
            setTimeEntries([]);
        } finally {
            setIsLoading(false);
        }
    }, [employee]);

    useEffect(() => {
        fetchTimesheetData();
        // Polling interval removed here since timesheets don't need real-time updates
    }, [employee, fetchTimesheetData]);


    const groupedEntries = timeEntries.reduce((acc, entry) => {
        const projectName = projects[entry.projectId] || 'Unknown Project';
        if (!acc[projectName]) {
            acc[projectName] = [];
        }
        acc[projectName].push(entry);
        return acc;
    }, {});


    if (isLoading) {
        return <div>Loading your timesheet...</div>;
    }

    return (
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            <h2 className="text-3xl font-bold mb-6">My Timesheet Report</h2>
            {Object.keys(groupedEntries).length === 0 ? (
                <p>You have no completed time entries.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white rounded-lg shadow">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3 font-semibold text-gray-700">Project</th>
                                <th className="p-3 font-semibold text-gray-700">Date</th>
                                <th className="p-3 font-semibold text-gray-700">Hours Worked</th>
                            </tr>
                        </thead>
                        <tbody>
                        {timeEntries.map(entry => (
                            <tr key={entry.id} className="border-b last:border-b-0 hover:bg-gray-100">
                                <td className="p-3">{projects[entry.projectId] || 'Unknown Project'}</td>
                                {/* Format date using seconds/nanos if present */}
                                <td className="p-3">{
                                    (() => {
                                        const ts = entry.clockInTime;
                                        let ms = null;
                                        if (ts && typeof ts.seconds === 'number') {
                                            const nanos = typeof ts.nanos === 'number' ? ts.nanos : 0;
                                            ms = ts.seconds * 1000 + Math.floor(nanos / 1_000_000);
                                        } else {
                                            const d = new Date(ts);
                                            ms = isNaN(d.getTime()) ? null : d.getTime();
                                        }
                                        return ms ? new Date(ms).toLocaleDateString() : '';
                                    })()
                                }</td>
                                <td className="p-3">{calculateHours(entry)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyTimesheet;