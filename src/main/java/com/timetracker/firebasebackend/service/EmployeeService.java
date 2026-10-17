package com.timetracker.firebasebackend.service;

import com.google.cloud.firestore.*;
import com.timetracker.firebasebackend.dto.PasswordResetResponse;
import com.timetracker.firebasebackend.model.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.security.SecureRandom;

@Service
public class EmployeeService {

    @Autowired
    private Firestore firestore;

    @Value("${firebase.collection.employees}")
    private String employeesCollection;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";
    private static final String ALL = UPPER + LOWER + DIGITS + SYMBOLS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateRandomPassword() {
        int length = 12;
        StringBuilder sb = new StringBuilder(length);
        // Ensure at least one of each category
        sb.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        sb.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        sb.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        sb.append(SYMBOLS.charAt(RANDOM.nextInt(SYMBOLS.length())));
        for (int i = 4; i < length; i++) {
            sb.append(ALL.charAt(RANDOM.nextInt(ALL.length())));
        }
        return sb.toString();
    }

    private String generateUniqueUsername(String base) throws ExecutionException, InterruptedException {
        String candidate = base;
        int counter = 1;
        CollectionReference col = firestore.collection(employeesCollection != null ? employeesCollection : "employees");
        while (true) {
            QuerySnapshot snapshot = col.whereEqualTo("username", candidate).limit(1).get().get();
            if (snapshot.isEmpty()) return candidate;
            candidate = base + counter;
            counter++;
            if (counter > 1000) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate unique username. Please try again.");
            }
        }
    }

    public List<Employee> getAllEmployees() {
        try {
            QuerySnapshot querySnapshot = firestore.collection(employeesCollection != null ? employeesCollection : "employees").get().get();
            List<Employee> employees = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Employee employee = document.toObject(Employee.class);
                employee.setId(document.getId());
                employee.setPassword(null); // never expose password
                employees.add(employee);
            }
            return employees;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve employee data from Firebase.", e);
        }
    }

    public Employee findEmployeeByUsernameAndPassword(String username, String password) {
        try {
            Query query = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("username", username.toLowerCase())
                    .limit(1);

            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) return null;

            QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
            Employee employee = document.toObject(Employee.class);
            employee.setId(document.getId());

            if (employee.getPassword() != null && passwordEncoder.matches(password, employee.getPassword())) {
                employee.setPassword(null);
                return employee;
            } else {
                return null;
            }

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Login process failed due to database error.", e);
        }
    }

    // Fallback auth: find by email + password
    public Employee findEmployeeByEmailAndPassword(String email, String password) {
        try {
            Query query = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("email", email.toLowerCase())
                    .limit(1);

            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) return null;

            QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
            Employee employee = document.toObject(Employee.class);
            employee.setId(document.getId());

            if (employee.getPassword() != null && passwordEncoder.matches(password, employee.getPassword())) {
                employee.setPassword(null);
                return employee;
            } else {
                return null;
            }

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Login process failed due to database error.", e);
        }
    }

    public Employee addEmployee(Employee employee) {
        try {
            System.out.println("\n========== BACKEND: EMPLOYEE CREATION START ==========");
            System.out.println("→ Received request to create employee: " + employee.getFirstName() + " " + employee.getLastName());
            
            // Required fields
            if (employee.getEmail() == null || employee.getEmail().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
            }
            // Normalize inputs
            employee.setEmail(employee.getEmail().toLowerCase());
            if (employee.getEmployeeId() != null) {
                employee.setEmployeeId(employee.getEmployeeId().trim());
            }
            
            // Auto-fill missing fields with defaults
            if (employee.getLastName() == null || employee.getLastName().isBlank()) {
                if (employee.getFirstName() != null && !employee.getFirstName().isBlank()) {
                    employee.setLastName(employee.getFirstName());
                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either first name or last name is required");
                }
            }
            if (employee.getYearOfJoining() == null || employee.getYearOfJoining().isBlank()) {
                employee.setYearOfJoining(String.valueOf(java.time.Year.now().getValue()));
            }
            if (employee.getYearOfJoining().length() < 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Year of joining must be at least 2 characters (e.g., 2021)");
            }
            
        System.out.println("✓ Validation passed");

        // Deduplication: if the employee already exists, either return 409 (if registered)
        // or upgrade the existing pending record with a temp password (no duplicate docs)
        QueryDocumentSnapshot existingDoc = null;
        if (employee.getEmployeeId() != null && !employee.getEmployeeId().isBlank()) {
        QuerySnapshot byEmpId = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
            .whereEqualTo("employeeId", employee.getEmployeeId())
            .limit(1)
            .get().get();
        if (!byEmpId.isEmpty()) existingDoc = byEmpId.getDocuments().get(0);
        }
        if (existingDoc == null && employee.getEmail() != null && !employee.getEmail().isBlank()) {
        QuerySnapshot byEmail = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
            .whereEqualTo("email", employee.getEmail())
            .limit(1)
            .get().get();
        if (!byEmail.isEmpty()) existingDoc = byEmail.getDocuments().get(0);
        }

        if (existingDoc != null) {
        Employee existing = existingDoc.toObject(Employee.class);
        String existingPassword = existing.getPassword();
        boolean alreadyRegistered = existingPassword != null && !existingPassword.isEmpty();
        if (alreadyRegistered || "active".equalsIgnoreCase(existing.getStatus())) {
            System.out.println("⚠ Duplicate invite for active/registered employee: " + existing.getEmployeeId());
            
            // Provide clear error message about which field caused the conflict
            String conflictReason = "";
            if (employee.getEmployeeId() != null && employee.getEmployeeId().equals(existing.getEmployeeId())) {
                conflictReason = "Employee ID '" + existing.getEmployeeId() + "' is already registered.";
            } else if (employee.getEmail() != null && employee.getEmail().equalsIgnoreCase(existing.getEmail())) {
                conflictReason = "Email '" + existing.getEmail() + "' is already registered to employee '" + 
                    existing.getFirstName() + " " + existing.getLastName() + "' (ID: " + existing.getEmployeeId() + ").";
            } else {
                conflictReason = "Employee already registered.";
            }
            
            throw new ResponseStatusException(HttpStatus.CONFLICT, conflictReason);
        }

        // Upgrade pending/invited record: set username if missing, set temp password, activate
        String lastTwo = (employee.getYearOfJoining() != null ? employee.getYearOfJoining()
            : (existing.getYearOfJoining() != null ? existing.getYearOfJoining() : String.valueOf(java.time.Year.now().getValue())));
        if (lastTwo.length() >= 2) lastTwo = lastTwo.substring(lastTwo.length() - 2);

        String baseUsername = (employee.getLastName() != null && !employee.getLastName().isBlank() ? employee.getLastName()
            : (existing.getLastName() != null ? existing.getLastName() : existing.getFirstName()))
            .toLowerCase() + lastTwo;
        String username = (existing.getUsername() != null && !existing.getUsername().isBlank())
            ? existing.getUsername()
            : generateUniqueUsername(baseUsername);

        final String tempPassword = generateRandomPassword();
        final String hashed = passwordEncoder.encode(tempPassword);

        Map<String, Object> updates = new java.util.HashMap<>();
        updates.put("username", username);
        updates.put("password", hashed);
        updates.put("status", "active");
        updates.put("requiresPasswordChange", true);
        if (existing.getEmail() == null && employee.getEmail() != null) updates.put("email", employee.getEmail());
        if (existing.getEmployeeId() == null && employee.getEmployeeId() != null) updates.put("employeeId", employee.getEmployeeId());
        if (employee.getFirstName() != null && !employee.getFirstName().isBlank()) updates.put("firstName", employee.getFirstName());
        if (employee.getLastName() != null && !employee.getLastName().isBlank()) updates.put("lastName", employee.getLastName());

        System.out.println("→ Updating existing pending employee (no duplicate document). DocId=" + existingDoc.getId());
        existingDoc.getReference().update(updates).get();

        // Return the same structure as for a newly created employee, but with plain temp password
        existing.setId(existingDoc.getId());
        existing.setUsername(username);
        existing.setPassword(tempPassword); // plain for response
        existing.setStatus("active");
        return existing;
        }
            
            String lastTwo = employee.getYearOfJoining().substring(employee.getYearOfJoining().length() - 2);
            String baseUsername = employee.getLastName().toLowerCase() + lastTwo;
            String username = generateUniqueUsername(baseUsername);

            employee.setUsername(username);
            employee.setCreatedAt(new Date());
            // email already normalized above

            // Generate a temporary password, hash it, and mark for first-time change
            final String tempPassword = generateRandomPassword();
            System.out.println("✓ Generated temporary password: " + tempPassword);
            
            final String hashed = passwordEncoder.encode(tempPassword);
            System.out.println("✓ Password hashed with BCrypt (length: " + hashed.length() + " chars)");
            
            employee.setPassword(hashed);
            employee.setRequiresPasswordChange(true);
            employee.setStatus("active");
            System.out.println("✓ Employee data prepared for database");

            System.out.println("→ Calling Firebase Firestore API...");
            DocumentReference docRef = firestore.collection(employeesCollection != null ? employeesCollection : "employees").add(employee).get();
            System.out.println("✓ Firebase write successful!");
            
            employee.setId(docRef.getId());
            System.out.println("✓ Document created with ID: " + docRef.getId());
            
            // Store both the employee ID and temp password in the response
            // so the controller can create login credentials
            employee.setPassword(tempPassword); // Plain text for response
            employee.setEmployeeId(employee.getEmployeeId()); // Ensure employeeId is set

            // Send credentials email (best-effort; failures should not block creation)
            try {
                String fullName = (employee.getFirstName() == null ? "" : employee.getFirstName()) +
                        (employee.getLastName() == null ? "" : (" " + employee.getLastName()));
                emailService.sendCredentials(employee.getEmail(), fullName.trim().isEmpty() ? null : fullName.trim(), username, tempPassword);
                System.out.println("✓ Credentials email sent to: " + employee.getEmail());
            } catch (Exception mailEx) {
                // Log in real app; for now, ignore to not fail the API
                System.out.println("⚠ Email sending failed (non-critical): " + mailEx.getMessage());
            }
            
            System.out.println("========== BACKEND: EMPLOYEE CREATION END ==========\n");
            return employee;

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to invite new employee.", e);
        }
    }

    public Employee completeSignUp(String employeeId, String email, String fullName, String newPassword) {
        try {
            Query query = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("email", email.toLowerCase())
                    .limit(1);

            QuerySnapshot querySnapshot = query.get().get();
            if (querySnapshot.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found with the provided details.");
            }

            QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
            Employee employee = document.toObject(Employee.class);
            
            // Verify full name matches (optional check; skip if fullName null or blank to allow flexible signup)
            if (fullName != null && !fullName.isBlank()) {
                String registeredFullName = (employee.getFirstName() + " " + employee.getLastName()).toLowerCase().trim();
                String providedFullName = fullName.toLowerCase().trim();
                if (!registeredFullName.equals(providedFullName)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The name entered does not match the details provided by your manager.");
                }
            }
            
            // Check if already has password (already signed up)
            if (employee.getPassword() != null && !employee.getPassword().isEmpty()) {
                // Use 409 Conflict to clearly indicate the account is already registered
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This account has already been activated. Please use the login page.");
            }

            DocumentReference docRef = document.getReference();
            String hashed = passwordEncoder.encode(newPassword);
            Map<String, Object> updates = new java.util.HashMap<>();
            updates.put("password", hashed);
            updates.put("status", "active");
            updates.put("requiresPasswordChange", false);
            docRef.update(updates).get();

            employee.setId(document.getId());
            employee.setStatus("active");
            employee.setPassword(null);
            return employee;

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to complete registration.", e);
        }
    }

    // Dev helper: create a pending employee record with no password so signup can be tested
    public Employee createPendingSignupRecord(String employeeId, String email, String fullName) {
        try {
            if (employeeId == null || employeeId.isBlank() || email == null || email.isBlank() || fullName == null || fullName.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId, email, and fullName are required");
            }

            String emailLc = email.toLowerCase();

            // If a record already exists for this employeeId+email, return conflict if password already set
            QuerySnapshot existing = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("email", emailLc)
                    .limit(1)
                    .get().get();
            if (!existing.isEmpty()) {
                QueryDocumentSnapshot doc = existing.getDocuments().get(0);
                String passwordValue = doc.getString("password");
                Boolean hasPassword = doc.contains("password") && passwordValue != null && !passwordValue.isEmpty();
                if (hasPassword) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Account already activated. Use login instead.");
                }
                // Already pending → return current as object
                Employee e = doc.toObject(Employee.class);
                e.setId(doc.getId());
                e.setPassword(null);
                return e;
            }

            String firstName;
            String lastName;
            String[] parts = fullName.trim().split("\\s+", 2);
            firstName = parts[0];
            lastName = parts.length > 1 ? parts[1] : parts[0];

            Employee e = new Employee();
            e.setEmployeeId(employeeId);
            e.setFirstName(firstName);
            e.setLastName(lastName);
            e.setEmail(emailLc);
            e.setStatus("pending");
            e.setRequiresPasswordChange(false);
            e.setCreatedAt(new Date());

            DocumentReference ref = firestore.collection(employeesCollection != null ? employeesCollection : "employees").add(e).get();
            e.setId(ref.getId());
            e.setPassword(null);
            return e;
        } catch (InterruptedException | ExecutionException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create pending signup record.", ex);
        }
    }

    public void changePassword(String employeeIdentifier, String currentPassword, String newPassword) {
        try {
            System.out.println("\n========== CHANGE PASSWORD REQUEST ==========");
            System.out.println("Identifier: " + employeeIdentifier);
            System.out.println("Current password provided: " + (currentPassword != null ? "[PRESENT]" : "[NULL]"));
            System.out.println("New password provided: " + (newPassword != null ? "[PRESENT]" : "[NULL]"));
            
            // Try as document ID first
            DocumentReference docRef = firestore.collection(employeesCollection != null ? employeesCollection : "employees").document(employeeIdentifier != null ? employeeIdentifier : "");
            DocumentSnapshot snapshot = docRef.get().get();
            
            // If not found, try as employeeId field
            if (!snapshot.exists()) {
                System.out.println("Not found by document ID, trying employeeId field...");
                QuerySnapshot querySnapshot = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                        .whereEqualTo("employeeId", employeeIdentifier)
                        .limit(1)
                        .get().get();
                        
                if (querySnapshot.isEmpty()) {
                    System.out.println("ERROR: Employee not found with identifier: " + employeeIdentifier);
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found");
                }
                
                snapshot = querySnapshot.getDocuments().get(0);
                docRef = snapshot.getReference();
                System.out.println("Found by employeeId, document ID: " + snapshot.getId());
            } else {
                System.out.println("Found by document ID: " + employeeIdentifier);
            }
            
            String storedHash = snapshot.getString("password");
            System.out.println("Stored hash present: " + (storedHash != null));
            
            if (storedHash == null) {
                System.out.println("ERROR: No password hash stored in database for this employee");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No password set for this account. Please contact your manager.");
            }
            
            boolean passwordMatches = passwordEncoder.matches(currentPassword, storedHash);
            System.out.println("Password matches: " + passwordMatches);
            
            if (!passwordMatches) {
                System.out.println("ERROR: Current password is incorrect");
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
            }

            String hashed = passwordEncoder.encode(newPassword);
            Map<String, Object> pwdUpdate = new java.util.HashMap<>();
            pwdUpdate.put("password", hashed);
            pwdUpdate.put("requiresPasswordChange", false);
            docRef.update(pwdUpdate).get();
            
            System.out.println("SUCCESS: Password updated successfully");
            System.out.println("========== CHANGE PASSWORD COMPLETE ==========\n");
        } catch (InterruptedException | ExecutionException e) {
            System.out.println("ERROR: Exception during password change: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update password.", e);
        } catch (ResponseStatusException e) {
            // Re-throw our own exceptions
            throw e;
        }
    }

    public PasswordResetResponse resetPassword(String employeeId, String email, String fullName) {
        try {
            Query query = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("email", email.toLowerCase())
                    .limit(1);

            QuerySnapshot snapshot = query.get().get();
            if (snapshot.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No matching employee record found.");
            }

            QueryDocumentSnapshot document = snapshot.getDocuments().get(0);
            Employee employee = document.toObject(Employee.class);
            String registeredFullName = (employee.getFirstName() + " " + employee.getLastName()).toLowerCase();
            if (!registeredFullName.equals(fullName.toLowerCase())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The name entered does not match the employee record.");
            }

            DocumentReference docRef = document.getReference();
            final String newPassword = generateRandomPassword();
            final String hashed = passwordEncoder.encode(newPassword);

            firestore.runTransaction(transaction -> {
                Map<String, Object> resetUpdate = new java.util.HashMap<>();
                resetUpdate.put("password", hashed);
                resetUpdate.put("requiresPasswordChange", true);
                transaction.update(docRef, resetUpdate);
                return null;
            }).get();

            return new PasswordResetResponse(newPassword);

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to reset password.", e);
        }
    }

    public void deactivateEmployee(String employeeIdentifier) {
        try {
            // First try as document ID
            DocumentReference docRef = firestore.collection(employeesCollection != null ? employeesCollection : "employees").document(employeeIdentifier != null ? employeeIdentifier : "");
            DocumentSnapshot snapshot = docRef.get().get();
            
            if (snapshot.exists()) {
                // It's a document ID
                docRef.update("status", "inactive").get();
                // Also deactivate login credentials (best-effort)
                try {
                    String empIdField = snapshot.getString("employeeId");
                    if (empIdField != null && !empIdField.isBlank()) {
                        // Lazy lookup via LoginCredentialsService not available here; duplicate small logic
                        QuerySnapshot creds = firestore.collection("loginCredentials")
                                .whereEqualTo("employeeId", empIdField)
                                .get().get();
                        for (DocumentSnapshot c : creds.getDocuments()) {
                            c.getReference().update("isActive", false).get();
                        }
                    }
                } catch (Exception ignore) {}
                return;
            }
            
            // If not found, try as employeeId
            QuerySnapshot querySnapshot = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("employeeId", employeeIdentifier)
                    .limit(1)
                    .get().get();
                    
            if (querySnapshot.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found with ID: " + employeeIdentifier);
            }
            
            QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
            document.getReference().update("status", "inactive").get();
            // Best-effort credentials deactivation
            try {
                String empIdField = document.getString("employeeId");
                if (empIdField != null && !empIdField.isBlank()) {
                    QuerySnapshot creds = firestore.collection("loginCredentials")
                            .whereEqualTo("employeeId", empIdField)
                            .get().get();
                    for (DocumentSnapshot c : creds.getDocuments()) {
                        c.getReference().update("isActive", false).get();
                    }
                }
            } catch (Exception ignore) {}
            
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to deactivate employee.", e);
        }
    }

    // Lookup employee by stored Firebase UID (assumes employee documents include a 'firebaseUid' field)
    public Employee getEmployeeByFirebaseUid(String firebaseUid) {
        try {
            Query query = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("firebaseUid", firebaseUid)
                    .limit(1);

            QuerySnapshot snapshot = query.get().get();
            if (snapshot.isEmpty()) return null;

            QueryDocumentSnapshot document = snapshot.getDocuments().get(0);
            Employee employee = document.toObject(Employee.class);
            employee.setId(document.getId());
            employee.setPassword(null);
            return employee;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to lookup employee by firebase UID.", e);
        }
    }

    // Get employee by employeeId field (not document ID)
    public Employee getEmployeeById(String employeeId) {
        try {
            QuerySnapshot querySnapshot = firestore.collection(employeesCollection != null ? employeesCollection : "employees")
                    .whereEqualTo("employeeId", employeeId)
                    .limit(1)
                    .get().get();
                    
            if (querySnapshot.isEmpty()) {
                return null;
            }
            
            QueryDocumentSnapshot document = querySnapshot.getDocuments().get(0);
            Employee employee = document.toObject(Employee.class);
            employee.setId(document.getId());
            employee.setPassword(null); // Don't return password
            return employee;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get employee by ID.", e);
        }
    }

}