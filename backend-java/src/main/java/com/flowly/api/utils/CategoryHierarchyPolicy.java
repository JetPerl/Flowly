package com.flowly.api.utils;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.repository.CategoryRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class CategoryHierarchyPolicy {

    public static final int MAX_CATEGORY_DEPTH = 5;

    private CategoryHierarchyPolicy() {
    }

    public static Category validateAndResolveParent(
            CategoryType type,
            Integer currentCategoryId,
            Long newParentId,
            Integer userId,
            boolean checkSubtree,
            CategoryRepository categoryRepository
    ) {
        if (currentCategoryId != null && newParentId.intValue() == currentCategoryId) {
            throw new BusinessValidationException("Категория не может быть родителем самой себя");
        }

        Category parent = findAccessibleCategory(newParentId.intValue(), userId, categoryRepository);
        if (parent.getType() != type) {
            throw new BusinessValidationException("Тип подкатегории должен совпадать с типом родительской категории");
        }

        int parentDepth = calculateDepthToRoot(parent, new HashSet<>());
        int requiredLevels = checkSubtree
                ? calculateSubtreeHeight(
                        findAccessibleCategory(currentCategoryId, userId, categoryRepository),
                        new HashSet<>(),
                        categoryRepository
                )
                : 1;

        if (parentDepth + requiredLevels > MAX_CATEGORY_DEPTH) {
            throw new BusinessValidationException(
                    "Превышена максимальная глубина иерархии категорий (" + MAX_CATEGORY_DEPTH + " уровней)"
            );
        }

        return parent;
    }

    private static Category findAccessibleCategory(Integer id, Integer userId, CategoryRepository categoryRepository) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Категория с ID " + id + " не найдена"));

        CategoryAccessPolicy.assertAccessible(category, userId);
        return category;
    }

    private static int calculateDepthToRoot(Category category, Set<Integer> visited) {
        int depth = 0;
        Category current = category;
        while (current != null) {
            if (current.getId() != null && !visited.add(current.getId())) {
                throw new BusinessValidationException("Обнаружен цикл в иерархии категорий");
            }
            depth++;
            if (depth > MAX_CATEGORY_DEPTH) {
                throw new BusinessValidationException(
                        "Превышена максимальная глубина иерархии категорий (" + MAX_CATEGORY_DEPTH + " уровней)"
                );
            }
            current = current.getParent();
        }
        return depth;
    }

    private static int calculateSubtreeHeight(
            Category node,
            Set<Integer> visited,
            CategoryRepository categoryRepository
    ) {
        if (node.getId() != null && !visited.add(node.getId())) {
            throw new BusinessValidationException("Обнаружен цикл в иерархии категорий");
        }
        List<Category> children = categoryRepository.findAllByParentId(node.getId());
        int maxChildHeight = 0;
        for (Category child : children) {
            int childHeight = calculateSubtreeHeight(child, new HashSet<>(visited), categoryRepository);
            if (childHeight > maxChildHeight) {
                maxChildHeight = childHeight;
            }
        }
        return 1 + maxChildHeight;
    }
}
