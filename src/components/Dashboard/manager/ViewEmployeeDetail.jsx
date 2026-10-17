import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, doc, updateDoc } from '../../firebase';
import ConfirmationModal from '../../common/ConfirmationModal';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204 || response.status === 200) {
        // Check if response has content before trying to parse JSON
        const text = await response.text();
        if (!text) return null;
        return JSON.parse(text);
    }
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorBody}`);
    }
    return response.json();
};

// REMOVED db prop
const ViewEmployeeDetail = ({ employee, setView }) => {
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false });
    const [isProcessing, setIsProcessing] = useState(false);
    
    // REPLACED Firestore updateDoc with API call
    const handleInactivate = async () => {
        setIsProcessing(true);
        try {
            // Call the PUT endpoint to set status to 'inactive'
            await apiFetch(`/employees/${employee.id}/deactivate`, {
                method: 'PUT'
            });
            
            setConfirmModalState({ isOpen: false });
            // Call the function passed from ViewEmployees to refresh the list and switch view
            setView(); 
        } catch (e) {
            console.error("Inactivation error:", e);
            alert("Failed to inactivate employee. Please check the backend console.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
             <ConfirmationModal 
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({isOpen: false})}
                onConfirm={handleInactivate}
                title="Inactivate Employee"
                message={`Are you sure you want to inactivate ${employee.firstName}? Their records will be kept.`}
            />
            <h2 className="text-3xl font-bold mb-6">Employee Detail</h2>
            <div className="space-y-2">
                <p><span className="font-semibold">First Name:</span> {employee.firstName}</p>
                <p><span className="font-semibold">Last Name:</span> {employee.lastName}</p>
                <p><span className="font-semibold">ID:</span> {employee.employeeId}</p>
                <p><span className="font-semibold">Email:</span> {employee.email}</p>
                <p><span className="font-semibold">Year of Joining:</span> {employee.yearOfJoining}</p>
                <p><span className="font-semibold">Status:</span> {employee.status}</p>
            </div>
            <div className="flex justify-end gap-4 mt-6">
                {/* setView() with no argument returns to the list in ViewEmployees.jsx */}
                <button onClick={() => setView()} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Back to Employees</button>
                <button 
                    onClick={() => setConfirmModalState({ isOpen: true })} 
                    disabled={employee.status === 'inactive' || isProcessing}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
                >
                    {isProcessing ? 'Processing...' : 'Inactivate'}
                </button>
            </div>
        </div>
    );
};

export default ViewEmployeeDetail;