package com.flowly.api.controller.impl;

import com.flowly.api.controller.CategoryController;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.service.CategoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryControllerImpl implements CategoryController {

    CategoryService categoryService;

    @Override
    public ResponseEntity<List<CategoryDto>> getCategories(CategoryType type, UserDetails userDetails) {
        String email = userDetails.getUsername();
        return ResponseEntity.ok(categoryService.getCategories(email, type));
    }
}
