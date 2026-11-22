import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { Dialog } from '../../components/ui/dialog-compat';
import { NumberFieldField } from '../../components/ui/number-field-field';
import { SelectField } from '../../components/ui/select-field';
import { TextareaField } from '../../components/ui/textarea-field';
import { TextField } from '../../components/ui/text-field';
import { useToast } from '../../components/ui/use-toast';
import { categoriesApi, itemsApi, locationsApi, type Item } from '../../api/client';
import { dateOnlyToUnix } from '../../utils/date';
import { LocationPickerField } from '../locations/LocationPickerField';
import * as s from './item-edit-dialog.css';

function unixToDateInput(ts?: number): string {
  if (!ts) return '';
  const date = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const EDITABLE_STATUSES = ['in_stock', 'in_use', 'idle', 'for_sale'];

/**
 * Shared edit dialog for an existing item, mirrored on the fields of the
 * new-asset form. Clear-capable fields send explicit nulls (omitted keys
 * would mean "leave unchanged" on the backend). Type changes are out of
 * scope — they alter supply/credential behavior — and status editing is
 * restricted to the active set; borrowed/unreturned items are managed by the
 * loan flow, and exited items must be restored through the exit flow.
 */
export function ItemEditDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category ?? '');
  const [locationId, setLocationId] = useState(item.location_id ?? '');
  const [status, setStatus] = useState(item.status);
  const [serialNumber, setSerialNumber] = useState(item.serial_number ?? '');
  const [purchaseDate, setPurchaseDate] = useState(() => unixToDateInput(item.purchase_date));
  const [purchasePlatform, setPurchasePlatform] = useState(item.purchase_platform ?? '');
  const [purchasePrice, setPurchasePrice] = useState(
    item.purchase_price != null ? String(item.purchase_price) : '',
  );
  const [purchaseCurrency, setPurchaseCurrency] = useState(item.purchase_currency ?? 'CNY');
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState(() =>
    unixToDateInput(item.warranty_expires_at),
  );
  const [description, setDescription] = useState(item.description ?? '');

  const locations = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.tree() });
  const isVirtual = item.type === 'virtual';
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list() });
  const categoryOptions = useMemo(
    () =>
      (categories.data?.categories ?? [])
        .filter((c) => c.root_type === (isVirtual ? 'virtual' : 'physical'))
        .map((c) => ({ value: c.name, label: c.name })),
    [categories.data, isVirtual],
  );

  const statusEditable = EDITABLE_STATUSES.includes(item.status);
  const statusOptions = EDITABLE_STATUSES.map((value) => ({ value, label: t(`status.${value}`) }));

  const mutation = useMutation({
    mutationFn: () =>
      itemsApi.update(item.id, {
        name: name.trim(),
        category: category.trim() || null,
        location_id: locationId || null,
        // Borrowed/unreturned/exited items change status through their flows.
        ...(statusEditable ? { status } : {}),
        serial_number: serialNumber.trim() || null,
        purchase_date: dateOnlyToUnix(purchaseDate) ?? null,
        purchase_platform: purchasePlatform.trim() || null,
        purchase_price: purchasePrice !== '' ? Number(purchasePrice) : null,
        purchase_currency: purchaseCurrency.trim() || null,
        warranty_expires_at: dateOnlyToUnix(warrantyExpiresAt) ?? null,
        description: description.trim() || null,
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(['item', item.id], next);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.show(t('items.changesSaved'));
      onClose();
    },
    onError: (error: Error) => toast.show(t('items.saveFailed', { error: error.message })),
  });

  return (
    <Dialog open title={t('items.editTitle')} onClose={onClose} contentClassName={s.content}>
      <div className={s.grid}>
        <div className={s.full}>
          <TextField
            label={t('items.name')}
            required
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </div>
        <SelectField
          label={t('items.category')}
          options={categoryOptions}
          placeholder={t('assets.selectCategory')}
          value={category}
          onChange={(event) => setCategory(event.currentTarget.value)}
        />
        {statusEditable ? (
          <SelectField
            label={t('items.status')}
            options={statusOptions}
            value={status}
            onChange={(event) => setStatus(event.currentTarget.value)}
          />
        ) : (
          <p className={uiStyles.helpParagraph}>{t('items.loanManagedStatusHint')}</p>
        )}
        <div className={s.full}>
          <LocationPickerField
            label={t('assets.location')}
            tree={locations.data?.tree}
            placeholder={t('items.selectLocation')}
            allowClear={!!item.location_id}
            value={locationId}
            onChange={setLocationId}
          />
        </div>
        <TextField
          label={t('items.serialNumber')}
          value={serialNumber}
          onChange={(event) => setSerialNumber(event.currentTarget.value)}
        />
        <DatePickerField
          label={t('itemDetail.purchasedAt')}
          value={purchaseDate}
          onChange={setPurchaseDate}
        />
        <TextField
          label={t('assets.purchasePlatform')}
          value={purchasePlatform}
          onChange={(event) => setPurchasePlatform(event.currentTarget.value)}
        />
        <DatePickerField
          label={t('assets.warrantyExpiry')}
          value={warrantyExpiresAt}
          onChange={setWarrantyExpiresAt}
        />
        <NumberFieldField
          label={t('assets.purchasePriceWithCurrency', { currency: purchaseCurrency || '—' })}
          value={purchasePrice}
          onChange={setPurchasePrice}
        />
        <TextField
          label={t('assets.currency')}
          value={purchaseCurrency}
          onChange={(event) => setPurchaseCurrency(event.currentTarget.value)}
        />
        <div className={s.full}>
          <TextareaField
            label={t('assets.notes')}
            placeholder={t('assets.notesPlaceholder')}
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
        </div>
        <div className={s.full} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={name.trim() === '' || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Single-purpose dialog for the most frequent update: moving an item. */
export function ChangeLocationDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [locationId, setLocationId] = useState(item.location_id ?? '');

  const locations = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.tree() });

  const mutation = useMutation({
    mutationFn: () => itemsApi.update(item.id, { location_id: locationId || null }),
    onSuccess: (next) => {
      queryClient.setQueryData(['item', item.id], next);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.show(t('items.locationSaved'));
      onClose();
    },
    onError: (error: Error) => toast.show(t('items.saveFailed', { error: error.message })),
  });

  return (
    <Dialog open title={t('itemDetail.moveLocation')} onClose={onClose}>
      <Stack>
        <LocationPickerField
          label={t('assets.location')}
          tree={locations.data?.tree}
          placeholder={t('items.selectLocation')}
          allowClear={!!item.location_id}
          value={locationId}
          onChange={setLocationId}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={mutation.isPending || locationId === (item.location_id ?? '')}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </Stack>
    </Dialog>
  );
}
