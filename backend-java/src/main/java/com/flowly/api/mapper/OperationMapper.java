package com.flowly.api.mapper;

import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.response.operation.OperationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OperationMapper {

    @Mapping(target = "type", expression = "java(op.getType() != null ? op.getType().name().toLowerCase() : null)")
    @Mapping(target = "category", expression = "java(op.getCategory() != null ? op.getCategory().getName() : \"Без категории\")")
    @Mapping(target = "categoryIcon", expression = "java(op.getCategory() != null ? op.getCategory().getIcon() : null)")
    @Mapping(target = "categoryColor", expression = "java(op.getCategory() != null ? op.getCategory().getColor() : null)")
    @Mapping(target = "categoryId", expression = "java(op.getCategory() != null ? op.getCategory().getId() : null)")
    @Mapping(target = "account", expression = "java(op.getAccount() != null ? op.getAccount().getName() : \"Счет\")")
    @Mapping(target = "accountId", expression = "java(op.getAccount() != null ? op.getAccount().getId() : null)")
    @Mapping(target = "accountIcon", expression = "java(op.getAccount() != null ? op.getAccount().getIcon() : null)")
    @Mapping(target = "accountColor", expression = "java(op.getAccount() != null ? op.getAccount().getColor() : null)")
    @Mapping(target = "relatedAccountId", source = "relatedAccountId")
    @Mapping(target = "transferId", source = "transferId")
    @Mapping(target = "note", source = "comment")
    @Mapping(target = "recipient", source = "recipient")
    @Mapping(target = "place", source = "place")
    @Mapping(target = "tags", source = "tags")
    @Mapping(target = "merchant", source = "merchant")
    @Mapping(target = "photoUrl", source = "photoUrl")
    @Mapping(target = "isPinned", source = "isPinned")
    @Mapping(target = "dateTime", source = "date")
    OperationResponse toOperationResponse(Operation op);
}
