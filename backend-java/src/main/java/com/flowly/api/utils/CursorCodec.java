package com.flowly.api.utils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class CursorCodec {

    private CursorCodec() {
    }

    public static Integer decode(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(cursor), StandardCharsets.UTF_8);
            return Integer.valueOf(decoded);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Некорректный формат курсора пагинации");
        }
    }

    public static String encode(Integer id) {
        if (id == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(id.toString().getBytes(StandardCharsets.UTF_8));
    }
}
