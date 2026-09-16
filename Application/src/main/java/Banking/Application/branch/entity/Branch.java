package Banking.Application.branch.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "branches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "branch_code", nullable = false, unique = true)
    private String branchCode;

    @Column(name = "ifsc_code", nullable = false, unique = true)
    private String ifscCode;

    private String address;
}
