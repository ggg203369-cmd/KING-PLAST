using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KingPlast.Api.Models;

public enum RoleLevel
{
    Owner = 1,
    SuperAdmin = 2,
    Staff = 3,
    Customer = 4
}

public enum QuotationStatus
{
    New = 1,
    UnderReview = 2,
    Contacted = 3,
    Quoted = 4,
    Completed = 5,
    Cancelled = 6
}

public enum StockStatus
{
    InStock = 1,
    LowStock = 2,
    OnDemand = 3,
    OutOfStock = 4
}

[Table("categories")]
public class Category
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(100)]
    public string NameAr { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? NameEn { get; set; }

    [Required, MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}

[Table("products")]
public class Product
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NameEn { get; set; }

    [Required, MaxLength(50)]
    public string Sku { get; set; } = string.Empty;

    public string? CategoryId { get; set; }
    public Category? Category { get; set; }

    [Required, MaxLength(50)]
    public string PolymerType { get; set; } = "PP"; // PP, HDPE, LDPE, LLDPE, PVC, PET, ABS

    [MaxLength(50)]
    public string Color { get; set; } = "Natural";

    [Required, MaxLength(50)]
    public string Form { get; set; } = "Granules"; // Granules, Flakes, Crystals, Regrind

    [MaxLength(50)]
    public string? Mfi { get; set; } // Melt Flow Index

    [MaxLength(50)]
    public string? Density { get; set; }

    [MaxLength(50)]
    public string? TensileStrength { get; set; }

    [MaxLength(50)]
    public string? MeshFilter { get; set; }

    [MaxLength(50)]
    public string? Moisture { get; set; }

    [MaxLength(100)]
    public string? Packaging { get; set; } = "أكياس 25 كجم";

    [MaxLength(50)]
    public string? MinOrderQuantity { get; set; } = "1 طن";

    public StockStatus StockStatus { get; set; } = StockStatus.InStock;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Price { get; set; }

    [MaxLength(20)]
    public string PriceUnit { get; set; } = "طن";

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(1000)]
    public string? Applications { get; set; }

    [MaxLength(500)]
    public string MainImageUrl { get; set; } = string.Empty;

    public string? AdditionalImagesJson { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

[Table("quotation_requests")]
public class QuotationRequest
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(30)]
    public string ReferenceNumber { get; set; } = string.Empty; // e.g. KP-2026-4821

    [Required, MaxLength(150)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? CompanyName { get; set; }

    [Required, MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Email { get; set; }

    [Required, MaxLength(100)]
    public string Governorate { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public QuotationStatus Status { get; set; } = QuotationStatus.New;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? QuotedPriceTotal { get; set; }

    [MaxLength(1000)]
    public string? QuotedNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();
}

[Table("quotation_items")]
public class QuotationItem
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string QuotationRequestId { get; set; } = string.Empty;
    public QuotationRequest? QuotationRequest { get; set; }

    public string? ProductId { get; set; }
    public Product? Product { get; set; }

    [Required, MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string PolymerType { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Quantity { get; set; }

    [Required, MaxLength(20)]
    public string Unit { get; set; } = "ton"; // ton or kg

    [MaxLength(50)]
    public string? CustomColor { get; set; }

    [MaxLength(500)]
    public string? CustomSpecs { get; set; }

    [MaxLength(100)]
    public string? PackagingPreference { get; set; }
}

[Table("recycling_stages")]
public class RecyclingStage
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(150)]
    public string TitleAr { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string DescriptionAr { get; set; } = string.Empty;

    public int OrderIndex { get; set; } = 1;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("company_settings")]
public class CompanySettings
{
    [Key]
    public int Id { get; set; } = 1; // Singleton row

    [Required, MaxLength(150)]
    public string CompanyNameAr { get; set; } = "الكينج بلاست لتجارة وتدوير خامات البلاستيك";

    [MaxLength(150)]
    public string CompanyNameEn { get; set; } = "KING PLAST For Recycled Raw Materials";

    [Required, MaxLength(50)]
    public string Phone { get; set; } = "+20 10 0000 0000";

    [Required, MaxLength(50)]
    public string WhatsappNumber { get; set; } = "+20 10 0000 0000";

    [MaxLength(150)]
    public string Email { get; set; } = "info@kingplast.com";

    [MaxLength(300)]
    public string FactoryAddress { get; set; } = "جمهورية مصر العربية — المنطقة الصناعية الثالثة، العاشر من رمضان";

    [MaxLength(150)]
    public string WorkingHours { get; set; } = "السبت - الخميس: 8:00 صباحاً - 5:00 مساءً";

    [MaxLength(300)]
    public string TaglineAr { get; set; } = "من إعادة التدوير إلى خامات تصنع المستقبل";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

[Table("users")]
public class UserAccountEntity
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public RoleLevel Role { get; set; } = RoleLevel.Customer;

    public bool IsOwner { get; set; } = false;

    [MaxLength(500)]
    public string PermissionsCsv { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Status { get; set; } = "active";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[Table("audit_logs")]
public class AuditLogEntry
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string PerformedByEmail { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? TargetResource { get; set; }

    [MaxLength(1000)]
    public string Details { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

[Table("system_bootstrap")]
public class SystemBootstrapState
{
    [Key]
    public int Id { get; set; } = 1; // Singleton row

    public bool IsInitialized { get; set; } = false;

    [MaxLength(150)]
    public string? OwnerEmail { get; set; }

    public DateTime? InitializedAt { get; set; }
}
