package com.wms.dto;

public class PlatformStatsDto {
    private long totalClients;
    private long activeClients;
    private long pendingClients;
    private long suspendedClients;
    private long totalBranches;
    private long totalWarehouses;
    private long totalUsers;

    public PlatformStatsDto() {}

    public long getTotalClients() { return totalClients; }
    public void setTotalClients(long totalClients) { this.totalClients = totalClients; }

    public long getActiveClients() { return activeClients; }
    public void setActiveClients(long activeClients) { this.activeClients = activeClients; }

    public long getPendingClients() { return pendingClients; }
    public void setPendingClients(long pendingClients) { this.pendingClients = pendingClients; }

    public long getSuspendedClients() { return suspendedClients; }
    public void setSuspendedClients(long suspendedClients) { this.suspendedClients = suspendedClients; }

    public long getTotalBranches() { return totalBranches; }
    public void setTotalBranches(long totalBranches) { this.totalBranches = totalBranches; }

    public long getTotalWarehouses() { return totalWarehouses; }
    public void setTotalWarehouses(long totalWarehouses) { this.totalWarehouses = totalWarehouses; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
}
