package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.model.Project;
import com.timetracker.firebasebackend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
})
public class ProjectController {

    private final ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<Project> getProjectById(@PathVariable String projectId) {
        Project project = projectService.getProjectById(projectId);
        return ResponseEntity.ok(project);
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        // NOTE: Frontend validation checks (name exists, hours > 250) must still be enforced
        if (project.getProjectTitle() == null || project.getAnticipatedHours() == null) {
            return ResponseEntity.badRequest().build();
        }
        Project createdProject = projectService.addProject(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProject);
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(@PathVariable String projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.noContent().build();
    }
    
    // Endpoint for assigning/deassigning employees (used by AssignEmployeeModal.jsx)
    @PutMapping("/{projectId}/assignments")
    public ResponseEntity<Void> updateAssignments(@PathVariable String projectId, @RequestBody List<String> employeeIds) {
        projectService.updateAssignedEmployees(projectId, employeeIds);
        return ResponseEntity.noContent().build();
    }

    // POST assign a single employee to a project (incremental add)
    public static class AssignRequest {
        public String projectId;
        public String employeeId;
    }

    @PostMapping("/assign")
    public ResponseEntity<Void> assignEmployee(@RequestBody AssignRequest request) {
        if (request.projectId == null || request.employeeId == null) {
            return ResponseEntity.badRequest().build();
        }
        projectService.assignEmployee(request.projectId, request.employeeId);
        return ResponseEntity.ok().build();
    }

    // DELETE remove a single employee from a project
    @DeleteMapping("/{projectId}/unassign/{employeeId}")
    public ResponseEntity<Void> unassignEmployee(@PathVariable String projectId, @PathVariable String employeeId) {
        projectService.unassignEmployee(projectId, employeeId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/v1/projects/assigned?employeeId={id}
    @GetMapping("/assigned")
    public ResponseEntity<List<Project>> getAssignedProjects(@RequestParam String employeeId) {
        List<Project> projects = projectService.getProjectsForEmployee(employeeId);
        return ResponseEntity.ok(projects);
    }

    // GET /api/v1/projects/employee/{employeeId} - Alternative endpoint for getting projects by employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<Project>> getProjectsByEmployee(@PathVariable String employeeId) {
        List<Project> projects = projectService.getProjectsForEmployee(employeeId);
        return ResponseEntity.ok(projects);
    }

    // GET /api/v1/projects/{projectId}/employees - Get all employees assigned to a project
    @GetMapping("/{projectId}/employees")
    public ResponseEntity<List<String>> getEmployeesAssignedToProject(@PathVariable String projectId) {
        Project project = projectService.getProjectById(projectId);
        List<String> employeeIds = project.getAssignedEmployees();
        if (employeeIds == null) {
            employeeIds = List.of();
        }
        return ResponseEntity.ok(employeeIds);
    }

    // POST/GET /api/v1/projects/backfill-ids -- triggers backfill of missing 'id' fields in project documents
    @PostMapping("/backfill-ids")
    @GetMapping("/backfill-ids")
    public ResponseEntity<String> backfillProjectIds() {
        int updated = projectService.backfillProjectIds();
        return ResponseEntity.ok("Backfilled " + updated + " project(s) with missing id field.");
    }
}