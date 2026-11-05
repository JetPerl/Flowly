package com.flowly.api.repository;

import com.flowly.api.model.entity.Category;
import com.flowly.api.model.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.user IS NULL) " +
            "AND (:type IS NULL OR c.type = :type) " +
            "AND (c.isHidden = false OR c.isHidden IS NULL) " +
            "ORDER BY c.name ASC")
    List<Category> findAvailableCategories(@Param("userId") Integer userId, @Param("type") CategoryType type);
}
