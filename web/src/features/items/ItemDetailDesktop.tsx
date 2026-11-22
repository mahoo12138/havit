import { useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconArchive,
  IconAlertTriangle,
  IconBell,
  IconChevronRight,
  IconClipboardList,
  IconClock,
  IconCopy,
  IconDownload,
  IconFileExport,
  IconHistory,
  IconHome,
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
import { useTranslation } from 'react-i18next';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { DetailSection } from '../../components/ui/detail-section';
import { SelectField } from '../../components/ui/select-field';
import { Spinner } from '../../components/ui/spinner';
import { StatusBadge } from '../../components/ui/status-badge';
import { Tag } from '../../components/ui/tag';
import { TextField } from '../../components/ui/text-field';
import {
  containerApi,
  itemsApi,
  loansApi,
  suppliesExtendedApi,
  virtualAssetsApi,
  remindersApi,
  type Attachment,
  type Item,
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
import * as s from './ItemDetailDesktop.css';
import * as d from '../../styles/detail.css';

export function ItemDetailDesktop({ itemId }: { itemId: string }) {
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
    statusOptions,
    fileInputRef,
    handlePhotoPick,
    addTag,
    removeTag,
    archive,
    updateStatus,
    updatePrivacy,
    uploadPhoto,
    replaceTags,
    createTag,
  } = useItemDetailData(itemId);
  const isOnline = useNetworkStatus();
  const [tagName, setTagName] = useState('');
  const [selectedTagID, setSelectedTagID] = useState('');
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  if (item.isLoading) return <Spinner />;
  if (item.error || !item.data) return <p className={s.errorText}>{t('errors.not_found')}</p>;

  const it = item.data;
  const typeLabel = t(`items.${it.type}`, it.type);
  const isConsumable = it.type === 'predictive_supplies' || it.type === 'tracked_spares';
  const isVirtual = it.type === 'virtual';
  // The breadcrumb entry must match the ledger the item lives in — each
  // item type rolls up to exactly one ledger page, which is why there is
  // no separate type level: it would either repeat the ledger link or be
  // a dead crumb. The type still shows as the badge under the title.
  const ledgerTo =
    isVirtual ? '/virtual-assets'
      : isConsumable ? '/supplies'
        : it.type === 'essentials' ? '/essentials'
          : '/assets';
  const ledgerLabel =
    isVirtual ? t('virtualAssets.title')
      : isConsumable ? t('supplies.title')
        : it.type === 'essentials' ? t('essentials.title')
          : t('assets.title');
  // Category tabs with URL preselect exist only on /assets and
  // /virtual-assets; elsewhere the category crumb stays plain text.
  const categoryCrumb =
    it.category && (isVirtual || it.type === 'durable')
      ? { to: ledgerTo, search: { category: it.category } }
      : undefined;

  function copyCurrentUrl() {
    void navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <div className={s.page}>
      <header className={s.topBar}>
        <nav className={s.breadcrumb} aria-label={String(t('common.breadcrumb'))}>
          <Link to={ledgerTo}>{ledgerLabel}</Link>
          {it.category && (
            <>
              <IconChevronRight size={13} />
              {categoryCrumb ? (
                <Link to={categoryCrumb.to} search={categoryCrumb.search}>{it.category}</Link>
              ) : (
                <span>{it.category}</span>
              )}
            </>
          )}
          <IconChevronRight size={13} />
          <span data-current>{it.name}</span>
        </nav>
        <div className={s.topActions}>
          <Button variant="outline" size="sm" leftSection={<IconCopy size={14} />} onClick={copyCurrentUrl}>
            {t('itemDetail.share')}
          </Button>
          <Button variant="outline" size="sm" leftSection={<IconFileExport size={14} />} onClick={() => window.print()}>
            {t('itemDetail.exportPdf')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftSection={<IconShieldCheck size={14} />}
            onClick={() => updatePrivacy.mutate(!it.is_private)}
            disabled={!isOnline || updatePrivacy.isPending}
          >
            {it.is_private ? t('itemDetail.makeShared') : t('itemDetail.makePrivate')}
          </Button>
          {it.status === 'stolen' && (
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconDownload size={14} />}
              onClick={() => {
                void suppliesExtendedApi.claimPdf(itemId).then((blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${it.name}-insurance-claim.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                });
              }}
            >
              {t('items.downloadClaim')}
            </Button>
          )}
          <Button
            variant="quiet"
            size="sm"
            leftSection={<IconArchive size={14} />}
            onClick={() => archive.mutate()}
            disabled={!isOnline || archive.isPending}
            title={!isOnline ? t('items.cannotArchiveOffline') : undefined}
          >
            {t('items.archive')}
          </Button>
        </div>
      </header>

      <section className={s.heroCard}>
        <Gallery
          itemName={it.name}
          photos={photos}
          currentPhoto={currentPhoto}
          photoIdx={photoIdx}
          isOnline={isOnline}
          uploadPending={uploadPhoto.isPending}
          onPickPhoto={setSelectedPhotoIdx}
          onAddPhoto={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          className={s.hiddenInput}
          type="file"
          accept="image/*"
          onChange={(event) => {
            handlePhotoPick(event.currentTarget.files?.[0]);
            event.currentTarget.value = '';
          }}
        />

        <div className={s.heroInfo}>
          <div className={s.titleRow}>
            <div>
              <h1 className={s.title}>{it.name}</h1>
              <div className={s.badgeRow}>
                <StatusBadge status={it.status} />
                <span className={s.typeBadge}>{typeLabel}</span>
                {it.category && <span className={s.categoryBadge}>{it.category}</span>}
                <button type="button" className={s.iconBadge} onClick={() => setTagDialogOpen(true)} aria-label={t('items.manageTags')}>
                  <IconPlus size={13} />
                </button>
              </div>
            </div>
            <div className={s.rowActions}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('items.editTitle')}
                title={t('items.editTitle')}
                onClick={() => setEditOpen(true)}
              >
                <IconPencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('items.archiveTitle')}
                title={t('items.archiveTitle')}
                disabled={!isOnline || archive.isPending}
                onClick={() => setArchiveConfirmOpen(true)}
              >
                <IconArchive size={16} />
              </Button>
            </div>
          </div>

          <div className={s.tagRow}>
            {currentTags.length === 0 ? (
              <span className={d.mutedText}>{t('items.noTags')}</span>
            ) : (
              currentTags.map((tag: any) => (
                <Tag key={tag.id}>#{tag.name}</Tag>
              ))
            )}
          </div>

          <div className={s.specGrid}>
            <SpecCell label={t('items.serialNumber')}>{it.serial_number ?? t('common.notSet')}</SpecCell>
            <SpecCell label={t('items.purchasePrice')}>{formatPrice(it.purchase_price, it.purchase_currency, t)}</SpecCell>
            <SpecCell label={t('itemDetail.purchasedAt')}>{formatDate(it.purchase_date) ?? t('common.notSet')}</SpecCell>
            <SpecCell label={t('itemDetail.baseLocation')}>{it.home_base_location_id ? t('common.set') : t('common.notSet')}</SpecCell>
            <SpecCell label={t('itemDetail.qrCode')}>
              <InlineCode text={it.id.slice(0, 8).toUpperCase()} />
            </SpecCell>
          </div>
        </div>

        <LocationRouteCard
          locationId={it.location_id}
          locationPath={locationPath}
          onMove={() => setMoveOpen(true)}
        />
      </section>

      <main className={s.contentGrid}>
        <div className={s.mainColumn}>
          <WarrantyPanel item={it} />
          <PurchasePanel
            item={it}
            isVirtual={isVirtual}
            proofs={proofs}
            uploadPending={uploadProof.isPending}
            onPickProof={handleProofPick}
            onDeleteProof={(proof) => deleteProof.mutate(proof.id)}
            onEdit={() => setEditOpen(true)}
          />
          {isVirtual && <PlatformSection itemId={itemId} itemName={it.name} />}
          <LoansSection itemId={itemId} />
          <EventsSection itemId={itemId} />
          <ContainerSection itemId={itemId} />
        </div>

        <div className={s.railColumn}>
          <StatusPanel statusOptions={statusOptions} status={it.status} isOnline={isOnline} pending={updateStatus.isPending} onChange={(status) => updateStatus.mutate(status)} locationPath={locationPath} />
          <TasksPanel itemId={it.id} />
          {isConsumable && <ConsumableSection itemId={itemId} item={it} />}
          <MetadataSection itemId={itemId} item={it} />
          <TimelineMeta item={it} />
        </div>
      </main>

      <Dialog open={tagDialogOpen} title={t('items.manageTags')} onClose={() => setTagDialogOpen(false)}>
        <div className={s.dialogStack}>
          <div className={s.tagList}>
            {currentTags.map((tag: any) => (
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
            {currentTags.length === 0 && <span className={d.mutedText}>{t('items.noTags')}</span>}
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
                const tag = tags.data?.tags.find((candidate: any) => candidate.id === tagID);
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

      {editOpen && <ItemEditDialog item={it} onClose={() => setEditOpen(false)} />}
      {moveOpen && <ChangeLocationDialog item={it} onClose={() => setMoveOpen(false)} />}
      <Dialog
        open={archiveConfirmOpen}
        title={t('items.archiveTitle')}
        onClose={() => setArchiveConfirmOpen(false)}
      >
        <p className={d.emptyState}>{t('items.archiveConfirmBody')}</p>
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
    </div>
  );
}

function Gallery({ itemName, photos, currentPhoto, photoIdx, isOnline, uploadPending, onPickPhoto, onAddPhoto }: {
  itemName: string;
  photos: Attachment[];
  currentPhoto?: Attachment;
  photoIdx: number;
  isOnline: boolean;
  uploadPending: boolean;
  onPickPhoto: (idx: number) => void;
  onAddPhoto: () => void;
}) {
  return (
    <div className={s.gallery}>
      <div className={s.mainPhoto}>
        {currentPhoto ? <HeroPhoto itemName={itemName} photo={currentPhoto} /> : <PhotoEmpty />}
        {photos.length > 0 && <span className={s.photoCount}>{photoIdx + 1}/{photos.length}</span>}
      </div>
      <div className={s.thumbStrip}>
        {photos.map((photo, idx) => (
          <button key={photo.id} type="button" className={s.thumbButton} data-active={idx === photoIdx || undefined} onClick={() => onPickPhoto(idx)} aria-label={photo.filename}>
            <img src={photo.url} alt="" className={s.thumbImg} />
          </button>
        ))}
        <button type="button" className={s.thumbAdd} onClick={onAddPhoto} disabled={!isOnline || uploadPending} aria-label="upload">
          {uploadPending ? <Spinner /> : <IconPhotoPlus size={18} />}
        </button>
      </div>
    </div>
  );
}

function PhotoEmpty() {
  const { t } = useTranslation();
  return (
    <div className={s.photoEmpty}>
      <IconPackage size={42} />
      <strong>{t('items.noPhotoYet')}</strong>
      <span>{t('items.uploadPhotoHint')}</span>
    </div>
  );
}

function HeroPhoto({ itemName, photo }: { itemName: string; photo: Attachment }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={s.photoEmpty}>
        <IconPackage size={42} />
        <strong>{t('items.photoReadFailed')}</strong>
        <span>{photo.filename}</span>
      </div>
    );
  }
  return <img className={s.mainPhotoImg} src={photo.url} alt={`${itemName} photo`} onError={() => setFailed(true)} />;
}

function LocationRouteCard({ locationId, locationPath, onMove }: { locationId?: string; locationPath?: string; onMove: () => void }) {
  const { t } = useTranslation();
  const nodes = splitPath(locationPath);
  return (
    <aside className={s.locationCard}>
      <div className={s.cardTitleRow}>
        <h2 className={s.cardTitle}>{t('itemDetail.locationPath')}</h2>
        <Button variant="ghost" size="sm" onClick={onMove}>{t('itemDetail.moveLocation')}</Button>
      </div>
      <div className={s.routeList}>
        {(nodes.length > 0 ? nodes : [t('common.notSet')]).map((node, index) => {
          const isCurrent = index === nodes.length - 1 && nodes.length > 0;
          return (
            <div className={s.routeItem} data-current={isCurrent || undefined} key={`${node}-${index}`}>
              <span className={s.routeIcon}>{index === 0 ? <IconHome size={14} /> : <IconMapPin size={14} />}</span>
              <span>{node}</span>
              {isCurrent && <span className={s.routeCode}>{t('common.current')}</span>}
            </div>
          );
        })}
      </div>
      <Link to="/locations" search={locationId ? { focus: locationId } : {}} className={s.blockLink}>
        {t('itemDetail.viewItemsAtLocation')}
        <IconChevronRight size={14} />
      </Link>
    </aside>
  );
}

function WarrantyPanel({ item }: { item: Item }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const warranty = getWarrantyView(item, t);
  return (
    <DetailSection
      icon={<IconShieldCheck size={15} />}
      title={t('itemDetail.warranty')}
      action={<Button variant="ghost" size="sm" onClick={() => setEditing(true)}>{t('common.edit')}</Button>}
    >
      {!warranty.expiresAt ? (
        <p className={d.emptyState}>{t('itemDetail.warrantyNotSetHint')}</p>
      ) : (
        <div className={d.kvList}>
          <KvRow label={t('itemDetail.warrantyExpiry')}>{formatDate(warranty.expiresAt)}</KvRow>
          <KvRow label={t('itemDetail.daysLeft')}>
            <span className={s.warrantySummary[warranty.tone === 'neutral' ? 'info' : warranty.tone]}>{warranty.summary}</span>
          </KvRow>
          <KvRow label={t('itemDetail.warrantyContact')}>{item.warranty_contact ?? t('common.notSet')}</KvRow>
        </div>
      )}
      {editing && (
        <WarrantyEditDialog
          item={item}
          onClose={() => {
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ['item'] });
          }}
        />
      )}
    </DetailSection>
  );
}

