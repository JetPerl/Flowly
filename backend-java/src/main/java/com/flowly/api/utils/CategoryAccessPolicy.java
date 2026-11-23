package com.flowly.api.utils;

import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.model.entity.Category;

public final class CategoryAccessPolicy {

    private CategoryAccessPolicy() {
    }

    public static void assertAccessible(Category category, Integer userId) {
        boolean isSystem = Boolean.TRUE.equals(category.getIsSystem()) && category.getUser() == null;
        boolean isOwner = category.getUser() != null && category.getUser().getId().equals(userId);

        if (!isSystem && !isOwner) {
            throw new ForbiddenAccessException("У вас нет прав доступа к этой категории");
        }
    }
}
