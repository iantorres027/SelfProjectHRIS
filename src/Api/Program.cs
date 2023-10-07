using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Template.Application;
using Template.Application.Services;
using Template.Infrastructure;
using Template.Infrastructure.Persistence.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

// Application, Infrastructure Dependency Injection
builder.Services.Configure<AuthenticationConfig>(builder.Configuration.GetSection("AuthenticationConfig"));
builder.Services.Configure<JWTConfiguration>(builder.Configuration.GetSection("JWTConfiguration"));
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

#region Swagger

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Template.API",
        Version = "v1"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 1safsfsdfdfd\"",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference {
                    Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

#endregion Swagger

#region Authentication

string? jwtKey = builder.Configuration["JWTConfiguration:SecretKey"];
byte[] keyBytes = Encoding.ASCII.GetBytes(jwtKey ?? "");

TokenValidationParameters tokenValidation = new()
{
    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
    ValidateLifetime = true,
    ValidateAudience = false,
    ValidateIssuer = false,
    ClockSkew = TimeSpan.Zero
};

builder.Services.AddSingleton(tokenValidation);

builder.Services.AddAuthentication(options =>
{
    // custom scheme defined in .AddPolicyScheme() below
    options.DefaultScheme = "JWT_OR_COOKIE";
    options.DefaultChallengeScheme = "JWT_OR_COOKIE";
})
     .AddCookie(options =>
     {
         options.Events.OnRedirectToLogin = (context) =>
         {
             context.Response.StatusCode = 401;
             return Task.CompletedTask;
         };
     })
      .AddJwtBearer("Bearer", jwtOptions =>
      {
          jwtOptions.TokenValidationParameters = tokenValidation;
          jwtOptions.Events = new JwtBearerEvents
          {
              OnTokenValidated = async (context) =>
              {
                  IJwtService jwtService = builder.Services.BuildServiceProvider().CreateScope().ServiceProvider.GetRequiredService<IJwtService>();
                  JwtSecurityToken jwtToken = context.SecurityToken as JwtSecurityToken;
                  bool isValid = await jwtService.IsTokenValid(jwtToken?.RawData ?? "");

                  if (!isValid)
                  {
                      context.Fail("Invalid Token Details");
                  }
              }
          };
      })
    // this is the key piece!
    .AddPolicyScheme("JWT_OR_COOKIE", "JWT_OR_COOKIE", options =>
    {
        // runs on each request
        options.ForwardDefaultSelector = context =>
        {
            // filter by auth type
            string? authorization = context.Request.Headers[HeaderNames.Authorization];
            if (!string.IsNullOrEmpty(authorization) && authorization.StartsWith("Bearer "))
            {
                return "Bearer";
            }

            // otherwise always check for cookie auth
            return "Cookies";
        };
    });

#endregion Authentication

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();