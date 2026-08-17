using FluentValidation;
using ReliefNexus.API.DTOs;

namespace ReliefNexus.API.Validators;

public class CreateRiskAssessmentValidator : AbstractValidator<CreateRiskAssessmentDto>
{
    public CreateRiskAssessmentValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .MaximumLength(1000);

        RuleFor(x => x.DisasterType)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Location)
            .NotEmpty()
            .MaximumLength(300);

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90, 90);

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180, 180);
    }
}