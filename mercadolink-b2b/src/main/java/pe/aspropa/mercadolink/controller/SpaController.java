package pe.aspropa.mercadolink.controller;

import java.io.IOException;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = "/app/", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> appRoot() throws IOException {
        Resource index = new ClassPathResource("static/app/index.html");
        if (!index.exists() || !index.isReadable()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(index);
    }
}
