import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { uiStyles } from '../../components/ui';

/** Small toolbar filter select shared by the credentials and warranty tabs. */
export function InlineSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? '')}
      items={[{ value: null, label: placeholder }, ...options]}
    >
      <SelectTrigger size="sm" className={uiStyles.loanFilterSelect} aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectItem value={null}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
