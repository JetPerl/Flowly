package com.flowly.api.mapper;

import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CategoryMapper {

    @Mapping(target = "id", expression = "java(category.getId() != null ? category.getId().longValue() : null)")
    CategoryDto toDto(Category category);
}
