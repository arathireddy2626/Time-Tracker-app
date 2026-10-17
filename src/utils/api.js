// Centralized API configuration for production-ready application
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api/v1';

// API utility functions for consistent error handling and request management
class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
            }
            
            // Check if response has content
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams(params);
        const queryString = searchParams.toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(fullEndpoint, {
            method: 'GET',
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export specific API functions for each domain
export const employeeAPI = {
    login: (credentials) => apiClient.post('/employees/login', credentials),
    register: (employeeData) => apiClient.post('/employees/register', employeeData),
    getAll: () => apiClient.get('/employees'),
    getById: (id) => apiClient.get(`/employees/${id}`),
    update: (id, data) => apiClient.put(`/employees/${id}`, data),
    delete: (id) => apiClient.delete(`/employees/${id}`),
    changePassword: (data) => apiClient.post('/employees/change-password', data),
    forgotPassword: (email) => apiClient.post('/employees/forgot-password', { email }),
};

export const projectAPI = {
    getAll: () => apiClient.get('/projects'),
    getById: (id) => apiClient.get(`/projects/${id}`),
    create: (projectData) => apiClient.post('/projects', projectData),
    update: (id, data) => apiClient.put(`/projects/${id}`, data),
    delete: (id) => apiClient.delete(`/projects/${id}`),
    getAssigned: (employeeId) => apiClient.get(`/projects/assigned`, { employeeId }),
};

export const assignmentAPI = {
    assign: (assignmentData) => apiClient.post('/assignments', assignmentData),
    unassign: (projectId, employeeId) => apiClient.delete(`/assignments/${projectId}/${employeeId}`),
    getByProject: (projectId) => apiClient.get(`/assignments/project/${projectId}`),
    getByEmployee: (employeeId) => apiClient.get(`/assignments/employee/${employeeId}`),
};

export const timeClockAPI = {
    clockIn: (data) => apiClient.post('/clock/in', data),
    clockOut: (data) => apiClient.post('/clock/out', data),
    getActive: (employeeId) => apiClient.get(`/clock/active/${employeeId}`),
    getHoursWorked: (employeeId, days = 7) => apiClient.get(`/clock/hours-worked`, { employeeId, days }),
    getRecent: (employeeId, limit = 5) => apiClient.get(`/clock/recent`, { employeeId, limit }),
};

export const reportAPI = {
    getEmployeeTimesheet: (employeeId, days = 30) => apiClient.get(`/reports/timesheet/${employeeId}`, { days }),
    getProjectReport: (projectId) => apiClient.get(`/reports/projects/${projectId}`),
    getEmployeeReport: (employeeId) => apiClient.get(`/reports/employees/${employeeId}`),
};

// Export the base API client for custom requests
export default apiClient;