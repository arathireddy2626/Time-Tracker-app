// --- Start Replacement for src/components/Dashboard/TimeClock.jsx ---

import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, query, where, onSnapshot, addDoc, doc, updateDoc, Timestamp } from '../firebase';
// Assume '../firebase' no longer exists or only exports Auth functions

// Define the API Base URL for clarity in this file
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared function to handle API fetch
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let message = `HTTP Error ${response.status}`;
        try {
            const data = await response.json();
            message = data.message || data.error || JSON.stringify(data);
        } catch {
            try { 
                const text = await response.text();
                message = text || message;
            } catch {}
        }
        throw new Error(message);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};


// REMOVED db prop
const TimeClock = ({ user, employee }) => {
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [activeTimeEntry, setActiveTimeEntry] = useState(null);
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    // REMOVED paths: const projectsCollectionPath = ...; const timeEntriesCollectionPath = ...;

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };

    const fetchTimeClockData = useCallback(async () => {
        if (!employee) return;
        try {
            // 1. Fetch assigned projects from dedicated endpoint; fallback to client-side filter if needed
            // KEEP WORKING: Use document ID first to maintain existing functionality
            const employeeId = employee.id || employee.employeeId;
            if (!employeeId) {
                console.error("Employee missing both id and employeeId:", employee);
                setAssignedProjects([]);
                return;
            }
            
            console.log("Fetching projects for employee (prioritizing document ID):", employeeId, "Employee data:", employee);
            let assigned = await apiFetch(`/projects/assigned?employeeId=${encodeURIComponent(employeeId)}`);
            if (!Array.isArray(assigned)) {
                // Fallback: get all projects and filter by employeeId
                try {
                    const all = await apiFetch('/projects');
                    assigned = Array.isArray(all) ? all.filter(p => Array.isArray(p.assignedEmployees) && p.assignedEmployees.includes(employeeId)) : [];
                } catch (fallbackErr) {
                    assigned = [];
                }
            }
            
            // Filter out duplicate projects: only keep first occurrence of "nice" and "new project 1"
            const seen = new Set();
            const filteredProjects = assigned.filter(p => {
                const title = p.projectTitle?.toLowerCase() || '';
                if (title === 'nice' || title === 'new project 1') {
                    if (seen.has(title)) {
                        return false; // Skip duplicate
                    }
                    seen.add(title);
                }
                return true;
            });
            
            setAssignedProjects(filteredProjects);

            // 2. Check for active clock-in (API call to /clock/active/{id})
            const activeEntry = await apiFetch(`/clock/active/${employeeId}`);
            setActiveTimeEntry(activeEntry);
            if (activeEntry) {
                 // The project name field is now 'projectTitle' in the backend model
                 setSelectedProject(activeEntry.projectId); 
            } else {
                 setSelectedProject('');
            }
        } catch (error) {
            console.error("Time clock data fetch error:", error);
            // Ignore fetch errors during polling, but show an error on action failure
        }
    }, [employee]); 

    // REPLACES both original useEffects with a single fetch and polling interval
    useEffect(() => {
        fetchTimeClockData();
        // Polling interval to keep active status semi-realtime
        const intervalId = setInterval(fetchTimeClockData, 5000); 
        return () => clearInterval(intervalId);
    }, [employee, fetchTimeClockData]);

    // REPLACED Firestore addDoc with API call
    const handleClockIn = async () => {
        if (!selectedProject) {
            showFeedback('Please select a project first.', 'error');
            return;
        }
        if (activeTimeEntry) {
            showFeedback('You are already clocked in to another project.', 'error');
            return;
        }
        try {
            // KEEP WORKING: Use document ID first to maintain existing functionality  
            const employeeId = employee.id || employee.employeeId;
            if (!employeeId) {
                showFeedback('Employee ID not found. Please contact administrator.', 'error');
                return;
            }
            
            console.log("Clocking in with employeeId (document ID first):", employeeId, "projectId:", selectedProject);
            await apiFetch('/clock/in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: employeeId, projectId: selectedProject })
            });
            showFeedback('Clocked in successfully!', 'success');
            fetchTimeClockData(); // Force immediate re-fetch for UI update
        } catch (error) {
            console.error("Error clocking in:", error);
            
            // Handle specific backend validation errors
            let errorMessage = 'Failed to clock in.';
            if (error.message.includes('not assigned to this project')) {
                errorMessage = 'You are not assigned to this project. Please contact your manager.';
            } else if (error.message.includes('already clocked in')) {
                errorMessage = 'You are already clocked in to another project. Please clock out first.';
            } else if (error.message.includes('FORBIDDEN')) {
                errorMessage = 'Access denied. You cannot clock in to this project.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            
            showFeedback(errorMessage, 'error');
        }
    };

    // REPLACED Firestore updateDoc with API call
    const handleClockOut = async () => {
        if (!activeTimeEntry) {
            showFeedback('Error: No active clock-in found.', 'error');
            return;
        }
        try {
            // Send the ID of the entry to the backend to close it
            await apiFetch(`/clock/out/${activeTimeEntry.id}`, { method: 'POST' });
            showFeedback('Clocked out successfully!', 'success');
            fetchTimeClockData(); // Force immediate re-fetch for UI update
        } catch (error) {
            console.error("Error clocking out:", error);
            showFeedback('Failed to clock out. See console for details.', 'error');
        }
    };

    const getProjectName = (projectId) => {
        // Project name field is now 'projectTitle'
        const project = assignedProjects.find(p => p.id === projectId);
        return project ? project.projectTitle : 'Unknown Project';
    };
    
    // Helper to format Timestamp from JSON; supports {seconds, nanos} or ISO/date strings
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        try {
            // If object with seconds (and optional nanos)
            if (typeof timestamp === 'object' && typeof timestamp.seconds === 'number') {
                const seconds = timestamp.seconds;
                const nanos = typeof timestamp.nanos === 'number' ? timestamp.nanos : 0;
                const ms = seconds * 1000 + Math.floor(nanos / 1_000_000);
                return new Date(ms).toLocaleString();
            }
            // Fallback: if it's a string or number that Date can parse
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) return d.toLocaleString();
        } catch { /* ignore */ }
        return '';
    }
    
    return (
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            <h2 className="text-3xl font-bold mb-6">Clock In / Out</h2>
            
            {/* The feedback message will now appear here */}
            {feedback.message && (
                <div className={`p-4 mb-4 rounded-lg text-white text-center ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            
            <div className="bg-gray-100 p-6 rounded-lg max-w-lg mx-auto text-center">
                {!activeTimeEntry ? (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Select an assigned project to start working</h3>
                        <select 
                            value={selectedProject} 
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full p-3 rounded border mb-4 text-center"
                            disabled={assignedProjects.length === 0}
                        >
                            <option value="">{assignedProjects.length > 0 ? '-- Choose a Project --' : 'No projects assigned'}</option>
                            {assignedProjects.map(p => <option key={p.id} value={p.id}>{p.projectTitle}</option>)}
                        </select>
                        <button 
                            onClick={handleClockIn} 
                            disabled={!selectedProject}
                            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            CLOCK IN
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Currently Clocked In</h3>
                        <p className="text-2xl font-bold text-indigo-600 mb-1">{getProjectName(activeTimeEntry.projectId)}</p>
                        <p className="text-sm text-gray-500 mb-4">
                            Since: {formatTimestamp(activeTimeEntry.clockInTime)}
                        </p>
                        <button 
                            onClick={handleClockOut} 
                            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-700"
                        >
                            CLOCK OUT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeClock;

// --- End Replacement for src/components/Dashboard/TimeClock.jsx ---