package com.flowly.api.mapper;

import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Tag;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-11-05T15:12:38+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.13 (Eclipse Adoptium)"
)
@Component
public class TagMapperImpl implements TagMapper {

    @Override
    public TagDto toDto(Tag tag) {
        if ( tag == null ) {
            return null;
        }

        String name = null;
        String color = null;
        String icon = null;

        name = tag.getName();
        color = tag.getColor();
        icon = tag.getIcon();

        Long id = tag.getId() != null ? tag.getId().longValue() : null;

        TagDto tagDto = new TagDto( id, name, color, icon );

        return tagDto;
    }
}
