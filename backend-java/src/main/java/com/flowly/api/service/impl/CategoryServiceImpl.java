package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.mapper.CategoryMapper;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.dto.EffectiveCategory;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.entity.UserCategory;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.model.request.category.CategoryCreateRequest;
import com.flowly.api.model.request.category.CategoryUpdateRequest;
import com.flowly.api.repository.CategoryRepository;
import com.flowly.api.repository.OperationRepository;
import com.flowly.api.repository.UserCategoryRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.CategoryService;
import com.flowly.api.utils.CategoryAccessPolicy;
import com.flowly.api.utils.CategoryHierarchyPolicy;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryServiceImpl implements CategoryService {

    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    UserCategoryRepository userCategoryRepository;
    OperationRepository operationRepository;
    UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategories(CategoryType type, boolean includeHidden, boolean asTree) {
        Integer userId = SecurityUtils.getCurrentUserId();

        List<Category> accessible = categoryRepository.findAllAccessibleByUserId(userId);
        Map<Integer, UserCategory> overridesByCategoryId = userCategoryRepository.findAllByUserId(userId)
                .stream()
                .collect(Collectors.toMap(uc -> uc.getCategory().getId(), uc -> uc));

        List<EffectiveCategory> effectiveList = new ArrayList<>();
        for (Category category : accessible) {
            UserCategory override = overridesByCategoryId.get(category.getId());
            EffectiveCategory effective = resolveEffectiveCategory(category, override);

            if (type != null && effective.type() != type) {
                continue;
            }
            if (!includeHidden && Boolean.TRUE.equals(effective.isHidden())) {
                continue;
            }
            effectiveList.add(effective);
        }

        effectiveList.sort(
                Comparator.comparing((EffectiveCategory ec) -> ec.sortOrder() == null ? Integer.MAX_VALUE : ec.sortOrder())
                        .thenComparing(EffectiveCategory::name, String.CASE_INSENSITIVE_ORDER)
        );

        if (!asTree) {
            return effectiveList.stream()
                    .map(ec -> categoryMapper.toDto(ec, List.of()))
                    .toList();
        }

        return buildTree(effectiveList);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Category category = findAccessibleCategory(id, userId);
        UserCategory override = userCategoryRepository.findByUserIdAndCategoryId(userId, category.getId()).orElse(null);
        return categoryMapper.toDto(resolveEffectiveCategory(category, override), List.of());
    }

    @Override
    @Transactional
    public CategoryDto createCategory(CategoryCreateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        User user = getCurrentUserEntity(userId);

        Category parent = request.parentId() != null
                ? CategoryHierarchyPolicy.validateAndResolveParent(
                    request.type(), null, request.parentId(), userId, false, categoryRepository
                )
                : null;

        Category category = categoryMapper.toEntity(request, parent, user);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toDto(resolveEffectiveCategory(saved, null), List.of());
    }

    @Override
    @Transactional
    public CategoryDto updateCategory(Integer id, CategoryUpdateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        User user = getCurrentUserEntity(userId);
        Category category = findAccessibleCategory(id, userId);

        if (!Boolean.TRUE.equals(category.getIsSystem())) {
            return updateCustomCategory(category, request, userId);
        }

        return updateSystemCategoryOverride(category, request, user, userId);
    }

    @Override
    @Transactional
    public CategoryDto resetCategory(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Category category = findAccessibleCategory(id, userId);

        if (!Boolean.TRUE.equals(category.getIsSystem())) {
            throw new BusinessValidationException("Сброс до стандарта доступен только для стандартных категорий");
        }

        userCategoryRepository.findByUserIdAndCategoryId(userId, category.getId())
                .ifPresent(userCategoryRepository::delete);

        return categoryMapper.toDto(resolveEffectiveCategory(category, null), List.of());
    }

    @Override
    @Transactional
    public void deleteCategory(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Category category = findAccessibleCategory(id, userId);

        if (Boolean.TRUE.equals(category.getIsSystem())) {
            throw new BusinessValidationException(
                    "Стандартную категорию нельзя удалить физически. Используйте скрытие или сброс до стандарта"
            );
        }

        if (category.getUser() == null || !category.getUser().getId().equals(userId)) {
            throw new ForbiddenAccessException("У вас нет прав для удаления этой категории");
        }

        Category fallbackUncategorized = findFallbackUncategorized(category.getType());
        operationRepository.reassignCategory(category.getId(), fallbackUncategorized);

        Category newParentForChildren = category.getParent();
        List<Category> directChildren = categoryRepository.findAllByParentId(category.getId());
        for (Category child : directChildren) {
            child.setParent(newParentForChildren);
            categoryRepository.save(child);
        }

        userCategoryRepository.deleteByUserIdAndCategoryId(userId, category.getId());
        categoryRepository.delete(category);
    }

    private CategoryDto updateCustomCategory(Category category, CategoryUpdateRequest request, Integer userId) {
        if (category.getUser() == null || !category.getUser().getId().equals(userId)) {
            throw new ForbiddenAccessException("У вас нет прав для изменения этой категории");
        }

        Category targetParent = request.parentId() != null
                ? CategoryHierarchyPolicy.validateAndResolveParent(
                    category.getType(), category.getId(), request.parentId(), userId, true, categoryRepository
                )
                : category.getParent();

        categoryMapper.updateEntityFromRequest(request, targetParent, category);

        Category saved = categoryRepository.save(category);
        UserCategory override = userCategoryRepository.findByUserIdAndCategoryId(userId, saved.getId()).orElse(null);
        return categoryMapper.toDto(resolveEffectiveCategory(saved, override), List.of());
    }

    private CategoryDto updateSystemCategoryOverride(
            Category category,
            CategoryUpdateRequest request,
            User user,
            Integer userId
    ) {
        UserCategory override = userCategoryRepository.findByUserIdAndCategoryId(userId, category.getId())
                .orElseGet(() -> UserCategory.builder()
                        .user(user)
                        .category(category)
                        .isHidden(false)
                        .isCustomized(false)
                        .build());

        applyOverrideFields(override, request);

        if (request.parentId() != null) {
            Category newParent = CategoryHierarchyPolicy.validateAndResolveParent(
                    category.getType(), category.getId(), request.parentId(), userId, true, categoryRepository
            );
            override.setCustomParent(newParent);
            override.setIsCustomized(true);
        }

        UserCategory savedOverride = userCategoryRepository.save(override);
        return categoryMapper.toDto(resolveEffectiveCategory(category, savedOverride), List.of());
    }

    private void applyOverrideFields(UserCategory override, CategoryUpdateRequest request) {
        if (request.name() != null) {
            override.setCustomName(request.name().trim());
            override.setIsCustomized(true);
        }
        applyCustomizedValue(override, request.icon(), override::setCustomIcon);
        applyCustomizedValue(override, request.color(), override::setCustomColor);
        applyCustomizedValue(override, request.sortOrder(), override::setSortOrder);

        if (request.isHidden() != null) {
            override.setIsHidden(request.isHidden());
            if (request.isHidden()) {
                override.setIsCustomized(true);
            }
        }
    }

    private <T> void applyCustomizedValue(
            UserCategory override,
            T value,
            java.util.function.Consumer<T> setter
    ) {
        if (value != null) {
            setter.accept(value);
            override.setIsCustomized(true);
        }
    }

    private Category findAccessibleCategory(Integer id, Integer userId) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Категория с ID " + id + " не найдена"));

        CategoryAccessPolicy.assertAccessible(category, userId);
        return category;
    }

    private Category findFallbackUncategorized(CategoryType type) {
        List<Category> candidates = categoryRepository.findDefaultUncategorizedByType(type);
        if (!candidates.isEmpty()) {
            return candidates.getFirst();
        }
        throw new ResourceNotFoundException("Системная категория 'Без категории' для типа " + type + " не найдена");
    }

    private User getCurrentUserEntity(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с ID " + userId + " не найден"));
    }

    private EffectiveCategory resolveEffectiveCategory(Category category, UserCategory override) {
        boolean isSystem = Boolean.TRUE.equals(category.getIsSystem());
        boolean customized = override != null && Boolean.TRUE.equals(override.getIsCustomized());

        String name = (override != null && override.getCustomName() != null)
                ? override.getCustomName()
                : category.getName();

        String icon = (override != null && override.getCustomIcon() != null)
                ? override.getCustomIcon()
                : category.getIcon();

        String color = (override != null && override.getCustomColor() != null)
                ? override.getCustomColor()
                : category.getColor();

        Integer parentId = null;
        if (override != null && override.getCustomParent() != null) {
            parentId = override.getCustomParent().getId();
        } else if (category.getParent() != null) {
            parentId = category.getParent().getId();
        }

        Integer sortOrder = (override != null && override.getSortOrder() != null)
                ? override.getSortOrder()
                : category.getSortOrder();

        boolean hidden = (override != null && Boolean.TRUE.equals(override.getIsHidden()))
                || Boolean.TRUE.equals(category.getIsHidden());

        return new EffectiveCategory(
                category.getId(),
                name,
                category.getType(),
                parentId,
                icon,
                color,
                sortOrder,
                isSystem,
                customized,
                hidden
        );
    }

    private List<CategoryDto> buildTree(List<EffectiveCategory> items) {
        Map<Integer, EffectiveCategory> byId = items.stream()
                .collect(Collectors.toMap(EffectiveCategory::id, item -> item));

        Map<Integer, List<EffectiveCategory>> childrenByParent = new HashMap<>();
        List<EffectiveCategory> roots = new ArrayList<>();

        for (EffectiveCategory item : items) {
            Integer parentId = item.parentId();
            if (parentId != null && byId.containsKey(parentId)) {
                childrenByParent.computeIfAbsent(parentId, k -> new ArrayList<>()).add(item);
            } else {
                roots.add(item);
            }
        }

        return roots.stream()
                .map(root -> toTreeDto(root, childrenByParent, new HashSet<>()))
                .toList();
    }

    private CategoryDto toTreeDto(
            EffectiveCategory node,
            Map<Integer, List<EffectiveCategory>> childrenByParent,
            Set<Integer> visited
    ) {
        if (!visited.add(node.id())) {
            return categoryMapper.toDto(node, List.of());
        }
        List<EffectiveCategory> rawChildren = childrenByParent.getOrDefault(node.id(), List.of());
        List<CategoryDto> childrenList = rawChildren.stream()
                .map(child -> toTreeDto(child, childrenByParent, new HashSet<>(visited)))
                .toList();
        return categoryMapper.toDto(node, childrenList);
    }
}
