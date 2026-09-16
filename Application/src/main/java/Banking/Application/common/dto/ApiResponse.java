package Banking.Application.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    @Builder.Default
    private int statusCode = 200;
    private boolean success;
    private String message;
    private T data;
    private Object pagination;

    public static <T> ApiResponse<T> success(int statusCode, String message, T data) {
        return ApiResponse.<T>builder()
                .statusCode(statusCode)
                .success(true)
                .message(message)
                .data(data)
                .pagination(null)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return success(200, message, data);
    }

    public static <T> ApiResponse<java.util.List<T>> success(String message, org.springframework.data.domain.Page<T> page) {
        return ApiResponse.<java.util.List<T>>builder()
                .statusCode(200)
                .success(true)
                .message(message)
                .data(page.getContent())
                .pagination(Pagination.of(page))
                .build();
    }

    public static <T> ApiResponse<T> success(String message) {
        return success(200, message, null);
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return ApiResponse.<T>builder()
                .statusCode(statusCode)
                .success(false)
                .message(message)
                .data(null)
                .pagination(null)
                .build();
    }
}
