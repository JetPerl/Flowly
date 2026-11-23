package com.flowly.api.service;

import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.model.request.category.CategoryCreateRequest;
import com.flowly.api.model.request.category.CategoryUpdateRequest;

import java.util.List;

public interface CategoryService {

    List<CategoryDto> getCategories(CategoryType type, boolean includeHidden, boolean asTree);

    CategoryDto getCategoryById(Integer id);

    CategoryDto createCategory(CategoryCreateRequest request);

    CategoryDto updateCategory(Integer id, CategoryUpdateRequest request);

    CategoryDto resetCategory(Integer id);

    void deleteCategory(Integer id);
}
