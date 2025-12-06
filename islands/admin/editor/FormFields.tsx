/**
 * Общие компоненты полей формы для редактора университета
 */

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'tel' | 'number';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Текстовое поле ввода
 */
export function InputField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
}: InputFieldProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span class="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        disabled={disabled}
        placeholder={placeholder}
        class={`w-full p-2 border rounded-lg ${
          disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Многострочное текстовое поле
 */
export function TextAreaField({ 
  label, 
  value, 
  onChange, 
  rows = 3,
  required = false,
  disabled = false,
  placeholder,
}: TextAreaFieldProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span class="text-red-500">*</span>}
      </label>
      <textarea
        rows={rows}
        value={value}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        disabled={disabled}
        placeholder={placeholder}
        class={`w-full p-2 border rounded-lg ${
          disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Выпадающий список
 */
export function SelectField({ 
  label, 
  value, 
  options, 
  onChange,
  disabled = false,
}: SelectFieldProps) {
  return (
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        disabled={disabled}
        class={`w-full p-2 border rounded-lg ${
          disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
        } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Чекбокс
 */
export function CheckboxField({ 
  label, 
  checked, 
  onChange,
  disabled = false,
}: CheckboxFieldProps) {
  return (
    <div class="flex items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        disabled={disabled}
        class="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <label class="text-sm font-medium text-gray-700">{label}</label>
    </div>
  );
}
