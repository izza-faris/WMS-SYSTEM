package com.wms.service;

import com.wms.dto.*;
import com.wms.entity.*;
import com.wms.exception.BusinessRuleException;
import com.wms.exception.ResourceNotFoundException;
import com.wms.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final BranchRepository branchRepository;
    private final ZoneRepository zoneRepository;
    private final RackRepository rackRepository;
    private final ShelfRepository shelfRepository;
    private final BinRepository binRepository;
    private final TenantSecurityService tenantSecurityService;
    private final AuditLogService auditLogService;
    private final QrBarcodeService qrBarcodeService;

    public WarehouseService(WarehouseRepository warehouseRepository, BranchRepository branchRepository,
                            ZoneRepository zoneRepository, RackRepository rackRepository,
                            ShelfRepository shelfRepository, BinRepository binRepository,
                            TenantSecurityService tenantSecurityService, AuditLogService auditLogService,
                            QrBarcodeService qrBarcodeService) {
        this.warehouseRepository = warehouseRepository;
        this.branchRepository = branchRepository;
        this.zoneRepository = zoneRepository;
        this.rackRepository = rackRepository;
        this.shelfRepository = shelfRepository;
        this.binRepository = binRepository;
        this.tenantSecurityService = tenantSecurityService;
        this.auditLogService = auditLogService;
        this.qrBarcodeService = qrBarcodeService;
    }

    public List<WarehouseDto> getAllWarehouses() {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        return warehouseRepository.findByClientId(clientId).stream()
                .map(this::convertWarehouseToDto)
                .collect(Collectors.toList());
    }

    public List<WarehouseDto> getWarehousesByBranch(Long branchId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        tenantSecurityService.validateBranchAccess(branchId);
        return warehouseRepository.findByClientIdAndBranchId(clientId, branchId).stream()
                .map(this::convertWarehouseToDto)
                .collect(Collectors.toList());
    }

    public WarehouseDto getWarehouseById(Long id) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Warehouse wh = warehouseRepository.findByIdAndClientId(id, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));
        tenantSecurityService.validateBranchAccess(wh.getBranchId());
        return convertWarehouseToDto(wh);
    }

    @Transactional
    public WarehouseDto createWarehouse(WarehouseDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        tenantSecurityService.validateBranchAccess(dto.getBranchId());

        if (warehouseRepository.existsByClientIdAndCode(clientId, dto.getCode())) {
            throw new BusinessRuleException("Warehouse code '" + dto.getCode() + "' already exists.");
        }

        Warehouse wh = new Warehouse(clientId, dto.getBranchId(), dto.getName(), dto.getCode(), dto.getAddress());
        wh = warehouseRepository.save(wh);

        auditLogService.logClientAction(clientId, "WAREHOUSE_CREATED", "Warehouse", wh.getId(),
                "Created warehouse: " + wh.getName() + " (" + wh.getCode() + ")");

        return convertWarehouseToDto(wh);
    }

    public WarehouseTreeDto getWarehouseHierarchyTree(Long warehouseId) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Warehouse wh = warehouseRepository.findByIdAndClientId(warehouseId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + warehouseId));
        tenantSecurityService.validateBranchAccess(wh.getBranchId());

        WarehouseTreeDto tree = new WarehouseTreeDto();
        tree.setId(wh.getId());
        tree.setName(wh.getName());
        tree.setCode(wh.getCode());
        tree.setBranchId(wh.getBranchId());
        branchRepository.findById(wh.getBranchId()).ifPresent(b -> tree.setBranchName(b.getBranchName()));

        List<Zone> zones = zoneRepository.findByWarehouseId(wh.getId());
        List<ZoneDto> zoneDtos = new ArrayList<>();

        for (Zone zone : zones) {
            ZoneDto zDto = new ZoneDto();
            zDto.setId(zone.getId());
            zDto.setClientId(clientId);
            zDto.setWarehouseId(warehouseId);
            zDto.setName(zone.getName());
            zDto.setCode(zone.getCode());
            zDto.setDescription(zone.getDescription());

            List<Rack> racks = rackRepository.findByZoneId(zone.getId());
            List<RackDto> rackDtos = new ArrayList<>();

            for (Rack rack : racks) {
                RackDto rDto = new RackDto();
                rDto.setId(rack.getId());
                rDto.setClientId(clientId);
                rDto.setZoneId(zone.getId());
                rDto.setCode(rack.getCode());

                List<Shelf> shelves = shelfRepository.findByRackId(rack.getId());
                List<ShelfDto> shelfDtos = new ArrayList<>();

                for (Shelf shelf : shelves) {
                    ShelfDto sDto = new ShelfDto();
                    sDto.setId(shelf.getId());
                    sDto.setClientId(clientId);
                    sDto.setRackId(rack.getId());
                    sDto.setCode(shelf.getCode());

                    List<Bin> bins = binRepository.findByShelfId(shelf.getId());
                    List<BinDto> binDtos = bins.stream().map(b -> {
                        BinDto bDto = new BinDto();
                        bDto.setId(b.getId());
                        bDto.setClientId(clientId);
                        bDto.setShelfId(shelf.getId());
                        bDto.setCode(b.getCode());
                        bDto.setQrCode(b.getQrCode());
                        bDto.setCapacityCubicMeters(b.getCapacityCubicMeters());
                        bDto.setIsActive(b.getIsActive());
                        return bDto;
                    }).collect(Collectors.toList());

                    sDto.setBins(binDtos);
                    shelfDtos.add(sDto);
                }

                rDto.setShelves(shelfDtos);
                rackDtos.add(rDto);
            }

            zDto.setRacks(rackDtos);
            zoneDtos.add(zDto);
        }

        tree.setZones(zoneDtos);
        return tree;
    }

    @Transactional
    public ZoneDto addZone(Long warehouseId, ZoneDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Warehouse wh = warehouseRepository.findByIdAndClientId(warehouseId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

        if (zoneRepository.existsByWarehouseIdAndCode(warehouseId, dto.getCode())) {
            throw new BusinessRuleException("Zone code '" + dto.getCode() + "' already exists in this warehouse.");
        }

        Zone zone = new Zone(clientId, warehouseId, dto.getName(), dto.getCode(), dto.getDescription());
        zone = zoneRepository.save(zone);

        dto.setId(zone.getId());
        dto.setClientId(clientId);
        dto.setWarehouseId(warehouseId);
        return dto;
    }

    @Transactional
    public RackDto addRack(Long zoneId, RackDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Zone zone = zoneRepository.findByIdAndClientId(zoneId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Zone not found"));

        if (rackRepository.existsByZoneIdAndCode(zoneId, dto.getCode())) {
            throw new BusinessRuleException("Rack code '" + dto.getCode() + "' already exists in this zone.");
        }

        Rack rack = new Rack(clientId, zoneId, dto.getCode());
        rack = rackRepository.save(rack);

        dto.setId(rack.getId());
        dto.setClientId(clientId);
        dto.setZoneId(zoneId);
        return dto;
    }

    @Transactional
    public ShelfDto addShelf(Long rackId, ShelfDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Rack rack = rackRepository.findByIdAndClientId(rackId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Rack not found"));

        if (shelfRepository.existsByRackIdAndCode(rackId, dto.getCode())) {
            throw new BusinessRuleException("Shelf code '" + dto.getCode() + "' already exists on this rack.");
        }

        Shelf shelf = new Shelf(clientId, rackId, dto.getCode());
        shelf = shelfRepository.save(shelf);

        dto.setId(shelf.getId());
        dto.setClientId(clientId);
        dto.setRackId(rackId);
        return dto;
    }

    @Transactional
    public BinDto addBin(Long shelfId, BinDto dto) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Shelf shelf = shelfRepository.findByIdAndClientId(shelfId, clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Shelf not found"));
        Rack rack = rackRepository.findById(shelf.getRackId()).orElseThrow();
        Zone zone = zoneRepository.findById(rack.getZoneId()).orElseThrow();
        Warehouse wh = warehouseRepository.findById(zone.getWarehouseId()).orElseThrow();

        if (binRepository.existsByShelfIdAndCode(shelfId, dto.getCode())) {
            throw new BusinessRuleException("Bin code '" + dto.getCode() + "' already exists on this shelf.");
        }

        // Generate standard hierarchical Location QR Code (e.g. WH01-ZA-R01-S02-B03)
        String locationQr = String.format("%s-%s-%s-%s-%s",
                wh.getCode(), zone.getCode(), rack.getCode(), shelf.getCode(), dto.getCode());

        Bin bin = new Bin(clientId, shelfId, dto.getCode(), locationQr, dto.getCapacityCubicMeters());
        bin = binRepository.save(bin);

        dto.setId(bin.getId());
        dto.setClientId(clientId);
        dto.setShelfId(shelfId);
        dto.setQrCode(locationQr);
        return dto;
    }

    public BinDto findBinByQrCode(String qrCode) {
        Long clientId = tenantSecurityService.requireCurrentClientId();
        Bin bin = binRepository.findByClientIdAndQrCode(clientId, qrCode)
                .orElseThrow(() -> new ResourceNotFoundException("Location Bin with QR '" + qrCode + "' not found."));

        BinDto dto = new BinDto();
        dto.setId(bin.getId());
        dto.setClientId(bin.getClientId());
        dto.setShelfId(bin.getShelfId());
        dto.setCode(bin.getCode());
        dto.setQrCode(bin.getQrCode());
        dto.setCapacityCubicMeters(bin.getCapacityCubicMeters());
        dto.setIsActive(bin.getIsActive());
        return dto;
    }

    private WarehouseDto convertWarehouseToDto(Warehouse wh) {
        WarehouseDto dto = new WarehouseDto();
        dto.setId(wh.getId());
        dto.setClientId(wh.getClientId());
        dto.setBranchId(wh.getBranchId());
        dto.setName(wh.getName());
        dto.setCode(wh.getCode());
        dto.setAddress(wh.getAddress());
        dto.setIsActive(wh.getIsActive());
        branchRepository.findById(wh.getBranchId()).ifPresent(b -> dto.setBranchName(b.getBranchName()));
        return dto;
    }
}
