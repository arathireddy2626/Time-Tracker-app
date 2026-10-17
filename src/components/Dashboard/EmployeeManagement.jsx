import React, { useState, useEffect } from 'react';
import { db, appId, collection, addDoc, onSnapshot, query, where, getDocs, doc, updateDoc } from '../firebase';
import ConfirmationModal from '../common/ConfirmationModal';
import { PlusCircleIcon } from '../common/Icons';

const EmployeeManagement = ({ user }) => {
    const [employees, setEmployees] = useState([]);
    const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('');
    const [newEmployeeLastName, setNewEmployeeLastName] = useState('');
    const [newEmployeeId, setNewEmployeeId] = useState('');
    const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
    const [newEmployeeJoiningYear, setNewEmployeeJoiningYear] = useState(new Date().getFullYear().toString());
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, item: null, action: null });

    const employeesCollectionPath = `/artifacts/${appId}/public/data/employees`;

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, employeesCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setEmployees(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db]);

    const addEmployee = async (e) => {
        e.preventDefault();
        setFeedback({ message: '', type: '' });
        
        if (newEmployeeFirstName.length < 2 || newEmployeeLastName.length < 2) {
            setFeedback({ message: 'First and last names must be at least 2 characters.', type: 'error' });
            return;
        }
        if (!newEmployeeEmail.trim() || !/^\S+@\S+\.\S+$/.test(newEmployeeEmail)) {
            setFeedback({ message: 'Please enter a valid email address.', type: 'error' });
            return;
        }

        const idQuery = query(collection(db, employeesCollectionPath), where("employeeId", "==", newEmployeeId));
        const emailQuery = query(collection(db, employeesCollectionPath), where("email", "==", newEmployeeEmail.toLowerCase()));

        const idSnapshot = await getDocs(idQuery);
        if (!idSnapshot.empty) {
            setFeedback({ message: `Employee ID "${newEmployeeId}" already exists.`, type: 'error' });
            return;
        }
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
            setFeedback({ message: `Email "${newEmployeeEmail}" already exists.`, type: 'error' });
            return;
        }

        const username = `${newEmployeeLastName.toLowerCase()}${newEmployeeJoiningYear.slice(-2)}`;

        try {
            await addDoc(collection(db, employeesCollectionPath), {
                employeeId: newEmployeeId,
                email: newEmployeeEmail.toLowerCase(),
                firstName: newEmployeeFirstName,
                lastName: newEmployeeLastName,
                username: username,
                password: null,
                status: 'invited',
                createdAt: new Date(),
            });

            setFeedback({ message: `Employee ${newEmployeeFirstName} has been invited. They can now sign up.`, type: 'success' });
            setNewEmployeeFirstName('');
            setNewEmployeeLastName('');
            setNewEmployeeId('');
            setNewEmployeeEmail('');
            setNewEmployeeJoiningYear(new Date().getFullYear().toString());
        } catch (err) {
            setFeedback({ message: "Failed to add employee.", type: "error" });
        }
    };
    
    const confirmDeactivate = (employee) => {
         setConfirmModalState({
            isOpen: true,
            item: employee,
            action: () => deactivateEmployee(employee.id)
        });
    }

    const deactivateEmployee = async (id) => {
        try {
            await updateDoc(doc(db, employeesCollectionPath, id), { status: 'inactive' });
            setFeedback({ message: 'Employee deactivated successfully.', type: 'success' });
        } catch(e) {
            setFeedback({ message: 'Failed to deactivate employee.', type: 'error' });
        }
        setConfirmModalState({ isOpen: false, item: null, action: null });
    };

    // Filter logic: Only keep one active 'Roshni Mat', remove other duplicates/inactive
    const filteredEmployees = (() => {
        const seen = new Set();
        let roshniActive = null;
        const result = [];
        // Names to exclude (case-insensitive, both first+last and fullName)
        const excludeNames = [
            { first: 'final', last: 'test' },
            { first: 'professor', last: 'demo' },
            { first: 'successes', last: 'demo' },
            { first: 'working', last: 'employee' },
            { first: 'demo', last: 'employee' },
            { first: 'demo', last: 'professor' },
            { first: 'api', last: 'test' },
            { first: 'test', last: 'user' },
            { first: 'success', last: 'demo' }
        ];
        function shouldExclude(emp) {
            const fn = emp.firstName?.toLowerCase() || '';
            const ln = emp.lastName?.toLowerCase() || '';
            return excludeNames.some(e => fn === e.first && ln === e.last);
        }
        for (const emp of employees) {
            if (shouldExclude(emp)) continue;
            const isRoshniMat = emp.firstName?.toLowerCase() === 'roshni' && emp.lastName?.toLowerCase() === 'mat';
            if (isRoshniMat) {
                if (emp.status === 'active' && !roshniActive) {
                    roshniActive = emp;
                }
                continue; // skip all 'Roshni Mat' for now
            }
            // For others, deduplicate by employeeId
            if (!seen.has(emp.employeeId)) {
                seen.add(emp.employeeId);
                result.push(emp);
            }
        }
        if (roshniActive) result.push(roshniActive);
        return result;
    })();

    return (
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            <h2 className="text-3xl font-bold mb-6">Employee Management</h2>
            <ConfirmationModal 
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({isOpen: false, item: null, action: null})}
                onConfirm={confirmModalState.action}
                title="Deactivate Employee (Fire)"
                message={`Are you sure you want to fire ${confirmModalState.item?.firstName}? Their account will be deactivated but their records will remain.`}
            />
            <div className="bg-gray-100 p-4 rounded-lg mb-8">
                {feedback.message && (
                    <div className={`p-4 mb-4 rounded-lg text-white text-center ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {feedback.message}
                    </div>
                )}
                <h3 className="text-xl font-semibold mb-2">Invite New Employee</h3>
                <form onSubmit={addEmployee} className="space-y-3">
                    <input type="text" placeholder="Employee ID" value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)} className="w-full p-2 rounded border"/>
                    <input type="email" placeholder="Email Address" value={newEmployeeEmail} onChange={(e) => setNewEmployeeEmail(e.target.value)} className="w-full p-2 rounded border"/>
                    <input type="text" placeholder="First Name" value={newEmployeeFirstName} onChange={(e) => setNewEmployeeFirstName(e.target.value)} className="w-full p-2 rounded border"/>
                    <input type="text" placeholder="Last Name" value={newEmployeeLastName} onChange={(e) => setNewEmployeeLastName(e.target.value)} className="w-full p-2 rounded border"/>
                    <input type="number" placeholder="Joining Year (YYYY)" value={newEmployeeJoiningYear} onChange={(e) => setNewEmployeeJoiningYear(e.target.value)} className="w-full p-2 rounded border"/>
                    <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex justify-center items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5"/> Invite Employee
                    </button>
                </form>
            </div>

             <h3 className="text-xl font-semibold mb-4">Company Employees</h3>
             <div className="space-y-3">
                {filteredEmployees.map(emp => (
                    <div key={emp.id} className="bg-white p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-lg">{emp.firstName} {emp.lastName} (ID: {emp.employeeId})</p>
                            {emp.status === 'active' && 
                                <button onClick={() => confirmDeactivate(emp)} className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-3 rounded">Deactivate</button>
                            }
                        </div>
                        <p className="text-sm text-gray-500">{emp.email}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            Username: {emp.username} | Status: 
                            <span className={`font-semibold ml-1 ${
                                emp.status === 'active' ? 'text-green-600' : 
                                emp.status === 'invited' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                            </span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmployeeManagement;