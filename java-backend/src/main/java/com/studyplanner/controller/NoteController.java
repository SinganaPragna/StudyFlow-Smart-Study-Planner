package com.studyplanner.controller;

import com.studyplanner.model.Note;
import com.studyplanner.repository.NoteRepository;
import com.studyplanner.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/notes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NoteController {

    private final NoteRepository noteRepository;
    private final AuthService authService;

    public record NoteRequest(String title, String body) {}

    @GetMapping
    public ResponseEntity<List<Note>> listNotes(@RequestHeader("Authorization") String authorization) {
        Long userId = authService.requireUserId(authorization);
        return ResponseEntity.ok(noteRepository.findByUserIdOrderByUpdatedAtDesc(userId));
    }

    @PostMapping
    public ResponseEntity<?> createNote(
            @RequestHeader("Authorization") String authorization,
            @RequestBody NoteRequest request) {
        Long userId = authService.requireUserId(authorization);
        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }

        Note note = Note.builder()
                .userId(userId)
                .title(request.title().trim())
                .body(request.body() == null ? "" : request.body())
                .build();
        return ResponseEntity.status(201).body(noteRepository.save(note));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id,
            @RequestBody NoteRequest request) {
        Long userId = authService.requireUserId(authorization);
        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }

        Optional<Note> optional = noteRepository.findByIdAndUserId(id, userId);
        if (optional.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Note not found"));
        }

        Note note = optional.get();
        note.setTitle(request.title().trim());
        note.setBody(request.body() == null ? "" : request.body());
        return ResponseEntity.ok(noteRepository.save(note));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        Long userId = authService.requireUserId(authorization);
        Optional<Note> optional = noteRepository.findByIdAndUserId(id, userId);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        noteRepository.delete(optional.get());
        return ResponseEntity.noContent().build();
    }
}
