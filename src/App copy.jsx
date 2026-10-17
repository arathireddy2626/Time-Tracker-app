import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    onSnapshot,
    query,
    where,
    getDocs,
    updateDoc,
    limit,
    orderBy,
    arrayUnion,
    arrayRemove,
    Timestamp
} from 'firebase/firestore';

// --- Helper Functions & Initial Config ---

// Use provided Firebase config or a placeholder for local development
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config)
    : { 
        apiKey: "AIzaSyDRtPjOoF_ZlQhsUuUI4aQXDyKSROPiPec",
        authDomain: "time-tracker-project-14f17.firebaseapp.com",
        projectId: "time-tracker-project-14f17",
        storageBucket: "time-tracker-project-14f17.firebasestorage.app",
        messagingSenderId: "34897476351",
        appId: "1:34897476351:web:d182488dbe2970d128eaca",
        measurementId: "G-3FK314GPD2"
    }; // Replace with your actual config for local testing

// Use provided App ID or a default
const appId = typeof __app_id !== 'undefined' ? __app_id : 'time-tracker-app';

// --- Icon Components (using inline SVG for simplicity) ---
const HomeIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const BriefcaseIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const UsersIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const ClockIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const LogOutIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const FileTextIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const PlusCircleIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
const XCircleIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);
const UserPlus = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="23" y2="17"/><line x1="20" y1="14" x2="26" y2="14"/></svg>
);
const LockIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const AlertTriangleIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const TimeTrackerLogo = (props) => (
    <svg {...props} viewBox="0 0 260 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M 10 25 C 10 14.9 14.9 10 25 10 C 35.1 10 40 14.9 40 25 C 40 35.1 35.1 40 25 40 C 14.9 40 10 35.1 10 25 Z M 25 12 C 16.6 12 12 16.6 12 25 C 12 33.4 16.6 38 25 38 C 33.4 38 38 33.4 38 25 C 38 16.6 33.4 12 25 12 Z" fill="currentColor"/>
        <path d="M 23 16 L 23 26 L 30 30" fill="none" stroke="currentColor" strokeWidth="2"/>
        <text x="50" y="35" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="currentColor">TimeTracker</text>
    </svg>
);


// --- Main Application Component ---
export default function App() {
    // Firebase state
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // App state
    const [authView, setAuthView] = useState('login'); // 'login', 'signup', 'forgotPassword'
    const [userRole, setUserRole] = useState(null); // 'manager' or 'employee'
    const [loggedInEmployee, setLoggedInEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Initialize Firebase
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);
            setDb(firestore);
            setAuth(authInstance);
        } catch (e) {
            console.error("Firebase initialization error:", e);
            setError("Could not connect to services.");
        }
    }, []);

    // Handle Auth State
    useEffect(() => {
        if (!auth) return;

        const attemptLogin = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Authentication error:", error);
                setError("Failed to authenticate.");
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
            setIsAuthReady(true);
            setIsLoading(false);
        });
        
        attemptLogin();

        return () => unsubscribe();
    }, [auth]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (username.toLowerCase() === 'manager' && password === 'Admin123') {
            setUserRole('manager');
            setLoggedInEmployee(null);
            return;
        }

        if (!db) {
            setError('Database connection not available.');
            return;
        }

        try {
            const employeesRef = collection(db, `/artifacts/${appId}/public/data/employees`);
            const q = query(employeesRef, where("username", "==", username.toLowerCase()));
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Invalid username or password.');
                return;
            }

            const employeeDoc = querySnapshot.docs[0];
            const employeeData = {id: employeeDoc.id, ...employeeDoc.data()};

            if (employeeData.password === password) {
                if (employeeData.status === 'active') {
                    setLoggedInEmployee(employeeData);
                    setUserRole('employee');
                } else if (employeeData.status === 'invited') {
                     setError('Your account has not been set up. Please Sign Up to create your password.');
                } else {
                    setError('This employee account is inactive.');
                }
            } else {
                setError('Invalid username or password.');
            }

        } catch (err) {
            console.error("Login error:", err);
            setError('An error occurred during login.');
        }
    };

    const handleLogout = () => {
        setUserRole(null);
        setLoggedInEmployee(null);
        setUsername('');
        setPassword('');
        setError('');
    };
    
    if (isLoading || !isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    }

    return (
        <div 
            className="bg-cover bg-center bg-fixed min-h-screen font-sans text-gray-800" 
            style={{backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop')"}}
        >
            <div className="bg-black bg-opacity-50 min-h-screen">
                {!userRole ? (
                     <AuthPage 
                        authView={authView}
                        setAuthView={setAuthView}
                        handleLogin={handleLogin}
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        error={error}
                        setError={setError}
                        db={db}
                     />
                ) : (
                    <DashboardLayout userRole={userRole} handleLogout={handleLogout} db={db} user={user} loggedInEmployee={loggedInEmployee}/>
                )}
            </div>
        </div>
    );
}

// --- Page & Layout Components ---

const AuthPage = ({ authView, setAuthView, ...props }) => {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md p-8 space-y-8 bg-white bg-opacity-90 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex justify-center text-indigo-600">
                    <TimeTrackerLogo className="w-auto h-12" />
                </div>
                {authView === 'login' && <LoginPage setAuthView={setAuthView} {...props} />}
                {authView === 'signup' && <SignUpPage setAuthView={setAuthView} {...props} />}
                {authView === 'forgotPassword' && <ForgotPasswordPage setAuthView={setAuthView} {...props} />}
            </div>
        </div>
    );
}

