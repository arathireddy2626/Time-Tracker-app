import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, query, onSnapshot, addDoc, deleteDoc, doc, where, getDocs } from '../firebase';
import { UsersIcon, XCircleIcon } from '../common/Icons';
import ConfirmationModal from '../common/ConfirmationModal';
import AssignEmployeeModal from './AssignEmployeeModal'; // This is the updated component

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (for demonstration; put this in a central utility in a real app)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let errorBody = await response.text();
        // Throw an error that includes the backend's error message
        throw new Error(errorBody || `HTTP Error ${response.status}`);
    }
    return response.json();
};

// REMOVED db prop
const ProjectManagement = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectHours, setNewProjectHours] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, item: null, action: null });

    // REMOVED Firestore paths

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };

    // REPLACED Firestore onSnapshot with API polling
    const fetchProjectData = useCallback(async () => {
        try {
            // 1. Fetch Projects
            const projectData = await apiFetch('/projects');
            
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
            
            // 2. Fetch Active Employees
            const employeeData = await apiFetch('/employees');
            setEmployees(employeeData.filter(e => e.status === 'active')); 

        } catch (error) {
            console.error("Failed to fetch project data:", error);
            showFeedback('Failed to load project data. Ensure backend is running.', 'error');
        }
    }, []);

    useEffect(() => {
        fetchProjectData();
        // Polling interval to mimic real-time updates without onSnapshot
        const intervalId = setInterval(fetchProjectData, 5000);
        return () => clearInterval(intervalId);
    }, [user, fetchProjectData]);

    // REPLACED Firestore addDoc with API call
    const addProject = async (e) => {
        e.preventDefault();
        setFeedback({ message: '', type: '' });

        if (!newProjectName.trim() || !newProjectHours || !newProjectDescription.trim()) {
            setFeedback({ message: 'Please fill out all fields.', type: 'error' });
            return;
        }
        if (Number(newProjectHours) <= 250) {
            setFeedback({ message: 'Anticipated completion time must be more than 250 hours.', type: 'error' });
            return;
        }
        
        try {
            // Backend handles the unique name check and persistence
            await apiFetch('/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    projectTitle: newProjectName, 
                    description: newProjectDescription, 
                    anticipatedHours: Number(newProjectHours),
                    assignedEmployees: [] // Initialize empty list
                })
            });
            showFeedback('Project added successfully.', 'success');
            setNewProjectName(''); setNewProjectHours(''); setNewProjectDescription('');
            fetchProjectData(); // Refresh list immediately
        } catch (err) {
            console.error("Error adding project:", err);
            // Use generic message or parse the error from the backend if possible
            setFeedback({ message: `Failed to add project. Reason: ${err.message || 'Server error.'}`, type: 'error' });
        }
    };
    
    const confirmDeleteProject = (project) => {
        setConfirmModalState({ isOpen: true, item: project, action: () => deleteProject(project.id) });
    };

    // REPLACED Firestore deleteDoc with API call
    const deleteProject = async (id) => {
        try {
            await apiFetch(`/projects/${id}`, { method: 'DELETE' });
            fetchProjectData(); // Refresh list
        } catch (e) {
            console.error("Error deleting project: ", e);
            setFeedback({ message: 'Failed to delete project.', type: 'error' });
        }
        setConfirmModalState({ isOpen: false, item: null, action: null });
    };

    return (
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            <h2 className="text-3xl font-bold mb-6">Project Management</h2>
            {feedback.message && <div className={`p-4 mb-4 rounded-lg text-white ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{feedback.message}</div>}
            
            <div className="bg-gray-100 p-4 rounded-lg mb-8">
                <h3 className="text-xl font-semibold mb-2">Add New Project</h3>
                <form onSubmit={addProject} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* NOTE: Project name field is now 'projectTitle' in backend model */}
                        <input type="text" placeholder="Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full p-2 rounded border md:col-span-2"/>
                        <input type="number" placeholder="Hours (>250)" value={newProjectHours} onChange={(e) => setNewProjectHours(e.target.value)} className="w-full p-2 rounded border"/>
                    </div>
                    <textarea placeholder="Project Description" value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} className="w-full p-2 rounded border" rows="4"></textarea>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Add Project</button>
                </form>
            </div>

            <h3 className="text-xl font-semibold mb-4">Existing Projects</h3>
            <div className="space-y-4">
                {projects.map(project => (
                    <div key={project.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-start">
                        <div className="flex-1">
                            <h4 className="font-bold text-lg text-indigo-700">{project.projectTitle?.toUpperCase() || "UNTITLED PROJECT"}</h4>
                            <p className="text-sm text-gray-600 my-2">{project.description || "No description provided."}</p>
                            <p className="text-sm text-gray-500 font-medium">Anticipated Hours: {project.anticipatedHours || 0}</p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                           <button onClick={() => { setSelectedProject(project); setAssignModalOpen(true); }} className="text-white bg-blue-500 hover:bg-blue-600 w-10 h-10 flex items-center justify-center rounded-full" title="Assign/Deassign Employees"><UsersIcon className="w-5 h-5"/></button>
                           <button onClick={() => confirmDeleteProject(project)} className="text-white bg-red-500 hover:bg-red-600 w-10 h-10 flex items-center justify-center rounded-full" title="Delete Project"><XCircleIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Added fetchProjectData to onClose to refresh the list after assignment changes */}
            {isAssignModalOpen && <AssignEmployeeModal project={selectedProject} employees={employees} onClose={() => { setAssignModalOpen(false); fetchProjectData(); }} />}
            <ConfirmationModal isOpen={confirmModalState.isOpen} onClose={() => setConfirmModalState({isOpen: false})} onConfirm={confirmModalState.action} title="Delete Project" message={`Are you sure you want to delete "${confirmModalState.item?.projectTitle}"?`} />
        </div>
    );
};

export default ProjectManagement;