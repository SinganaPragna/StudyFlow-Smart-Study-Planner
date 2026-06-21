package com.studyplanner.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.studyplanner.model.StudySession;
import com.studyplanner.model.Subject;
import com.studyplanner.repository.SessionRepository;
import com.studyplanner.repository.SubjectRepository;
import com.studyplanner.service.AuthService;
import com.studyplanner.service.PlannerManager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SessionController - REST API Controller for Study Sessions
 *
 * GET /api/sessions - List all sessions (timetable) POST /api/sessions -
 * Generate a new timetable PATCH /api/sessions/{id}/complete - Toggle session
 * completion
 */
@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionRepository sessionRepository;
    private final SubjectRepository subjectRepository;
    private final PlannerManager plannerManager;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<StudySession>> listSessions(@RequestHeader("Authorization") String authorization) {
        Long userId = authService.requireUserId(authorization);
        List<StudySession> sessions = sessionRepository.findByUserIdOrderByDateAscSubjectNameAsc(userId);
        return ResponseEntity.ok(sessions);
    }

    @PostMapping
    public ResponseEntity<List<StudySession>> generateTimetable(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, String> body) {
        Long userId = authService.requireUserId(authorization);
        String startDateStr = body.getOrDefault("startDate", LocalDate.now().toString());
        try {
            LocalDate startDate = LocalDate.parse(startDateStr);
            List<StudySession> sessions = plannerManager.generateTimetable(userId, startDate);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            log.error("Failed to generate timetable", e);
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/custom")
    public ResponseEntity<?> createCustomSession(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> body) {
        Long userId = authService.requireUserId(authorization);
        String subjectName = asString(body.get("subjectName"));
        String date = asString(body.get("date"));
        Double hours = asDouble(body.get("hours"));

        if (subjectName == null || subjectName.isBlank() || date == null || hours == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "subjectName, date, and hours are required"));
        }

        Long subjectId = asLong(body.get("subjectId"));
        if (subjectId != null) {
            Optional<Subject> subject = subjectRepository.findByIdAndUserId(subjectId, userId);
            if (subject.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Subject not found"));
            }
        }

        StudySession session = StudySession.builder()
                .userId(userId)
                .subjectId(subjectId)
                .subjectName(subjectName.trim())
                .date(date)
                .hours(hours)
                .completed(false)
                .priority(asStringOrDefault(body.get("priority"), "Medium"))
                .topic(asString(body.get("topic")))
                .iconKey(asString(body.get("iconKey")))
                .build();

        return ResponseEntity.status(201).body(sessionRepository.save(session));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        Long userId = authService.requireUserId(authorization);
        Optional<StudySession> optional = sessionRepository.findByIdAndUserId(id, userId);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        sessionRepository.delete(optional.get());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> toggleComplete(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        Long userId = authService.requireUserId(authorization);
        Optional<StudySession> optional = sessionRepository.findByIdAndUserId(id, userId);
        if (optional.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Session not found"));
        }
        StudySession session = optional.get();
        session.setCompleted(!Boolean.TRUE.equals(session.getCompleted()));
        StudySession saved = sessionRepository.save(session);
        return ResponseEntity.ok(saved);
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private String asStringOrDefault(Object value, String defaultValue) {
        String result = asString(value);
        return result == null || result.isBlank() ? defaultValue : result;
    }

    private Double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
