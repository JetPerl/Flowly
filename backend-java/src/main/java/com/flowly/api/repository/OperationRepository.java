package com.flowly.api.repository;

import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.Operation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Integer> {

    @Query("""
            SELECT o FROM Operation o
            JOIN FETCH o.account
            LEFT JOIN FETCH o.category
            WHERE o.account.id IN :accountIds
              AND (:cursor IS NULL OR o.id < :cursor)
            ORDER BY o.date DESC, o.id DESC
            """)
    List<Operation> findOperationsWithCursor(
            @Param("accountIds") List<Integer> accountIds,
            @Param("cursor") Integer cursor,
            Pageable pageable
    );

    List<Operation> findAllByTransferId(Integer transferId);

    @Modifying
    @Query("UPDATE Operation o SET o.category = :fallbackCategory WHERE o.category.id = :categoryId")
    void reassignCategory(@Param("categoryId") Integer categoryId, @Param("fallbackCategory") Category fallbackCategory);
}
