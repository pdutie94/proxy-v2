import { getLocationsAction } from '@/modules/locations/actions/location.action';
import { LocationManagement } from '@/modules/locations/components/location-management';

export default async function LocationsPage() {
  const locations = await getLocationsAction();

  return <LocationManagement initialLocations={locations} />;
}
