import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, addDoc, query, where, getDocs } from '../../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (for demonstration; assumes existence)
const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(errorBody || `HTTP Error ${response.status}`);
    }
    return response.json();
};

const AddNewProject = ({ setActiveView }) => {
    const [formData, setFormData] = useState({ title: '', hours: '', description: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // --- Client-Side Validation (Retained) ---
        if (!formData.title || !formData.hours || !formData.description) {
            setError('All three fields must be non-empty.');
            return;
        }
        if (formData.title.length < 2 || !/^[A-Za-z]/.test(formData.title)) {
            setError('Project title must have at least two characters and start with an alphabet.');
            return;
        }
        if (Number(formData.hours) < 250) {
            setError('Anticipated completion time should be at least 250 hours.');
            return;
        }
        // --- End Validation ---

        try {
            // REPLACED Firestore addDoc with API call
            await apiFetch('/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectTitle: formData.title, // Maps to backend model field
                    anticipatedHours: Number(formData.hours),
                    description: formData.description,
                })
            });
            
            setSuccess('Project added successfully! Returning to project list...');
            setTimeout(() => {
                setActiveView('viewProjects');
            }, 2000);
        } catch (err) {
            console.error("Failed to add project:", err);
            // Display error returned by the Spring Boot server
            setError(`Failed to add project. Reason: ${err.message || 'Server error.'}`);
        }
    };

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold mb-6">Add New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Project Title</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Anticipated Completion Time (Hours)</label>
                    <input type="number" value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Project Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded-md" rows="4"></textarea>
                </div>

                <div className="flex justify-end items-center gap-4 pt-4">
                    {error && <p className="text-red-500 text-sm text-right flex-1">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-right flex-1">{success}</p>}
                    
                    <button type="button" onClick={() => setActiveView('viewProjects')} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Add Project</button>
                </div>
            </form>
        </div>
    );
};

export default AddNewProject;