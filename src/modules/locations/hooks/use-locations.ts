import { useQuery } from '@tanstack/react-query';
import { getLocationsAction } from '../actions/location.action';

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocationsAction(),
  });
}
