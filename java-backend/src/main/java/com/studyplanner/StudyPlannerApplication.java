package com.studyplanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Smart Study Planner - Spring Boot Application Entry Point
 *
 * Architecture follows OOP principles:
 * - Subject       : represents a course/subject entity
 * - StudySession  : represents a study session in the timetable
 * - PlannerManager: orchestrates timetable generation (service layer)
 * - User          : user profile (future extension)
 */
@SpringBootApplication
public class StudyPlannerApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyPlannerApplication.class, args);
    }
}
