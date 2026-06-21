package com.studyplanner.repository;

import com.studyplanner.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * SessionRepository - Data Access Layer (OOP Repository Pattern)
 *
 * Provides CRUD operations and custom queries for StudySession entities.
 */
@Repository
public interface SessionRepository extends JpaRepository<StudySession, Long> {

    /**
     * Find all sessions for a specific subject
     */
    List<StudySession> findByUserIdAndSubjectIdOrderByDateAsc(Long userId, Long subjectId);

    List<StudySession> findByUserIdOrderByDateAscSubjectNameAsc(Long userId);

    Optional<StudySession> findByIdAndUserId(Long id, Long userId);

    /**
     * Count completed sessions for progress calculation
     */
    long countByUserIdAndCompletedTrue(Long userId);

    long countByUserId(Long userId);

    /**
     * Find all sessions on a specific date
     */
    List<StudySession> findByUserIdAndDateOrderBySubjectNameAsc(Long userId, String date);

    /**
     * Delete all sessions for a subject (used when subject is deleted)
     */
    void deleteBySubjectIdAndUserId(Long subjectId, Long userId);

    void deleteByUserId(Long userId);
}
