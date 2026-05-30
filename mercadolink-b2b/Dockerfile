FROM eclipse-temurin:17-jre-alpine
LABEL maintainer="Aspropa <admin@aspropa.pe>"
LABEL description="MercadoLink B2B API - Springboot 3.3 + H2 Database"

WORKDIR /app

# Copiar el JAR compilado
COPY target/mercadolink-b2b.jar .

# Puerto expuesto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Arrancar la app
ENTRYPOINT ["java", "-jar", "mercadolink-b2b.jar"]
