import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query, doc, updateDoc, arrayUnion } from '../../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const data = await response.json();
            message = data.message || data.error || JSON.stringify(data);
        } catch {
            try { message = await response.text(); } catch {}
        }
        throw new Error(message);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

const AssignEmployee = ({ project, setView }) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [feedback, setFeedback] = useState('');

    // REPLACED onSnapshot fetch with API call
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                // Fetch ALL employees
                const allEmployees = await apiFetch('/employees');
                
                // Filter out employees already assigned to this project (client-side filter)
                const unassigned = allEmployees.filter(emp => 
                    emp.status === 'active' && !project.assignedEmployees?.includes(emp.id)
                );
                setEmployees(unassigned);
            } catch(e) {
                console.error("Error fetching employees:", e);
            }
        };
        fetchEmployees();
    }, [project]);

    // REPLACED Firestore updateDoc/arrayUnion with API call
    const handleAssign = async () => {
        if (!selectedEmployee) return;
        if (!project?.id) { setFeedback('No project selected (missing id).'); return; }
        setFeedback('');

        try {
            // Get the current list, add the new employee ID
            const updatedAssignments = [...(project.assignedEmployees || []), selectedEmployee];
            
            // PUT the entire new list to the backend
            await apiFetch(`/projects/${project.id}/assignments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAssignments)
            });
            
            setFeedback('Employee assigned successfully! Returning to project detail...');
            setSelectedEmployee('');

            // Automatically return to the detail view after a delay
            setTimeout(() => setView('detail'), 1500);

        } catch (e) {
            console.error("Assignment error:", e);
            setFeedback(e.message || 'Failed to assign employee.');
        }
    };

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-2">Assign Employee</h2>
            <p className="text-gray-600 mb-6">To Project: <span className="font-semibold">{project.projectTitle}</span></p>

            <select onChange={(e) => setSelectedEmployee(e.target.value)} value={selectedEmployee} className="w-full p-2 border rounded-md bg-white">
                <option value="">-- Select an Employee --</option>
                {employees.map(emp => (
                    // Display only active employees
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
            </select>

            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setView('detail')} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Back to Project</button>
                <button onClick={handleAssign} disabled={!selectedEmployee} className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">Assign</button>
            </div>
            {feedback && <p className={`text-sm mt-4 text-right ${feedback.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>}
        </div>
    );
};

export default AssignEmployee;