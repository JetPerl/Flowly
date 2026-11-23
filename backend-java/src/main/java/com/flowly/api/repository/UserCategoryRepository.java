package com.flowly.api.repository;

import com.flowly.api.model.entity.UserCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserCategoryRepository extends JpaRepository<UserCategory, Integer> {

    List<UserCategory> findAllByUserId(Integer userId);

    Optional<UserCategory> findByUserIdAndCategoryId(Integer userId, Integer categoryId);

    void deleteByUserIdAndCategoryId(Integer userId, Integer categoryId);
}
