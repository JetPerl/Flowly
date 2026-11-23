package com.flowly.api.service;

import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.request.tag.TagCreateRequest;
import com.flowly.api.model.request.tag.TagUpdateRequest;

import java.util.List;

public interface TagService {

    List<TagDto> getAllTags(boolean includeHidden);

    TagDto getTagById(Integer id);

    TagDto createTag(TagCreateRequest request);

    TagDto updateTag(Integer id, TagUpdateRequest request);

    TagDto resetTag(Integer id);

    void deleteTag(Integer id);
}
