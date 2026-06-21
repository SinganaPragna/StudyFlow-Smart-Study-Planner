package com.studyplanner.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Subject - OOP Entity Class
 *
 * Represents a course or subject a student needs to study.
 * Each subject has:
 * - A name (e.g., "Mathematics")
 * - An exam date for deadline-driven scheduling
 * - A priority level to determine scheduling intensity
 * - Available study hours per day for workload distribution
 * - Optional comma-separated topics for detailed session planning
 */
@Entity
@Table(name = "subjects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank(message = "Subject name is required")
    @Column(nullable = false)
    private String name;

    @Column(name = "exam_date")
    private String examDate;

    @NotNull(message = "Priority is required")
    @Column(nullable = false)
    private String priority; // "High", "Medium", "Low"

    @NotNull(message = "Hours per day is required")
    @DecimalMin(value = "0.5", message = "Minimum 0.5 hours per day")
    @DecimalMax(value = "24.0", message = "Maximum 24 hours per day")
    @Column(name = "hours_per_day", nullable = false)
    private Double hoursPerDay;

    @Builder.Default
    private Boolean completed = false;

    @Column(columnDefinition = "TEXT")
    private String topics;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Returns the priority as an integer weight for sorting.
     * High = 0, Medium = 1, Low = 2
     */
    public int getPriorityWeight() {
        return switch (this.priority) {
            case "High" -> 0;
            case "Medium" -> 1;
            default -> 2;
        };
    }

    /**
     * Returns whether this subject's exam is in the future
     */
    public boolean isUpcoming() {
        return !this.completed && this.examDate != null && !this.examDate.isBlank();
    }
}
