import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { IconKey, IconLicense, IconPackages, IconPlus } from '@tabler/icons-react';
import { uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import {
  virtualCredentialsApi,
  type Item,
  type VirtualCredentialWithItem,
} from '../../api/client';
import { DataCard } from '../m2/components';
import { formatDate, formatPrice } from '../assets/useAssetsData';
import { CredentialFormDialog } from './CredentialFormDialog';
import { CredentialMetrics } from './CredentialMetrics';
import { InlineSelect } from './InlineSelect';
import { LicenseKeyBox } from './LicenseKeyBox';
import { useCredentialDelete } from './useCredentialDelete';
import * as s from './credentials.css';

export function CredentialsTab({
  virtualItems,
  virtualLoading = false,
  virtualError = false,
}: {
  virtualItems: Item[];
  /** State of the virtual-items query, so the empty-state hint never lies. */
  virtualLoading?: boolean;
  virtualError?: boolean;
}) {
  const { t } = useTranslation();
  const [filterPlatform, setFilterPlatform] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VirtualCredentialWithItem | null>(null);
  const { requestDelete, deleteDialog } = useCredentialDelete();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['virtual-credentials'],
    queryFn: () => virtualCredentialsApi.list(),
  });
  const credentials = data?.credentials ?? [];

  const platforms = useMemo(
    () => Array.from(new Set(credentials.map((credential) => credential.platform))).sort(),
    [credentials]
  );
  const visible = useMemo(
    () => (filterPlatform ? credentials.filter((c) => c.platform === filterPlatform) : credentials),
    [credentials, filterPlatform]
  );
  const itemCount = useMemo(() => new Set(credentials.map((c) => c.item_id)).size, [credentials]);

  return (
    <>
      <CredentialMetrics
        metrics={[
          { icon: IconKey, label: t('credentials.credentialRecords'), value: credentials.length, tone: 'accent' },
          {
            icon: IconLicense,
            label: t('credentials.hasLicenseKey'),
            value: credentials.filter((c) => c.license_key).length,
            tone: 'info',
          },
          { icon: IconPackages, label: t('credentials.linkedItems'), value: itemCount, tone: 'success' },
        ]}
      />
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <DataCard title={t('credentials.virtualCredentialList')}>
          <div className={s.emptyNote}>{t('credentials.loadFailed')}</div>
        </DataCard>
      ) : credentials.length === 0 ? (
        <DataCard title={t('credentials.virtualCredentialList')}>
          <EmptyCredentials
            virtualItems={virtualItems}
            virtualLoading={virtualLoading}
            virtualError={virtualError}
            onAdd={() => setFormOpen(true)}
          />
        </DataCard>
      ) : (
        <DataCard
          title={t('credentials.virtualCredentialList')}
          meta={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <InlineSelect
                value={filterPlatform}
                placeholder={t('credentials.filterAllPlatforms')}
                onChange={setFilterPlatform}
                options={platforms.map((platform) => ({ value: platform, label: platform }))}
              />
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <IconPlus size={14} /> {t('credentials.addCredential')}
              </Button>
            </div>
          }
        >
          {visible.length === 0 ? (
            <div className={s.emptyNote}>{t('credentials.noFilterResult')}</div>
          ) : (
            <div className={uiStyles.cardGrid}>
              {visible.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onEdit={() => setEditing(credential)}
                  onDelete={() => requestDelete(credential)}
                />
              ))}
            </div>
          )}
        </DataCard>
      )}

      {formOpen && (
        <CredentialFormDialog open onClose={() => setFormOpen(false)} virtualItems={virtualItems} />
      )}
      {editing && (
        <CredentialFormDialog
          open
          credential={editing}
          itemId={editing.item_id}
          onClose={() => setEditing(null)}
        />
      )}
      {deleteDialog}
    </>
  );
}

function CredentialCard({
  credential,
  onEdit,
  onDelete,
}: {
  credential: VirtualCredentialWithItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [];
  if (credential.order_id) rows.push({ label: t('credentials.orderId'), value: credential.order_id, mono: true });
  if (credential.price != null)
    rows.push({ label: t('credentials.price'), value: formatPrice(credential.price, credential.currency) });
  if (credential.purchased_at)
    rows.push({ label: t('credentials.purchasedAt'), value: formatDate(credential.purchased_at) });

  return (
    <Card>
      <div className={s.cardBody}>
        <div className={s.cardHead}>
          <span className={s.statusTile.credential}>
            <IconKey size={16} />
          </span>
          <div className={s.cardHeadMeta}>
            <h3 className={s.cardTitle}>
              <Link to="/items/$itemId" params={{ itemId: credential.item_id }}>
                {credential.item_name}
              </Link>
            </h3>
            {credential.account && <span className={s.cardSub}>{credential.account}</span>}
          </div>
          <span className={s.statusChip.platform}>{credential.platform}</span>
        </div>

        {rows.length > 0 && (
          <dl className={s.kvList}>
            {rows.map((row) => (
              <div className={s.kvRow} key={row.label}>
                <dt className={s.kvLabel}>{row.label}</dt>
                <dd className={row.mono ? `${s.kvValue} ${s.mono}` : s.kvValue}>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {credential.license_key && <LicenseKeyBox licenseKey={credential.license_key} />}

        <div className={s.cardFoot}>
          <Button variant="subtle" size="sm" onClick={onEdit}>
            {t('common.edit')}
          </Button>
          <Button variant="subtle" size="sm" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EmptyCredentials({
  virtualItems,
  virtualLoading,
  virtualError,
  onAdd,
}: {
  virtualItems: Item[];
  virtualLoading: boolean;
  virtualError: boolean;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  // The virtual-items list may still be loading or failed; only claim "no
  // virtual assets" once it has actually resolved empty.
  if (virtualLoading) return <Spinner />;
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem', padding: '2rem 0' }}>
      <IconKey size={28} />
      {virtualError ? (
        <p style={{ color: 'var(--havit-muted)', margin: 0 }}>{t('credentials.loadFailed')}</p>
      ) : (
        <p style={{ color: 'var(--havit-muted)', margin: 0 }}>{t('credentials.noVirtual')}</p>
      )}
      {virtualItems.length > 0 ? (
        <Button size="sm" onClick={onAdd}>
          <IconPlus size={14} /> {t('credentials.addCredential')}
        </Button>
      ) : !virtualError && (
        <p className={uiStyles.helpParagraph}>
          {t('credentials.needVirtualItemFirst')}
        </p>
      )}
    </div>
  );
}
