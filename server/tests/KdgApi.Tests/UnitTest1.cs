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

    [Fact]
    public async Task Update_ReturnsNoContent_WhenCustomerExists()
    {
        using var context = CreateContext(nameof(Update_ReturnsNoContent_WhenCustomerExists));
        var controller = new CustomersController(context);
        var customer = new Customer { Name = "Jane Doe", Email = "jane@example.com" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        customer.Name = "Jane Smith";
        var result = await controller.Update(customer.Id, customer);

        Assert.IsType<NoContentResult>(result);
        var updated = await context.Customers.FindAsync(customer.Id);
        Assert.Equal("Jane Smith", updated!.Name);
    }

    [Fact]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        using var context = CreateContext(nameof(Update_ReturnsBadRequest_WhenIdMismatch));
        var controller = new CustomersController(context);
        var customer = new Customer { Id = 1, Name = "Jane Doe", Email = "jane@example.com" };

        var result = await controller.Update(999, customer);

        Assert.IsType<BadRequestResult>(result);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent_WhenCustomerExists()
    {
        using var context = CreateContext(nameof(Delete_ReturnsNoContent_WhenCustomerExists));
        var controller = new CustomersController(context);
        var customer = new Customer { Name = "Jane Doe", Email = "jane@example.com" };
        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        var result = await controller.Delete(customer.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(await context.Customers.FindAsync(customer.Id));
    }

    [Fact]
    public async Task Delete_ReturnsNotFound_WhenCustomerDoesNotExist()
    {
        using var context = CreateContext(nameof(Delete_ReturnsNotFound_WhenCustomerDoesNotExist));
        var controller = new CustomersController(context);

        var result = await controller.Delete(999);

        Assert.IsType<NotFoundResult>(result);
    }
}
