package com.flowly.api.repository;

import com.flowly.api.model.entity.Operation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Integer> {

    @Query("SELECT o FROM Operation o WHERE o.account.id IN :accountIds AND (:cursor IS NULL OR o.id < :cursor) ORDER BY o.date DESC, o.id DESC")
    List<Operation> findOperationsWithCursor(
            @Param("accountIds") List<Integer> accountIds,
            @Param("cursor") Integer cursor,
            Pageable pageable
    );

    @Query("SELECT o FROM Operation o WHERE o.id = :id AND o.account.id IN :accountIds")
    Optional<Operation> findByIdAndAccountIdIn(
            @Param("id") Integer id,
            @Param("accountIds") List<Integer> accountIds
    );
}
