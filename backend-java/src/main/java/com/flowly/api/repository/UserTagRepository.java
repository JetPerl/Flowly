package com.flowly.api.repository;

import com.flowly.api.model.entity.UserTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserTagRepository extends JpaRepository<UserTag, Integer> {

    List<UserTag> findAllByUserId(Integer userId);

    Optional<UserTag> findByUserIdAndTagId(Integer userId, Integer tagId);

    void deleteByUserIdAndTagId(Integer userId, Integer tagId);
}
