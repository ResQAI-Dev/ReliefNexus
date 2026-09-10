interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const roles = [
  ["AffectedUser", "Affected User"],
  ["FieldVolunteer", "Field Volunteer"],
  ["ReliefCoordinator", "Relief Coordinator"],
  ["SystemAdministrator", "System Administrator"],
];

const RoleSelector = ({ value, onChange }: RoleSelectorProps) => {
  return (
    <div className="compact-role-selector">

      <label className="role-selector-label">
        Select your role
      </label>

      <div className="compact-role-grid">

        {roles.map(([roleValue, label]) => (
          <button
            key={roleValue}
            type="button"
            className={
              value === roleValue
                ? "compact-role selected"
                : "compact-role"
            }
            onClick={() => onChange(roleValue)}
          >
            <span className="compact-radio">
              {value === roleValue && <i />}
            </span>

            {label}
          </button>
        ))}

      </div>

    </div>
  );
};

export default RoleSelector;
