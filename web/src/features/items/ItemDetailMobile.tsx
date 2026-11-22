import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconArchive,
  IconBell,
  IconCalendar,
  IconClipboardList,
  IconEdit,
  IconHistory,
  IconKey,
  IconMapPin,
  IconPackage,
  IconPencil,
  IconPhotoPlus,
  IconPlus,
  IconQrcode,
  IconReceipt,
  IconShieldCheck,
  IconShoppingCart,
  IconTag,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog } from '../../components/ui/dialog-compat';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import { Tag } from '../../components/ui/tag';
import { TextField } from '../../components/ui/text-field';
import {
  containerApi,
  itemsApi,
  loansApi,
  remindersApi,
  suppliesExtendedApi,
  virtualAssetsApi,
  type Attachment,
  type Item,
  type Tag as TagType,
  type VirtualCredential,
} from '../../api/client';
import { useNetworkStatus } from '../../utils/useNetworkStatus';
import { formatDate, formatDateTime, formatPrice, getWarrantyView, useItemDetailData } from './useItemDetailData';
import { CredentialFormDialog } from '../credentials/CredentialFormDialog';
import { LicenseKeyBox } from '../credentials/LicenseKeyBox';
import { useCredentialDelete } from '../credentials/useCredentialDelete';
import { WarrantyEditDialog } from '../credentials/WarrantyTab';
import { ReminderRow } from '../reminders/reminderUi';
import { ChangeLocationDialog, ItemEditDialog } from './ItemEditDialog';
import { ProofStrip } from './ProofStrip';
import * as s from './itemDetailMobile.css';

