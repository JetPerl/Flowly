package com.flowly.api.mapper;

import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.response.OperationResponse;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-11-05T15:12:38+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.13 (Eclipse Adoptium)"
)
@Component
public class OperationMapperImpl implements OperationMapper {

    @Override
    public OperationResponse toOperationResponse(Operation op) {
        if ( op == null ) {
            return null;
        }

        Integer relatedAccountId = null;
        Integer transferId = null;
        String note = null;
        String recipient = null;
        String place = null;
        List<TagDto> tags = null;
        String merchant = null;
        String photoUrl = null;
        Boolean isPinned = null;
        OffsetDateTime dateTime = null;
        Integer id = null;
        BigDecimal amount = null;
        String currency = null;

        relatedAccountId = op.getRelatedAccountId();
        transferId = op.getTransferId();
        note = op.getComment();
        recipient = op.getRecipient();
        place = op.getPlace();
        tags = tagListToTagDtoList( op.getTags() );
        merchant = op.getMerchant();
        photoUrl = op.getPhotoUrl();
        isPinned = op.getIsPinned();
        dateTime = op.getDate();
        id = op.getId();
        amount = op.getAmount();
        currency = op.getCurrency();

        String type = op.getType() != null ? op.getType().name().toLowerCase() : null;
        String category = op.getCategory() != null ? op.getCategory().getName() : "Без категории";
        String categoryIcon = op.getCategory() != null ? op.getCategory().getIcon() : null;
        String categoryColor = op.getCategory() != null ? op.getCategory().getColor() : null;
        Integer categoryId = op.getCategory() != null ? op.getCategory().getId() : null;
        String account = op.getAccount() != null ? op.getAccount().getName() : "Счет";
        Integer accountId = op.getAccount() != null ? op.getAccount().getId() : null;
        String accountIcon = op.getAccount() != null ? op.getAccount().getIcon() : null;
        String accountColor = op.getAccount() != null ? op.getAccount().getColor() : null;

        OperationResponse operationResponse = new OperationResponse( id, type, amount, currency, category, categoryIcon, categoryColor, categoryId, account, accountId, accountIcon, accountColor, relatedAccountId, transferId, note, recipient, place, tags, merchant, photoUrl, isPinned, dateTime );

        return operationResponse;
    }

    protected TagDto tagToTagDto(Tag tag) {
        if ( tag == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String color = null;
        String icon = null;

        if ( tag.getId() != null ) {
            id = tag.getId().longValue();
        }
        name = tag.getName();
        color = tag.getColor();
        icon = tag.getIcon();

        TagDto tagDto = new TagDto( id, name, color, icon );

        return tagDto;
    }

    protected List<TagDto> tagListToTagDtoList(List<Tag> list) {
        if ( list == null ) {
            return null;
        }

        List<TagDto> list1 = new ArrayList<TagDto>( list.size() );
        for ( Tag tag : list ) {
            list1.add( tagToTagDto( tag ) );
        }

        return list1;
    }
}
