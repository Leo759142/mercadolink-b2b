package pe.aspropa.mercadolink;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.aspropa.mercadolink.service.TagService;

@Component
public class TagMigrationRunner implements CommandLineRunner {

    private final TagService tagService;

    public TagMigrationRunner(TagService tagService) {
        this.tagService = tagService;
    }

    @Override
    public void run(String... args) {
        tagService.migrarEtiquetasLegacy();
    }
}
