type ProfileItemProps = {
  label: string;
  value: string;
};

export const ProfileItem = ({ label, value }: ProfileItemProps) => (
  <div className="flex gap-3 text-xs">
    <span className="w-28 font-semibold text-slate-400">{label}</span>
    <span className="font-bold text-slate-700">{value}</span>
  </div>
);
