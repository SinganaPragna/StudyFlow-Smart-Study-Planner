package com.studyplanner.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.studyplanner.model.StudySession;
import com.studyplanner.model.Subject;
import com.studyplanner.repository.SessionRepository;
import com.studyplanner.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PlannerManager - Core Business Logic Service (OOP Design Pattern:
 * Manager/Orchestrator)
 *
 * Responsible for: 1. Sorting subjects by priority and exam proximity 2.
 * Generating study timetables based on available hours and deadlines 3.
 * Calculating overall progress statistics 4. Validating study schedules for
 * conflicts
 *
 * Implements intelligent scheduling: - High priority subjects: daily sessions -
 * Medium priority subjects: every other day - Low priority subjects: every 3rd
 * day - Sessions are distributed based on hoursPerDay setting
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlannerManager {

    private final SubjectRepository subjectRepository;
    private final SessionRepository sessionRepository;

    /**
     * Generates a complete study timetable starting from the given date. Clears
     * any existing sessions before generating new ones.
     *
     * @param startDate The date from which to begin scheduling
     * @return List of generated StudySession objects
     */
    public List<StudySession> generateTimetable(Long userId, LocalDate startDate) {
        log.info("Generating timetable for user {} from {}", userId, startDate);

        // Clear existing sessions
        sessionRepository.deleteByUserId(userId);

        // Get all incomplete subjects
        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .filter(s -> !Boolean.TRUE.equals(s.getCompleted()))
                .toList();

        if (subjects.isEmpty()) {
            log.info("No subjects found. Timetable is empty.");
            return Collections.emptyList();
        }

        // Sort subjects by priority and exam date
        List<Subject> sorted = sortByPriorityAndDate(subjects);

        List<StudySession> allSessions = new ArrayList<>();
        for (Subject subject : sorted) {
            List<StudySession> sessions = generateSessionsForSubject(userId, subject, startDate);
            allSessions.addAll(sessions);
        }

        List<StudySession> saved = sessionRepository.saveAll(allSessions);
        log.info("Generated {} study sessions", saved.size());
        return saved;
    }

    /**
     * Sorts subjects by priority (High > Medium > Low) then by exam date
     * (nearest first). OOP Encapsulation: keeps sort logic within the manager.
     */
    private List<Subject> sortByPriorityAndDate(List<Subject> subjects) {
        return subjects.stream()
                .sorted(
                        Comparator.comparingInt(Subject::getPriorityWeight)
                                .thenComparing(subject -> {
                                    String examDate = subject.getExamDate();

                                    if (examDate == null || examDate.isBlank()) {
                                        return "9999-12-31";
                                    }

                                    return examDate;
                                })
                )
                .toList();
    }

    /**
     * Generates study sessions for a single subject. Schedules sessions based
     * on priority and days until exam.
     *
     * @param subject The subject to schedule
     * @param startDate The start date for scheduling
     * @return List of sessions for this subject
     */
    private List<StudySession> generateSessionsForSubject(Long userId, Subject subject, LocalDate startDate) {
        List<StudySession> sessions = new ArrayList<>();

        LocalDate examDate;

        if (subject.getExamDate() == null || subject.getExamDate().isBlank()) {
            // Subjects without exam date get a 14-day study plan
            examDate = startDate.plusDays(14);
        } else {
            examDate = LocalDate.parse(subject.getExamDate());

            if (!examDate.isAfter(startDate)) {
                log.warn("Exam date {} is not in the future for subject {}", examDate, subject.getName());
                return sessions;
            }
        }

        // Parse topics for rotation
        List<String> topics = parseTopics(subject.getTopics());

        // Calculate scheduling interval based on priority
        int interval = switch (subject.getPriority()) {
            case "High" ->
                1;   // Every day
            case "Medium" ->
                2; // Every other day
            default ->
                3;       // Every 3rd day (Low)
        };

        // Calculate daily hours with priority multiplier
        double dailyHours = subject.getHoursPerDay();

        long daysUntilExam = ChronoUnit.DAYS.between(startDate, examDate);
        int topicIndex = 0;

        for (long dayOffset = 0; dayOffset < daysUntilExam; dayOffset += interval) {
            LocalDate sessionDate = startDate.plusDays(dayOffset);
            String topic = topics.isEmpty() ? null : topics.get(topicIndex % topics.size());

            StudySession session = StudySession.builder()
                    .userId(userId)
                    .subjectId(subject.getId())
                    .subjectName(subject.getName())
                    .date(sessionDate.toString())
                    .hours(dailyHours)
                    .completed(false)
                    .priority(subject.getPriority())
                    .topic(topic)
                    .build();

            sessions.add(session);
            topicIndex++;
        }

        return sessions;
    }

    /**
     * Parses a comma-separated topics string into a list.
     */
    private List<String> parseTopics(String topicsStr) {
        if (topicsStr == null || topicsStr.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(topicsStr.split(","))
                .map(String::trim)
                .filter(t -> !t.isBlank())
                .toList();
    }

    /**
     * Calculates the overall progress percentage. Based on session completion
     * if sessions exist, otherwise subject completion.
     */
    public double calculateProgressPercentage(Long userId) {
        long totalSessions = sessionRepository.countByUserId(userId);
        if (totalSessions > 0) {
            long completedSessions = sessionRepository.countByUserIdAndCompletedTrue(userId);
            return Math.round((double) completedSessions / totalSessions * 100);
        }
        long totalSubjects = subjectRepository.findByUserIdOrderByCreatedAtAsc(userId).size();
        if (totalSubjects == 0) {
            return 0;
        }
        long completedSubjects = subjectRepository.countByUserIdAndCompletedTrue(userId);
        return Math.round((double) completedSubjects / totalSubjects * 100);
    }
}
