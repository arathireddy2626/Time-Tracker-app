import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query, where, getDocs } from '../../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204 || response.status === 404) return [];
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(errorBody || `HTTP Error ${response.status}`);
    }
    return response.json();
};

// REMOVED db prop
const GenerateEmployeeReport = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // REPLACED initial onSnapshot fetches with API fetch
    const fetchInitialData = useCallback(async () => {
        try {
            const [projectData, employeeData] = await Promise.all([
                apiFetch('/projects'),
                apiFetch('/employees')
            ]);
            setProjects(projectData);
            setEmployees(employeeData);
        } catch(e) {
            console.error("Failed to fetch initial data for employee report:", e);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // REPLACED getDocs/Firestore calculation with dedicated backend call
    const handleGenerateReport = async () => {
        if (!selectedEmployee) return;
        setIsLoading(true);

        const employee = employees.find(e => e.id === selectedEmployee);

        try {
             // CALL DEDICATED BACKEND REPORT ENDPOINT: /reports/employees/{id}
            const report = await apiFetch(`/reports/employees/${selectedEmployee}`);
            
            // The backend returns the calculated breakdown:
            // report: { employeeIdNum: "...", projectBreakdown: [{id, name, hours}, ...] }

            setReportData({
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeIdNum: employee.employeeId,
                projectBreakdown: report.projectBreakdown
            });

        } catch (e) {
            console.error("Failed to generate report:", e);
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (reportData) {
        return (
            <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
                <h2 className="text-3xl font-bold mb-4">Employee Report: {reportData.employeeName} (ID: {reportData.employeeIdNum})</h2>
                <h3 className="text-2xl font-semibold mb-4">Projects Contributed To</h3>
                <div className="space-y-2">
                    {reportData.projectBreakdown.map(proj => (
                        <div key={proj.id} className="bg-gray-100 p-3 rounded-md flex justify-between">
                            <span>{proj.name}</span>
                            <span>{proj.hours.toFixed(2)} hours</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => setReportData(null)} className="mt-6 bg-gray-300 px-4 py-2 rounded-lg">Back to Employees</button>
            </div>
        )
    }

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-6">Generate Employee Report</h2>
            <p className="text-gray-600 mb-4">Select an employee from a dropdown to generate a detailed report.</p>
            <div className="space-y-4">
                <select onChange={(e) => setSelectedEmployee(e.target.value)} value={selectedEmployee} className="w-full p-2 border rounded-md bg-white">
                    <option value="">-- Select an Employee --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
                <button onClick={handleGenerateReport} disabled={!selectedEmployee || isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>
        </div>
    );
};

export default GenerateEmployeeReport;