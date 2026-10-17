import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query, where, getDocs } from '../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
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
const Reports = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [isReportLoading, setIsReportLoading] = useState(false);

    // REMOVED Firestore paths

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
            console.error("Failed to fetch initial report data:", e);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [user, fetchInitialData]);

    // REPLACED getDocs/Firestore calculation with dedicated backend call
    const handleGenerateProjectReport = async (project) => {
        setSelectedReport({ type: 'project', data: project });
        setIsReportLoading(true);
        
        try {
            // CALL DEDICATED BACKEND REPORT ENDPOINT
            const report = await apiFetch(`/reports/projects/${project.id}`);

            setReportData(report);
        } catch (e) {
            console.error("Failed to generate project report:", e);
            setReportData({ totalHours: 0, employeeBreakdown: [] });
        } finally {
            setIsReportLoading(false);
        }
    };

    const handleGenerateEmployeeReport = (employee) => {
        setSelectedReport({ type: 'employee', data: employee });
        // NOTE: The employee report detail view (renderEmployeeDetail) currently uses projects/employees states 
        // to show assigned projects, which is sufficient without another API call.
    };
    
    const renderMainView = () => (
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            <h2 className="text-3xl font-bold mb-6">Generate Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">By Project</h3>
                    <div className="space-y-2">
                       {projects.map(p => (<div key={p.id} className="bg-gray-50 p-3 rounded flex justify-between items-center"><span>{p.projectTitle}</span><button onClick={() => handleGenerateProjectReport(p)} className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600">Generate</button></div>))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4">By Employee</h3>
                    <div className="space-y-2">
                       {employees.map(e => (<div key={e.id} className="bg-gray-50 p-3 rounded flex justify-between items-center"><span>{e.firstName} {e.lastName}</span><button onClick={() => handleGenerateEmployeeReport(e)} className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600">Generate</button></div>))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderProjectDetail = () => {
        const project = selectedReport.data;
        return (
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
                <button onClick={() => setSelectedReport(null)} className="mb-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-semibold">&larr; Back to Reports List</button>
                <h3 className="text-3xl font-bold mb-2">Project Report: {project.projectTitle?.toUpperCase()}</h3>
                <p className="mb-4 text-gray-600 italic text-sm">{project.description}</p>
                <div className="border-t border-b border-gray-300 py-4 my-4"><p><span className="font-semibold">Anticipated Hours:</span> {project.anticipatedHours}</p></div>
                <h4 className="text-xl font-semibold mb-2">Assigned Employees & Hours Contributed</h4>
                <div className="space-y-2 mb-6">
                    {isReportLoading ? <p>Loading hours...</p> : reportData?.employeeBreakdown.length > 0 ? reportData.employeeBreakdown.map(emp => (<div key={emp.id} className="bg-gray-100 p-3 rounded flex justify-between"><span>{emp.name}</span><span className="font-semibold">{emp.hours.toFixed(2)} hrs</span></div>)) : <p className="text-gray-500">No hours have been logged for this project.</p>}
                </div>
                <div className="text-right font-bold text-2xl"><p>Total Hours Worked: {isReportLoading ? '...' : (reportData?.totalHours || 0).toFixed(2)}</p></div>
            </div>
        );
    };

    const renderEmployeeDetail = () => {
        const employee = selectedReport.data;
        // NOTE: Uses locally fetched 'projects' state
        const assignedProjs = projects.filter(p => p.assignedEmployees?.includes(employee.id));
        return (
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
                <button onClick={() => setSelectedReport(null)} className="mb-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-semibold">&larr; Back to Reports List</button>
                <h3 className="text-3xl font-bold mb-2">Employee Report: {employee.firstName} {employee.lastName}</h3>
                <p className="text-gray-600">ID: {employee.employeeId}</p>
                <p className="text-gray-600">Email: {employee.email}</p>
                <p className="text-gray-600 mb-4">Username: {employee.username}</p>
                <h4 className="text-xl font-semibold mb-2">Currently Assigned Projects</h4>
                <div className="space-y-2">
                    {assignedProjs.length > 0 ? assignedProjs.map(p => (<div key={p.id} className="bg-gray-100 p-3 rounded">{p.projectTitle}</div>)) : <p>Not assigned to any projects.</p>}
                </div>
            </div>
        );
    };

    if (!selectedReport) return renderMainView();
    if (selectedReport.type === 'project') return renderProjectDetail();
    if (selectedReport.type === 'employee') return renderEmployeeDetail();
    return null;
};

export default Reports;