import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, collection, addDoc, query, where, getDocs } from '../../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
            const data = await response.json();
            message = data.message || data.error || JSON.stringify(data);
        } catch {
            try { message = await response.text(); } catch {}
        }
        throw new Error(message);
    }
    return response.json();
};

const AddNewEmployee = ({ setActiveView }) => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', id: '', email: '', joiningYear: '2025' });
    const [error, setError] = useState('');
    // RESTORED state for the pop-up modal
    const [newCredentials, setNewCredentials] = useState(null); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.firstName || !formData.lastName || !formData.id || !formData.email || !formData.joiningYear) {
            setError('All fields must be non-empty.');
            return;
        }
        // Trim whitespace and validate names
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        
        if (firstName.length < 2) {
            setError('First name must be at least 2 characters long.');
            return;
        }
        if (lastName.length < 2) {
            setError('Last name must be at least 2 characters long.');
            return;
        }
        if (!/^[A-Za-z\s]+$/.test(firstName)) {
            setError('First name can only contain letters and spaces.');
            return;
        }
        if (!/^[A-Za-z\s]+$/.test(lastName)) {
            setError('Last name can only contain letters and spaces.');
            return;
        }

        try {
            const employeeData = {
                firstName: firstName,
                lastName: lastName,
                employeeId: formData.id.trim(),
                email: formData.email.toLowerCase().trim(),
                yearOfJoining: formData.joiningYear,
            };

            // API call now returns the employee object with the generated username and password
            const invitedEmployee = await apiFetch('/employees/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });

            // RESTORED: Show the modal with credentials returned from the backend
            setNewCredentials({ 
                username: invitedEmployee.username, 
                password: invitedEmployee.password, 
                email: invitedEmployee.email, 
                firstName: invitedEmployee.firstName 
            });
            
            // Clear form
            setFormData({ firstName: '', lastName: '', id: '', email: '', joiningYear: '2025' });

        } catch (err) { 
            console.error(err);
            setError(err.message || 'Failed to add employee. Please try again.'); 
        }
    };

    const handleCloseModal = () => {
        setNewCredentials(null);
        // Redirect back to the view list when the user closes the modal
        setActiveView('viewEmployees'); 
    };

    const createMailtoLink = () => {
        if (!newCredentials) return '';
        const subject = "Your New TimeTracker Account Credentials";
        // NOTE: The backend must be updated to set the 'password' field upon invite for this link to work.
        const body = `Hello ${newCredentials.firstName},\n\nWelcome to TimeTracker! Your account has been created.\n\nPlease use the following credentials to log in. You will be required to change your password upon your first login.\n\nUsername: ${newCredentials.username}\nTemporary Password: ${newCredentials.password}\n\nThank you,\nThe Management`;
        return `mailto:${newCredentials.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="bg-white bg-opacity-80 p-8 rounded-2xl">
            {/* RESTORED: The Pop-up Modal */}
            {newCredentials && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
                        <h3 className="text-xl font-bold mb-4">Employee Account Created!</h3>
                        <p className="mb-4">Please provide the new employee with their login credentials below, or send them via email.</p>
                        <div className="text-left bg-gray-100 p-4 rounded-md space-y-2 mb-6">
                            <p><strong>Username:</strong> <span className="font-mono">{newCredentials.username}</span></p>
                            <p><strong>Temporary Password:</strong> <span className="font-mono">{newCredentials.password}</span></p>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button onClick={handleCloseModal} className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500">Done</button>
                            <a href={createMailtoLink()} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                                Send Credentials via Email
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-3xl font-bold mb-6">Add New Employee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">First Name</label>
                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
                      <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Last Name</label>
                          <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Employee ID</label>
                    <input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 border rounded-md" />
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Year of Joining</label>
                    <select value={formData.joiningYear} onChange={(e) => setFormData({ ...formData, joiningYear: e.target.value })} className="w-full p-2 border rounded-md bg-white">
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                        <option value="2029">2029</option>
                        <option value="2030">2030</option>
                    </select>
                </div>
                <div className="flex justify-end items-center gap-4 pt-4">
                    {error && <p className="text-red-500 text-sm text-right flex-1">{error}</p>}
                    <button type="button" onClick={() => setActiveView('viewEmployees')} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Add Employee</button>
                </div>
            </form>
        </div>
    );
};
export default AddNewEmployee;