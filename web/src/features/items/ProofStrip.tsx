import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFileText, IconPhotoPlus, IconTrash } from '@tabler/icons-react';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { Spinner } from '../../components/ui/spinner';
import type { Attachment } from '../../api/client';
import * as s from './proof-strip.css';

interface ProofStripProps {
  proofs: Attachment[];
  uploadPending: boolean;
  onPick: (file: File | undefined) => void;
  onDelete: (attachment: Attachment) => void;
}

/**
 * Purchase-proof attachment strip: real invoice/order files, unlike the
 * old fake "purchase proof" thumbnail which merely restated purchase
 * fields. Images render inline as thumbnails, anything else (PDF) opens
 * as a download via the backend's attachment disposition.
 */
export function ProofStrip({ proofs, uploadPending, onPick, onDelete }: ProofStripProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);

  return (
    <div className={s.strip}>
      {proofs.map((proof) => (
        <ProofThumb key={proof.id} proof={proof} onDelete={() => setPendingDelete(proof)} />
      ))}
      {proofs.length === 0 && <p className={s.hint}>{t('itemDetail.proofEmpty')}</p>}
      <button
        type="button"
        className={s.add}
        onClick={() => inputRef.current?.click()}
        disabled={uploadPending}
        aria-label={t('itemDetail.uploadProof')}
      >
        {uploadPending ? <Spinner /> : <IconPhotoPlus size={18} />}
        <span>{t('itemDetail.uploadProof')}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className={s.fileInput}
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {pendingDelete && (
        <Dialog open title={t('itemDetail.proofDeleteConfirm')} onClose={() => setPendingDelete(null)}>
          <p className={s.hint}>{pendingDelete.filename}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="quiet" onClick={() => setPendingDelete(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              {t('common.delete')}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ProofThumb({ proof, onDelete }: { proof: Attachment; onDelete: () => void }) {
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = proof.content_type?.startsWith('image/') && !imgFailed;
  return (
    <a
      className={s.thumb}
      href={proof.url}
      target="_blank"
      rel="noreferrer"
      aria-label={proof.filename}
      title={proof.filename}
    >
      {isImage && <img className={s.thumbImg} src={proof.url} alt="" onError={() => setImgFailed(true)} />}
      {isImage && <span className={s.thumbScrim} />}
      {!isImage && <IconFileText size={20} />}
      <span className={s.thumbName}>{proof.filename}</span>
      <span
        role="button"
        tabIndex={0}
        className={s.deleteButton}
        aria-label={t('common.delete')}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }
        }}
      >
        <IconTrash size={13} />
      </span>
    </a>
  );
}
