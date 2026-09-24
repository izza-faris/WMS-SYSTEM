package com.wms.config;

import com.wms.service.SequenceGeneratorService;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;

import java.lang.reflect.Field;

@Component
public class MongoAutoIdEventListener extends AbstractMongoEventListener<Object> {

    private final SequenceGeneratorService sequenceGenerator;

    public MongoAutoIdEventListener(SequenceGeneratorService sequenceGenerator) {
        this.sequenceGenerator = sequenceGenerator;
    }

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Object> event) {
        Object source = event.getSource();
        if (source == null) return;

        Field idField = ReflectionUtils.findField(source.getClass(), "id");
        if (idField != null && (idField.getType() == Long.class || idField.getType() == long.class)) {
            ReflectionUtils.makeAccessible(idField);
            Object currentId = ReflectionUtils.getField(idField, source);
            if (currentId == null || ((Number) currentId).longValue() <= 0) {
                String seqName = source.getClass().getSimpleName().toLowerCase() + "_seq";
                long generatedId = sequenceGenerator.generateSequence(seqName);
                ReflectionUtils.setField(idField, source, generatedId);
            }
        }
    }
}
