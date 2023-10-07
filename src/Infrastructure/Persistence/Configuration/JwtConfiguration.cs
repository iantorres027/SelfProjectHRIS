namespace Template.Infrastructure.Persistence.Configuration;

public class JWTConfiguration
{
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public string SecretKey { get; set; }
    public int ExpirationMinutes { get; set; }

}