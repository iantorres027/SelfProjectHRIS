using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace Template.Domain.Dto.Authentication
{
    public class RefreshTokenRequest
    {
        [Required]
        public string ExpiredToken { get; set; } = null!;
        [Required]
        public string RefreshToken { get; set; } = null!;
    }
}
