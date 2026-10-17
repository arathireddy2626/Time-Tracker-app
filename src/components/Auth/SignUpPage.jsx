import React, { useState } from 'react';
// REMOVED ALL FIRESTORE IMPORTS: import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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


const SignUpPage = ({ setAuthView }) => { // REMOVED db, appId props
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // REMOVED: const employeesCollectionPath = ...;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFeedback('');
    setIsSubmitting(true);

    // Rule: Password Complexity Validation (Client-side retained)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 6 characters and contain an uppercase letter, a lowercase letter, and a number.');
        setIsSubmitting(false);
        return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      // REPLACED all Firestore verification and update logic with a single API call
      const response = await apiFetch('/employees/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      // Rule: Show confirmation message in the UI
      setFeedback('Registration successful! You can now log in.');
      setTimeout(() => setAuthView('login'), 4000);

    } catch (err) { 
      console.error("Sign up error:", err);
       // Handle specific backend validation errors (e.g., name mismatch, not found)
      if (err.message.includes("404")) {
         setError('Account not found or already registered. Please ensure your details match those provided by your manager.');
      } else if (err.message.includes("400")) {
         setError('The name entered does not match the details provided by your manager.');
      } else {
         setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Employee Registration</h2>
        <p className="mt-1 text-sm text-gray-600">Complete your account setup.</p>
      </div>

      {feedback && (
        <div className="mt-4 p-4 rounded-lg bg-green-500 text-white text-center">
          {feedback}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700">FULL NAME</label>
          <p className="text-xs text-gray-500 mb-1">Enter your first and last name as provided to your manager.</p>
          <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">EMPLOYEE ID</label>
          <p className="text-xs text-gray-500 mb-1">Enter your unique employee ID.</p>
          <input name="employeeId" type="text" required value={formData.employeeId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">EMAIL</label>
          <p className="text-xs text-gray-500 mb-1">Use the email your manager has on file.</p>
          <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">PASSWORD</label>
          <p className="text-xs text-gray-500 mb-1">Set your new password.</p>
          <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">CONFIRM PASSWORD</label>
          <p className="text-xs text-gray-500 mb-1">Re-enter your password.</p>
          <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
        </div>
        
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button type="submit" disabled={isSubmitting || feedback} className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
          {isSubmitting ? 'Registering...' : 'Complete Registration'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already registered?{' '}
        <button onClick={() => setAuthView('login')} className="text-indigo-600 hover:underline">
          Sign In
        </button>
      </p>
    </>
  );
};

export default SignUpPage;