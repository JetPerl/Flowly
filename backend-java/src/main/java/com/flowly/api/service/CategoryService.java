package com.flowly.api.service;

import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;

import java.util.List;

public interface CategoryService {

    List<CategoryDto> getCategories(CategoryType type);
}
