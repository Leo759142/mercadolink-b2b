package pe.aspropa.mercadolink.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción de negocio mapeada al catálogo de excepciones del Avance 1
 * (sección 3.2.3 y 3.4.5). Cada error lleva un código estable consumible
 * por clientes para mostrar mensajes traducidos.
 */
public class BusinessException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public BusinessException(String code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public static BusinessException notFound(String code, String message) {
        return new BusinessException(code, HttpStatus.NOT_FOUND, message);
    }

    public static BusinessException badRequest(String code, String message) {
        return new BusinessException(code, HttpStatus.BAD_REQUEST, message);
    }

    public static BusinessException conflict(String code, String message) {
        return new BusinessException(code, HttpStatus.CONFLICT, message);
    }

    public static BusinessException forbidden(String code, String message) {
        return new BusinessException(code, HttpStatus.FORBIDDEN, message);
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
}
