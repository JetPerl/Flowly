package com.flowly.api.mapper;

import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CategoryMapper {

    @Mapping(target = "id", expression = "java(category.getId() != null ? category.getId().longValue() : null)")
    @Mapping(target = "parentId", expression = "java(category.getParent() != null && category.getParent().getId() != null ? category.getParent().getId().longValue() : null)")
    @Mapping(target = "isCustomized", ignore = true)
    CategoryDto toDto(Category category);
}
