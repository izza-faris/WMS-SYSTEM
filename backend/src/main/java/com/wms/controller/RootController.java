package com.wms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping(value = "/", produces = "text/html")
    public String home() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AeroWMS API - Online</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
                        color: #f3f4f6;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        text-align: center;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .card {
                        background: rgba(17, 24, 39, 0.85);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        padding: 2.5rem 2rem;
                        border-radius: 16px;
                        max-width: 500px;
                        width: 100%;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(10px);
                    }
                    .badge {
                        display: inline-block;
                        background: rgba(16, 185, 129, 0.15);
                        color: #10b981;
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        padding: 0.35rem 0.85rem;
                        border-radius: 9999px;
                        font-weight: 600;
                        font-size: 0.85rem;
                        margin-bottom: 1.25rem;
                    }
                    h1 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1.85rem;
                        font-weight: 800;
                        letter-spacing: -0.02em;
                    }
                    .subtitle {
                        color: #9ca3af;
                        font-size: 0.95rem;
                        margin-bottom: 2rem;
                        line-height: 1.5;
                    }
                    .btn {
                        display: inline-block;
                        background: #10b981;
                        color: white;
                        text-decoration: none;
                        padding: 0.85rem 1.75rem;
                        border-radius: 10px;
                        font-weight: 700;
                        font-size: 1rem;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
                    }
                    .btn:hover {
                        background: #059669;
                        transform: translateY(-2px);
                    }
                    .footer {
                        margin-top: 2rem;
                        font-size: 0.78rem;
                        color: #6b7280;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">● Backend API Server Online</div>
                    <h1>AeroWMS Backend</h1>
                    <p class="subtitle">
                        Spring Boot 3 REST API is running live on Railway.
                        To access the full Warehouse Management web application, open the portal below.
                    </p>
                    <a href="https://izza-faris.github.io/WMS-SYSTEM/" class="btn">
                        Open AeroWMS Web App →
                    </a>
                    <div class="footer">
                        AeroWMS Enterprise v1.0.0 &bull; Cloud Production
                    </div>
                </div>
            </body>
            </html>
            """;
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "AeroWMS Backend",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
