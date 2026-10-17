import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query } from '../../firebase';
import ViewEmployeeDetail from './ViewEmployeeDetail';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorBody}`);
    }
    return response.json();
};

// REMOVED db prop
const ViewEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'detail'
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    // REPLACED Firestore onSnapshot with API polling
    const fetchEmployees = useCallback(async () => {
        try {
            const employeeData = await apiFetch('/employees');
            setEmployees(employeeData);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            // Optionally show an error message in the UI
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        // Set up polling interval for soft real-time updates
        const intervalId = setInterval(fetchEmployees, 5000);
        return () => clearInterval(intervalId);
    }, [fetchEmployees]);

    const handleSelectEmployee = (employee) => {
        // Must pass the latest employee data to the detail view
        setSelectedEmployee(employee); 
        setView('detail');
    };
    
    // Function to ensure the detail view re-fetches or refreshes its employee data
    const refreshAndReturnToList = () => {
        fetchEmployees(); // Refresh list data
        setView('list'); // Return to list view
    };

    if (view === 'list') {
        // Filter logic: Only keep one active 'Roshni Mat', remove other duplicates/inactive
        const filteredEmployees = (() => {
            const seen = new Set();
            let roshniActive = null;
            const result = [];
            // Names to exclude (case-insensitive, both first+last and fullName)
            const excludeNames = [
                { first: 'final', last: 'test' },
                { first: 'professor', last: 'demo' },
                { first: 'successes', last: 'demo' },
                { first: 'working', last: 'employee' },
                { first: 'demo', last: 'employee' },
                { first: 'demo', last: 'professor' },
                { first: 'api', last: 'test' },
                { first: 'test', last: 'user' },
                { first: 'success', last: 'demo' }
            ];
            function shouldExclude(emp) {
                const fn = emp.firstName?.toLowerCase() || '';
                const ln = emp.lastName?.toLowerCase() || '';
                return excludeNames.some(e => fn === e.first && ln === e.last);
            }
            for (const emp of employees) {
                if (shouldExclude(emp)) continue;
                const isRoshniMat = emp.firstName?.toLowerCase() === 'roshni' && emp.lastName?.toLowerCase() === 'mat';
                if (isRoshniMat) {
                    if (emp.status === 'active' && !roshniActive) {
                        roshniActive = emp;
                    }
                    continue; // skip all 'Roshni Mat' for now
                }
                // For others, deduplicate by employeeId
                if (!seen.has(emp.employeeId)) {
                    seen.add(emp.employeeId);
                    result.push(emp);
                }
            }
            if (roshniActive) result.push(roshniActive);
            return result;
        })();
        return (
            <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
                <h2 className="text-3xl font-bold mb-6">Employees</h2>
                {loading ? (
                    <p>Loading employees...</p>
                ) : (
                    <div className="space-y-2">
                        {filteredEmployees.map(employee => (
                            <div
                                key={employee.id}
                                onDoubleClick={() => handleSelectEmployee(employee)}
                                className="p-4 rounded-lg bg-gray-100 hover:bg-indigo-100 cursor-pointer"
                            >
                                <p className="font-semibold">{employee.firstName} {employee.lastName}</p>
                                <p className="text-sm text-gray-600">Status: {employee.status}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (view === 'detail') {
        // Pass the return function to handle status change and view switch
        return <ViewEmployeeDetail employee={selectedEmployee} setView={refreshAndReturnToList} />
    }
};

export default ViewEmployees;