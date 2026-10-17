import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import ChangePassword from './ChangePassword';
import TimeClock from './TimeClock';
import MyTimesheet from './MyTimesheet';
import { LogOutIcon } from '../common/Icons';

const ContentRouter = ({ activeView, userRole, user, setActiveView }) => {
    if (userRole === 'forcePasswordChange') {
        return <ChangePassword user={user} isForced={true} />;
    }
    if (userRole === 'manager') {
        return <ManagerDashboard activeView={activeView} setActiveView={setActiveView} />;
    } 
    if (userRole === 'employee') {
        switch (activeView) {
            case 'dashboard': return <EmployeeDashboard user={user} setActiveView={setActiveView} />;
            case 'clock': return <TimeClock user={user} employee={user} />;
            case 'timesheet': return <MyTimesheet employee={user} />;
            case 'password': return <ChangePassword user={user} />;
            default: return <EmployeeDashboard user={user} setActiveView={setActiveView} />;
        }
    }
    return null;
};

const DashboardLayout = ({ userRole, handleLogout, user }) => {
    const [activeView, setActiveView] = useState('dashboard');
    const displayName = userRole === 'manager' ? 'Manager' : `${user?.firstName} ${user?.lastName}`;

    return (
        <div className="flex h-screen bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop')"}}>
            <Sidebar userRole={userRole} activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-end items-center p-4">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-white text-lg">{displayName}</span>
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                           <LogOutIcon className="h-5 w-5" /> Logout
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <ContentRouter activeView={activeView} userRole={userRole} user={user} setActiveView={setActiveView} />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;