function PurchasePanel({ item, isVirtual, proofs, uploadPending, onPickProof, onDeleteProof, onEdit }: {
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
    <DetailSection
      icon={<IconReceipt size={15} />}
      title={t('itemDetail.purchaseInfo')}
      action={<Button variant="ghost" size="sm" onClick={onEdit}>{t('common.edit')}</Button>}
    >
      <div className={d.kvList}>
        <KvRow label={t('itemDetail.purchasedAt')}>{item.purchase_date ? formatDate(item.purchase_date) : t('common.notSet')}</KvRow>
        <KvRow label={t('items.purchasePrice')}>{item.purchase_price != null ? formatPrice(item.purchase_price, item.purchase_currency, t) : t('common.notSet')}</KvRow>
        <KvRow label={t('assets.purchasePlatform')}>{item.purchase_platform ?? t('common.notSet')}</KvRow>
      </div>
      <ProofStrip proofs={proofs} uploadPending={uploadPending} onPick={onPickProof} onDelete={onDeleteProof} />
      {isVirtual && addons.isError && <div className={d.emptyState}>{t('common.loadFailed')}</div>}
      {isVirtual && addonList.length > 0 && (
        <>
          <span className={d.mutedText}>{t('itemDetail.addonPurchases')}</span>
          <div className={d.kvList}>
            {addonList.map((addon: any) => (
              <KvRow label={addon.name} key={addon.id}>
                {addon.price != null ? formatPrice(addon.price, addon.currency, t) : t('common.notSet')}
              </KvRow>
            ))}
          </div>
        </>
      )}
    </DetailSection>
  );
}

