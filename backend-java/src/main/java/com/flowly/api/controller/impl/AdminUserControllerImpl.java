package com.flowly.api.controller.impl;

import com.flowly.api.controller.AdminUserController;
import com.flowly.api.service.AdminUserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminUserControllerImpl implements AdminUserController {

    AdminUserService adminUserService;

    @Override
    public ResponseEntity<Void> deleteUser(Integer id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
