package com.flowly.api.repository;

import com.flowly.api.model.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {

    List<Account> findByUserId(Integer userId);

    Optional<Account> findByIdAndUserId(Integer id, Integer userId);
}
