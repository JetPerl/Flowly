package com.flowly.api.mapper;

import com.flowly.api.model.entity.Account;
import com.flowly.api.model.enums.AccountType;
import com.flowly.api.model.response.AccountResponse;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-11-05T15:12:37+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.13 (Eclipse Adoptium)"
)
@Component
public class AccountMapperImpl implements AccountMapper {

    @Override
    public AccountResponse toAccountResponse(Account account) {
        if ( account == null ) {
            return null;
        }

        Integer id = null;
        String name = null;
        String currency = null;
        BigDecimal balance = null;
        AccountType type = null;
        String color = null;
        String icon = null;

        id = account.getId();
        name = account.getName();
        currency = account.getCurrency();
        balance = account.getBalance();
        type = account.getType();
        color = account.getColor();
        icon = account.getIcon();

        AccountResponse accountResponse = new AccountResponse( id, name, currency, balance, type, color, icon );

        return accountResponse;
    }

    @Override
    public List<AccountResponse> toAccountResponseList(List<Account> accounts) {
        if ( accounts == null ) {
            return null;
        }

        List<AccountResponse> list = new ArrayList<AccountResponse>( accounts.size() );
        for ( Account account : accounts ) {
            list.add( toAccountResponse( account ) );
        }

        return list;
    }
}
