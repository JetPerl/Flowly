package com.flowly.api.validation.constraints;

import lombok.Getter;

import java.util.regex.Pattern;

@Getter
public enum PatternType {
    ENTITY_NAME("^(?! )(?!.*  )(?!.* $)[A-Za-zА-Яа-яЁё0-9 .,/()№:-]+$"),
    COMMENT("^(?! )(?!.*  )(?!.* $)[A-Za-zА-Яа-яЁё0-9 .,/()№:'@-]+$"),
    URL("^https?:\\/\\/(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,}(?::[0-9]{2,5})?(?:\\/[^\\s]*)?$");

    private final Pattern pattern;

    PatternType(String regex) {
        this.pattern = Pattern.compile(regex);
    }
}
