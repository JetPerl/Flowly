package com.flowly.api.mapper;

import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.enums.CategoryType;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-11-05T15:12:37+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.13 (Eclipse Adoptium)"
)
@Component
public class CategoryMapperImpl implements CategoryMapper {

    @Override
    public CategoryDto toDto(Category category) {
        if ( category == null ) {
            return null;
        }

        String name = null;
        CategoryType type = null;
        String icon = null;
        String color = null;

        name = category.getName();
        type = category.getType();
        icon = category.getIcon();
        color = category.getColor();

        Long id = category.getId() != null ? category.getId().longValue() : null;

        CategoryDto categoryDto = new CategoryDto( id, name, type, icon, color );

        return categoryDto;
    }
}
