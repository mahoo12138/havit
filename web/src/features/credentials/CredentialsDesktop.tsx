import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { IconShieldCheck } from '@tabler/icons-react';
import { Stack, uiStyles } from '../../components/ui';
import { Spinner } from '../../components/ui/spinner';
import { TabsNav } from '../../components/ui/tabs-nav';
import { itemsApi, suppliesExtendedApi } from '../../api/client';
import { DataCard, FeatureHeader } from '../m2/components';
import * as css from './credentials.css';
import { CredentialsTab } from './CredentialsTab';
import { WarrantyTab } from './WarrantyTab';

type CredentialsTabKey = 'warranty' | 'credentials';

export function CredentialsDesktop() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CredentialsTabKey>('warranty');

  const { data: warrantyData, isLoading: warrantyLoading, isError: warrantyError } = useQuery({
    queryKey: ['items', 'warranty'],
    queryFn: () => suppliesExtendedApi.warranty(),
    enabled: tab === 'warranty',
  });

  // Virtual items power both the credential picker and the empty-state hint.
  // Same key/fetcher as the virtual-assets page so both share one cache entry.
  const { data: virtualData, isLoading: virtualLoading, isError: virtualError } = useQuery({
    queryKey: ['items', 'virtual'],
    queryFn: () => itemsApi.list({ type: 'virtual' }),
    enabled: tab === 'credentials',
  });
  const virtualItems = virtualData?.items ?? [];

  const warrantyItems = warrantyData?.items ?? [];
  const isLoading = tab === 'warranty' ? warrantyLoading : false;

  return (
    <Stack>
      <FeatureHeader
        title={t('credentials.title')}
        description={t('credentials.description')}
        meta={t('credentials.meta')}
      />

      <TabsNav
        value={tab}
        onChange={(v) => setTab(v as CredentialsTabKey)}
        tabs={[
          { key: 'warranty', label: t('credentials.warrantyTab') },
          { key: 'credentials', label: t('credentials.virtualTab') },
        ]}
      />

      {isLoading ? (
        <Spinner />
      ) : tab === 'warranty' ? (
        warrantyError ? (
          <DataCard title={t('credentials.warrantyAggregate')}>
            <div className={css.emptyNote}>{t('credentials.loadFailed')}</div>
          </DataCard>
        ) : warrantyItems.length === 0 ? (
          <DataCard title={t('credentials.warrantyAggregate')}>
            <div style={{ display: 'grid', justifyItems: 'center', gap: '0.75rem', padding: '2rem 0' }}>
              <IconShieldCheck size={28} />
              <p style={{ color: 'var(--havit-muted)', margin: 0 }}>{t('credentials.noWarranty')}</p>
              <p className={uiStyles.helpParagraph}>
                {t('credentials.noWarrantyHint')}
              </p>
            </div>
          </DataCard>
        ) : (
          <WarrantyTab items={warrantyItems} />
        )
      ) : (
        <CredentialsTab
          virtualItems={virtualItems}
          virtualLoading={virtualLoading}
          virtualError={virtualError}
        />
      )}
    </Stack>
  );
}
