import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { signInAndGetIdToken, auth as firebaseAuth } from './components/firebase';
// DELETED: import { db, auth, appId } from './components/firebase';
import LoginPage from './components/Auth/LoginPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import DashboardLayout from './components/Dashboard/DashboardLayout';
// DELETED: import { collection, getDocs, query, where } from 'firebase/firestore';

// --- API Configuration ---
const API_BASE_URL = 'http://localhost:8080/api/v1';
// --- DUMMY VARIABLES (Replace with actual Auth/App ID if needed) ---
const appId = 'time-tracker-app';
// -------------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authView, setAuthView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loggedInEmployee, setLoggedInEmployee] = useState(null);



  // If Firebase auth isn't configured, skip setting up the listener and mark auth ready
  useEffect(() => {
    if (!firebaseAuth) { setIsAuthReady(true); setIsLoading(false); return; }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser || null);
      setIsAuthReady(true);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REPLACED with Spring Boot API call logic
  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    if (!username || !password) {
        setError("Username and password cannot be empty.");
        return;
    }
    setIsSubmitting(true);
    
    try {
      // Hard-coded manager login check (Retained)
      if (username.toLowerCase() === 'manager' && password === 'Adminmanager123@') {
        setUserRole('manager');
        setLoggedInEmployee(null);
        return;
      }
      
      // Prefer Firebase Auth when configured; but fall back to legacy server-side login if Firebase isn't set up
      let usedFirebase = false;
      try {
        if (firebaseAuth) {
          const idToken = await signInAndGetIdToken(username, password);
          usedFirebase = true;
          const res = await fetch(`${API_BASE_URL}/employees/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
          });

          if (res.status === 401) {
            setError('Invalid credentials or token not accepted by backend.');
            return;
          }

          if (!res.ok) {
            setError('Login failed due to a server error.');
            return;
          }

          const employeeData = await res.json();
          if (employeeData.status === 'inactive') {
            setError('This employee account is inactive.');
            return;
          }
          setLoggedInEmployee(employeeData);
          if (employeeData.requiresPasswordChange) {
            setUserRole('forcePasswordChange');
          } else {
            setUserRole('employee');
          }
          return; // success via Firebase path
        }
      } catch (firebaseErr) {
        // If Firebase isn't configured or sign-in failed, fall back to legacy username/password endpoint
        // fall through to legacy path below
      }

      // Legacy username/password backend path
      try {
        const response = await fetch(`${API_BASE_URL}/employees/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.toLowerCase(), password })
        });

        if (response.status === 401) { // UNAUTHORIZED
          setError('Invalid username or password.');
          return;
        }

        if (!response.ok) {
          throw new Error('Login failed due to a server error.');
        }

        const employeeData = await response.json();
        if (employeeData) {
          if (employeeData.status === 'inactive') {
            setError('This employee account is inactive.');
            return;
          }
          setLoggedInEmployee(employeeData);
          if (employeeData.requiresPasswordChange) {
            setUserRole('forcePasswordChange');
          } else {
            setUserRole('employee');
          }
        } else {
          setError('Invalid username or password.');
        }
      } catch (legacyErr) {
        setError('Authentication error. Please check your credentials.');
        return;
      }

    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setUserRole(null); setLoggedInEmployee(null); setUsername(''); setPassword(''); setError('');
  };

  if (isLoading || !isAuthReady) {
    return <div className="flex items-center justify-center h-screen">Loading…</div>;
  }

  if (userRole) {
    // REMOVED db prop
    return <DashboardLayout userRole={userRole} user={loggedInEmployee} handleLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')" }}>
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border-2 border-blue-200">
        {authView === 'login' ? (
          <LoginPage username={username} setUsername={setUsername} password={password} setPassword={setPassword} handleLogin={handleLogin} setAuthView={setAuthView} error={error} isSubmitting={isSubmitting} />
        ) : (
          // REMOVED db, appId props
          <ForgotPasswordPage setAuthView={setAuthView} />
        )}
      </div>
    </div>
  );
}