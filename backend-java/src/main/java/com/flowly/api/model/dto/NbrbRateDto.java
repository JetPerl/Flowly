package com.flowly.api.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record NbrbRateDto(
        @JsonProperty("Cur_ID")
        Integer curId,

        @JsonProperty("Cur_Abbreviation")
        String curAbbreviation,

        @JsonProperty("Cur_Scale")
        Integer curScale,

        @JsonProperty("Cur_OfficialRate")
        BigDecimal curOfficialRate
) {
}
