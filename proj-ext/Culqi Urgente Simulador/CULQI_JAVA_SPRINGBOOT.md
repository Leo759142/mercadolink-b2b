# Integración Culqi SDK Java con Spring Boot

## Requisitos

- Java 11+
- Spring Boot 2.x o 3.x
- Maven o Gradle
- Claves API de Culqi (test o producción)

## Instalación

Agrega la dependencia en tu `pom.xml`:

```xml
<dependency>
    <groupId>com.culqi</groupId>
    <artifactId>culqi-java</artifactId>
    <version>2.0.0</version>
</dependency>
```

## Configuración

### application.yml

```yaml
culqi:
  public-key: pk_test_tu_clave_publica
  private-key: sk_test_tu_clave_privada
  rsa-public-key: "" # Opcional, para encriptación
  rsa-id: "" # Opcional, para encriptación
```

### ConfigProperties.java

```java
@ConfigurationProperties(prefix = "culqi")
@Data
public class CulqiProperties {
    private String publicKey;
    private String privateKey;
    private String rsaPublicKey;
    private String rsaId;
}
```

## Servicios

### CulqiService.java

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CulqiService {
    
    private final CulqiProperties properties;
    
    private CulqiClient getClient() {
        return new CulqiClient(properties.getPublicKey(), properties.getPrivateKey());
    }
    
    public Token createToken(CardData data) {
        return getClient().token().create(data);
    }
    
    public Charge createCharge(ChargeData data) {
        return getClient().charge().create(data);
    }
    
    public Customer createCustomer(CustomerData data) {
        return getClient().customer().create(data);
    }
    
    public Order createOrder(OrderData data) {
        return getClient().order().create(data);
    }
}
```

## Modelos

### TokenRequest.java

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenRequest {
    private String card_number;
    private String cvv;
    private String expiration_month;
    private String expiration_year;
    private String currency_code;
    private String email;
    private Device device;
}
```

### ChargeRequest.java

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChargeRequest {
    private Integer amount;
    private String currency_code = "PEN";
    private String email;
    private String source_id;
    private Map<String, Object> metadata;
}
```

### CustomerRequest.java

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequest {
    private String email;
    private String first_name;
    private String last_name;
    private String phone_number;
    private String address;
    private String address_city;
    private String country_code = "PE";
}
```

## Controlador REST

### PaymentController.java

```java
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {
    
    private final CulqiService culqiService;
    
    @PostMapping("/token")
    public ResponseEntity<?> createToken(@RequestBody TokenRequest request) {
        try {
            Token token = culqiService.createToken(request);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/charge")
    public ResponseEntity<?> createCharge(@RequestBody ChargeRequest request) {
        try {
            Charge charge = culqiService.createCharge(request);
            return ResponseEntity.ok(charge);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/customer")
    public ResponseEntity<?> createCustomer(@RequestBody CustomerRequest request) {
        try {
            Customer customer = culqiService.createCustomer(request);
            return ResponseEntity.ok(customer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
```

## Tarjetas de Prueba

| Tipo | Número | CVV | Fecha |
|------|--------|-----|-------|
| Visa | 4111111111111111 | 123 | 09/2026 |
| Mastercard | 5111111111111118 | 456 | 12/2027 |
| Amex | 341111111111111 | 7890 | 06/2026 |
| Dinners | 301111111111111 | 123 | 11/2025 |

## Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-----------|
| POST | /api/token | Crear token |
| POST | /api/charge | Crear cargo |
| POST | /api/customer | Crear cliente |
| POST | /api/card | Asociar tarjeta |
| POST | /api/plan | Crear plan |
| POST | /api/subscription | Crear suscripción |
| POST | /api/order | Crear orden |
| POST | /api/refund | Crear devolución |

## Ejecución

```bash
./mvnw spring-boot:run
```

El servidor correrá en `http://localhost:8080`.

## Notas Importantes

1. Los montos son en centavos (5000 = S/ 50.00)
2. La moneda debe ser "PEN" o "USD"
3. Para RSA, configura `rsa-public-key` con formato PEM completo
4. Usa siempre tarjetas de prueba en ambiente test