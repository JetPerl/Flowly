package com.flowly.api.service.impl;

import com.flowly.api.mapper.TagMapper;
import com.flowly.api.model.dto.TagDto;
import com.flowly.api.repository.TagRepository;
import com.flowly.api.service.TagService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TagServiceImpl implements TagService {

    TagRepository tagRepository;
    TagMapper tagMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TagDto> getAllTags() {
        return tagRepository.findAllByOrderByNameAsc()
                .stream()
                .map(tagMapper::toDto)
                .toList();
    }
}
