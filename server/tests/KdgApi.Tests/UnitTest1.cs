using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KdgApi.Controllers;
using KdgApi.Data;
using KdgApi.Models;

namespace KdgApi.Tests;

public class CustomersControllerTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoCustomers()
    {
        using var context = CreateContext(nameof(GetAll_ReturnsEmptyList_WhenNoCustomers));
        var controller = new CustomersController(context);

        var result = await controller.GetAll();

        Assert.NotNull(result.Value);
        Assert.Empty(result.Value);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenCustomerDoesNotExist()
    {
        using var context = CreateContext(nameof(GetById_ReturnsNotFound_WhenCustomerDoesNotExist));
        var controller = new CustomersController(context);

        var result = await controller.GetById(999);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedCustomer_WithGeneratedId()
    {
        using var context = CreateContext(nameof(Create_ReturnsCreatedCustomer_WithGeneratedId));
        var controller = new CustomersController(context);
        var customer = new Customer { Name = "Jane Doe", Email = "jane@example.com" };

        var result = await controller.Create(customer);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<Customer>(created.Value);
        Assert.Equal("Jane Doe", returned.Name);
        Assert.Equal("jane@example.com", returned.Email);
        Assert.True(returned.Id > 0);
    }
}
