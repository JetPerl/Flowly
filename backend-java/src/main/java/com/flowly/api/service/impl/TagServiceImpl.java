package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.entity.UserTag;
import com.flowly.api.model.request.tag.TagCreateRequest;
import com.flowly.api.model.request.tag.TagUpdateRequest;
import com.flowly.api.repository.TagRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.repository.UserTagRepository;
import com.flowly.api.service.TagService;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TagServiceImpl implements TagService {

    TagRepository tagRepository;
    UserTagRepository userTagRepository;
    UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TagDto> getAllTags(boolean includeHidden) {
        Integer userId = SecurityUtils.getCurrentUserId();

        List<Tag> accessible = tagRepository.findAllAccessibleByUserId(userId);
        Map<Integer, UserTag> overridesByTagId = userTagRepository.findAllByUserId(userId)
                .stream()
                .collect(Collectors.toMap(ut -> ut.getTag().getId(), ut -> ut));

        List<EffectiveTag> effectiveTags = new ArrayList<>();
        for (Tag tag : accessible) {
            UserTag override = overridesByTagId.get(tag.getId());
            EffectiveTag effective = resolveEffectiveTag(tag, override);

            if (!includeHidden && Boolean.TRUE.equals(effective.isHidden())) {
                continue;
            }
            effectiveTags.add(effective);
        }

        effectiveTags.sort(
                Comparator.comparing((EffectiveTag et) -> et.sortOrder() == null ? Integer.MAX_VALUE : et.sortOrder())
                        .thenComparing(EffectiveTag::name, String.CASE_INSENSITIVE_ORDER)
        );

        return effectiveTags.stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TagDto getTagById(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Tag tag = findAccessibleTag(id, userId);
        UserTag override = userTagRepository.findByUserIdAndTagId(userId, tag.getId()).orElse(null);
        return toDto(resolveEffectiveTag(tag, override));
    }

    @Override
    @Transactional
    public TagDto createTag(TagCreateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        User user = getCurrentUserEntity(userId);

        Tag tag = Tag.builder()
                .name(request.name().trim())
                .color(request.color())
                .icon(request.icon())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isSystem(false)
                .isArchived(false)
                .user(user)
                .build();

        Tag saved = tagRepository.save(tag);
        return toDto(resolveEffectiveTag(saved, null));
    }

    @Override
    @Transactional
    public TagDto updateTag(Integer id, TagUpdateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        User user = getCurrentUserEntity(userId);
        Tag tag = findAccessibleTag(id, userId);

        boolean isSystem = Boolean.TRUE.equals(tag.getIsSystem());

        if (!isSystem) {
            if (tag.getUser() == null || !tag.getUser().getId().equals(userId)) {
                throw new ForbiddenAccessException("У вас нет прав для изменения этой метки");
            }

            if (request.name() != null) {
                tag.setName(request.name().trim());
            }
            if (request.color() != null) {
                tag.setColor(request.color());
            }
            if (request.icon() != null) {
                tag.setIcon(request.icon());
            }
            if (request.sortOrder() != null) {
                tag.setSortOrder(request.sortOrder());
            }
            if (request.isHidden() != null) {
                tag.setIsArchived(request.isHidden());
            }

            Tag saved = tagRepository.save(tag);
            UserTag override = userTagRepository.findByUserIdAndTagId(userId, saved.getId()).orElse(null);
            return toDto(resolveEffectiveTag(saved, override));
        }

        UserTag override = userTagRepository.findByUserIdAndTagId(userId, tag.getId())
                .orElseGet(() -> UserTag.builder()
                        .user(user)
                        .tag(tag)
                        .isHidden(false)
                        .isCustomized(false)
                        .build());

        if (request.name() != null) {
            override.setCustomName(request.name().trim());
            override.setIsCustomized(true);
        }
        if (request.color() != null) {
            override.setCustomColor(request.color());
            override.setIsCustomized(true);
        }
        if (request.icon() != null) {
            override.setCustomIcon(request.icon());
            override.setIsCustomized(true);
        }
        if (request.sortOrder() != null) {
            override.setSortOrder(request.sortOrder());
            override.setIsCustomized(true);
        }
        if (request.isHidden() != null) {
            override.setIsHidden(request.isHidden());
            if (request.isHidden()) {
                override.setIsCustomized(true);
            }
        }

        UserTag savedOverride = userTagRepository.save(override);
        return toDto(resolveEffectiveTag(tag, savedOverride));
    }

    @Override
    @Transactional
    public TagDto resetTag(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Tag tag = findAccessibleTag(id, userId);

        if (!Boolean.TRUE.equals(tag.getIsSystem())) {
            throw new BusinessValidationException("Сброс до стандарта доступен только для стандартных меток");
        }

        userTagRepository.findByUserIdAndTagId(userId, tag.getId())
                .ifPresent(userTagRepository::delete);

        return toDto(resolveEffectiveTag(tag, null));
    }

    @Override
    @Transactional
    public void deleteTag(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Tag tag = findAccessibleTag(id, userId);

        if (Boolean.TRUE.equals(tag.getIsSystem())) {
            throw new BusinessValidationException(
                    "Стандартную метку нельзя удалить физически. Используйте скрытие или сброс до стандарта"
            );
        }

        if (tag.getUser() == null || !tag.getUser().getId().equals(userId)) {
            throw new ForbiddenAccessException("У вас нет прав для удаления этой метки");
        }

        tagRepository.unlinkTagFromOperations(tag.getId());
        userTagRepository.deleteByUserIdAndTagId(userId, tag.getId());
        tagRepository.delete(tag);
    }

    private Tag findAccessibleTag(Integer id, Integer userId) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Метка с ID " + id + " не найдена"));

        boolean isSystem = Boolean.TRUE.equals(tag.getIsSystem()) && tag.getUser() == null;
        boolean isOwner = tag.getUser() != null && tag.getUser().getId().equals(userId);

        if (!isSystem && !isOwner) {
            throw new ForbiddenAccessException("У вас нет прав доступа к этой метке");
        }
        return tag;
    }

    private User getCurrentUserEntity(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с ID " + userId + " не найден"));
    }

    private EffectiveTag resolveEffectiveTag(Tag tag, UserTag override) {
        boolean isSystem = Boolean.TRUE.equals(tag.getIsSystem());
        boolean customized = override != null && Boolean.TRUE.equals(override.getIsCustomized());

        String name = (override != null && override.getCustomName() != null)
                ? override.getCustomName()
                : tag.getName();

        String color = (override != null && override.getCustomColor() != null)
                ? override.getCustomColor()
                : tag.getColor();

        String icon = (override != null && override.getCustomIcon() != null)
                ? override.getCustomIcon()
                : tag.getIcon();

        Integer sortOrder = (override != null && override.getSortOrder() != null)
                ? override.getSortOrder()
                : tag.getSortOrder();

        boolean hidden = (override != null && Boolean.TRUE.equals(override.getIsHidden()))
                || Boolean.TRUE.equals(tag.getIsArchived());

        return new EffectiveTag(
                tag.getId(),
                name,
                color,
                icon,
                sortOrder,
                isSystem,
                customized,
                hidden
        );
    }

    private TagDto toDto(EffectiveTag et) {
        return new TagDto(
                et.id().longValue(),
                et.name(),
                et.color(),
                et.icon()
        );
    }

    private record EffectiveTag(
            Integer id,
            String name,
            String color,
            String icon,
            Integer sortOrder,
            Boolean isSystem,
            Boolean isCustomized,
            Boolean isHidden
    ) {
    }
}
