import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { AssetsDesktop } from '../features/assets/AssetsDesktop';
import { AssetsMobile } from '../features/assets/AssetsMobile';

type AssetsSearch = {
  /** Category tab to preselect on entry (e.g. from a detail-page breadcrumb). */
  category?: string;
};

export const Route = createFileRoute('/assets')({
  validateSearch: (search: Record<string, unknown>): AssetsSearch => ({
    category: typeof search.category === 'string' && search.category ? search.category : undefined,
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const { category } = Route.useSearch();
  const device = useDevice();
  if (device === 'mobile') return <AssetsMobile initialCategory={category} />;
  return <AssetsDesktop initialCategory={category} />;
}
