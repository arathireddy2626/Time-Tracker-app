import React from 'react';
// Import the new granular components
import ViewProjects from './manager/ViewProjects';
import AddNewProject from './manager/AddNewProject';
import ViewEmployees from './manager/ViewEmployees';
import AddNewEmployee from './manager/AddNewEmployee';
import GenerateProjectReport from './manager/GenerateProjectReport';
import GenerateEmployeeReport from './manager/GenerateEmployeeReport';

// REMOVED db/user props as they are not needed by the ManagerDashboard router itself
const ManagerDashboard = ({ activeView, setActiveView }) => { 
    // This component now acts as a router for the manager's workspace
    switch (activeView) {
        // Project views
        case 'viewProjects': 
            // Pass setActiveView for navigation away from the list
            return <ViewProjects setActiveView={setActiveView} />; 
        
        case 'addProject': 
            // Pass setActiveView so the new project form can return to the list
            return <AddNewProject setActiveView={setActiveView} />;

        // Employee views
        case 'viewEmployees': 
            // Pass setActiveView for navigation away from the list
            return <ViewEmployees setActiveView={setActiveView} />;
        
        case 'addEmployee': 
            // FIX: Pass setActiveView here to allow navigation away from the invite form
            return <AddNewEmployee setActiveView={setActiveView} />; 

        // Report views
        case 'projectReports': 
            return <GenerateProjectReport />;
        
        case 'employeeReports': 
            return <GenerateEmployeeReport />;

        // Default empty workspace
        default: 
            return (
                <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
                    <h2 className="text-3xl font-bold">Manager Dashboard</h2>
                    <p className="mt-4">Please select an option from the menu to begin.</p>
                </div>
            );
    }
};

export default ManagerDashboard;