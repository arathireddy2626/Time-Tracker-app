import React, { useState } from 'react';
import { LayoutDashboard, Briefcase, Users, FileText, Clock, Lock, ChevronDown } from 'lucide-react';
import TimeTrackerLogo from '../common/TimeTrackerLogo';

const Sidebar = ({ userRole, activeView, setActiveView }) => {
    const [openMenu, setOpenMenu] = useState(null);

    const managerMenu = [
        { label: 'Projects', key: 'projects', icon: <Briefcase size={20} />, submenus: [ { label: 'View Projects', view: 'viewProjects' }, { label: 'Add New Project', view: 'addProject' } ] },
        { label: 'Employees', key: 'employees', icon: <Users size={20} />, submenus: [ { label: 'View Employees', view: 'viewEmployees' }, { label: 'Add New Employee', view: 'addEmployee' } ] },
        { label: 'Reports', key: 'reports', icon: <FileText size={20} />, submenus: [ { label: 'Project Reports', view: 'projectReports' }, { label: 'Employee Reports', view: 'employeeReports' } ] }
    ];
    const employeeMenu = [
        { label: 'Dashboard', view: 'dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Clock In/Out', view: 'clock', icon: <Clock size={20} /> },
        { label: 'My Timesheet', view: 'timesheet', icon: <FileText size={20} /> },
        { label: 'Change Password', view: 'password', icon: <Lock size={20} /> },
    ];

    const currentNavItems = userRole === 'manager' ? managerMenu : employeeMenu;

    return (
        <aside className="w-64 bg-gray-900 bg-opacity-80 backdrop-blur-lg flex flex-col text-white">
            <div className="h-20 flex items-center justify-center border-b border-gray-700 px-4"><TimeTrackerLogo /></div>
            <nav className="flex-1 p-4 space-y-2">
                {currentNavItems.map((item) => (
                    item.submenus ? (
                        <div key={item.key}>
                            <button onClick={() => setOpenMenu(openMenu === item.key ? null : item.key)} className="w-full flex justify-between items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700">
                                <div className="flex items-center gap-3">{item.icon}<span>{item.label}</span></div>
                                <ChevronDown size={16} className={`transition-transform ${openMenu === item.key ? 'rotate-180' : ''}`} />
                            </button>
                            {openMenu === item.key && (
                                <div className="pl-8 space-y-1 py-2">
                                    {item.submenus.map(sub => (
                                        <button key={sub.view} onClick={() => setActiveView(sub.view)} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${activeView === sub.view ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>{sub.label}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button key={item.view} onClick={() => setActiveView(item.view)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeView === item.view ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
                            {item.icon}<span>{item.label}</span>
                        </button>
                    )
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;