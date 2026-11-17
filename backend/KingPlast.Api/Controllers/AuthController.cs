using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using KingPlast.Api.Data;
using KingPlast.Api.Models;

namespace KingPlast.Api.Controllers;

public record BootstrapOwnerDto(string SecretToken, string Email, string Password, string DisplayName);
public record LoginDto(string Email, string Password);
public record InviteAdminDto(string Email, string DisplayName, string Password, List<string> Permissions);

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("bootstrap-status")]
    public async Task<IActionResult> GetBootstrapStatus()
    {
        var bootstrap = await _context.SystemBootstrap.FirstOrDefaultAsync(b => b.Id == 1);
        return Ok(new
        {
            isInitialized = bootstrap?.IsInitialized ?? false,
            initializedAt = bootstrap?.InitializedAt
        });
    }

    /// <summary>
    /// Critical Requirement: Secure First-Owner Bootstrap
    /// Single execution, enforces that only 1 owner can ever exist.
    /// </summary>
    [HttpPost("bootstrap-owner")]
    public async Task<IActionResult> BootstrapFirstOwner([FromBody] BootstrapOwnerDto dto)
    {
        var configuredToken = _configuration["Bootstrap:SecretToken"] ?? "KING_PLAST_BOOTSTRAP_INIT_KEY_2026";
        if (dto.SecretToken != configuredToken)
        {
            return StatusCode(403, new { message = "رمز التهيئة الأمنية غير صحيح (Invalid Bootstrap Token)" });
        }

        var bootstrap = await _context.SystemBootstrap.FirstOrDefaultAsync(b => b.Id == 1);
        if (bootstrap == null)
        {
            bootstrap = new SystemBootstrapState { Id = 1 };
            _context.SystemBootstrap.Add(bootstrap);
        }

        if (bootstrap.IsInitialized)
        {
            return BadRequest(new { message = "تمت تهيئة النظام وتعيين المالك الرئيسي مسبقاً. تم تعطيل نقطة التهيئة نهائياً." });
        }

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existingUser != null)
        {
            return BadRequest(new { message = "البريد الإلكتروني مسجل بالفعل لمستخدم آخر" });
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var owner = new UserAccountEntity
        {
            Email = dto.Email.ToLower().Trim(),
            DisplayName = dto.DisplayName?.Trim() ?? "المالك التنفيذي | KING PLAST",
            PasswordHash = hashedPassword,
            Role = RoleLevel.Owner,
            IsOwner = true,
            PermissionsCsv = "manage_products,manage_categories,manage_quotations,manage_inventory,view_inquiries,manage_admins,manage_settings,view_audit_logs",
            Status = "active",
            CreatedAt = DateTime.UtcNow
        };

        bootstrap.IsInitialized = true;
        bootstrap.OwnerEmail = owner.Email;
        bootstrap.InitializedAt = DateTime.UtcNow;

        _context.Users.Add(owner);
        _context.AuditLogs.Add(new AuditLogEntry
        {
            Action = "SYSTEM_OWNER_BOOTSTRAP",
            PerformedByEmail = owner.Email,
            Details = "Initial secure bootstrap of the King Plast Master Owner account",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var token = GenerateJwt(owner);
        return Ok(new
        {
            message = "تمت تهيئة المالك الرئيسي بنجاح وتم تأمين النظام بشكل كامل",
            token,
            user = new
            {
                owner.Id,
                owner.Email,
                owner.DisplayName,
                Role = "Owner",
                owner.IsOwner
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        if (user.Status == "suspended")
        {
            return StatusCode(403, new { message = "تم تعليق هذا الحساب من قبل الإدارة" });
        }

        var token = GenerateJwt(user);
        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Email,
                user.DisplayName,
                Role = user.Role.ToString(),
                user.IsOwner,
                Permissions = user.PermissionsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries)
            }
        });
    }

    /// <summary>
    /// Owner only: Add up to 3 Super Admins
    /// </summary>
    [HttpPost("super-admins")]
    [Authorize(Policy = "OwnerOnly")]
    public async Task<IActionResult> CreateSuperAdmin([FromBody] InviteAdminDto dto)
    {
        var count = await _context.Users.CountAsync(u => u.Role == RoleLevel.SuperAdmin);
        if (count >= 3)
        {
            return BadRequest(new { message = "تم الوصول للحد الأقصى المسموح به للمديرين المميزين (3 حسابات فقط)" });
        }

        var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (existing != null)
        {
            return BadRequest(new { message = "البريد الإلكتروني مستخدم بالفعل" });
        }

        var user = new UserAccountEntity
        {
            Email = dto.Email.ToLower().Trim(),
            DisplayName = dto.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = RoleLevel.SuperAdmin,
            IsOwner = false,
            PermissionsCsv = string.Join(",", dto.Permissions ?? new List<string> { "manage_products", "manage_quotations" }),
            Status = "active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        _context.AuditLogs.Add(new AuditLogEntry
        {
            Action = "CREATE_SUPER_ADMIN",
            PerformedByEmail = User.FindFirstValue(ClaimTypes.Email) ?? "Owner",
            TargetResource = user.Email,
            Details = $"Super Admin account created with permissions: {user.PermissionsCsv}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "تم إضافة المدير المميز بنجاح", userId = user.Id });
    }

    private string GenerateJwt(UserAccountEntity user)
    {
        var secret = _configuration["JwtSettings:Secret"] ?? "KING_PLAST_ULTRA_SECURE_JWT_SECRET_KEY_2026_MIN_32_CHARS!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("Role", user.Role.ToString()),
            new Claim("IsOwner", user.IsOwner.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "KingPlastApi",
            audience: "KingPlastClient",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
