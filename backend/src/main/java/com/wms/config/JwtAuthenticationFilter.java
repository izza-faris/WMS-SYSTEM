package com.wms.config;

import com.wms.entity.enums.Role;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Claims claims = tokenProvider.extractAllClaims(jwt);
                String email = claims.getSubject();
                String roleStr = claims.get("role", String.class);
                Role role = Role.valueOf(roleStr);

                Number userIdNum = claims.get("userId", Number.class);
                Long userId = userIdNum != null ? userIdNum.longValue() : null;

                Number clientIdNum = claims.get("clientId", Number.class);
                Long clientId = clientIdNum != null ? clientIdNum.longValue() : null;

                Number branchIdNum = claims.get("branchId", Number.class);
                Long branchId = branchIdNum != null ? branchIdNum.longValue() : null;

                // Populate ThreadLocal TenantContext
                TenantContext.set(new TenantContext.TenantInfo(userId, clientId, branchId, role, email));

                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.name());
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, Collections.singletonList(authority));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
