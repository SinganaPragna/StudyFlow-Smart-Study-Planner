package com.studyplanner.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.studyplanner.dto.DashboardStats;
import com.studyplanner.model.Subject;
import com.studyplanner.repository.SessionRepository;
import com.studyplanner.repository.SubjectRepository;
import com.studyplanner.service.AuthService;
import com.studyplanner.service.PlannerManager;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * DashboardController - REST API Controller for Dashboard Statistics
 *
 * GET /api/dashboard - Returns aggregated stats for the dashboard view
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class DashboardController {

    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;
    private final PlannerManager plannerManager;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<DashboardStats> getDashboard(@RequestHeader("Authorization") String authorization) {
        Long userId = authService.requireUserId(authorization);
        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtAsc(userId);
        long totalSubjects = subjects.size();
        long completedSubjects = subjects.stream()
                .filter(subject -> {
                    List<com.studyplanner.model.StudySession> sessions
                            = sessionRepository.findByUserIdOrderByDateAscSubjectNameAsc(userId)
                                    .stream()
                                    .filter(session
                                            -> session.getSubjectId() != null
                                    && session.getSubjectId().equals(subject.getId()))
                                    .toList();

                    return !sessions.isEmpty()
                            && sessions.stream()
                                    .allMatch(session
                                            -> Boolean.TRUE.equals(session.getCompleted()));
                })
                .count();

        long pendingSubjects = totalSubjects - completedSubjects;

        long totalSessions = sessionRepository.countByUserId(userId);
        long completedSessions = sessionRepository.countByUserIdAndCompletedTrue(userId);
        double progressPercentage = plannerManager.calculateProgressPercentage(userId);

        // Build upcoming exams
        LocalDate today = LocalDate.now();
        List<DashboardStats.UpcomingExam> upcomingExams = subjects.stream()
                .filter(s -> !Boolean.TRUE.equals(s.getCompleted()))
                .filter(Subject::isUpcoming)
                .map(s -> {
                    LocalDate examDate = LocalDate.parse(s.getExamDate());
                    long daysLeft = ChronoUnit.DAYS.between(today, examDate);
                    return DashboardStats.UpcomingExam.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .examDate(s.getExamDate())
                            .priority(s.getPriority())
                            .daysLeft(daysLeft)
                            .build();
                })
                .filter(e -> e.getDaysLeft() >= 0)
                .sorted((a, b) -> Long.compare(a.getDaysLeft(), b.getDaysLeft()))
                .limit(5)
                .toList();

        DashboardStats stats = DashboardStats.builder()
                .totalSubjects((int) totalSubjects)
                .completedSubjects((int) completedSubjects)
                .pendingSubjects((int) pendingSubjects)
                .totalSessions(totalSessions)
                .completedSessions(completedSessions)
                .progressPercentage(progressPercentage)
                .upcomingExams(upcomingExams)
                .build();

        return ResponseEntity.ok(stats);
    }
}
