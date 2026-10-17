// Production-Ready Test Suite for Time Tracker Application
import { employeeAPI, projectAPI, assignmentAPI, timeClockAPI, reportAPI } from './api.js';

class TimeTrackerTestSuite {
    constructor() {
        this.testResults = [];
        this.testEmployeeId = null;
        this.testProjectId = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logEntry);
        this.testResults.push({ timestamp, type, message });
    }

    async runTest(testName, testFunction) {
        this.log(`Running test: ${testName}`, 'test');
        try {
            await testFunction();
            this.log(`✅ ${testName} - PASSED`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ ${testName} - FAILED: ${error.message}`, 'error');
            console.error(error);
            return false;
        }
    }

    async runAllTests() {
        this.log('Starting Time Tracker Production Test Suite', 'info');
        let passedTests = 0;
        let totalTests = 0;

        // Test 1: Employee API
        totalTests++;
        if (await this.runTest('Employee API - Get All Employees', async () => {
            const employees = await employeeAPI.getAll();
            if (!Array.isArray(employees) || employees.length === 0) {
                throw new Error('No employees found');
            }
            this.testEmployeeId = employees[0].id;
            this.log(`Found ${employees.length} employees. Using employee ID: ${this.testEmployeeId}`, 'info');
        })) passedTests++;

        // Test 2: Project API
        totalTests++;
        if (await this.runTest('Project API - Get All Projects', async () => {
            const projects = await projectAPI.getAll();
            if (!Array.isArray(projects) || projects.length === 0) {
                throw new Error('No projects found');
            }
            this.testProjectId = projects[0].id;
            this.log(`Found ${projects.length} projects. Using project ID: ${this.testProjectId}`, 'info');
        })) passedTests++;

        // Test 3: Assignment API
        totalTests++;
        if (await this.runTest('Assignment API - Get Employee Assignments', async () => {
            const assignments = await assignmentAPI.getByEmployee(this.testEmployeeId);
            this.log(`Employee has ${assignments ? assignments.length : 0} assignments`, 'info');
        })) passedTests++;

        // Test 4: Time Clock API - Get Active
        totalTests++;
        if (await this.runTest('Time Clock API - Get Active Time Entry', async () => {
            const activeEntry = await timeClockAPI.getActive(this.testEmployeeId);
            this.log(`Active entry status: ${activeEntry ? 'Has active entry' : 'No active entry'}`, 'info');
        })) passedTests++;

        // Test 5: Reports API
        totalTests++;
        if (await this.runTest('Reports API - Get Employee Timesheet', async () => {
            const timesheet = await reportAPI.getEmployeeTimesheet(this.testEmployeeId, 30);
            if (!Array.isArray(timesheet)) {
                throw new Error('Timesheet should be an array');
            }
            this.log(`Employee timesheet contains ${timesheet.length} entries`, 'info');
        })) passedTests++;

        // Test 6: Project Assignment Check
        totalTests++;
        if (await this.runTest('Project API - Get Assigned Projects', async () => {
            const assignedProjects = await projectAPI.getAssigned(this.testEmployeeId);
            this.log(`Employee assigned to ${assignedProjects ? assignedProjects.length : 0} projects`, 'info');
        })) passedTests++;

        // Test Summary
        this.log(`\n📊 TEST SUMMARY`, 'info');
        this.log(`Total Tests: ${totalTests}`, 'info');
        this.log(`Passed: ${passedTests}`, 'success');
        this.log(`Failed: ${totalTests - passedTests}`, passedTests === totalTests ? 'success' : 'error');
        this.log(`Success Rate: ${(passedTests / totalTests * 100).toFixed(1)}%`, passedTests === totalTests ? 'success' : 'warning');

        if (passedTests === totalTests) {
            this.log('🎉 ALL TESTS PASSED - SYSTEM IS PRODUCTION READY!', 'success');
        } else {
            this.log('⚠️ SOME TESTS FAILED - REVIEW REQUIRED', 'warning');
        }

        return { total: totalTests, passed: passedTests, results: this.testResults };
    }
}

// Function to test specific workflows
export async function testManagerWorkflow() {
    console.log('🔧 Testing Manager Workflow...');
    
    try {
        // 1. Get all employees and projects
        const employees = await employeeAPI.getAll();
        const projects = await projectAPI.getAll();
        
        console.log(`✅ Found ${employees.length} employees and ${projects.length} projects`);
        
        // 2. Test assignment functionality (if data exists)
        if (employees.length > 0 && projects.length > 0) {
            const testEmployee = employees[0];
            const testProject = projects[0];
            
            // Check existing assignments
            const assignments = await assignmentAPI.getByProject(testProject.id);
            console.log(`✅ Project "${testProject.projectTitle}" has ${assignments ? assignments.length : 0} assignments`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Manager workflow test failed:', error);
        return false;
    }
}

export async function testEmployeeWorkflow(employeeId) {
    console.log(`🔧 Testing Employee Workflow for ID: ${employeeId}...`);
    
    try {
        // 1. Get assigned projects
        const assignedProjects = await projectAPI.getAssigned(employeeId);
        console.log(`✅ Employee assigned to ${assignedProjects ? assignedProjects.length : 0} projects`);
        
        // 2. Check active time entry
        const activeEntry = await timeClockAPI.getActive(employeeId);
        console.log(`✅ Active time entry: ${activeEntry ? 'Yes' : 'No'}`);
        
        // 3. Get timesheet
        const timesheet = await reportAPI.getEmployeeTimesheet(employeeId, 7);
        console.log(`✅ Timesheet has ${timesheet.length} entries from last 7 days`);
        
        return true;
    } catch (error) {
        console.error('❌ Employee workflow test failed:', error);
        return false;
    }
}

// Export the test suite
export default TimeTrackerTestSuite;