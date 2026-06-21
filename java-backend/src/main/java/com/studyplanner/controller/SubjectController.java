package com.studyplanner.controller;

import com.studyplanner.dto.SubjectRequest;
import com.studyplanner.model.Subject;
import com.studyplanner.repository.SessionRepository;
import com.studyplanner.repository.SubjectRepository;
import com.studyplanner.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * SubjectController - REST API Controller (OOP Controller Pattern)
 *
 * Handles all HTTP requests related to Subject management:
 * GET    /api/subjects         - List all subjects (with optional search)
 * POST   /api/subjects         - Create a new subject
 * GET    /api/subjects/{id}    - Get a specific subject
 * PUT    /api/subjects/{id}    - Update a subject
 * DELETE /api/subjects/{id}    - Delete a subject
 * PATCH  /api/subjects/{id}/complete - Toggle completion status
 */
@RestController
@RequestMapping("/subjects")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SubjectController {

    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<Subject>> listSubjects(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) String search) {
        Long userId = authService.requireUserId(authorization);
        List<Subject> subjects;
        if (search != null && !search.isBlank()) {
            subjects = subjectRepository.findByUserIdAndNameContainingIgnoreCase(userId, search);
        } else {
            subjects = subjectRepository.findByUserIdOrderByCreatedAtAsc(userId);
        }
        return ResponseEntity.ok(subjects);
    }

    @PostMapping
    public ResponseEntity<?> createSubject(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody SubjectRequest request) {
        Long userId = authService.requireUserId(authorization);
        try {
            Subject subject = Subject.builder()
                    .userId(userId)
                    .name(request.getName())
                    .examDate(request.getExamDate())
                    .priority(request.getPriority())
                    .hoursPerDay(request.getHoursPerDay())
                    .topics(request.getTopics())
                    .completed(false)
                    .build();
            Subject saved = subjectRepository.save(subject);
            log.info("Created subject: {}", saved.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            log.error("Failed to create subject", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create subject"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSubject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        Long userId = authService.requireUserId(authorization);
        Optional<Subject> subject = subjectRepository.findByIdAndUserId(id, userId);
        if (subject.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Subject not found"));
        }
        return ResponseEntity.ok(subject.get());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubject(@RequestHeader("Authorization") String authorization,
                                            @PathVariable Long id,
                                            @Valid @RequestBody SubjectRequest request) {
        Long userId = authService.requireUserId(authorization);
        Optional<Subject> optional = subjectRepository.findByIdAndUserId(id, userId);
        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Subject not found"));
        }
        Subject subject = optional.get();
        subject.setName(request.getName());
        subject.setExamDate(request.getExamDate());
        subject.setPriority(request.getPriority());
        subject.setHoursPerDay(request.getHoursPerDay());
        subject.setTopics(request.getTopics());
        Subject saved = subjectRepository.save(subject);
        log.info("Updated subject: {}", saved.getName());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        Long userId = authService.requireUserId(authorization);
        Optional<Subject> subject = subjectRepository.findByIdAndUserId(id, userId);
        if (subject.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        sessionRepository.deleteBySubjectIdAndUserId(id, userId);
        subjectRepository.delete(subject.get());
        log.info("Deleted subject id: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> toggleComplete(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        Long userId = authService.requireUserId(authorization);
        Optional<Subject> optional = subjectRepository.findByIdAndUserId(id, userId);
        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Subject not found"));
        }
        Subject subject = optional.get();
        subject.setCompleted(!Boolean.TRUE.equals(subject.getCompleted()));
        Subject saved = subjectRepository.save(subject);
        log.info("Toggled completion for subject: {} -> {}", saved.getName(), saved.getCompleted());
        return ResponseEntity.ok(saved);
    }
}
