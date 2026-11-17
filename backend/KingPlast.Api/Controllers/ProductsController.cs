using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KingPlast.Api.Data;
using KingPlast.Api.Models;

namespace KingPlast.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? polymerType,
        [FromQuery] string? categoryId,
        [FromQuery] string? color,
        [FromQuery] string? form,
        [FromQuery] string? search)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsPublished);

        if (!string.IsNullOrWhiteSpace(polymerType) && polymerType != "all")
            query = query.Where(p => p.PolymerType.ToLower() == polymerType.ToLower());

        if (!string.IsNullOrWhiteSpace(categoryId) && categoryId != "all")
            query = query.Where(p => p.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(color) && color != "all")
            query = query.Where(p => p.Color.ToLower() == color.ToLower());

        if (!string.IsNullOrWhiteSpace(form) && form != "all")
            query = query.Where(p => p.Form.ToLower() == form.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.NameAr.ToLower().Contains(s) || 
                                     (p.NameEn != null && p.NameEn.ToLower().Contains(s)) ||
                                     p.Sku.ToLower().Contains(s) ||
                                     (p.Description != null && p.Description.ToLower().Contains(s)));
        }

        var products = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProductById(string id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound(new { message = "الخامة المطلوبة غير موجودة" });

        return Ok(product);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
        return Ok(categories);
    }
}
