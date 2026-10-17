import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query, where, getDocs } from '../../firebase';

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

// REMOVED db prop
const GenerateProjectReport = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // REPLACED initial onSnapshot fetches with API fetch
    const fetchInitialData = useCallback(async () => {
        try {
            const [projectData, employeeData] = await Promise.all([
                apiFetch('/projects'),
                apiFetch('/employees')
            ]);
            
            // Filter out duplicate projects: only keep first occurrence of "nice" and "new project 1"
            const seen = new Set();
            const filteredProjects = projectData.filter(p => {
                const title = p.projectTitle?.toLowerCase() || '';
                if (title === 'nice' || title === 'new project 1') {
                    if (seen.has(title)) {
                        return false; // Skip duplicate
                    }
                    seen.add(title);
                }
                return true;
            });
            
            setProjects(filteredProjects);
            setEmployees(employeeData);
        } catch(e) {
            console.error("Failed to fetch initial data for project report:", e);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // REPLACED getDocs/Firestore calculation with dedicated backend call
    const handleGenerateReport = async () => {
        if (!selectedProject) return;
        setIsLoading(true);

        const project = projects.find(p => p.id === selectedProject);

        try {
             // CALL DEDICATED BACKEND REPORT ENDPOINT
            const report = await apiFetch(`/reports/projects/${selectedProject}`);
            
            // Map employee IDs in the breakdown to full names/details (Optional, can be done fully on backend)
            const employeeBreakdown = report.employeeBreakdown.map(bd => {
                const employee = employees.find(e => e.id === bd.id);
                return {
                    id: bd.id,
                    name: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
                    employeeIdNum: employee ? employee.employeeId : 'N/A',
                    hours: bd.hours
                };
            });

            setReportData({
                projectTitle: project.projectTitle,
                projectDescription: project.description,
                anticipatedHours: project.anticipatedHours,
                completedHours: report.totalHours,
                employeeBreakdown: employeeBreakdown
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
                <h2 className="text-3xl font-bold mb-4">{reportData.projectTitle}</h2>
                <p className="text-gray-600 mb-4">{reportData.projectDescription}</p>
                <div className="border-y py-4 my-4 grid grid-cols-2 gap-4">
                    <p><strong>Anticipated Completion Hours:</strong> {reportData.anticipatedHours}</p>
                    <p><strong>Completed Hours:</strong> {reportData.completedHours.toFixed(2)}</p>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Assigned Employees' List</h3>
                <div className="space-y-2">
                    {reportData.employeeBreakdown.map(emp => (
                        <div key={emp.id} className="bg-gray-100 p-3 rounded-md flex justify-between">
                            <span>{emp.name} (ID: {emp.employeeIdNum})</span>
                            <span>{emp.hours.toFixed(2)} hours</span>
                        </div>
                    ))}
                </div>
                <button onClick={() => setReportData(null)} className="mt-6 bg-gray-300 px-4 py-2 rounded-lg">Back to Projects</button>
            </div>
        )
    }

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-6">Generate Project Report</h2>
            <p className="text-gray-600 mb-4">Select a project from a dropdown to generate a detailed report.</p>
            <div className="space-y-4">
                <select onChange={(e) => setSelectedProject(e.target.value)} value={selectedProject} className="w-full p-2 border rounded-md bg-white">
                    <option value="">-- Select a Project --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.projectTitle}</option>)}
                </select>
                <button onClick={handleGenerateReport} disabled={!selectedProject || isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>
        </div>
    );
};

export default GenerateProjectReport;