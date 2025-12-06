/**
 * Вкладка: Контакты
 */

import { InputField, TextAreaField } from './FormFields.tsx';
import type { Contacts } from '../../../src/types/university.ts';

interface Props {
  contacts: Contacts;
  updateField: (path: string, value: unknown) => void;
}

/**
 * Форма редактирования контактной информации
 */
export default function ContactsTab({ contacts, updateField }: Props) {
  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium border-b pb-2">Контактная информация</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Основной Email"
          type="email"
          value={contacts.main_email || ''}
          onChange={(v) => updateField('contacts.main_email', v)}
        />
        <InputField
          label="Email приёмной комиссии"
          type="email"
          value={contacts.admissions_email || ''}
          onChange={(v) => updateField('contacts.admissions_email', v)}
        />
      </div>

      <InputField
        label="Телефон"
        type="tel"
        value={contacts.phone || ''}
        onChange={(v) => updateField('contacts.phone', v)}
      />

      <TextAreaField
        label="Адрес"
        value={contacts.address || ''}
        onChange={(v) => updateField('contacts.address', v)}
        rows={2}
      />

      {/* Социальные сети */}
      <div class="pt-4 border-t">
        <h4 class="text-md font-medium mb-4">Социальные сети</h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Facebook"
            type="url"
            value={contacts.social_media?.facebook || ''}
            onChange={(v) => updateField('contacts.social_media.facebook', v)}
          />
          <InputField
            label="Instagram"
            type="url"
            value={contacts.social_media?.instagram || ''}
            onChange={(v) => updateField('contacts.social_media.instagram', v)}
          />
          <InputField
            label="Twitter/X"
            type="url"
            value={contacts.social_media?.twitter || ''}
            onChange={(v) => updateField('contacts.social_media.twitter', v)}
          />
          <InputField
            label="LinkedIn"
            type="url"
            value={contacts.social_media?.linkedin || ''}
            onChange={(v) => updateField('contacts.social_media.linkedin', v)}
          />
        </div>
      </div>
    </div>
  );
}
