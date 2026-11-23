package com.flowly.api.controller.impl;

import com.flowly.api.controller.TagController;
import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.request.tag.TagCreateRequest;
import com.flowly.api.model.request.tag.TagUpdateRequest;
import com.flowly.api.service.TagService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TagControllerImpl implements TagController {

    TagService tagService;

    @Override
    public ResponseEntity<List<TagDto>> getTags(boolean includeHidden) {
        return ResponseEntity.ok(tagService.getAllTags(includeHidden));
    }

    @Override
    public ResponseEntity<TagDto> getTagById(Integer id) {
        return ResponseEntity.ok(tagService.getTagById(id));
    }

    @Override
    public ResponseEntity<TagDto> createTag(TagCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.createTag(request));
    }

    @Override
    public ResponseEntity<TagDto> updateTag(Integer id, TagUpdateRequest request) {
        return ResponseEntity.ok(tagService.updateTag(id, request));
    }

    @Override
    public ResponseEntity<TagDto> resetTag(Integer id) {
        return ResponseEntity.ok(tagService.resetTag(id));
    }

    @Override
    public ResponseEntity<Void> deleteTag(Integer id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
