package com.flowly.api.service.impl;

import com.flowly.api.mapper.CategoryMapper;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.repository.CategoryRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.CategoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryServiceImpl implements CategoryService {

    CategoryRepository categoryRepository;
    UserRepository userRepository;
    CategoryMapper categoryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategories(String userEmail, CategoryType type) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        return categoryRepository.findAvailableCategories(user.getId(), type)
                .stream()
                .map(categoryMapper::toDto)
                .toList();
    }
}
