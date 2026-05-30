package pe.aspropa.mercadolink.dto;

import java.time.Instant;
import java.util.List;

/**
 * Cuerpo de respuesta de error siguiendo el espíritu de RFC 9457 - Problem Details.
 */
public class ApiError {
    private String code;
    private int status;
    private String title;
    private String detail;
    private String correlationId;
    private List<String> fieldErrors;
    private Instant timestamp = Instant.now();

    public ApiError() {}

    public ApiError(String code, int status, String title, String detail, String correlationId) {
        this.code = code;
        this.status = status;
        this.title = title;
        this.detail = detail;
        this.correlationId = correlationId;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String c) { this.correlationId = c; }
    public List<String> getFieldErrors() { return fieldErrors; }
    public void setFieldErrors(List<String> f) { this.fieldErrors = f; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant t) { this.timestamp = t; }
}
