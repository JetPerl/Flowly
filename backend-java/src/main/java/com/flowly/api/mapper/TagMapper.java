package com.flowly.api.mapper;

import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.entity.UserTag;
import com.flowly.api.model.request.tag.TagCreateRequest;
import com.flowly.api.model.request.tag.TagUpdateRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TagMapper {

    @Mapping(target = "id", expression = "java(tag != null && tag.getId() != null ? tag.getId().longValue() : null)")
    @Mapping(target = "name", expression = "java(hasCustom(override) && override.getCustomName() != null ? override.getCustomName() : (tag != null ? tag.getName() : null))")
    @Mapping(target = "color", expression = "java(hasCustom(override) && override.getCustomColor() != null ? override.getCustomColor() : (tag != null ? tag.getColor() : null))")
    @Mapping(target = "icon", expression = "java(hasCustom(override) && override.getCustomIcon() != null ? override.getCustomIcon() : (tag != null ? tag.getIcon() : null))")
    TagDto toDto(Tag tag, UserTag override);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isSystem", constant = "false")
    @Mapping(target = "isArchived", constant = "false")
    @Mapping(target = "name", expression = "java(request.name() != null ? request.name().trim() : null)")
    @Mapping(target = "color", source = "request.color")
    @Mapping(target = "icon", source = "request.icon")
    @Mapping(target = "sortOrder", expression = "java(request.sortOrder() != null ? request.sortOrder() : 0)")
    @Mapping(target = "user", source = "user")
    Tag toEntity(TagCreateRequest request, User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isSystem", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "name", expression = "java(request.name() != null ? request.name().trim() : tag.getName())")
    @Mapping(target = "color", source = "color")
    @Mapping(target = "icon", source = "icon")
    @Mapping(target = "sortOrder", source = "sortOrder")
    @Mapping(target = "isArchived", source = "isHidden")
    void updateEntityFromRequest(TagUpdateRequest request, @MappingTarget Tag tag);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "tag", ignore = true)
    @Mapping(target = "isCustomized", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "customName", expression = "java(request.name() != null ? request.name().trim() : override.getCustomName())")
    @Mapping(target = "customColor", source = "color")
    @Mapping(target = "customIcon", source = "icon")
    @Mapping(target = "sortOrder", source = "sortOrder")
    @Mapping(target = "isHidden", source = "isHidden")
    void updateOverrideFromRequest(TagUpdateRequest request, @MappingTarget UserTag override);

    default boolean hasCustom(UserTag override) {
        return override != null && Boolean.TRUE.equals(override.getIsCustomized());
    }
}
