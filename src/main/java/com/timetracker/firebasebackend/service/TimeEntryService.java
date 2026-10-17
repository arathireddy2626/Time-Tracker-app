package com.timetracker.firebasebackend.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.timetracker.firebasebackend.model.TimeEntry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.math.BigDecimal;

@Service
public class TimeEntryService {

    @Autowired
    private Firestore firestore;

    @Value("${firebase.collection.timeEntries}")
    private String timeEntriesCollection;

    // Get all time entries (optionally filtered by days)
    @SuppressWarnings("null")
    public List<TimeEntry> getAllTimeEntries(int days) {
        try {
            Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries");
            
            if (days > 0) {
                long cutoffMillis = System.currentTimeMillis() - (days * 24L * 60 * 60 * 1000);
                Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(cutoffMillis / 1000, 0);
                query = query.whereGreaterThanOrEqualTo("clockInTime", (Object) cutoff);
            }
            
            query = query.orderBy("clockInTime", Query.Direction.DESCENDING);
            QuerySnapshot snapshot = query.get().get();
            
            List<TimeEntry> entries = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                entries.add(mapToTimeEntry(doc));
            }
            return entries;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to retrieve time entries.", e);
        }
    }

    // Get time entries by employee
    public List<TimeEntry> getTimeEntriesByEmployee(String employeeId, int days) {
        try {
            Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries")
                    .whereEqualTo("employeeId", employeeId);
            
            // Avoid Firestore composite index requirements by not adding range filters here; filter in memory
            QuerySnapshot snapshot = query.get().get();
            
            List<TimeEntry> entries = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                entries.add(mapToTimeEntry(doc));
            }
            
            // Sort in memory (newest first)
            entries.sort((a, b) -> {
                if (a.getClockInTime() == null && b.getClockInTime() == null) return 0;
                if (a.getClockInTime() == null) return 1;
                if (b.getClockInTime() == null) return -1;
                return b.getClockInTime().compareTo(a.getClockInTime());
            });
            
            // Filter by days in memory when requested
            if (days > 0) {
                long cutoffMillis = System.currentTimeMillis() - (days * 24L * 60 * 60 * 1000);
                entries = entries.stream()
                        .filter(e -> e.getClockInTime() != null && (e.getClockInTime().getSeconds() * 1000L) >= cutoffMillis)
                        .toList();
            }
            
            return entries;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to retrieve time entries for employee.", e);
        }
    }

    // Get time entries by project
    public List<TimeEntry> getTimeEntriesByProject(String projectId, int days) {
        try {
            Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries")
                    .whereEqualTo("projectId", projectId);
            
            // Avoid Firestore composite index requirements by not adding range filters here; filter in memory
            QuerySnapshot snapshot = query.get().get();
            
            List<TimeEntry> entries = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                entries.add(mapToTimeEntry(doc));
            }
            
            // Sort in memory (newest first)
            entries.sort((a, b) -> {
                if (a.getClockInTime() == null && b.getClockInTime() == null) return 0;
                if (a.getClockInTime() == null) return 1;
                if (b.getClockInTime() == null) return -1;
                return b.getClockInTime().compareTo(a.getClockInTime());
            });
            
            // Filter by days in memory when requested
            if (days > 0) {
                long cutoffMillis = System.currentTimeMillis() - (days * 24L * 60 * 60 * 1000);
                entries = entries.stream()
                        .filter(e -> e.getClockInTime() != null && (e.getClockInTime().getSeconds() * 1000L) >= cutoffMillis)
                        .toList();
            }
            
            return entries;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to retrieve time entries for project.", e);
        }
    }

    private TimeEntry mapToTimeEntry(DocumentSnapshot doc) {
        TimeEntry entry = new TimeEntry();
        entry.setId(doc.getId());
        entry.setEmployeeId(doc.getString("employeeId"));
        entry.setProjectId(doc.getString("projectId"));
        entry.setStatus(doc.getString("status"));
        entry.setClockInTime(parseToTimestamp(doc.get("clockInTime")));
        entry.setClockOutTime(parseToTimestamp(doc.get("clockOutTime")));
        return entry;
    }

    private Timestamp parseToTimestamp(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof Timestamp ts) {
                return ts;
            }
            if (value instanceof java.util.Date d) {
                long ms = d.getTime();
                return Timestamp.ofTimeSecondsAndNanos(ms / 1000L, (int) ((ms % 1000L) * 1_000_000L));
            }
            if (value instanceof Number n) {
                long num = (n instanceof BigDecimal) ? ((BigDecimal) n).longValue() : n.longValue();
                if (Math.abs(num) > 3_000_000_000L) {
                    return Timestamp.ofTimeSecondsAndNanos(num / 1000L, (int) ((num % 1000L) * 1_000_000L));
                } else {
                    return Timestamp.ofTimeSecondsAndNanos(num, 0);
                }
            }
            if (value instanceof String s) {
                s = s.trim();
                try {
                    Instant instant = Instant.parse(s);
                    return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
                } catch (DateTimeParseException ignore) {
                    try {
                        long num = Long.parseLong(s);
                        if (Math.abs(num) > 3_000_000_000L) {
                            return Timestamp.ofTimeSecondsAndNanos(num / 1000L, (int) ((num % 1000L) * 1_000_000L));
                        } else {
                            return Timestamp.ofTimeSecondsAndNanos(num, 0);
                        }
                    } catch (NumberFormatException ignore2) {
                        return null;
                    }
                }
            }
        } catch (Exception ex) {
            return null;
        }
        return null;
    }

    // Create a new time entry (clock in)
    public TimeEntry createTimeEntry(TimeEntry timeEntry) {
        try {
            if (timeEntry.getEmployeeId() == null || timeEntry.getProjectId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "employeeId and projectId are required");
            }
            
            // Set default values if not provided
            if (timeEntry.getClockInTime() == null) {
                timeEntry.setClockInTime(Timestamp.now());
            }
            if (timeEntry.getStatus() == null) {
                timeEntry.setStatus("clocked-in");
            }
            
            DocumentReference docRef = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries").add(timeEntry).get();
            timeEntry.setId(docRef.getId());
            return timeEntry;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to create time entry.", e);
        }
    }

    // Update an existing time entry
    public TimeEntry updateTimeEntry(String id, TimeEntry updates) {
        try {
            DocumentReference docRef = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries").document(id != null ? id : "");
            DocumentSnapshot snapshot = docRef.get().get();
            
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Time entry not found");
            }
            
            // Build update map
            Map<String, Object> updateMap = new java.util.HashMap<>();
            if (updates.getClockOutTime() != null) {
                updateMap.put("clockOutTime", updates.getClockOutTime());
            }
            if (updates.getStatus() != null) {
                updateMap.put("status", updates.getStatus());
            }
            if (updates.getProjectId() != null) {
                updateMap.put("projectId", updates.getProjectId());
            }
            
            if (!updateMap.isEmpty()) {
                docRef.update(updateMap).get();
            }
            
            // Fetch and return updated entry
            snapshot = docRef.get().get();
            TimeEntry updated = snapshot.toObject(TimeEntry.class);
            if (updated == null) {
                updated = new TimeEntry();
            }
            updated.setId(snapshot.getId());
            return updated;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to update time entry.", e);
        }
    }

    // Delete a time entry
    public void deleteTimeEntry(String id) {
        try {
            DocumentReference docRef = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries").document(id != null ? id : "");
            DocumentSnapshot snapshot = docRef.get().get();
            
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Time entry not found");
            }
            
            docRef.delete().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to delete time entry.", e);
        }
    }
}
