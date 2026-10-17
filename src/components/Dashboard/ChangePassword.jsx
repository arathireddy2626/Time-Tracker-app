import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { db, appId, doc, updateDoc, getDoc } from '../firebase';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Shared fetch function (assuming available globally or imported)
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
    // Gracefully handle empty body
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

// Accepts 'user' but password validation is done server-side now.
const ChangePassword = ({ user, isForced = false }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ message: '', type: '' }); // Clear feedback on new submission
        setIsProcessing(true);

        // Client-side only checks for structure; the server validates current password securely.
        if (newPassword !== confirmPassword) {
            setFeedback({ message: 'New passwords do not match.', type: 'error' });
            setIsProcessing(false);
            return;
        }
        // 2. Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            setFeedback({ message: 'Password must be 6+ chars with uppercase, lowercase, and a number.', type: 'error' });
            setIsProcessing(false);
            return;
        }
        
        // 3. REPLACED Firestore updateDoc with API call
        try {
            // Use document ID (user.id) for password endpoint, not employeeId
            const employeeId = user.id || user.employeeId;
            await apiFetch(`/employees/${employeeId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }) // Send the new password for backend update
            });
            
            setFeedback({ message: 'Password updated successfully! Please log in again.', type: 'success' });
            // NOTE: The forced reload ensures the app gets the new password value on next login.
            setTimeout(() => window.location.reload(), 2000); 

        } catch (error) {
            console.error('Password change error:', error);
            let errorMessage = 'Failed to update password.';
            
            // Try to extract more specific error information
            if (error.message) {
                errorMessage = error.message;
            }
            
            setFeedback({ message: errorMessage, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
            {isForced && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Security Update Required</p>
                    <p>Please update your temporary password to continue.</p>
                </div>
            )}
            <h2 className="text-3xl font-bold mb-6">Change Password</h2>
            
            <div className="max-w-sm mx-auto bg-gray-50 p-6 rounded-lg shadow-inner">
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3 rounded border" required />
                    <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 rounded border" required />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 rounded border" required />
                    <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-semibold">
                        {isProcessing ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {feedback.message && (
                 <div className={`mt-6 max-w-sm mx-auto p-4 rounded-lg text-white text-center ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
        </div>
    );
};

export default ChangePassword;