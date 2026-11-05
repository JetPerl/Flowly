package com.flowly.api.mapper;

import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Tag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TagMapper {

    @Mapping(target = "id", expression = "java(tag.getId() != null ? tag.getId().longValue() : null)")
    TagDto toDto(Tag tag);
}
