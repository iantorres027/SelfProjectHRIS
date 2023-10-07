using AutoMapper;
using Template.Domain.Dto.ModuleDto;
using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Configuration;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Add as many of these lines as you need to map your objects
        CreateMap<User, UserModel>().ReverseMap();
        CreateMap<Module, ModuleModel>().ReverseMap();
        CreateMap<ModuleType, ModuleTypeModel>().ReverseMap();
        CreateMap<ModuleStageApprover, ModuleStageApproverModel>().ReverseMap();
    }
}