function PlatformSection({ itemId, itemName }: { itemId: string; itemName: string }) {
  const { t } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VirtualCredential | null>(null);
  const { requestDelete, deleteDialog } = useCredentialDelete();
  const creds = useQuery({ queryKey: ['item', itemId, 'credentials'], queryFn: () => virtualAssetsApi.listCredentials(itemId) });
  const credentials = creds.data?.credentials ?? [];

  return (
    <DetailSection
      icon={<IconKey size={15} />}
      title={t('itemDetail.platformCredentials')}
      action={<Button variant="ghost" size="sm" onClick={() => setFormOpen(true)}>{t('itemDetail.addCredential')}</Button>}
    >
      {creds.isLoading ? <Spinner /> : creds.isError ? (
        <div className={d.emptyState}>{t('common.loadFailed')}</div>
      ) : credentials.length === 0 ? (
        <div className={d.emptyState}>{t('itemDetail.noCredentials')}</div>
      ) : (
        <div className={d.listStack}>
          {credentials.map((credential: VirtualCredential) => (
            <div className={d.listRow} key={credential.id}>
              <span className={d.listThumb}><IconKey size={15} /></span>
              <span className={d.listMeta}>
                <span className={d.listName}>{credential.platform}</span>
                {credential.account && <span className={d.listSub}>{t('itemDetail.accountLabel')}: {credential.account}</span>}
                {credential.order_id && <span className={d.listSub}>{t('itemDetail.orderLabel')}: {credential.order_id}</span>}
                {credential.license_key && (
                  <LicenseKeyBox licenseKey={credential.license_key} />
                )}
              </span>
              <span className={s.rowActions}>
                <Button variant="ghost" size="icon-sm" aria-label={t('common.edit')} onClick={() => setEditing(credential)}>
                  <IconPencil size={14} />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={t('common.delete')} onClick={() => requestDelete(credential, itemName)}>
                  <IconTrash size={14} />
                </Button>
              </span>
            </div>
          ))}
        </div>
      )}
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
    </DetailSection>
  );
}

