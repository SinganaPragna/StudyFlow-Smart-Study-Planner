package com.studyplanner.repository;

import com.studyplanner.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * SubjectRepository - Data Access Layer (OOP Repository Pattern)
 *
 * Provides CRUD operations and custom queries for Subject entities.
 * Extends JpaRepository for standard database operations.
 */
@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    /**
     * Find subjects by name containing the search term (case-insensitive)
     */
    @Query("SELECT s FROM Subject s WHERE s.userId = :userId AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY s.createdAt")
    List<Subject> findByUserIdAndNameContainingIgnoreCase(@Param("userId") Long userId, @Param("search") String search);

    List<Subject> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Subject> findByIdAndUserId(Long id, Long userId);

    /**
     * Count completed subjects for progress calculation
     */
    long countByUserIdAndCompletedTrue(Long userId);

    /**
     * Find all non-completed subjects ordered by exam date
     */
    List<Subject> findByUserIdAndCompletedFalseOrderByExamDateAsc(Long userId);

    /**
     * Find subjects by priority
     */
    List<Subject> findByUserIdAndPriorityOrderByExamDateAsc(Long userId, String priority);
}
