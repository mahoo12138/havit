import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCopy, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useToast } from '../../components/ui/use-toast';
import * as s from './credentials.css';

/**
 * Masked license-key display shared by the credentials page and the item
 * detail platform-credentials card: `••••` value with an eye toggle and a
 * clipboard copy. Toasts are fired here so callers stay stateless.
 */
export function LicenseKeyBox({ licenseKey }: { licenseKey: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [revealed, setRevealed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      toast.show(t('credentials.licenseKeyCopied'));
    } catch {
      toast.show(t('credentials.licenseKeyCopyFailed'));
    }
  };

  return (
    <div className={s.licenseBox}>
      <span className={s.licenseValue}>{revealed ? licenseKey : '••••••••••••'}</span>
      <button
        type="button"
        className={s.licenseAction}
        aria-label={t('credentials.toggleLicenseKey')}
        title={t('credentials.toggleLicenseKey')}
        onClick={() => setRevealed((prev) => !prev)}
      >
        {revealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
      </button>
      <button
        type="button"
        className={s.licenseAction}
        aria-label={t('credentials.copyLicenseKey')}
        title={t('credentials.copyLicenseKey')}
        onClick={copy}
      >
        <IconCopy size={14} />
      </button>
    </div>
  );
}
