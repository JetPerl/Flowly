package com.flowly.api.mapper;

import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.request.account.AccountCreateRequest;
import com.flowly.api.model.request.account.AccountUpdateRequest;
import com.flowly.api.model.response.account.AccountResponse;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AccountMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "name", source = "request.name", qualifiedByName = "trim")
    @Mapping(target = "balance", source = "request.balance")
    @Mapping(target = "currency", source = "request.currency", qualifiedByName = "upperTrim")
    @Mapping(target = "type", source = "request.type")
    @Mapping(target = "color", source = "request.color", qualifiedByName = "trim")
    @Mapping(target = "icon", source = "request.icon", qualifiedByName = "trim")
    Account toEntity(AccountCreateRequest request, User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "name", source = "name", qualifiedByName = "trim")
    @Mapping(target = "balance", source = "balance")
    @Mapping(target = "currency", source = "currency", qualifiedByName = "upperTrim")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "color", source = "color", qualifiedByName = "trim")
    @Mapping(target = "icon", source = "icon", qualifiedByName = "trim")
    void updateEntityFromRequest(AccountUpdateRequest request, @MappingTarget Account account);

    AccountResponse toAccountResponse(Account account);

    List<AccountResponse> toAccountResponseList(List<Account> accounts);

    @Named("trim")
    static String trim(String value) {
        return value != null ? value.trim() : null;
    }

    @Named("upperTrim")
    static String upperTrim(String value) {
        return value != null ? value.trim().toUpperCase() : null;
    }
}
