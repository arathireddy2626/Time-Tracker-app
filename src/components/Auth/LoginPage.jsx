import React from 'react';

const LoginPage = ({ handleLogin, username, setUsername, password, setPassword, error, setAuthView, isSubmitting }) => (
  <>
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800">TimeTracker</h1>
      <p className="text-gray-500 mt-2">Welcome back! Please sign in.</p>
    </div>
    <form onSubmit={handleLogin}>
      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
      {/* Input fields for username and password remain the same */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">Username</label>
        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="Enter your username" />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="Enter your password" />
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-indigo-400">
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>
      <div className="text-center mt-4">
        {/* The "Forgot your password?" link remains as per professor's feedback [cite: 7] */}
        <button type="button" onClick={() => setAuthView('forgotPassword')} className="text-sm text-indigo-600 hover:underline">
          Forgot your password?
        </button>
      </div>
    </form>
  </>
);

export default LoginPage;