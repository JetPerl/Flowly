package com.flowly.api.repository;

import com.flowly.api.model.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Integer> {

    @Query("""
            SELECT t FROM Tag t
            WHERE (t.isSystem = true AND t.user IS NULL)
               OR (t.user.id = :userId)
            ORDER BY t.sortOrder ASC NULLS LAST, t.name ASC
            """)
    List<Tag> findAllAccessibleByUserId(@Param("userId") Integer userId);

    Optional<Tag> findByIdAndUserId(Integer id, Integer userId);

    @Modifying
    @Query(value = "DELETE FROM operation_tags WHERE tag_id = :tagId", nativeQuery = true)
    void unlinkTagFromOperations(@Param("tagId") Integer tagId);
}