const LoginPage = ({ handleLogin, username, setUsername, password, setPassword, error, setAuthView }) => (
    <>
        <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                Sign In
            </h2>
            <p className="mt-2 text-sm text-gray-600">
                Welcome back to TimeTracker
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
                <div>
                    <input id="username" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username" />
                </div>
                <div>
                    <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password" />
                </div>
            </div>
             <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => setAuthView('forgotPassword')} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Forgot your password?
                    </button>
                </div>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <div>
                <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign in
                </button>
            </div>
        </form>
         <p className="text-center text-sm text-gray-600">
            New employee?{' '}
            <button onClick={() => setAuthView('signup')} className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign Up
            </button>
        </p>
    </>
);

const SignUpPage = ({ db, error, setError, setAuthView }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const employeesCollectionPath = `/artifacts/${appId}/public/data/employees`;

    const showFeedback = (message, type, duration = 4000) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), duration);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.fullName.trim().split(' ').length < 2) {
            setError('Please enter your full first and last name.');
            return;
        }
        if (formData.password.length < 6 || !/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/\d/.test(formData.password)) {
            setError('Password must be at least 6 characters and contain an uppercase letter, a lowercase letter, and a number.');
            return;
        }

        const employeesRef = collection(db, employeesCollectionPath);
        const q = query(
            employeesRef, 
            where("employeeId", "==", formData.employeeId),
            where("email", "==", formData.email),
            where("status", "==", "invited")
        );
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setError('Account not found or already registered. Please contact your manager to ensure your details have been added correctly.');
            return;
        }
        
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();
        
        const registeredFullName = `${employeeData.firstName} ${employeeData.lastName}`.toLowerCase();
        const enteredFullName = formData.fullName.trim().toLowerCase();

        if (registeredFullName !== enteredFullName){
            setError('The name entered does not match the details provided by your manager.');
            return;
        }

        try {
            await updateDoc(doc(db, employeesCollectionPath, employeeDoc.id), {
                password: formData.password,
                status: 'active'
            });
            showFeedback('Registration successful! You can now log in.', 'success', 6000);
            setTimeout(() => setAuthView('login'), 6000);
        } catch (error) {
            console.error("Sign up error:", error);
            setError('Failed to update account.');
        }
    };

    return (
        <>
            <div className="text-center">
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Employee Registration
                </h2>
                 <p className="mt-2 text-sm text-gray-600">
                    Complete your account setup.
                </p>
            </div>
            {feedback.message && (
                 <div className={`p-4 my-4 rounded-lg text-white text-center ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            <form className="mt-8 space-y-4" onSubmit={handleSignUp}>
                <div>
                    <label className="block text-sm font-bold text-gray-700">FULL NAME</label>
                    <p className="text-xs text-gray-500 mb-1">Enter your first and last name as provided to your manager.</p>
                    <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">EMPLOYEE ID</label>
                    <p className="text-xs text-gray-500 mb-1">Enter your unique employee ID.</p>
                    <input name="employeeId" type="text" required value={formData.employeeId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">EMAIL</label>
                    <p className="text-xs text-gray-500 mb-1">Use the email your manager has on file.</p>
                    <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">PASSWORD</label>
                    <p className="text-xs text-gray-500 mb-1">Set your new password.</p>
                    <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700">CONFIRM PASSWORD</label>
                     <p className="text-xs text-gray-500 mb-1">Re-enter your password.</p>
                    <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div>
                    <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Complete Registration
                    </button>
                </div>
            </form>
             <p className="text-center text-sm text-gray-600 mt-4">
                Already registered?{' '}
                <button onClick={() => setAuthView('login')} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign In
                </button>
            </p>
        </>
    );
};

const ForgotPasswordPage = ({ db, setAuthView, error, setError }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        employeeId: '',
        email: '',
        reason: ''
    });
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    const showFeedback = (message, type, duration = 6000) => {
        setFeedback({ message, type });
        setTimeout(() => {
            setFeedback({ message: '', type: '' });
            if (type === 'success') {
                setAuthView('login');
            }
        }, duration);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.fullName || !formData.employeeId || !formData.email || !formData.reason) {
            setError('Please fill out all fields.');
            return;
        }
        
        const employeesRef = collection(db, `/artifacts/${appId}/public/data/employees`);
        const q = query(
            employeesRef,
            where("employeeId", "==", formData.employeeId),
            where("email", "==", formData.email)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setError('No matching employee record found.');
            return;
        }
        
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();
        const registeredFullName = `${employeeData.firstName} ${employeeData.lastName}`.toLowerCase();
        const enteredFullName = formData.fullName.trim().toLowerCase();

        if (registeredFullName !== enteredFullName) {
            setError('The name entered does not match the employee record.');
            return;
        }

        // NOTE: In a real application, this would trigger a backend service to log the request 
        // and notify an administrator. For this demo, we will just show a confirmation message.
        showFeedback('The request is sent to the administrator.', 'success');
    };

    return (
         <>
            <div className="text-center">
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    Request Password Reset
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Please provide your details for verification.
                </p>
            </div>
            {feedback.message && (
                 <div className={`p-4 my-4 rounded-lg text-white text-center ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            <form className="mt-8 space-y-4" onSubmit={handleReset}>
                <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Full Name"/>
                <input name="employeeId" type="text" required value={formData.employeeId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Employee ID"/>
                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Email Address"/>
                <textarea name="reason" required value={formData.reason} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Reason for request..." rows="3"></textarea>
                
                 {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div>
                    <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Request Reset
                    </button>
                </div>
            </form>
             <p className="text-center text-sm text-gray-600 mt-4">
                Remember your password?{' '}
                <button onClick={() => setAuthView('login')} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign In
                </button>
            </p>
        </>
    );
};


const DashboardLayout = ({ userRole, handleLogout, db, user, loggedInEmployee }) => {
    const [activeView, setActiveView] = useState('dashboard');

    const managerMenu = [
        { name: 'Dashboard', icon: HomeIcon, view: 'dashboard' },
        { name: 'Projects', icon: BriefcaseIcon, view: 'projects' },
        { name: 'Employees', icon: UsersIcon, view: 'employees' },
        { name: 'Reports', icon: FileTextIcon, view: 'reports' },
    ];

    const employeeMenu = [
        { name: 'Dashboard', icon: HomeIcon, view: 'dashboard' },
        { name: 'Clock In/Out', icon: ClockIcon, view: 'clock' },
        { name: 'My Timesheet', icon: FileTextIcon, view: 'timesheet' },
        { name: 'Change Password', icon: LockIcon, view: 'password' },
    ];
    
    const menuItems = userRole === 'manager' ? managerMenu : employeeMenu;

    return (
        <div className="flex h-screen text-gray-100 bg-gray-900 bg-opacity-50">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 bg-opacity-80 backdrop-blur-lg flex flex-col flex-shrink-0">
                <div className="h-20 flex items-center justify-center border-b border-gray-700 px-4">
                     <TimeTrackerLogo className="w-auto h-10 text-white" />
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map(item => (
                        <button 
                            key={item.name} 
                            onClick={() => setActiveView(item.view)}
                            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${activeView === item.view ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-700 hover:text-white'}`}
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Content Header */}
                 <header className="flex justify-end items-center p-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-white text-lg">
                            {userRole === 'manager' ? 'Manager' : `${loggedInEmployee?.firstName} ${loggedInEmployee?.lastName}`}
                        </span>
                        <button 
                            onClick={handleLogout} 
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
                        >
                           <LogOutIcon className="h-5 w-5" /> Logout
                        </button>
                    </div>
                </header>
                
                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl shadow-xl p-8 min-h-full text-gray-900">
                        {userRole === 'manager' && <ManagerContent activeView={activeView} db={db} user={user} />}
                        {userRole === 'employee' && <EmployeeContent activeView={activeView} db={db} user={user} loggedInEmployee={loggedInEmployee} setActiveView={setActiveView} />}
                    </div>
                </main>
            </div>
        </div>
    );
};

// --- Manager & Employee Specific Content ---

const ManagerContent = ({ activeView, db, user }) => {
    switch (activeView) {
        case 'dashboard':
            return <ManagerDashboard db={db} user={user}/>;
        case 'projects':
            return <ProjectManagement db={db} user={user}/>;
        case 'employees':
            return <EmployeeManagement db={db} user={user}/>;
        case 'reports':
            return <Reports db={db} user={user}/>;
        default:
            return <ManagerDashboard db={db} user={user}/>;
    }
};

const EmployeeContent = ({ activeView, db, user, loggedInEmployee, setActiveView }) => {
    switch (activeView) {
        case 'dashboard':
            return <EmployeeDashboard employee={loggedInEmployee} db={db} setActiveView={setActiveView} />;
        case 'clock':
            return <TimeClock db={db} user={user} employee={loggedInEmployee} />;
        case 'timesheet':
            return <MyTimesheet db={db} employee={loggedInEmployee} />;
        case 'password':
            return <ChangePassword db={db} employee={loggedInEmployee} />;
        default:
            return <EmployeeDashboard employee={loggedInEmployee} db={db} setActiveView={setActiveView} />;
    }
};

// --- Feature Components ---

const ManagerDashboard = ({ db, user }) => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);

    const projectsCollectionPath = `/artifacts/${appId}/public/data/projects`;
    const employeesCollectionPath = `/artifacts/${appId}/public/data/employees`;

    useEffect(() => {
        if (!db || !user) return;

        const projectsQuery = query(collection(db, projectsCollectionPath), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const employeesQuery = query(collection(db, employeesCollectionPath));
        const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeProjects();
            unsubscribeEmployees();
        };
    }, [db, user, projectsCollectionPath, employeesCollectionPath]);
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Manager Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Summaries */}
                <div className="bg-gray-50 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Recent Projects</h3>
                    <div className="space-y-2">
                        {projects.length > 0 ? projects.map(p => (
                            <div key={p.id} className="bg-white p-3 rounded shadow-sm">
                                <p className="font-semibold">{p.name} <span className="text-sm font-normal text-gray-500">- {p.assignedEmployees?.length || 0} employees</span></p>
                            </div>
                        )) : <p>No projects found.</p>}
                    </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Employee Overview</h3>
                    <div className="text-center mb-4">
                        <p className="text-4xl font-bold">{employees.filter(e => e.status === 'active').length}</p>
                        <p className="text-gray-600">Active Employees</p>
                    </div>
                     <div className="text-center">
                        <p className="text-4xl font-bold">{employees.filter(e => e.status === 'invited').length}</p>
                        <p className="text-gray-600">Invited Employees</p>
                    </div>
                </div>
            </div>

            {/* All Employees List */}
            <div>
                 <h3 className="text-2xl font-bold mb-4">All Company Employees</h3>
                 <div className="space-y-3">
                    {employees.map(emp => (
                        <div key={emp.id} className={`p-4 rounded-lg shadow-md flex justify-between items-center ${emp.status === 'active' ? 'bg-white' : 'bg-gray-200'}`}>
                            <div>
                                <p className="font-bold text-lg">{emp.firstName} {emp.lastName} (ID: {emp.employeeId})</p>
                                <p className="text-sm text-gray-500">{emp.email}</p>
                                <p className="text-sm text-gray-600">Username: {emp.username}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${emp.status === 'active' ? 'bg-green-500' : emp.status === 'invited' ? 'bg-blue-500' : 'bg-red-500'}`}>{emp.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const EmployeeDashboard = ({ employee, db, setActiveView }) => {
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [activeTimeEntry, setActiveTimeEntry] = useState(null);
    const [weekHours, setWeekHours] = useState(0);

    const projectsCollectionPath = `/artifacts/${appId}/public/data/projects`;
    const timeEntriesCollectionPath = `/artifacts/${appId}/public/data/timeEntries`;
    
    // Fetch dashboard data
    useEffect(() => {
        if (!db || !employee) return;
        
        // Assigned projects
        const qProjects = query(collection(db, projectsCollectionPath), where("assignedEmployees", "array-contains", employee.id));
        const unsubProjects = onSnapshot(qProjects, (snapshot) => {
            setAssignedProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Active clock-in
        const qActive = query(collection(db, timeEntriesCollectionPath), where("employeeId", "==", employee.id), where("status", "==", "clocked-in"));
        const unsubActive = onSnapshot(qActive, (snapshot) => {
            setActiveTimeEntry(snapshot.empty ? null : {id: snapshot.docs[0].id, ...snapshot.docs[0].data()});
        });
        
        // Weekly hours
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const qWeek = query(
            collection(db, timeEntriesCollectionPath),
            where("employeeId", "==", employee.id),
            where("status", "==", "clocked-out"),
            where("clockInTime", ">=", Timestamp.fromDate(oneWeekAgo))
        );
        const unsubWeek = onSnapshot(qWeek, (snapshot) => {
            let totalSeconds = 0;
            snapshot.forEach(doc => {
                const entry = doc.data();
                if(entry.clockOutTime && entry.clockInTime) {
                    totalSeconds += entry.clockOutTime.seconds - entry.clockInTime.seconds;
                }
            });
            setWeekHours(totalSeconds / 3600);
        });

        return () => {
            unsubProjects();
            unsubActive();
            unsubWeek();
        }
    }, [db, employee]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-2">Welcome, {employee?.firstName}!</h2>
            <p className="text-gray-600 mb-8">Here's a summary of your activity.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Project Card */}
                <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-500 mb-2">Currently Clocked In</h3>
                    {activeTimeEntry ? (
                        <div>
                            <p className="text-2xl font-bold text-indigo-600">{assignedProjects.find(p => p.id === activeTimeEntry.projectId)?.name || '...'}</p>
                            <button onClick={() => setActiveView('clock')} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Clock Out</button>
                        </div>
                    ) : (
                         <div>
                            <p className="text-2xl font-bold text-gray-400">Not Clocked In</p>
                             <button onClick={() => setActiveView('clock')} className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Clock In</button>
                        </div>
                    )}
                </div>
                 {/* Assigned Projects Card */}
                 <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                     <h3 className="text-lg font-semibold text-gray-500 mb-2">Assigned Projects</h3>
                     <p className="text-5xl font-bold text-gray-800">{assignedProjects.length}</p>
                </div>
                 {/* Weekly Hours Card */}
                 <div className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                     <h3 className="text-lg font-semibold text-gray-500 mb-2">Hours This Week</h3>
                     <p className="text-5xl font-bold text-gray-800">{weekHours.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
};

const ProjectManagement = ({ db, user }) => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectHours, setNewProjectHours] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, item: null, action: null });
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    
    const projectsCollectionPath = `/artifacts/${appId}/public/data/projects`;
    const employeesCollectionPath = `/artifacts/${appId}/public/data/employees`;

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };
    
    useEffect(() => {
        if(!db || !user) return;
        const qProjects = query(collection(db, projectsCollectionPath));
        const unsubscribeProjects = onSnapshot(qProjects, (querySnapshot) => {
            setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qEmployees = query(collection(db, employeesCollectionPath), where("status", "==", "active"));
        const unsubscribeEmployees = onSnapshot(qEmployees, (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeProjects();
            unsubscribeEmployees();
        };
    }, [db, user, projectsCollectionPath, employeesCollectionPath]);

    const addProject = async () => {
        if (newProjectName && newProjectHours > 0) {
            if (newProjectHours <= 250) {
                showFeedback('Anticipated completion time must be more than 250 hours.', 'error');
                return;
            }
            const q = query(collection(db, projectsCollectionPath), where("name", "==", newProjectName));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                showFeedback('A project with this name already exists.', 'error');
                return;
            }

            try {
                await addDoc(collection(db, projectsCollectionPath), {
                    name: newProjectName,
                    description: newProjectDescription,
                    estimatedHours: Number(newProjectHours),
                    createdAt: new Date(),
                    assignedEmployees: []
                });
                showFeedback('Project added successfully.', 'success');
                setNewProjectName('');
                setNewProjectHours('');
                setNewProjectDescription('');
            } catch (e) {
                console.error("Error adding project: ", e);
                showFeedback('Failed to add project.', 'error');
            }
        } else {
             showFeedback('Please provide a valid project name and positive hours.', 'error');
        }
    };

    const confirmDeleteProject = (project) => {
        setConfirmModalState({
            isOpen: true,
            item: project,
            action: () => deleteProject(project.id)
        });
    };

    const deleteProject = async (id) => {
        try {
            await deleteDoc(doc(db, projectsCollectionPath, id));
            showFeedback('Project deleted successfully.', 'success');
        } catch (e) {
            console.error("Error deleting project: ", e);
            showFeedback('Failed to delete project.', 'error');
        }
        setConfirmModalState({ isOpen: false, item: null, action: null });
    };

    const handleOpenAssignModal = (project) => {
        setSelectedProject(project);
        setAssignModalOpen(true);
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Project Management</h2>
            <ConfirmationModal 
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({isOpen: false, item: null, action: null})}
                onConfirm={confirmModalState.action}
                title="Delete Project"
                message={`Are you sure you want to delete the project "${confirmModalState.item?.name}"? This action cannot be undone.`}
            />
            {isAssignModalOpen && (
                <AssignEmployeeModal
                    project={selectedProject}
                    employees={employees}
                    db={db}
                    onClose={() => setAssignModalOpen(false)}
                    projectsCollectionPath={projectsCollectionPath}
                />
            )}
             {feedback.message && (
                 <div className={`p-4 mb-4 rounded-lg text-white ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="bg-gray-100 p-4 rounded-lg mb-6 space-y-3">
                <h3 className="text-xl font-semibold mb-2">Add New Project</h3>
                <div className="flex gap-4">
                    <input type="text" placeholder="Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="flex-grow p-2 rounded border"/>
                    <input type="number" placeholder="Estimated Hours (>250)" value={newProjectHours} onChange={(e) => setNewProjectHours(e.target.value)} className="w-48 p-2 rounded border"/>
                </div>
                <div>
                    <textarea placeholder="Project Description" value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} className="w-full p-2 rounded border" rows="3"></textarea>
                </div>
                <button onClick={addProject} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"><PlusCircleIcon className="w-5 h-5"/> Add Project</button>
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Existing Projects</h3>
             <div className="space-y-3">
                {projects.map(project => (
                    <div key={project.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">{project.name}</p>
                            <p className="text-sm text-gray-500 italic mt-1">{project.description}</p>
                            <p className="text-sm text-gray-600 mt-2">Estimated Hours: {project.estimatedHours}</p>
                            <p className="text-sm text-gray-500">Assigned: {project.assignedEmployees?.length || 0} employees</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleOpenAssignModal(project)} className="text-white bg-blue-500 hover:bg-blue-700 p-2 rounded-full"><UsersIcon className="w-5 h-5"/></button>
                           <button onClick={() => confirmDeleteProject(project)} className="text-white bg-red-500 hover:bg-red-700 p-2 rounded-full"><XCircleIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const EmployeeManagement = ({ db, user }) => {
    const [employees, setEmployees] = useState([]);
    const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('');
    const [newEmployeeLastName, setNewEmployeeLastName] = useState('');
    const [newEmployeeId, setNewEmployeeId] = useState('');
    const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
    const [newEmployeeJoiningYear, setNewEmployeeJoiningYear] = useState(new Date().getFullYear().toString());
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [confirmModalState, setConfirmModalState] = useState({ isOpen: false, item: null, action: null });

    const employeesCollectionPath = `/artifacts/${appId}/public/data/employees`;

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };

    useEffect(() => {
        if(!db || !user) return;
        const q = query(collection(db, employeesCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const employeesData = [];
            querySnapshot.forEach((doc) => {
                employeesData.push({ id: doc.id, ...doc.data() });
            });
            setEmployees(employeesData);
        }, (error) => {
            console.error("Error fetching employees: ", error);
        });

        return () => unsubscribe();
    }, [db, user, employeesCollectionPath]);

    const addEmployee = async (e) => {
        e.preventDefault();
        if (!newEmployeeId.trim()) { showFeedback('Employee ID is required.', 'error'); return; }
        if (!newEmployeeEmail.trim() || !/^\S+@\S+\.\S+$/.test(newEmployeeEmail)) { showFeedback('Please enter a valid email address.', 'error'); return; }
        if (newEmployeeFirstName.length < 2 || newEmployeeLastName.length < 2) { showFeedback('First and last names must be at least 2 characters.', 'error'); return; }
        if (!/^\d{4}$/.test(newEmployeeJoiningYear) || parseInt(newEmployeeJoiningYear) < 2000 || parseInt(newEmployeeJoiningYear) > 2100) {
            showFeedback('Please enter a valid 4-digit joining year (e.g., 2025).', 'error');
            return;
        }

        const year = newEmployeeJoiningYear.toString().slice(-2);
        const username = `${newEmployeeLastName.toLowerCase()}${year}`;
        const employeesRef = collection(db, employeesCollectionPath);

        const idQuery = query(employeesRef, where("employeeId", "==", newEmployeeId));
        const emailQuery = query(employeesRef, where("email", "==", newEmployeeEmail));
        const usernameQuery = query(employeesRef, where("username", "==", username));

        const [idSnapshot, emailSnapshot, usernameSnapshot] = await Promise.all([
             getDocs(idQuery), getDocs(emailQuery), getDocs(usernameQuery)
        ]);
        
        if (!idSnapshot.empty) { showFeedback(`Employee ID "${newEmployeeId}" already exists.`, 'error'); return; }
        if (!emailSnapshot.empty) { showFeedback(`Email "${newEmployeeEmail}" already exists.`, 'error'); return; }
        if (!usernameSnapshot.empty){ showFeedback(`Username "${username}" may already exist. Please adjust the last name.`, 'error'); return; }
        
        try {
            await addDoc(collection(db, employeesCollectionPath), {
                employeeId: newEmployeeId,
                email: newEmployeeEmail,
                firstName: newEmployeeFirstName,
                lastName: newEmployeeLastName,
                username: username,
                password: null,
                status: 'invited',
                createdAt: new Date(),
            });
            showFeedback(`Employee ${newEmployeeFirstName} has been invited! They can now register.`, 'success');
            setNewEmployeeFirstName('');
            setNewEmployeeLastName('');
            setNewEmployeeId('');
            setNewEmployeeEmail('');
            setNewEmployeeJoiningYear(new Date().getFullYear().toString());
        } catch (err) {
            console.error("Error adding employee: ", err);
            showFeedback("Failed to invite employee.", "error");
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
            showFeedback('Employee deactivated successfully.', 'success');
        } catch(e) {
            console.error("Error deactivating employee: ", e);
            showFeedback('Failed to deactivate employee.', 'error');
        }
        setConfirmModalState({ isOpen: false, item: null, action: null });
    };

    const HireEmployeeForm = (
         <form onSubmit={addEmployee} className="space-y-3">
            <input type="text" placeholder="Unique Employee ID" value={newEmployeeId} onChange={(e) => setNewEmployeeId(e.target.value)} className="w-full p-2 rounded border"/>
            <input type="email" placeholder="Unique Email Address" value={newEmployeeEmail} onChange={(e) => setNewEmployeeEmail(e.target.value)} className="w-full p-2 rounded border"/>
            <input type="text" placeholder="First Name" value={newEmployeeFirstName} onChange={(e) => setNewEmployeeFirstName(e.target.value)} className="w-full p-2 rounded border"/>
            <input type="text" placeholder="Last Name" value={newEmployeeLastName} onChange={(e) => setNewEmployeeLastName(e.target.value)} className="w-full p-2 rounded border"/>
            <input type="number" placeholder="Joining Year (YYYY)" value={newEmployeeJoiningYear} onChange={(e) => setNewEmployeeJoiningYear(e.target.value)} className="w-full p-2 rounded border"/>
            <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center justify-center gap-2"><PlusCircleIcon className="w-5 h-5" /> Invite Employee</button>
        </form>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Employee Management</h2>
            <ConfirmationModal 
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({isOpen: false, item: null, action: null})}
                onConfirm={confirmModalState.action}
                title="Deactivate Employee"
                message={`Are you sure you want to deactivate ${confirmModalState.item?.firstName} ${confirmModalState.item?.lastName}? Their records will be kept.`}
            />
             {feedback.message && (
                 <div className={`p-4 mb-4 rounded-lg text-white ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                 <h3 className="text-xl font-semibold mb-2">Invite New Employee</h3>
                 {HireEmployeeForm}
            </div>

             <h3 className="text-xl font-semibold mb-4">Company Employees</h3>
             <div className="space-y-3">
                {employees.map(emp => (
                    <div key={emp.id} className={`p-4 rounded-lg shadow-md flex justify-between items-center ${emp.status === 'active' ? 'bg-white' : 'bg-gray-200'}`}>
                        <div>
                            <p className="font-bold text-lg">{emp.firstName} {emp.lastName} (ID: {emp.employeeId})</p>
                             <p className="text-sm text-gray-500">{emp.email}</p>
                            <p className="text-sm text-gray-600">Username: {emp.username} | Status: <span className={`font-semibold ${emp.status === 'active' ? 'text-green-600' : emp.status === 'invited' ? 'text-blue-600' : 'text-red-600'}`}>{emp.status}</span></p>
                        </div>
                        {emp.status === 'active' && 
                            <button onClick={() => confirmDeactivate(emp)} className="text-red-500 hover:text-red-700">Deactivate</button>
                        }
                    </div>
                ))}
            </div>
        </div>
    );
};


const TimeClock = ({ db, user, employee }) => {
    const [assignedProjects, setAssignedProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [activeTimeEntry, setActiveTimeEntry] = useState(null); // null or {id, projectId, clockInTime}
    const [feedback, setFeedback] = useState({message: '', type: ''});

    const projectsCollectionPath = `/artifacts/${appId}/public/data/projects`;
    const timeEntriesCollectionPath = `/artifacts/${appId}/public/data/timeEntries`;

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };

    // Fetch assigned projects
    useEffect(() => {
        if (!db || !employee) return;
        const q = query(collection(db, projectsCollectionPath), where("assignedEmployees", "array-contains", employee.id));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setAssignedProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, employee, projectsCollectionPath]);

    // Check for active clock-in
    useEffect(() => {
        if (!db || !employee) return;
        const q = query(
            collection(db, timeEntriesCollectionPath),
            where("employeeId", "==", employee.id),
            where("status", "==", "clocked-in")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                setActiveTimeEntry({ id: doc.id, ...doc.data() });
            } else {
                setActiveTimeEntry(null);
            }
        });
        return () => unsubscribe();
    }, [db, employee, timeEntriesCollectionPath]);

    const handleClockIn = async () => {
        if (!selectedProject) {
            showFeedback('Please select a project first.', 'error');
            return;
        }
        if (activeTimeEntry) {
            showFeedback('You are already clocked in to another project.', 'error');
            return;
        }
        try {
            await addDoc(collection(db, timeEntriesCollectionPath), {
                employeeId: employee.id,
                projectId: selectedProject,
                clockInTime: Timestamp.now(),
                clockOutTime: null,
                status: 'clocked-in'
            });
            showFeedback('Clocked in successfully!', 'success');
        } catch (error) {
            console.error("Error clocking in:", error);
            showFeedback('Failed to clock in.', 'error');
        }
    };

    const handleClockOut = async () => {
        if (!activeTimeEntry) {
            showFeedback('Error: No active clock-in found.', 'error');
            return;
        }
        try {
            const entryRef = doc(db, timeEntriesCollectionPath, activeTimeEntry.id);
            await updateDoc(entryRef, {
                clockOutTime: Timestamp.now(),
                status: 'clocked-out'
            });
            showFeedback('Clocked out successfully!', 'success');
            setSelectedProject('');
        } catch (error) {
            console.error("Error clocking out:", error);
            showFeedback('Failed to clock out.', 'error');
        }
    };

    const getProjectName = (projectId) => {
        const project = assignedProjects.find(p => p.id === projectId);
        return project ? project.name : 'Unknown Project';
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Clock In / Out</h2>
            {feedback.message && (
                 <div className={`p-4 mb-4 rounded-lg text-white ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="bg-gray-100 p-6 rounded-lg max-w-lg mx-auto text-center">
                {!activeTimeEntry ? (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Select an assigned project to start working</h3>
                        <select 
                            value={selectedProject} 
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full p-2 rounded border mb-4"
                            disabled={assignedProjects.length === 0}
                        >
                            <option value="">{assignedProjects.length > 0 ? '-- Choose a Project --' : 'No projects assigned'}</option>
                            {assignedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button 
                            onClick={handleClockIn} 
                            disabled={!selectedProject}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                            CLOCK IN
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Currently Clocked In</h3>
                        <p className="text-2xl font-bold text-indigo-600 mb-1">{getProjectName(activeTimeEntry.projectId)}</p>
                        <p className="text-sm text-gray-500 mb-4">
                            Since: {new Date(activeTimeEntry.clockInTime.seconds * 1000).toLocaleString()}
                        </p>
                        <button 
                            onClick={handleClockOut} 
                            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-red-700"
                        >
                            CLOCK OUT
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AssignEmployeeModal = ({ project, employees, db, onClose, projectsCollectionPath }) => {
    const [assigned, setAssigned] = useState(project.assignedEmployees || []);

    const handleToggleAssign = async (employeeId) => {
        const projectRef = doc(db, projectsCollectionPath, project.id);
        if (assigned.includes(employeeId)) {
            setAssigned(assigned.filter(id => id !== employeeId));
            await updateDoc(projectRef, { assignedEmployees: arrayRemove(employeeId) });
        } else {
            setAssigned([...assigned, employeeId]);
            await updateDoc(projectRef, { assignedEmployees: arrayUnion(employeeId) });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">Assign Employees to {project.name}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {employees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100">
                           <label htmlFor={`emp-${emp.id}`} className="flex-grow cursor-pointer">
                                {emp.firstName} {emp.lastName}
                            </label>
                            <input
                                type="checkbox"
                                id={`emp-${emp.id}`}
                                checked={assigned.includes(emp.id)}
                                onChange={() => handleToggleAssign(emp.id)}
                                className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Done</button>
            </div>
        </div>
    );
};

const Reports = ({ db, user }) => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [isReportLoading, setIsReportLoading] = useState(false);

    const projectsCollectionPath = `/artifacts/${appId}/public/data/projects`;
    const employeesCollectionPath = `/artifacts/${appId}/public/data/employees`;
    const timeEntriesCollectionPath = `/artifacts/${appId}/public/data/timeEntries`;

    const calculateHours = (entry) => {
        if (!entry.clockOutTime || !entry.clockInTime) return 0;
        const diffSeconds = entry.clockOutTime.seconds - entry.clockInTime.seconds;
        return (diffSeconds / 3600);
    };

    useEffect(() => {
        if (!db || !user) return;
        const unsubProjects = onSnapshot(collection(db, projectsCollectionPath), (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubEmployees = onSnapshot(collection(db, employeesCollectionPath), (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => {
            unsubProjects();
            unsubEmployees();
        };
    }, [db, user]);

    useEffect(() => {
        if (selectedReport?.type === 'project') {
            const fetchProjectReportData = async () => {
                setIsReportLoading(true);
                const q = query(
                    collection(db, timeEntriesCollectionPath),
                    where("projectId", "==", selectedReport.data.id),
                    where("status", "==", "clocked-out")
                );
                const querySnapshot = await getDocs(q);
                const entries = querySnapshot.docs.map(doc => doc.data());

                const employeeHours = {};
                let totalHours = 0;

                entries.forEach(entry => {
                    const hours = calculateHours(entry);
                    totalHours += hours;
                    employeeHours[entry.employeeId] = (employeeHours[entry.employeeId] || 0) + hours;
                });
                
                setReportData({ employeeHours, totalHours });
                setIsReportLoading(false);
            };
            fetchProjectReportData();
        }
    }, [selectedReport, db]);

    if (selectedReport) {
        if (selectedReport.type === 'project') {
            const project = selectedReport.data;
            const assignedEmps = employees.filter(e => project.assignedEmployees?.includes(e.id));
            return (
                <div>
                    <button onClick={() => setSelectedReport(null)} className="mb-4 bg-gray-200 px-4 py-2 rounded">&larr; Back to Reports List</button>
                    <h3 className="text-2xl font-bold mb-2">Project Report: {project.name}</h3>
                    <p className="mb-2 text-gray-600 italic">{project.description}</p>
                    <p className="mb-4 text-gray-600">Anticipated Hours: {project.estimatedHours}</p>
                    <h4 className="text-xl font-semibold mb-2">Assigned Employees</h4>
                    {isReportLoading ? <p>Calculating hours...</p> : (
                        <>
                            <div className="space-y-2">
                                {assignedEmps.length > 0 ? assignedEmps.map(e => (
                                    <div key={e.id} className="bg-gray-100 p-3 rounded flex justify-between">
                                        <span>{e.firstName} {e.lastName}</span>
                                        <span className="font-semibold">{(reportData?.employeeHours[e.id] || 0).toFixed(2)} hrs</span>
                                    </div>
                                )) : <p>No employees assigned.</p>}
                            </div>
                            <div className="mt-4 text-right font-bold text-lg">
                                <p>Total Hours Worked: {(reportData?.totalHours || 0).toFixed(2)}</p>
                            </div>
                        </>
                    )}
                </div>
            )
        }
        if (selectedReport.type === 'employee') {
            // This part can be enhanced similarly if needed
            const employee = selectedReport.data;
            const assignedProjs = projects.filter(p => p.assignedEmployees?.includes(employee.id));
            return (
                <div>
                    <button onClick={() => setSelectedReport(null)} className="mb-4 bg-gray-200 px-4 py-2 rounded">&larr; Back to Reports List</button>
                    <h3 className="text-2xl font-bold mb-2">Employee Report: {employee.firstName} {employee.lastName}</h3>
                    <p className="mb-1 text-gray-600">ID: {employee.employeeId}</p>
                    <p className="mb-1 text-gray-600">Email: {employee.email}</p>
                    <p className="mb-4 text-gray-600">Username: {employee.username}</p>
                    <h4 className="text-xl font-semibold mb-2">Currently Assigned Projects</h4>
                    <div className="space-y-2">
                        {assignedProjs.length > 0 ? assignedProjs.map(p => (
                            <div key={p.id} className="bg-gray-100 p-3 rounded flex justify-between">
                                <span>{p.name}</span>
                                <span className="text-gray-500">Hours spent: N/A</span>
                            </div>
                        )) : <p>Not assigned to any projects.</p>}
                    </div>
                </div>
            )
        }
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Generate Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">By Project</h3>
                    <div className="space-y-2">
                       {projects.map(p => (
                            <div key={p.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                               <span>{p.name}</span>
                               <button onClick={() => setSelectedReport({ type: 'project', data: p })} className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600">Generate</button>
                            </div>
                       ))}
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold mb-4">By Employee</h3>
                    <div className="space-y-2">
                       {employees.map(e => (
                            <div key={e.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                               <span>{e.firstName} {e.lastName}</span>
                               <button onClick={() => setSelectedReport({ type: 'employee', data: e })} className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600">Generate</button>
                            </div>
                       ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChangePassword = ({ db, employee }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (employee.password !== currentPassword) {
            showFeedback('Current password is incorrect.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showFeedback('New passwords do not match.', 'error');
            return;
        }
        // RULE: Passwords must have a minimum of six characters, at least one 
        // Uppercase letter, one lowercase letter, and one number.
        if (newPassword.length < 6) {
            showFeedback('Password must be at least 6 characters.', 'error');
            return;
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
            showFeedback('Password must contain an uppercase letter, a lowercase letter, and a number.', 'error');
            return;
        }

        try {
            const employeeRef = doc(db, `/artifacts/${appId}/public/data/employees`, employee.id);
            await updateDoc(employeeRef, { password: newPassword });
            showFeedback('Password updated successfully!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error("Error updating password:", error);
            showFeedback('Failed to update password.', 'error');
        }
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Change Password</h2>
            {feedback.message && (
                 <div className={`p-4 mb-4 rounded-lg text-white ${feedback.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg shadow">
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 rounded border" required />
                    <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 rounded border" required />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 rounded border" required />
                    <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Update Password</button>
                </form>
            </div>
        </div>
    );
};

const MyTimesheet = ({ db, employee }) => {
    const [timeEntries, setTimeEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const timeEntriesCollectionPath = `/artifacts/${appId}/public/data/timeEntries`;
    const projectsCollectionPath = `/artifacts/${appId}/public/data/projects`;

    useEffect(() => {
        if (!db || !employee) return;
        setIsLoading(true);

        // Fetch all projects to map IDs to names
        const unsubProjects = onSnapshot(collection(db, projectsCollectionPath), (snapshot) => {
            const projectsData = {};
            snapshot.forEach(doc => {
                projectsData[doc.id] = doc.data().name;
            });
            setProjects(projectsData);
        });
        
        // Fetch employee's time entries
        const q = query(
            collection(db, timeEntriesCollectionPath),
            where("employeeId", "==", employee.id),
            where("status", "==", "clocked-out"),
            orderBy("clockInTime", "desc")
        );
        
        const unsubTimeEntries = onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setTimeEntries(entries);
            setIsLoading(false);
        });

        return () => {
            unsubProjects();
            unsubTimeEntries();
        };

    }, [db, employee]);

    const calculateHours = (entry) => {
        if (!entry.clockOutTime || !entry.clockInTime) return 0;
        const diffSeconds = entry.clockOutTime.seconds - entry.clockInTime.seconds;
        return (diffSeconds / 3600).toFixed(2);
    };
    
    const groupedEntries = timeEntries.reduce((acc, entry) => {
        const projectName = projects[entry.projectId] || 'Unknown Project';
        if (!acc[projectName]) {
            acc[projectName] = [];
        }
        acc[projectName].push(entry);
        return acc;
    }, {});


    if (isLoading) {
        return <div>Loading your timesheet...</div>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">My Timesheet</h2>
            {Object.keys(groupedEntries).length === 0 ? (
                <p>You have no completed time entries.</p>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedEntries).map(([projectName, entries]) => (
                        <div key={projectName} className="bg-gray-50 p-4 rounded-lg shadow">
                            <h3 className="text-xl font-bold mb-3">{projectName}</h3>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Hours Worked</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="border-b last:border-b-0">
                                            <td className="p-2">{new Date(entry.clockInTime.seconds * 1000).toLocaleDateString()}</td>
                                            <td className="p-2">{calculateHours(entry)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// RULE: Any action that removes an entry from the database must be preceded by a dialog to confirm with the user.
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

