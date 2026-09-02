package com.wms.repository;

import com.wms.entity.User;
import com.wms.entity.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByClientId(Long clientId);
    Page<User> findByClientId(Long clientId, Pageable pageable);
    List<User> findByClientIdAndBranchId(Long clientId, Long branchId);
    List<User> findByRole(Role role);
    long countByClientId(Long clientId);
}
