package com.timetracker.firebasebackend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.timetracker.firebasebackend.model.LoginCredentials;
import com.timetracker.firebasebackend.model.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ExecutionException;

@Service
public class LoginCredentialsService {

    @Autowired
    private Firestore firestore;

    @Lazy
    @Autowired
    private EmployeeService employeeService;

    @Value("${firebase.collection.loginCredentials}")
    private String loginCredentialsCollection;
    
    @Value("${firebase.collection.employees}")
    private String employeesCollection;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Create login credentials for an employee
    public LoginCredentials createLoginCredentials(String username, String password, String employeeId, String userType) {
        try {
            // Check if username already exists
            Query existingQuery = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials")
                .whereEqualTo("username", username.toLowerCase())
                .whereEqualTo("isActive", true);
                
            QuerySnapshot existing = existingQuery.get().get();
            
            if (!existing.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Username already exists");
            }

            // Create new login credentials
            String hashedPassword = passwordEncoder.encode(password);
            LoginCredentials credentials = new LoginCredentials(username.toLowerCase(), hashedPassword, userType, employeeId);
            
            DocumentReference docRef = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials").document();
            credentials.setId(docRef.getId());
            
            docRef.set(credentials).get();
            
            return credentials;
            
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to create login credentials", e);
        }
    }

    // Authenticate user and return employee data if valid
    public Employee authenticateAndGetEmployee(String username, String password) {
        try {
            Query query = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials")
                .whereEqualTo("username", username.toLowerCase())
                .whereEqualTo("isActive", true)
                .limit(1);
                
            QuerySnapshot snapshot = query.get().get();
            
            if (snapshot.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
            }

            DocumentSnapshot doc = snapshot.getDocuments().get(0);
            LoginCredentials credentials = doc.toObject(LoginCredentials.class);
            
            if (credentials == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
            }

            // Verify password
            if (credentials.getPassword() != null && !passwordEncoder.matches(password, credentials.getPassword())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
            }

            // Check if it's manager login
            if ("manager".equals(credentials.getUserType())) {
                // Return a special manager employee object
                Employee manager = new Employee();
                manager.setEmployeeId("MANAGER001");
                manager.setFirstName("System");
                manager.setLastName("Manager");
                manager.setEmail(username);
                manager.setStatus("active");
                return manager;
            }

            // Get employee data
            Employee employee = employeeService.getEmployeeById(credentials.getEmployeeId());
            if (employee == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found");
            }

            if (!"active".equals(employee.getStatus())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Employee account is inactive");
            }

            return employee;
            
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Authentication failed", e);
        }
    }

    // Update password
    public void updatePassword(String employeeId, String newPassword) {
        try {
            Query query = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials")
                .whereEqualTo("employeeId", employeeId)
                .whereEqualTo("isActive", true);
                
            QuerySnapshot snapshot = query.get().get();
            
            if (!snapshot.isEmpty()) {
                DocumentSnapshot doc = snapshot.getDocuments().get(0);
                LoginCredentials credentials = doc.toObject(LoginCredentials.class);
                if (credentials != null) {
                    credentials.setPassword(passwordEncoder.encode(newPassword));
                    doc.getReference().set(credentials).get();
                }
            }
            
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to update password", e);
        }
    }

    // Deactivate login credentials
    public void deactivateCredentials(String employeeId) {
        try {
            Query query = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials")
                .whereEqualTo("employeeId", employeeId);
                
            QuerySnapshot snapshot = query.get().get();
            
            for (DocumentSnapshot doc : snapshot.getDocuments()) {
                LoginCredentials credentials = doc.toObject(LoginCredentials.class);
                if (credentials != null) {
                    credentials.setActive(false);
                    doc.getReference().set(credentials).get();
                }
            }
            
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to deactivate credentials", e);
        }
    }
}