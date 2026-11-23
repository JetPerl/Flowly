package com.flowly.api.repository;

import com.flowly.api.model.entity.Category;
import com.flowly.api.model.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    @Query("""
            SELECT c FROM Category c
            LEFT JOIN FETCH c.parent
            WHERE (c.isSystem = true AND c.user IS NULL)
               OR (c.user.id = :userId)
            ORDER BY c.sortOrder ASC NULLS LAST, c.name ASC
            """)
    List<Category> findAllAccessibleByUserId(@Param("userId") Integer userId);

    @Query("""
            SELECT c FROM Category c
            WHERE c.isSystem = true
              AND c.user IS NULL
              AND c.type = :type
              AND LOWER(c.name) = LOWER('Без категории')
            ORDER BY c.id ASC
            """)
    List<Category> findDefaultUncategorizedByType(@Param("type") CategoryType type);

    Optional<Category> findByIdAndUserId(Integer id, Integer userId);

    List<Category> findAllByParentId(Integer parentId);
}
