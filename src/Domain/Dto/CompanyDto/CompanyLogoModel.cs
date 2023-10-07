using Microsoft.AspNetCore.Http;
using System.ComponentModel;

namespace Template.Domain.Dto.CompanyDto
{
    public class CompanyLogoModel
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Location { get; set; }

        [DisplayName("Disable")]
        public bool IsDisabled { get; set; }

        public int CreatedBy { get; set; }
        public DateTime DateCreated { get; set; }
        public int ModifiedBy { get; set; }
        public DateTime DateModified { get; set; }
        public int? CompanyId { get; set; }

        [DisplayName("")]
        public IFormFile? CompanyLogoFile { get; set; }
    }
}