function TasksPanel({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const reminders = useQuery({
    queryKey: ['reminders', 'item', itemId],
    queryFn: () => remindersApi.list({ itemId }),
  });
  const all = reminders.data?.reminders ?? [];
  const pending = all.filter((r) => !r.is_dismissed && !r.sent_at);

  return (
    <DetailSection icon={<IconBell size={15} />} title={t('itemDetail.tasks')}>
      {reminders.isPending ? (
        <Spinner />
      ) : reminders.isError ? (
        <div className={d.emptyState}>{t('common.loadFailed')}</div>
      ) : pending.length === 0 ? (
        <div className={d.emptyState}>{t('reminders.noPendingForItem')}</div>
      ) : (
        <div className={s.taskList}>
          {pending.map((r) => (
            <ReminderRow key={r.id} reminder={r} showItem={false} />
          ))}
        </div>
      )}
      <Link to="/reminders" className={d.blockLinkButton}>
        {t('itemDetail.viewAllTasks')}
      </Link>
    </DetailSection>
  );
}

function StatusPanel({ statusOptions, status, isOnline, pending, onChange, locationPath }: {
  statusOptions: Array<{ value: string; label: string }>;
  status: string;
  isOnline: boolean;
  pending: boolean;
  onChange: (status: string) => void;
  locationPath?: string;
}) {
  const { t } = useTranslation();
  return (
    <DetailSection icon={<IconMapPin size={15} />} title={t('itemDetail.statusAndLocation')}>
      <div className={d.kvList}>
        <KvRow label={t('items.status')}><StatusBadge status={status} /></KvRow>
        <KvRow label={t('items.location')}>{locationPath ?? t('common.notSet')}</KvRow>
      </div>
      {statusOptions.some((option) => option.value === status) && (
        <SelectField label={t('items.switchStatus')} options={statusOptions} value={status} disabled={!isOnline || pending} onChange={(event) => onChange(event.currentTarget.value)} />
      )}
    </DetailSection>
  );
}

function TimelineMeta({ item }: { item: Item }) {
  const { t } = useTranslation();
  return (
    <DetailSection icon={<IconClock size={15} />} title={t('itemDetail.timestamps')}>
      <div className={d.kvList}>
        <KvRow label={t('itemDetail.createdAt')}>{formatDateTime(item.created_at)}</KvRow>
        <KvRow label={t('itemDetail.updatedAt')}>{formatDateTime(item.updated_at)}</KvRow>
      </div>
    </DetailSection>
  );
}

function ConsumableSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const useOneMutation = useMutation({ mutationFn: () => suppliesExtendedApi.useOne(itemId), onSuccess: (next) => qc.setQueryData(['item', itemId], next) });
  const stock = item.current_stock ?? 0;
  const min = item.min_stock_threshold ?? 0;
  const low = min > 0 && stock <= min;
  return (
    <DetailSection
      icon={<IconShoppingCart size={15} />}
      title={t('itemDetail.consumable')}
      action={low ? <span className={s.warningText}><IconAlertTriangle size={12} />{t('itemDetail.belowThreshold')}</span> : undefined}
    >
      <div className={s.stockHero}>
        <span className={s.stockValue}>{stock}</span>
        <span>{t('common.pieces')}</span>
      </div>
      <div className={d.kvList}>
        <KvRow label={t('itemDetail.minStock')}>{item.min_stock_threshold ?? '—'}</KvRow>
        <KvRow label={t('itemDetail.lifespanDays')}>{item.lifespan_days ?? '—'}</KvRow>
      </div>
      {item.type === 'tracked_spares' && <Button leftSection={<IconShoppingCart size={15} />} onClick={() => useOneMutation.mutate()} disabled={useOneMutation.isPending || stock <= 0}>{t('itemDetail.useOne')}</Button>}
    </DetailSection>
  );
}

function LoansSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({ queryKey: ['item', itemId, 'loans'], queryFn: () => loansApi.listForItem(itemId) });
  const loans = data?.loans ?? [];
  return (
    <DetailSection icon={<IconClipboardList size={15} />} title={t('itemDetail.loans')}>
      {isLoading ? <Spinner /> : isError ? <div className={d.emptyState}>{t('common.loadFailed')}</div> : loans.length === 0 ? (
        <div className={d.emptyState}>{t('itemDetail.noLoans')}</div>
      ) : (
        <div className={d.listStack}>
          {loans.map((loan: any) => (
            <div className={d.listRow} key={loan.id}>
              <span className={d.avatar}>{loan.borrower_name?.slice(0, 1) ?? '?'}</span>
              <div className={d.listMeta}>
                <span className={d.listName}>{loan.borrower_name}</span>
                <span className={d.listSub}>{formatDate(loan.loaned_at)}{loan.due_at ? ` / ${formatDate(loan.due_at)}` : ''}</span>
              </div>
              <Badge>{String(t(`status.${loan.status}`, loan.status))}</Badge>
            </div>
          ))}
        </div>
      )}
    </DetailSection>
  );
}

function EventsSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({ queryKey: ['item', itemId, 'events'], queryFn: () => suppliesExtendedApi.listEvents(itemId) });
  const events = data?.events ?? [];
  return (
    <DetailSection icon={<IconHistory size={15} />} title={t('itemDetail.events')}>
      {isLoading ? <Spinner /> : isError ? <div className={d.emptyState}>{t('common.loadFailed')}</div> : events.length === 0 ? (
        <div className={d.emptyState}>{t('itemDetail.noEvents')}</div>
      ) : (
        <>
          <div className={d.timeline}>
            {events.slice(0, 5).map((event: any) => (
              <div className={d.timelineRow} key={event.id}>
                <span className={d.timelineIcon}><IconHistory size={13} /></span>
                <div className={d.timelineMeta}>
                  <span className={d.listName}>{formatEventTitle(event, t)}</span>
                  <span className={d.listSub}>{formatDateTime(event.created_at)}</span>
                  {formatEventPayload(event, t) && <code className={d.payload}>{formatEventPayload(event, t)}</code>}
                </div>
              </div>
            ))}
          </div>
          {events.length > 5 && <span className={d.mutedText}>{t('itemDetail.eventsTotal', { count: events.length })}</span>}
        </>
      )}
    </DetailSection>
  );
}

