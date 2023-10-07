using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Template.Domain.Dto.UserDto
{
    public class UserApproverModel
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required]
        [DisplayName("Approver")]
        public int ApproverId { get; set; }

        public int Level { get; set; }
        public bool IsDisabled { get; set; }
        public int CreatedById { get; set; }
        public DateTime? DateCreated { get; set; }
        public int ModifiedById { get; set; }
        public DateTime? DateModified { get; set; }
    }
}