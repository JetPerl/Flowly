package com.flowly.api.mapper;

import com.flowly.api.model.entity.Account;
import com.flowly.api.model.response.AccountResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AccountMapper {
    AccountResponse toAccountResponse(Account account);
    List<AccountResponse> toAccountResponseList(List<Account> accounts);
}