function ContainerSection({ itemId }: { itemId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['item', itemId, 'contents'], queryFn: () => containerApi.listContents(itemId) });
  const removeMutation = useMutation({ mutationFn: (childId: string) => containerApi.remove(itemId, childId), onSuccess: () => qc.invalidateQueries({ queryKey: ['item', itemId, 'contents'] }) });
  const contents = data?.items ?? [];
  if (!isLoading && !isError && contents.length === 0) return null;
  return (
    <DetailSection icon={<IconPackage size={15} />} title={t('itemDetail.contents')}>
      {isLoading ? <Spinner /> : isError ? <div className={d.emptyState}>{t('common.loadFailed')}</div> : (
        <div className={d.listStack}>
          {contents.map((child: any) => (
            <div className={d.listRow} key={child.id}>
              <span className={d.listThumb}><IconPackage size={15} /></span>
              <span className={d.listMeta}>
                <span className={d.listName}>{child.name}</span>
                <span className={d.listSub}>{String(t(`status.${child.status}`, child.status))}</span>
              </span>
              <Button variant="quiet" size="sm" leftSection={<IconX size={13} />} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(child.id)}>{t('itemDetail.removeFromContainer')}</Button>
            </div>
          ))}
        </div>
      )}
    </DetailSection>
  );
}

