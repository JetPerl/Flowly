package com.flowly.api.controller.impl;

import com.flowly.api.controller.CategoryController;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.model.request.category.CategoryCreateRequest;
import com.flowly.api.model.request.category.CategoryUpdateRequest;
import com.flowly.api.service.CategoryService;
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
public class CategoryControllerImpl implements CategoryController {

    CategoryService categoryService;

    @Override
    public ResponseEntity<List<CategoryDto>> getCategories(CategoryType type, boolean includeHidden, boolean asTree) {
        return ResponseEntity.ok(categoryService.getCategories(type, includeHidden, asTree));
    }

    @Override
    public ResponseEntity<CategoryDto> getCategoryById(Integer id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @Override
    public ResponseEntity<CategoryDto> createCategory(CategoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
    }

    @Override
    public ResponseEntity<CategoryDto> updateCategory(Integer id, CategoryUpdateRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @Override
    public ResponseEntity<CategoryDto> resetCategory(Integer id) {
        return ResponseEntity.ok(categoryService.resetCategory(id));
    }

    @Override
    public ResponseEntity<Void> deleteCategory(Integer id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
