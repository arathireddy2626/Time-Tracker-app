import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const apiFetch = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (response.status === 204) return null;
    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(errorBody || `HTTP Error ${response.status}`);
    }
    return response.json();
};

// REMOVED generatePassword helper function (now handled by the backend)

const ForgotPasswordPage = ({ setAuthView }) => { // REMOVED db, appId props
    const [formData, setFormData] = useState({ fullName: '', employeeId: '', email: '' });
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setFeedback('');
        
        try {
            // REPLACED all Firestore queries and updates with a single API call
            const response = await apiFetch('/employees/forgot-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // Assuming the backend returns the generated new password in the response body: { newPassword: "..." }
            setFeedback(`A new temporary password has been generated: ${response.newPassword}. Please use it to log in and change your password.`);
            
        } catch (err) {
            console.error("Reset error:", err);
            // Handle specific backend errors (e.g., Not Found, Verification Mismatch)
            if (err.message.includes("404")) {
                 setError('No matching employee record found.');
            } else if (err.message.includes("400")) {
                 setError('The name entered does not match the employee record.');
            } else {
                 setError("An error occurred during password reset. Please try again.");
            }
        }
    };

    return (
        <>
            <div className="text-center mt-4">
                <h2 className="text-2xl font-bold text-gray-900">Request Password Reset</h2>
                <p className="mt-1 text-sm text-gray-600">Provide your details for verification.</p>
            </div>
            {feedback && <div className="mt-4 p-4 rounded-lg bg-green-500 text-white text-center">{feedback}</div>}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <input name="fullName" type="text" placeholder="Full Name" required onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2"/>
                <input name="employeeId" type="text" placeholder="Employee ID" required onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2"/>
                <input name="email" type="email" placeholder="Email Address" required onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border-gray-300 px-3 py-2"/>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <button type="submit" disabled={!!feedback} className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">Generate New Password</button>
            </form>
            <p className="mt-4 text-center text-sm">
                <button onClick={() => setAuthView('login')} className="text-indigo-600 hover:underline">Back to Sign In</button>
            </p>
        </>
    );
};

export default ForgotPasswordPage;