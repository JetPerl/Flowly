package com.flowly.api.model.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record HistorySectionResponse(
        String id,
        LocalDate date,
        String dateLabel,
        BigDecimal totalDayAmount,
        List<OperationResponse> items
) {
}
