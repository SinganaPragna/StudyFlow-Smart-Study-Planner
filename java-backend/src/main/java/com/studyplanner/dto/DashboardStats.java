package com.studyplanner.dto;

import lombok.*;
import java.util.List;

/**
 * DashboardStats - Data Transfer Object for Dashboard API response
 *
 * Aggregates key statistics for the dashboard view:
 * - Subject counts (total, completed, pending)
 * - Session counts for progress tracking
 * - Upcoming exams list
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private int totalSubjects;
    private int completedSubjects;
    private int pendingSubjects;
    private long totalSessions;
    private long completedSessions;
    private double progressPercentage;
    private List<UpcomingExam> upcomingExams;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpcomingExam {
        private Long id;
        private String name;
        private String examDate;
        private String priority;
        private long daysLeft;
    }
}
