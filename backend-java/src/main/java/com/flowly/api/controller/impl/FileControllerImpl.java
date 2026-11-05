package com.flowly.api.controller.impl;

import com.flowly.api.controller.FileController;
import com.flowly.api.service.FileStorageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Реализация REST-контроллера файлов.
 */

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileControllerImpl implements FileController {

    FileStorageService fileStorageService;

    @Override
    public ResponseEntity<Map<String, String>> uploadFile(MultipartFile file) {
        String fileUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }
}
