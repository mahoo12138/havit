import { createFileRoute } from '@tanstack/react-router';
import { useDevice } from '../lib/device';
import { LocationsDesktop } from '../features/locations/LocationsDesktop';
import { LocationsMobile } from '../features/locations/LocationsMobile';

type LocationsSearch = {
  /** Location to reveal on entry (e.g. from item detail "view items at location"). */
  focus?: string;
};

export const Route = createFileRoute('/locations/')({
  validateSearch: (search: Record<string, unknown>): LocationsSearch => ({
    focus: typeof search.focus === 'string' && search.focus ? search.focus : undefined,
  }),
  component: LocationsPage,
});

function LocationsPage() {
  const { focus } = Route.useSearch();
  const device = useDevice();
  if (device === 'mobile') return <LocationsMobile focusLocationId={focus} />;
  return <LocationsDesktop focusLocationId={focus} />;
}
