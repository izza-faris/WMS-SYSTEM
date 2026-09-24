package com.wms.repository;

import com.wms.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends MongoRepository<Category, Long> {
    List<Category> findByClientId(Long clientId);
    Optional<Category> findByIdAndClientId(Long id, Long clientId);
    boolean existsByClientIdAndName(Long clientId, String name);
}
