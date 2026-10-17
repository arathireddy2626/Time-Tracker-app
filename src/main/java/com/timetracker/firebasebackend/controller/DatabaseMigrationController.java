package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.service.DataMigrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/migration")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
}) 
public class DatabaseMigrationController {

    @Autowired
    private DataMigrationService dataMigrationService;

    // Create the 6-table structure
    @PostMapping("/create-6-table-structure")
    public ResponseEntity<Map<String, Object>> create6TableStructure() {
        return ResponseEntity.ok(dataMigrationService.create6TableStructure());
    }

    // Migrate employee passwords to loginCredentials
    @PostMapping("/migrate-passwords")
    public ResponseEntity<Map<String, Object>> migratePasswords() {
        return ResponseEntity.ok(dataMigrationService.migratePasswordsToLoginCredentials());
    }

    // Migrate project assignments to projectEmployees
    @PostMapping("/migrate-assignments")
    public ResponseEntity<Map<String, Object>> migrateAssignments() {
        return ResponseEntity.ok(dataMigrationService.migrateProjectAssignments());
    }

    // Clean up employee collection (remove passwords)
    @PostMapping("/cleanup-employees")
    public ResponseEntity<Map<String, Object>> cleanupEmployees() {
        return ResponseEntity.ok(dataMigrationService.removePasswordsFromEmployees());
    }

    // Full migration - all steps at once
    @PostMapping("/full-migration")
    public ResponseEntity<Map<String, Object>> fullMigration() {
        return ResponseEntity.ok(dataMigrationService.performFullMigration());
    }

    // Check current database status
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        return ResponseEntity.ok(dataMigrationService.getDatabaseStatus());
    }
}