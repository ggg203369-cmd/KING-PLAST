using Microsoft.EntityFrameworkCore;
using KingPlast.Api.Models;

namespace KingPlast.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<QuotationRequest> QuotationRequests => Set<QuotationRequest>();
    public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();
    public DbSet<RecyclingStage> RecyclingStages => Set<RecyclingStage>();
    public DbSet<CompanySettings> CompanySettings => Set<CompanySettings>();
    public DbSet<UserAccountEntity> Users => Set<UserAccountEntity>();
    public DbSet<AuditLogEntry> AuditLogs => Set<AuditLogEntry>();
    public DbSet<SystemBootstrapState> SystemBootstrap => Set<SystemBootstrapState>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Product constraints & indexes
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => p.Sku).IsUnique();
            entity.HasIndex(p => p.PolymerType);
            entity.HasIndex(p => p.IsPublished);
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Quotation constraints
        modelBuilder.Entity<QuotationRequest>(entity =>
        {
            entity.HasIndex(q => q.ReferenceNumber).IsUnique();
            entity.HasIndex(q => q.Status);
            entity.HasIndex(q => q.CreatedAt);
        });

        modelBuilder.Entity<QuotationItem>(entity =>
        {
            entity.HasOne(i => i.QuotationRequest)
                  .WithMany(r => r.Items)
                  .HasForeignKey(i => i.QuotationRequestId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Category constraints
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Slug).IsUnique();
        });

        // User constraints
        modelBuilder.Entity<UserAccountEntity>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // System bootstrap singleton constraint
        modelBuilder.Entity<SystemBootstrapState>(entity =>
        {
            entity.HasData(new SystemBootstrapState
            {
                Id = 1,
                IsInitialized = false,
                OwnerEmail = null,
                InitializedAt = null
            });
        });

        // Default Company settings singleton
        modelBuilder.Entity<CompanySettings>(entity =>
        {
            entity.HasData(new CompanySettings
            {
                Id = 1,
                CompanyNameAr = "الكينج بلاست لتجارة وتدوير خامات البلاستيك",
                CompanyNameEn = "KING PLAST For Recycled Raw Materials",
                Phone = "+20 10 0000 0000",
                WhatsappNumber = "+20 10 0000 0000",
                Email = "info@kingplast.com",
                FactoryAddress = "جمهورية مصر العربية — المنطقة الصناعية، العاشر من رمضان",
                WorkingHours = "السبت - الخميس: 8:00 صباحاً - 5:00 مساءً",
                TaglineAr = "من إعادة التدوير إلى خامات تصنع المستقبل"
            });
        });
    }
}
