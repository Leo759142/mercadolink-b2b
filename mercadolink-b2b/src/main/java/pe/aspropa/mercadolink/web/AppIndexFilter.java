package pe.aspropa.mercadolink.web;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AppIndexFilter extends OncePerRequestFilter {

    private static final String PATH = "/app/";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        if (PATH.equals(uri)) {
            Resource index = new ClassPathResource("static/app/index.html");
            if (index.exists() && index.isReadable()) {
                response.setContentType("text/html;charset=UTF-8");
                try (InputStream in = index.getInputStream()) {
                    String html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                    response.getWriter().write(html);
                    response.getWriter().flush();
                    return;
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
