import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  itemsApi,
  locationsApi,
  tagsApi,
  type Item,
  type Location,
  type Tag,
} from '../../api/client';
import { useToast } from '../../components/ui/use-toast';

/* ── Helpers ── */

export function findLocationPath(
  nodes: Location[] | undefined, locationId: string | undefined, prefix = '',
): string | undefined {
  if (!nodes || !locationId) return undefined;
  for (const node of nodes) {
    const path = prefix ? `${prefix} → ${node.name}` : node.name;
    if (node.id === locationId) return path;
    const child = findLocationPath(node.children, locationId, path);
    if (child) return child;
  }
  return undefined;
}

export function formatDate(unix: number | undefined): string | undefined {
  if (!unix) return undefined;
  return new Date(unix * 1000).toLocaleDateString();
}

export function formatDateTime(unix: number | undefined): string {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString();
}

export function formatPrice(
  price: number | undefined, currency: string | undefined, t: (key: string) => string,
): string {
  if (price == null) return t('common.notSet');
  return `${price.toLocaleString()} ${currency ?? ''}`.trim();
}

export function getWarrantyView(item: Item, t: (key: string, params?: any) => string): {
  expiresAt?: number;
  daysLeft: number | null;
  summary: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
} {
  if (!item.warranty_expires_at) return { daysLeft: null, summary: '—', tone: 'neutral' };
  const daysLeft = Math.floor((item.warranty_expires_at - Date.now() / 1000) / 86400);
  if (daysLeft < 0) return { expiresAt: item.warranty_expires_at, daysLeft, summary: t('itemDetail.warrantyExpired'), tone: 'danger' };
  if (daysLeft <= 30) return { expiresAt: item.warranty_expires_at, daysLeft, summary: t('itemDetail.daysCount', { count: daysLeft }), tone: 'warning' };
  return { expiresAt: item.warranty_expires_at, daysLeft, summary: t('itemDetail.daysCount', { count: daysLeft }), tone: 'success' };
}

/* ── Hook ── */

export function useItemDetailData(itemId: string) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const item = useQuery({ queryKey: ['item', itemId], queryFn: () => itemsApi.get(itemId) });
  const attachments = useQuery({ queryKey: ['item', itemId, 'attachments'], queryFn: () => itemsApi.attachments(itemId) });
  const locs = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.tree() });
  const tags = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list() });

  const archive = useMutation({
    mutationFn: () => itemsApi.archive(itemId),
    onSuccess: () => { toast.show(t('items.archived')); qc.invalidateQueries({ queryKey: ['items'] }); window.history.back(); },
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => itemsApi.update(itemId, { status }),
    onSuccess: (next) => { toast.show(t('items.statusUpdated')); qc.setQueryData(['item', itemId], next); qc.invalidateQueries({ queryKey: ['items'] }); },
    onError: (e: Error) => toast.show(t('items.statusUpdateFailed', { error: e.message })),
  });

  const updatePrivacy = useMutation({
    mutationFn: (isPrivate: boolean) => itemsApi.update(itemId, { is_private: isPrivate }),
    onSuccess: (next) => { toast.show(t(next.is_private ? 'items.nowPrivate' : 'items.nowShared')); qc.setQueryData(['item', itemId], next); qc.invalidateQueries({ queryKey: ['items'] }); },
    onError: (e: Error) => toast.show(t('items.statusUpdateFailed', { error: e.message })),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => itemsApi.uploadPhoto(itemId, file),
    onSuccess: () => { toast.show(t('items.photoUploaded')); qc.invalidateQueries({ queryKey: ['item', itemId, 'attachments'] }); },
    onError: (e: Error) => toast.show(t('items.photoUploadFailed', { error: e.message })),
  });

  const uploadProof = useMutation({
    mutationFn: (file: File) => itemsApi.uploadAttachment(itemId, file, 'purchase_proof'),
    onSuccess: () => { toast.show(t('itemDetail.proofUploaded')); qc.invalidateQueries({ queryKey: ['item', itemId, 'attachments'] }); },
    onError: (e: Error) => toast.show(t('itemDetail.proofUploadFailed', { error: e.message })),
  });

  const deleteProof = useMutation({
    mutationFn: (attachmentId: string) => itemsApi.deleteAttachment(attachmentId),
    onSuccess: () => { toast.show(t('itemDetail.proofDeleted')); qc.invalidateQueries({ queryKey: ['item', itemId, 'attachments'] }); },
    onError: (e: Error) => toast.show(t('itemDetail.proofDeleteFailed', { error: e.message })),
  });

  const replaceTags = useMutation({
    mutationFn: (tagIds: string[]) => itemsApi.replaceTags(itemId, tagIds),
    onSuccess: (next) => { qc.setQueryData(['item', itemId], next); qc.invalidateQueries({ queryKey: ['items'] }); toast.show(t('items.tagsUpdated')); },
    onError: (e: Error) => toast.show(t('items.tagUpdateFailed', { error: e.message })),
  });

  const createTag = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); },
    onError: (e: Error) => toast.show(t('items.tagCreateFailed', { error: e.message })),
  });

  // Computed
  const it = item.data;
  const locationPath = findLocationPath(locs.data?.tree, it?.location_id);
  const allAttachments = attachments.data?.attachments ?? [];
  const photos = allAttachments.filter((att) => att.type === 'photo');
  const proofs = allAttachments.filter((att) => att.type === 'purchase_proof');
  const photoIdx = Math.min(selectedPhotoIdx, Math.max(photos.length - 1, 0));
  const currentPhoto = photos[photoIdx];
  const currentTags = it?.tags ?? [];
  const currentTagIDs = currentTags.map((tag: Tag) => tag.id);
  const availableTags = tags.data?.tags.filter((tag: Tag) => !currentTagIDs.includes(tag.id)) ?? [];
  const tagOptions = availableTags.map((tag: Tag) => ({ value: tag.id, label: tag.name }));

  function handlePhotoPick(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) { toast.show(t('items.selectImage')); return; }
    uploadPhoto.mutate(file);
  }

  // Purchase proofs accept images and PDF invoices/order screenshots.
  function handleProofPick(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.show(t('itemDetail.selectProofFile'));
      return;
    }
    uploadProof.mutate(file);
  }

  function addTag(tag: Tag) {
    if (currentTagIDs.includes(tag.id)) return;
    replaceTags.mutate([...currentTagIDs, tag.id]);
  }

  function removeTag(tagID: string) {
    replaceTags.mutate(currentTagIDs.filter((id) => id !== tagID));
  }

  // Exit/borrowed statuses have dedicated flows (exit, loan, abnormal
  // recovery); the generic switcher only exposes safe in-place changes.
  const statusOptions = [
    { value: 'in_stock', label: t('status.in_stock') },
    { value: 'in_use', label: t('status.in_use') },
    { value: 'idle', label: t('status.idle') },
    { value: 'for_sale', label: t('status.for_sale') },
  ];

  return {
    t, item, attachments, locs, tags, it, locationPath,
    photos, photoIdx, currentPhoto, setSelectedPhotoIdx,
    proofs, uploadProof, deleteProof, handleProofPick,
    currentTags, currentTagIDs, availableTags, tagOptions,
    statusOptions, fileInputRef, handlePhotoPick, addTag, removeTag,
    archive, updateStatus, updatePrivacy, uploadPhoto, replaceTags, createTag,
  };
}
