import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query, doc, updateDoc, arrayRemove } from '../../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(errorBody || `HTTP Error ${response.status}`);
    }
    return response.json();
};

const DeassignEmployee = ({ project, setView }) => {
    const [assignedEmployees, setAssignedEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [feedback, setFeedback] = useState('');

    // REPLACED onSnapshot fetch with API call (filtered client-side)
    useEffect(() => {
        const fetchAssignedEmployees = async () => {
            try {
                // Fetch ALL employees
                const allEmployees = await apiFetch('/employees');
                
                // Filter for employees currently assigned to this project
                const assigned = allEmployees.filter(emp => 
                    project.assignedEmployees?.includes(emp.id)
                );
                setAssignedEmployees(assigned);
            } catch(e) {
                console.error("Error fetching employees:", e);
            }
        };
        fetchAssignedEmployees();
    }, [project]);

    // REPLACED Firestore updateDoc/arrayRemove with API call
    const handleDeassign = async () => {
        if (!selectedEmployee) return;
        setFeedback('');

        try {
            // Remove the selected employee ID from the current list
            const updatedAssignments = (project.assignedEmployees || []).filter(
                id => id !== selectedEmployee
            );
            
            // PUT the entire new list to the backend
            await apiFetch(`/projects/${project.id}/assignments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedAssignments)
            });
            
            setFeedback('Employee de-assigned successfully! Returning to project detail...');
            setSelectedEmployee('');

            // Automatically return to the detail view after a delay
            setTimeout(() => setView('detail'), 1500);

        } catch (e) {
            console.error("De-assignment error:", e);
            setFeedback('Failed to de-assign employee.', 'error');
        }
    };

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-2">De-assign Employee</h2>
            <p className="text-gray-600 mb-6">From Project: <span className="font-semibold">{project.projectTitle}</span></p>

            <select onChange={(e) => setSelectedEmployee(e.target.value)} value={selectedEmployee} className="w-full p-2 border rounded-md bg-white">
                <option value="">-- Select an Employee --</option>
                {assignedEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
            </select>

            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setView('detail')} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Back to Project</button>
                <button onClick={handleDeassign} disabled={!selectedEmployee} className="bg-red-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">De-assign</button>
            </div>
            {feedback && <p className={`text-sm mt-4 text-right ${feedback.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>{feedback}</p>}
        </div>
    );
};

export default DeassignEmployee;