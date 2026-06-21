package com.studyplanner.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * SubjectRequest - Data Transfer Object (DTO)
 *
 * Used for creating and updating subjects via the REST API.
 * Contains validation annotations for input validation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    private String name;

    private String examDate;

    @NotNull(message = "Priority is required")
    @Pattern(regexp = "High|Medium|Low", message = "Priority must be High, Medium, or Low")
    private String priority;

    @NotNull(message = "Hours per day is required")
    @DecimalMin(value = "0.5", message = "Minimum 0.5 hours per day")
    @DecimalMax(value = "24.0", message = "Maximum 24 hours per day")
    private Double hoursPerDay;

    private String topics; // comma-separated (optional)
}