function formatEventTitle(event: any, t: (key: string, params?: any) => string) {
  return String(t(`events.${event.event_type}`, event.event_type));
}

function formatEventPayload(event: any, t: (key: string, params?: any) => string): string | null {
  if (!event.payload) return null;
  try {
    const parsed = JSON.parse(event.payload);
    if (parsed && typeof parsed.exit_type === 'string') {
      return `${t('items.exitType')}: ${t(`status.${parsed.exit_type}`, parsed.exit_type)}`;
    }
    return event.payload;
  } catch {
    return event.payload;
  }
}

function MetadataSection({ itemId, item }: { itemId: string; item: Item }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formKey, setFormKey] = useState('');
  const [formVal, setFormVal] = useState('');
  const [editOriginalKey, setEditOriginalKey] = useState<string | null>(null);
  const isOnline = useNetworkStatus();
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
      <DetailSection
        icon={<IconTag size={15} />}
        title={t('itemDetail.customMetadata')}
        action={<Button variant="ghost" size="sm" leftSection={<IconPlus size={14} />} disabled={!isOnline} onClick={openAdd}>{t('common.add')}</Button>}
      >
        {entries.length > 0 ? (
          <div className={d.kvList}>
            {entries.map(([key, value]) => (
              <div className={d.kvRow} key={key}>
                <span className={d.kvLabel}>{key}</span>
                <button type="button" className={d.kvValueButton} onClick={() => openEdit(key, value)}>{value}</button>
                <button type="button" className={d.iconOnly} onClick={() => handleRemove(key)} disabled={!isOnline || updateMutation.isPending} title={t('common.delete')}>
                  <IconTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : <div className={d.emptyState}>{t('itemDetail.noMetadata')}</div>}
      </DetailSection>
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

function SpecCell({ label, children, span }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <div className={s.specCell} data-span={span || undefined}>
      <span className={s.specLabel}>{label}</span>
      <span className={s.specValue}>{children}</span>
    </div>
  );
}

function KvRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={d.kvRow}>
      <span className={d.kvLabel}>{label}</span>
      <span className={d.kvValue}>{children}</span>
    </div>
  );
}

function InlineCode({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <span className={s.inlineCode}>
      {text}
      <button type="button" className={s.copyButton} onClick={() => void navigator.clipboard?.writeText(text)} aria-label={t('common.copy')}>
        <IconCopy size={12} />
      </button>
      <IconQrcode size={14} />
    </span>
  );
}

function splitPath(path?: string) {
  return path?.split('→').map((part) => part.trim()).filter(Boolean) ?? [];
}
