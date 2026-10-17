package com.timetracker.firebasebackend.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.timetracker.firebasebackend.model.ProjectAssignment;
import com.timetracker.firebasebackend.service.ProjectAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/assignments")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
})
public class ProjectAssignmentController {

    private final ProjectAssignmentService assignmentService;
    private final Firestore firestore;

    public ProjectAssignmentController(ProjectAssignmentService assignmentService, Firestore firestore) {
        this.assignmentService = assignmentService;
        this.firestore = firestore;
    }

    @PostMapping
    public ResponseEntity<ProjectAssignment> create(@RequestBody ProjectAssignment assignment) {
        ProjectAssignment created = assignmentService.createAssignment(assignment);
        return ResponseEntity.ok(created);
    }

    // Simple health check to verify Firestore connectivity and collections
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() throws Exception {
        QuerySnapshot employees = firestore.collection("employees").limit(1).get().get();
        boolean hasEmployees = !employees.isEmpty();
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "employeesCollectionReachable", hasEmployees
        ));
    }
}
