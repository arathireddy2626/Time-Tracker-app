import React from 'react';

const ViewProjectDetail = ({ project, setView }) => {
    // NOTE: Project title field is now 'projectTitle'
    const numAssigned = project.assignedEmployees?.length || 0;

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-6">Project Detail</h2>
            
            <div className="mb-4">
                <h3 className="text-xl font-bold text-indigo-700">{project.projectTitle?.toUpperCase()}</h3>
                <p className="text-gray-600 mt-2">{project.description}</p>
            </div>
            
            <div className="border-t border-b py-4 my-4">
                <p><span className="font-semibold">Anticipated Hours:</span> {project.anticipatedHours}</p>
                <p><span className="font-semibold">Employees Assigned:</span> {numAssigned}</p>
            </div>

            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setView('list')} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Back to Projects</button>
                <button onClick={() => setView('deassign')} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">De-assign Employee</button>
                <button onClick={() => setView('assign')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">Assign Employee</button>
            </div>
        </div>
    );
};

export default ViewProjectDetail;