export function ItemDetailMobile({ itemId }: { itemId: string }) {
  const d = useItemDetailData(itemId);
  const {
    t,
    item,
    tags,
    locationPath,
    photos,
    photoIdx,
    currentPhoto,
    setSelectedPhotoIdx,
    proofs,
    uploadProof,
    deleteProof,
    handleProofPick,
    currentTags,
    tagOptions,
    addTag,
    removeTag,
    replaceTags,
    createTag,
    statusOptions,
    fileInputRef,
    handlePhotoPick,
    archive,
    updateStatus,
    updatePrivacy,
    uploadPhoto,
  } = d;
  const isOnline = useNetworkStatus();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedTagID, setSelectedTagID] = useState('');
  const [tagName, setTagName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  if (item.isLoading) return <div className={s.page}><Spinner /></div>;
  if (item.error || !item.data) return <div className={s.page}><p>{t('errors.not_found')}</p></div>;

  const data = item.data;
  const typeLabel = t(`items.${data.type}`, data.type);
  const isConsumable = data.type === 'predictive_supplies' || data.type === 'tracked_spares';
  const isVirtual = data.type === 'virtual';
  const warranty = getWarrantyView(data, t);

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.mobileTopActions}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('items.editTitle')}
            className={s.heroAction}
            onClick={() => setEditOpen(true)}
          >
            <IconEdit size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('items.archiveTitle')}
            className={s.heroAction}
            disabled={!isOnline || archive.isPending}
            onClick={() => setArchiveConfirmOpen(true)}
          >
            <IconArchive size={17} />
          </Button>
        </div>
        <div className={s.photoFrame} data-empty={!currentPhoto || undefined}>
          {currentPhoto ? <img className={s.heroPhoto} src={currentPhoto.url} alt={currentPhoto.filename} /> : <PhotoEmpty />}
          {photos.length > 0 && <span className={s.photoCount}>{photoIdx + 1}/{photos.length}</span>}
        </div>
        <div className={s.thumbStrip}>
          {photos.map((photo, idx) => (
            <button key={photo.id} type="button" className={s.thumbButton} data-active={idx === photoIdx || undefined} onClick={() => setSelectedPhotoIdx(idx)} aria-label={photo.filename}>
              <img className={s.thumbImg} src={photo.url} alt="" />
            </button>
          ))}
          {isOnline && (
            <button type="button" className={s.thumbAdd} onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending} aria-label={t('common.upload')}>
              {uploadPhoto.isPending ? <Spinner /> : <IconPhotoPlus size={18} />}
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden className={s.hiddenInput} onChange={(event) => { handlePhotoPick(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />

        <div className={s.summary}>
          <h1 className={s.title}>{data.name}</h1>
          <div className={s.badgeRow}>
            <StatusBadge status={data.status} />
            <span className={s.typeBadge}>{typeLabel}</span>
            {data.category && <span className={s.categoryBadge}>{data.category}</span>}
            <button
              type="button"
              className={s.tagAddButton}
              onClick={() => setTagDialogOpen(true)}
              aria-label={t('items.manageTags')}
            >
              <IconPlus size={13} />
            </button>
          </div>
          <div className={s.tagRow}>
            {currentTags.map((tag: TagType) => <Tag key={tag.id}>#{tag.name}</Tag>)}
            {currentTags.length === 0 && <span className={s.mutedText}>{t('items.noTags')}</span>}
          </div>

          <div className={s.specList}>
            <SpecRow label={t('items.status')}><StatusBadge status={data.status} /></SpecRow>
            <SpecRow label={t('itemDetail.currentLocation')}>{locationPath ?? t('common.notSet')}</SpecRow>
            <SpecRow label={t('itemDetail.qrCode')}><span className={s.qrChip}>{data.id.slice(0, 8).toUpperCase()}<IconQrcode size={14} /></span></SpecRow>
            <SpecRow label={t('items.serialNumber')}>{data.serial_number ?? t('common.notSet')}</SpecRow>
            <SpecRow label={t('itemDetail.purchasedAt')}>{formatDate(data.purchase_date) ?? t('common.notSet')}</SpecRow>
            <SpecRow label={t('items.purchasePrice')}>{formatPrice(data.purchase_price, data.purchase_currency, t)}</SpecRow>
            <SpecRow label={t('itemDetail.warrantyExpiry')}>{warranty.summary}</SpecRow>
          </div>
        </div>
      </section>

      <Card className={s.section} padded={false}>
        <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconMapPin size={15} />{t('itemDetail.statusAndLocation')}</h2></div>
        <div className={s.sectionBody}>
          <StatusBadge status={data.status} />
          {statusOptions.some((option) => option.value === data.status) && (
            <SelectField label={t('items.switchStatus')} options={statusOptions} value={data.status} disabled={!isOnline || updateStatus.isPending} onChange={(event) => updateStatus.mutate(event.currentTarget.value)} />
          )}
          <Button
            variant="quiet"
            leftSection={<IconShieldCheck size={15} />}
            onClick={() => updatePrivacy.mutate(!data.is_private)}
            disabled={!isOnline || updatePrivacy.isPending}
          >
            {data.is_private ? t('itemDetail.makeShared') : t('itemDetail.makePrivate')}
          </Button>
        </div>
      </Card>

      <WarrantySection item={data} />
      <PurchaseSection
        item={data}
        isVirtual={isVirtual}
        proofs={proofs}
        uploadPending={uploadProof.isPending}
        onPickProof={handleProofPick}
        onDeleteProof={(proof) => deleteProof.mutate(proof.id)}
        onEdit={() => setEditOpen(true)}
      />
      {isConsumable && <ConsumableSection itemId={itemId} item={data} />}
      {isVirtual && <VirtualSection itemId={itemId} itemName={data.name} />}
      <LoansSection itemId={itemId} />
      <EventsSection itemId={itemId} />
      <ContainerSection itemId={itemId} />
      <TasksSection itemId={itemId} />
      <MetadataSection itemId={itemId} item={data} />

      <Card className={s.section} padded={false}>
        <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconCalendar size={15} />{t('itemDetail.timestamps')}</h2></div>
        <div className={s.sectionBody}>
          <SpecRow label={t('itemDetail.createdAt')}>{formatDateTime(data.created_at)}</SpecRow>
          <SpecRow label={t('itemDetail.updatedAt')}>{formatDateTime(data.updated_at)}</SpecRow>
        </div>
      </Card>

      <div className={s.bottomBar}>
        <Button variant="quiet" leftSection={<IconMapPin size={15} />} onClick={() => setMoveOpen(true)}>{t('itemDetail.moveLocation')}</Button>
        <Button onClick={() => setEditOpen(true)}>{t('common.edit')}</Button>
        <Button
          variant="quiet"
          size="icon-sm"
          aria-label={t('items.archiveTitle')}
          onClick={() => setArchiveConfirmOpen(true)}
          disabled={!isOnline || archive.isPending}
        >
          <IconArchive size={16} />
        </Button>
      </div>

      {editOpen && <ItemEditDialog item={data} onClose={() => setEditOpen(false)} />}
      {moveOpen && <ChangeLocationDialog item={data} onClose={() => setMoveOpen(false)} />}
      <Dialog
        open={archiveConfirmOpen}
        title={t('items.archiveTitle')}
        onClose={() => setArchiveConfirmOpen(false)}
      >
        <p className={s.sectionEmpty}>{t('items.archiveConfirmBody')}</p>
        <div className={s.dialogActions}>
          <Button variant="quiet" onClick={() => setArchiveConfirmOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="destructive"
            disabled={!isOnline || archive.isPending}
            onClick={() =>
              archive.mutate(undefined, {
                onSuccess: () => setArchiveConfirmOpen(false),
              })
            }
          >
            {archive.isPending ? t('common.loading') : t('items.archiveTitle')}
          </Button>
        </div>
      </Dialog>

      <Dialog open={tagDialogOpen} title={t('items.manageTags')} onClose={() => setTagDialogOpen(false)}>
        <div className={s.dialogStack}>
          <div className={s.tagList}>
            {currentTags.map((tag: TagType) => (
              <Tag key={tag.id}>
                {tag.name}
                <button
                  type="button"
                  className={s.tagRemove}
                  onClick={() => removeTag(tag.id)}
                  disabled={!isOnline || replaceTags.isPending}
                  title={t('items.removeTag')}
                >
                  <IconX size={12} />
                </button>
              </Tag>
            ))}
            {currentTags.length === 0 && <span className={s.mutedText}>{t('items.noTags')}</span>}
          </div>
          {tagOptions.length > 0 && (
            <SelectField
              label={t('items.selectTag')}
              options={tagOptions}
              placeholder={tags.isLoading ? t('items.tagsLoading') : t('items.selectTagPlaceholder')}
              value={selectedTagID}
              disabled={!isOnline || replaceTags.isPending}
              onChange={(event) => {
                const tagID = event.currentTarget.value;
                const tag = tags.data?.tags.find((candidate: TagType) => candidate.id === tagID);
                if (tag) addTag(tag);
                setSelectedTagID('');
              }}
            />
          )}
          <div className={s.inlineForm}>
            <TextField label={t('items.newTag')} value={tagName} onChange={(event) => setTagName(event.currentTarget.value)} disabled={!isOnline || createTag.isPending} />
            <Button
              leftSection={<IconPlus size={15} />}
              disabled={!isOnline || !tagName.trim() || createTag.isPending}
              onClick={() => {
                createTag.mutate(tagName, {
                  onSuccess: (tag) => {
                    addTag(tag);
                    setTagName('');
                  },
                });
              }}
            >
              {t('items.createTag')}
            </Button>
          </div>
          <div className={s.dialogActions}>
            <Button variant="quiet" onClick={() => setTagDialogOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function PhotoEmpty() {
  const { t } = useTranslation();
  return (
    <div className={s.photoEmpty}>
      <IconPackage size={34} />
      <span>{t('items.noPhotoYet')}</span>
    </div>
  );
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.specRow}>
      <span className={s.specLabel}>{label}</span>
      <span className={s.specValue}>{children}</span>
    </div>
  );
}

function WarrantySection({ item }: { item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const warranty = getWarrantyView(item, t);
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}><IconShieldCheck size={15} />{t('itemDetail.warranty')}</h2>
        {warranty.tone === 'danger' ? (
          <span className={s.warningText}><IconAlertTriangle size={12} />{t('itemDetail.warrantyExpired')}</span>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
        )}
      </div>
      <div className={s.sectionBody}>
        {!warranty.expiresAt ? (
          <p className={s.sectionEmpty}>{t('itemDetail.warrantyNotSetHint')}</p>
        ) : (
          <>
            <SpecRow label={t('itemDetail.warrantyExpiry')}>{formatDate(warranty.expiresAt)}</SpecRow>
            <SpecRow label={t('itemDetail.daysLeft')}>{warranty.summary}</SpecRow>
            <SpecRow label={t('itemDetail.warrantyContact')}>{item.warranty_contact ?? t('common.notSet')}</SpecRow>
          </>
        )}
      </div>
      {editing && (
        <WarrantyEditDialog
          item={item}
          onClose={() => {
            setEditing(false);
            qc.invalidateQueries({ queryKey: ['item'] });
          }}
        />
      )}
    </Card>
  );
}

function PurchaseSection({ item, isVirtual, proofs, uploadPending, onPickProof, onDeleteProof, onEdit }: {
  item: Item;
  isVirtual: boolean;
  proofs: Attachment[];
  uploadPending: boolean;
  onPickProof: (file: File | undefined) => void;
  onDeleteProof: (proof: Attachment) => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const addons = useQuery({ queryKey: ['item', item.id, 'addons'], queryFn: () => virtualAssetsApi.listAddons(item.id) });
  const addonList = addons.data?.addons ?? [];
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}><IconReceipt size={15} />{t('itemDetail.purchaseInfo')}</h2>
        <Button variant="ghost" size="sm" onClick={onEdit}>{t('common.edit')}</Button>
      </div>
      <div className={s.sectionBody}>
        <SpecRow label={t('itemDetail.purchasedAt')}>{item.purchase_date ? formatDate(item.purchase_date) : t('common.notSet')}</SpecRow>
        <SpecRow label={t('items.purchasePrice')}>{item.purchase_price != null ? formatPrice(item.purchase_price, item.purchase_currency, t) : t('common.notSet')}</SpecRow>
        <SpecRow label={t('assets.purchasePlatform')}>{item.purchase_platform ?? t('common.notSet')}</SpecRow>
        <ProofStrip proofs={proofs} uploadPending={uploadPending} onPick={onPickProof} onDelete={onDeleteProof} />
        {isVirtual && addons.isError && <p className={s.sectionEmpty}>{t('common.loadFailed')}</p>}
        {isVirtual && addonList.length > 0 && (
          <>
            <span className={s.mutedText}>{t('itemDetail.addonPurchases')}</span>
            {addonList.map((addon: any) => (
              <SpecRow key={addon.id} label={addon.name}>{addon.price != null ? formatPrice(addon.price, addon.currency, t) : t('common.notSet')}</SpecRow>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}

function ConsumableSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOne = useMutation({ mutationFn: () => suppliesExtendedApi.useOne(itemId), onSuccess: (next) => qc.setQueryData(['item', itemId], next) });
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconShoppingCart size={15} />{t('itemDetail.consumable')}</h2></div>
      <div className={s.sectionBody}>
        <SpecRow label={t('itemDetail.currentStock')}>{item.current_stock ?? 0} {t('common.pieces')}</SpecRow>
        <SpecRow label={t('itemDetail.minStock')}>{item.min_stock_threshold ?? '—'}</SpecRow>
        {item.type === 'tracked_spares' && <Button leftSection={<IconShoppingCart size={15} />} onClick={() => useOne.mutate()} disabled={useOne.isPending || (item.current_stock ?? 0) <= 0}>{t('itemDetail.useOne')}</Button>}
      </div>
    </Card>
  );
}

function VirtualSection({ itemId, itemName }: { itemId: string; itemName: string }) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VirtualCredential | null>(null);
  const { requestDelete, deleteDialog } = useCredentialDelete();
  const creds = useQuery({ queryKey: ['item', itemId, 'credentials'], queryFn: () => virtualAssetsApi.listCredentials(itemId) });
  const credentials = creds.data?.credentials ?? [];
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}>
        <h2 className={s.sectionTitle}><IconKey size={15} />{t('itemDetail.platformCredentials')}</h2>
        <Button variant="ghost" size="sm" onClick={() => setFormOpen(true)}>{t('itemDetail.addCredential')}</Button>
      </div>
      <div className={s.sectionBody}>
        {creds.isLoading ? <Spinner /> : creds.isError ? <div className={s.sectionEmpty}>{t('common.loadFailed')}</div> : credentials.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noCredentials')}</div> : credentials.map((credential: VirtualCredential) => (
          <div key={credential.id} className={s.compactCard}>
            <div className={s.compactHead}>
              <span className={s.compactTitle}>{credential.platform}</span>
              <span className={s.compactActions}>
                <Button variant="ghost" size="icon-sm" aria-label={t('common.edit')} onClick={() => setEditing(credential)}>
                  <IconPencil size={14} />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={t('common.delete')} onClick={() => requestDelete(credential, itemName)}>
                  <IconTrash size={14} />
                </Button>
              </span>
            </div>
            {credential.account && <span className={s.compactSub}>{t('itemDetail.accountLabel')}: {credential.account}</span>}
            {credential.order_id && <span className={s.compactSub}>{t('itemDetail.orderLabel')}: {credential.order_id}</span>}
            {credential.license_key && <LicenseKeyBox licenseKey={credential.license_key} />}
          </div>
        ))}
      </div>
      {formOpen && <CredentialFormDialog open itemId={itemId} onClose={() => setFormOpen(false)} />}
      {editing && (
        <CredentialFormDialog
          open
          credential={editing}
          itemId={editing.item_id}
          onClose={() => setEditing(null)}
        />
      )}
      {deleteDialog}
    </Card>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({ queryKey: ['item', itemId, 'loans'], queryFn: () => loansApi.listForItem(itemId) });
  const loans = data?.loans ?? [];
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconClipboardList size={15} />{t('itemDetail.loans')}</h2>{loans.length > 0 && <Badge>{loans.length}</Badge>}</div>
      <div className={s.sectionBody}>
        {isLoading ? <Spinner /> : isError ? <div className={s.sectionEmpty}>{t('common.loadFailed')}</div> : loans.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noLoans')}</div> : loans.map((loan: any) => (
          <div key={loan.id} className={s.compactCard}>
            <div className={s.compactHead}>
              <span className={s.compactTitle}>{loan.borrower_name}</span>
              <Badge>{String(t(`status.${loan.status}`, loan.status))}</Badge>
            </div>
            <span className={s.compactSub}>{formatDate(loan.loaned_at)}{loan.due_at ? ` / ${formatDate(loan.due_at)}` : ''}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({ queryKey: ['item', itemId, 'events'], queryFn: () => suppliesExtendedApi.listEvents(itemId) });
  const events = data?.events ?? [];
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconHistory size={15} />{t('itemDetail.events')}</h2></div>
      <div className={s.sectionBody}>
        {isLoading ? <Spinner /> : isError ? <div className={s.sectionEmpty}>{t('common.loadFailed')}</div> : events.length === 0 ? <div className={s.sectionEmpty}>{t('itemDetail.noEvents')}</div> : events.slice(0, 4).map((event: any) => (
          <div key={event.id} className={s.timelineRow}>
            <span className={s.timelineTitle}>{String(t(`events.${event.event_type}`, event.event_type))}</span>
            <span className={s.timelineMeta}>{formatDateTime(event.created_at)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ContainerSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isOnline = useNetworkStatus();
  const { data, isLoading, isError } = useQuery({ queryKey: ['item', itemId, 'contents'], queryFn: () => containerApi.listContents(itemId) });
  const removeMutation = useMutation({
    mutationFn: (childId: string) => containerApi.remove(itemId, childId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['item', itemId, 'contents'] }),
  });
  const contents = data?.items ?? [];
  // A container with nothing inside (or a failed fetch) stays hidden, like
  // the desktop section; a fetch error must not render as an empty shell.
  if (isLoading || isError || contents.length === 0) return null;
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconPackage size={15} />{t('itemDetail.contents')}</h2></div>
      <div className={s.sectionBody}>
        {contents.map((child: any) => (
          <div key={child.id} className={s.compactCard}>
            <div className={s.compactHead}>
              <span className={s.compactTitle}>{child.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('itemDetail.removeFromContainer')}
                disabled={!isOnline || removeMutation.isPending}
                onClick={() => removeMutation.mutate(child.id)}
              >
                <IconX size={14} />
              </Button>
            </div>
            <span className={s.compactSub}>{String(t(`status.${child.status}`, child.status))}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TasksSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const reminders = useQuery({
    queryKey: ['reminders', 'item', itemId],
    queryFn: () => remindersApi.list({ itemId }),
  });
  const all = reminders.data?.reminders ?? [];
  const pending = all.filter((r) => !r.is_dismissed && !r.sent_at);
  return (
    <Card className={s.section} padded={false}>
      <div className={s.sectionHead}><h2 className={s.sectionTitle}><IconBell size={15} />{t('itemDetail.tasks')}</h2></div>
      <div className={s.sectionBody}>
        {reminders.isPending ? (
          <Spinner />
        ) : reminders.isError ? (
          <div className={s.sectionEmpty}>{t('common.loadFailed')}</div>
        ) : pending.length === 0 ? (
          <div className={s.sectionEmpty}>{t('reminders.noPendingForItem')}</div>
        ) : (
          pending.map((r) => <ReminderRow key={r.id} reminder={r} showItem={false} />)
        )}
        <Link to="/reminders" className={s.mutedText}>{t('itemDetail.viewAllTasks')}</Link>
      </div>
    </Card>
  );
}

function MetadataSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isOnline = useNetworkStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState('');
  const [formVal, setFormVal] = useState('');
  const [editOriginalKey, setEditOriginalKey] = useState<string | null>(null);
  const meta = item.metadata ?? {};
  const entries = Object.entries(meta);
  const updateMutation = useMutation({
    mutationFn: (next: Record<string, string>) => itemsApi.update(itemId, { metadata: next }),
    onSuccess: (next) => {
      qc.setQueryData(['item', itemId], next);
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });

  function openAdd() {
    setEditOriginalKey(null);
    setFormKey('');
    setFormVal('');
    setDialogOpen(true);
  }

  function openEdit(key: string, value: string) {
    setEditOriginalKey(key);
    setFormKey(key);
    setFormVal(value);
    setDialogOpen(true);
  }

  function handleSave() {
    const key = formKey.trim();
    const value = formVal.trim();
    if (!key) return;
    const next: Record<string, string> = {};
    for (const [entryKey, entryValue] of entries) {
      if (editOriginalKey !== null && entryKey === editOriginalKey) continue;
      next[entryKey] = entryValue;
    }
    next[key] = value;
    updateMutation.mutate(next);
    setDialogOpen(false);
  }

  function handleRemove(key: string) {
    const next = { ...meta };
    delete next[key];
    updateMutation.mutate(next);
  }

  return (
    <>
      <Card className={s.section} padded={false}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}><IconTag size={15} />{t('itemDetail.customMetadata')}</h2>
          <Button variant="ghost" size="sm" leftSection={<IconPlus size={14} />} disabled={!isOnline} onClick={openAdd}>{t('common.add')}</Button>
        </div>
        <div className={s.sectionBody}>
          {entries.length > 0 ? entries.map(([key, value]) => (
            <div key={key} className={s.compactCard}>
              <div className={s.compactHead}>
                <span className={s.compactTitle}>{key}</span>
                <span className={s.compactActions}>
                  <Button variant="ghost" size="icon-sm" aria-label={t('common.edit')} onClick={() => openEdit(key, value)}>
                    <IconPencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('common.delete')}
                    disabled={!isOnline || updateMutation.isPending}
                    onClick={() => handleRemove(key)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </span>
              </div>
              <button type="button" className={s.metadataValueButton} onClick={() => openEdit(key, value)}>
                {value}
              </button>
            </div>
          )) : <div className={s.sectionEmpty}>{t('itemDetail.noMetadata')}</div>}
        </div>
      </Card>
      <Dialog open={dialogOpen} title={editOriginalKey !== null ? t('itemDetail.editMetadata') : t('itemDetail.addMetadata')} onClose={() => setDialogOpen(false)}>
        <div className={s.dialogStack}>
          <TextField label={t('itemDetail.metadataKey')} value={formKey} onChange={(event) => setFormKey(event.currentTarget.value)} disabled={!isOnline || updateMutation.isPending} autoFocus />
          <TextField label={t('itemDetail.metadataValue')} value={formVal} onChange={(event) => setFormVal(event.currentTarget.value)} disabled={!isOnline || updateMutation.isPending} />
          <div className={s.dialogActions}>
            <Button variant="quiet" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button disabled={!isOnline || !formKey.trim() || updateMutation.isPending} onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
