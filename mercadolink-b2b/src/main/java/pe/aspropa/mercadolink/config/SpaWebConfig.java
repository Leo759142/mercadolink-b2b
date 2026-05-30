package pe.aspropa.mercadolink.config;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    private static final String SPA_INDEX = "index.html";

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addRedirectViewController("/app", "/app/");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/app/static/**")
                .addResourceLocations("classpath:/static/app/static/")
                .resourceChain(false);
        registry.addResourceHandler("/app/**")
                .addResourceLocations("classpath:/static/app/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        String path = normalize(resourcePath);

                        if (!path.isEmpty()) {
                            Resource requested = location.createRelative(path);
                            if (isServeableFile(requested)) {
                                return requested;
                            }

                            if (hasExtension(path)) {
                                return null;
                            }
                        }

                        Resource index = location.createRelative(SPA_INDEX);
                        return isServeableFile(index) ? index : null;
                    }
                });
    }

    private static String normalize(String resourcePath) {
        if (resourcePath == null) {
            return "";
        }

        String path = resourcePath.trim();
        if (path.isEmpty() || ".".equals(path) || "/".equals(path)) {
            return "";
        }

        while (path.startsWith("/")) {
            path = path.substring(1);
        }

        return path;
    }

    private static boolean hasExtension(String path) {
        int slash = path.lastIndexOf('/');
        int dot = path.lastIndexOf('.');
        return dot > slash;
    }

    private static boolean isServeableFile(Resource resource) throws IOException {
        return resource != null
                && resource.exists()
                && resource.isReadable()
                && resource.contentLength() > 0;
    }
}