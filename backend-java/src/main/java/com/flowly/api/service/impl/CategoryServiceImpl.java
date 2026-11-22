package com.flowly.api.service.impl;

import com.flowly.api.mapper.CategoryMapper;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.repository.CategoryRepository;
import com.flowly.api.service.CategoryService;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryServiceImpl implements CategoryService {

    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategories(CategoryType type) {
        Integer userId = SecurityUtils.getCurrentUserId();

        return categoryRepository.findAvailableCategories(userId, type)
                .stream()
                .map(categoryMapper::toDto)
                .toList();
    }
}
