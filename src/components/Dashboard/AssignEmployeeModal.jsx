import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { doc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// REMOVED db and projectsCollectionPath props
const AssignEmployeeModal = ({ project, employees, onClose }) => {
    const [assigned, setAssigned] = useState(project.assignedEmployees || []);

    const handleToggleAssign = async (employeeId) => {
        let newAssigned;
        // Determine the new state of the assigned array
        if (assigned.includes(employeeId)) {
            newAssigned = assigned.filter(id => id !== employeeId);
        } else {
            newAssigned = [...assigned, employeeId];
        }

        try {
            // Send the entire new list to the backend PUT endpoint
            // The backend replaces the old list with the new one
            const res = await fetch(`${API_BASE_URL}/projects/${project.id}/assignments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAssigned)
            });
            if (!res.ok) {
                let message = `HTTP ${res.status}`;
                try {
                    const data = await res.json();
                    message = data.message || data.error || JSON.stringify(data);
                } catch {
                    try { message = await res.text(); } catch {}
                }
                throw new Error(message);
            }
            
            // Update local state only after successful API call
            setAssigned(newAssigned);
        } catch (e) {
            console.error("Assignment update failed:", e);
            // Optionally provide user feedback here
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">Assign Employees to {project.projectTitle}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {employees.map(emp => (
                        <div key={emp.employeeId || emp.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                           <label htmlFor={`emp-${emp.employeeId || emp.id}`} className="flex-grow cursor-pointer">
                                {emp.firstName} {emp.lastName}
                            </label>
                            <input
                                type="checkbox"
                                id={`emp-${emp.employeeId || emp.id}`}
                                checked={assigned.includes(emp.employeeId || emp.id)}
                                onChange={() => handleToggleAssign(emp.employeeId || emp.id)}
                                className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Done</button>
            </div>
        </div>
    );
};

export default AssignEmployeeModal;