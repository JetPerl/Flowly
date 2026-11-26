package com.flowly.api.mapper;

import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.enums.OperationType;
import com.flowly.api.model.request.operation.OperationCreateRequest;
import com.flowly.api.model.request.operation.OperationPatchRequest;
import com.flowly.api.model.response.operation.OperationResponse;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        uses = TagMapper.class
)
public interface OperationMapper {

    @Mapping(target = "type", expression = "java(op.getType() != null ? op.getType().name().toLowerCase() : null)")
    @Mapping(target = "category", source = "category")
    @Mapping(target = "categoryIcon", source = "categoryIcon")
    @Mapping(target = "categoryColor", source = "categoryColor")
    @Mapping(target = "categoryId", expression = "java(op.getCategory() != null ? op.getCategory().getId() : null)")
    @Mapping(target = "account", expression = "java(op.getAccount() != null ? op.getAccount().getName() : \"Счет\")")
    @Mapping(target = "accountId", expression = "java(op.getAccount() != null ? op.getAccount().getId() : null)")
    @Mapping(target = "accountIcon", expression = "java(op.getAccount() != null ? op.getAccount().getIcon() : null)")
    @Mapping(target = "accountColor", expression = "java(op.getAccount() != null ? op.getAccount().getColor() : null)")
    @Mapping(target = "relatedAccountId", source = "op.relatedAccountId")
    @Mapping(target = "transferId", source = "op.transferId")
    @Mapping(target = "note", source = "op.comment")
    @Mapping(target = "recipient", source = "op.recipient")
    @Mapping(target = "place", source = "op.place")
    @Mapping(target = "tags", source = "tags")
    @Mapping(target = "merchant", source = "op.merchant")
    @Mapping(target = "photoUrl", source = "op.photoUrl")
    @Mapping(target = "isPinned", source = "op.isPinned")
    @Mapping(target = "dateTime", source = "op.date")
    OperationResponse toOperationResponse(
            Operation op,
            String category,
            String categoryIcon,
            String categoryColor,
            List<TagDto> tags
    );

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "relatedAccountId", ignore = true)
    @Mapping(target = "transferId", ignore = true)
    @Mapping(target = "account", source = "account")
    @Mapping(target = "category", source = "category")
    @Mapping(target = "amount", source = "request.amount")
    @Mapping(target = "type", source = "request.type")
    @Mapping(target = "currency", source = "currency")
    @Mapping(target = "date", source = "operationDate")
    @Mapping(target = "comment", source = "request.note")
    @Mapping(target = "merchant", source = "request.merchant")
    @Mapping(target = "place", source = "request.place")
    @Mapping(target = "recipient", source = "request.recipient")
    @Mapping(target = "photoUrl", source = "request.photoUrl")
    @Mapping(target = "isPinned", source = "isPinned")
    @Mapping(target = "tags", source = "tags")
    Operation toEntity(
            OperationCreateRequest request,
            Account account,
            Category category,
            String currency,
            OffsetDateTime operationDate,
            boolean isPinned,
            List<Tag> tags
    );

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "account", source = "account")
    @Mapping(target = "recipient", source = "recipient")
    @Mapping(target = "amount", source = "amount")
    @Mapping(target = "type", source = "type")
    @Mapping(target = "currency", source = "currency")
    @Mapping(target = "relatedAccountId", source = "relatedAccountId")
    @Mapping(target = "transferId", source = "transferId")
    @Mapping(target = "date", source = "operationDate")
    @Mapping(target = "comment", source = "request.note")
    @Mapping(target = "merchant", source = "request.merchant")
    @Mapping(target = "place", source = "request.place")
    @Mapping(target = "photoUrl", source = "request.photoUrl")
    @Mapping(target = "isPinned", source = "isPinned")
    @Mapping(target = "tags", source = "tags")
    Operation toTransferLeg(
            OperationCreateRequest request,
            Account account,
            String recipient,
            BigDecimal amount,
            OperationType type,
            String currency,
            Integer relatedAccountId,
            int transferId,
            OffsetDateTime operationDate,
            boolean isPinned,
            List<Tag> tags
    );

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "relatedAccountId", ignore = true)
    @Mapping(target = "transferId", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "date", source = "dateTime")
    @Mapping(target = "comment", source = "note")
    void updateFromPatch(OperationPatchRequest request, @MappingTarget Operation operation);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "amount", ignore = true)
    @Mapping(target = "type", ignore = true)
    @Mapping(target = "currency", ignore = true)
    @Mapping(target = "relatedAccountId", ignore = true)
    @Mapping(target = "transferId", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "recipient", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "date", source = "dateTime")
    @Mapping(target = "comment", source = "note")
    void syncPartnerFromPatch(OperationPatchRequest request, @MappingTarget Operation partner);
}
