package com.flowly.api.controller.impl;

import com.flowly.api.controller.TagController;
import com.flowly.api.model.dto.TagDto;
import com.flowly.api.service.TagService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TagControllerImpl implements TagController {

    TagService tagService;

    @Override
    public ResponseEntity<List<TagDto>> getTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }
}
