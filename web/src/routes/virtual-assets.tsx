import { createFileRoute } from '@tanstack/react-router';
import { VirtualAssetsDesktop } from '../features/virtual-assets/VirtualAssetsDesktop';

type VirtualAssetsSearch = {
  /** Category tab to preselect on entry (e.g. from a detail-page breadcrumb). */
  category?: string;
};

export const Route = createFileRoute('/virtual-assets')({
  validateSearch: (search: Record<string, unknown>): VirtualAssetsSearch => ({
    category: typeof search.category === 'string' && search.category ? search.category : undefined,
  }),
  component: VirtualAssetsPage,
});

function VirtualAssetsPage() {
  const { category } = Route.useSearch();
  return <VirtualAssetsDesktop initialCategory={category} />;
}
