using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KingPlast.Api.Data;
using KingPlast.Api.Models;

namespace KingPlast.Api.Controllers;

public record CreateQuotationItemDto(
    string? ProductId,
    string ProductName,
    string PolymerType,
    decimal Quantity,
    string Unit,
    string? CustomColor,
    string? CustomSpecs,
    string? PackagingPreference
);

public record CreateQuotationRequestDto(
    string CustomerName,
    string? CompanyName,
    string Phone,
    string? Email,
    string Governorate,
    string? Notes,
    List<CreateQuotationItemDto> Items
);

[ApiController]
[Route("api/[controller]")]
public class QuotationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public QuotationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitQuotation([FromBody] CreateQuotationRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CustomerName) || string.IsNullOrWhiteSpace(dto.Phone) || string.IsNullOrWhiteSpace(dto.Governorate))
        {
            return BadRequest(new { message = "يرجى تعبئة كافة الحقول الإلزامية (الاسم، الجوال، المحافظة)" });
        }

        if (dto.Items == null || !dto.Items.Any())
        {
            return BadRequest(new { message = "يجب اختيار خامة واحدة على الأقل لطلب عرض السعر" });
        }

        var year = DateTime.UtcNow.Year;
        var count = await _context.QuotationRequests.CountAsync(q => q.CreatedAt.Year == year);
        var refNumber = $"KP-{year}-{(count + 1001):D4}";

        var request = new QuotationRequest
        {
            ReferenceNumber = refNumber,
            CustomerName = dto.CustomerName.Trim(),
            CompanyName = dto.CompanyName?.Trim(),
            Phone = dto.Phone.Trim(),
            Email = dto.Email?.Trim(),
            Governorate = dto.Governorate.Trim(),
            Notes = dto.Notes?.Trim(),
            Status = QuotationStatus.New,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var item in dto.Items)
        {
            request.Items.Add(new QuotationItem
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                PolymerType = item.PolymerType,
                Quantity = item.Quantity > 0 ? item.Quantity : 1,
                Unit = item.Unit ?? "ton",
                CustomColor = item.CustomColor,
                CustomSpecs = item.CustomSpecs,
                PackagingPreference = item.PackagingPreference
            });
        }

        _context.QuotationRequests.Add(request);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuotationByRef), new { referenceNumber = refNumber }, new
        {
            success = true,
            referenceNumber = refNumber,
            message = "تم تسجيل طلب عرض السعر بنجاح وجارٍ مراجعته من قبل مهندسي المبيعات",
            id = request.Id
        });
    }

    [HttpGet("track/{referenceNumber}")]
    public async Task<IActionResult> GetQuotationByRef(string referenceNumber)
    {
        var quotation = await _context.QuotationRequests
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.ReferenceNumber.ToUpper() == referenceNumber.ToUpper());

        if (quotation == null)
            return NotFound(new { message = "طلب عرض السعر غير موجود" });

        return Ok(new
        {
            quotation.ReferenceNumber,
            quotation.CustomerName,
            quotation.Status,
            quotation.CreatedAt,
            quotation.QuotedPriceTotal,
            quotation.QuotedNotes,
            Items = quotation.Items.Select(i => new
            {
                i.ProductName,
                i.PolymerType,
                i.Quantity,
                i.Unit
            })
        });
    }
}
