package com.flowly.api.mapper;

import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.dto.EffectiveCategory;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.request.category.CategoryCreateRequest;
import com.flowly.api.model.request.category.CategoryUpdateRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CategoryMapper {

    @Mapping(target = "id", expression = "java(category.getId() != null ? category.getId().longValue() : null)")
    @Mapping(target = "parentId", expression = "java(category.getParent() != null && category.getParent().getId() != null ? category.getParent().getId().longValue() : null)")
    @Mapping(target = "isCustomized", ignore = true)
    CategoryDto toDto(Category category);

    @Mapping(target = "id", expression = "java(ec.id() != null ? ec.id().longValue() : null)")
    @Mapping(target = "name", source = "ec.name")
    @Mapping(target = "type", source = "ec.type")
    @Mapping(target = "parentId", expression = "java(ec.parentId() != null ? ec.parentId().longValue() : null)")
    @Mapping(target = "icon", source = "ec.icon")
    @Mapping(target = "color", source = "ec.color")
    @Mapping(target = "sortOrder", source = "ec.sortOrder")
    @Mapping(target = "isSystem", source = "ec.isSystem")
    @Mapping(target = "isCustomized", source = "ec.isCustomized")
    @Mapping(target = "isHidden", source = "ec.isHidden")
    @Mapping(target = "children", source = "children")
    CategoryDto toDto(EffectiveCategory ec, List<CategoryDto> children);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "isHidden", constant = "false")
    @Mapping(target = "isSystem", constant = "false")
    @Mapping(target = "name", expression = "java(request.name() != null ? request.name().trim() : null)")
    @Mapping(target = "type", source = "request.type")
    @Mapping(target = "parent", source = "parent")
    @Mapping(target = "icon", source = "request.icon")
    @Mapping(target = "color", source = "request.color")
    @Mapping(target = "sortOrder", source = "request.sortOrder")
    @Mapping(target = "user", source = "user")
    Category toEntity(CategoryCreateRequest request, Category parent, User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "isSystem", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "name", expression = "java(request.name() != null ? request.name().trim() : category.getName())")
    @Mapping(target = "parent", source = "parent")
    @Mapping(target = "icon", source = "request.icon")
    @Mapping(target = "color", source = "request.color")
    @Mapping(target = "sortOrder", source = "request.sortOrder")
    @Mapping(target = "isHidden", source = "request.isHidden")
    void updateEntityFromRequest(
            CategoryUpdateRequest request,
            Category parent,
            @MappingTarget Category category
    );
}
