package pe.aspropa.mercadolink.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import pe.aspropa.mercadolink.dto.ApiError;

import java.util.List;
import java.util.UUID;

/**
 * Convierte excepciones en respuestas JSON consistentes según el catálogo
 * de excepciones definido en el Avance 1 (sección 3.2.3).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> business(BusinessException ex) {
        ApiError err = new ApiError(ex.getCode(), ex.getStatus().value(),
                ex.getStatus().getReasonPhrase(), ex.getMessage(), correlationId());
        return ResponseEntity.status(ex.getStatus()).body(err);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        List<String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .toList();
        ApiError err = new ApiError("EX-VAL-001", 400, "Bad Request",
                "Errores de validación en la solicitud", correlationId());
        err.setFieldErrors(fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> auth(AuthenticationException ex) {
        ApiError err = new ApiError("EX-AUTH-001", 401, "Unauthorized",
                "Credenciales inválidas o token ausente", correlationId());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> denied(AccessDeniedException ex) {
        ApiError err = new ApiError("EX-AUTH-002", 403, "Forbidden",
                "Acceso no autorizado para este rol", correlationId());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> notFound(NoResourceFoundException ex) {
        ApiError err = new ApiError("EX-NOT-FOUND", 404, "Not Found",
                "Recurso no encontrado", correlationId());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> generic(Exception ex) {
        String cid = correlationId();
        log.error("Error interno [correlationId={}]: {}", cid, ex.getMessage(), ex);
        ApiError err = new ApiError("EX-SYS-001", 500, "Internal Server Error",
                "Error interno no controlado", cid);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
    }

    private static String correlationId() {
        return UUID.randomUUID().toString();
    }
}
