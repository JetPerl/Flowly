package com.flowly.api.utils;

import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.model.entity.Tag;

public final class TagAccessPolicy {

    private TagAccessPolicy() {
    }

    public static void assertAccessible(Tag tag, Integer userId) {
        boolean isSystem = Boolean.TRUE.equals(tag.getIsSystem()) && tag.getUser() == null;
        boolean isOwner = tag.getUser() != null
                && userId != null
                && userId.equals(tag.getUser().getId());

        if (!isSystem && !isOwner) {
            throw new ForbiddenAccessException("У вас нет прав доступа к этой метке");
        }
    }
}
