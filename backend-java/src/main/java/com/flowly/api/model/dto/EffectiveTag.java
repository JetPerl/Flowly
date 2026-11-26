package com.flowly.api.model.dto;

import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.entity.UserTag;

public record EffectiveTag(
        Tag tag,
        UserTag override,
        String name,
        Integer sortOrder,
        boolean isHidden
) {
}
