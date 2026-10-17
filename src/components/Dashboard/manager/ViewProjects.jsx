import React, { useState, useEffect, useCallback } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, onSnapshot, query } from '../../firebase';
import ViewProjectDetail from './ViewProjectDetail';
import AssignEmployee from './AssignEmployee';
import DeassignEmployee from './DeassignEmployee';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return [];
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(errorBody || `HTTP Error ${response.status}`);
    }
    return response.json();
};

const ViewProjects = () => {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'detail', 'assign', 'deassign'
    const [selectedProject, setSelectedProject] = useState(null);

    // REPLACED Firestore onSnapshot with API polling
    const fetchProjects = useCallback(async () => {
        try {
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
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
        // Set up polling interval for soft real-time updates
        const intervalId = setInterval(fetchProjects, 5000);
        return () => clearInterval(intervalId);
    }, [fetchProjects]);

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setView('detail');
    };
    
    // Main List View
    if (view === 'list') {
        return (
            <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
                <h2 className="text-3xl font-bold mb-6">Projects</h2>
                <div className="space-y-2">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onDoubleClick={() => handleSelectProject(project)}
                            className="p-4 rounded-lg bg-gray-100 hover:bg-indigo-100 cursor-pointer"
                        >
                            <p className="font-semibold">{project.projectTitle}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    // Detailed Views
    if (view === 'detail') {
        return <ViewProjectDetail project={selectedProject} setView={setView} />;
    }
    if (view === 'assign') {
        return <AssignEmployee project={selectedProject} setView={setView} />;
    }
    if (view === 'deassign') {
        return <DeassignEmployee project={selectedProject} setView={setView} />;
    }
};

export default ViewProjects;