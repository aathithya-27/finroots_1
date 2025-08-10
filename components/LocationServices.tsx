import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Member } from '../types.ts';
import { getOptimalRoute, findClientsOnRoute, suggestSmartTrip } from '../services/geminiService.ts';
import { indianStates } from '../constants.tsx';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { MapPin, Navigation, Phone, Loader2, Route, X, BrainCircuit, Users, Compass, Wand2, Check, AlertTriangle, Building, ChevronDown, Search, Copy, ExternalLink } from 'lucide-react';
import Button from './ui/Button.tsx';
import Input from './ui/Input.tsx';

// Tell TypeScript that the 'google' global object will exist at runtime.
declare var google: any;

const digipinToCoords: Record<string, { lat: number; lng: number }> = {
    '7J4VPQCP+HG': { lat: 11.3410, lng: 77.7172 }, // Erode, Tamil Nadu
    '7JFJ3Q6H+2V': { lat: 19.1678, lng: 72.8647 }, // Mumbai, Goregaon East
    '7JFJ3Q6H+3X': { lat: 19.1679, lng: 72.8648 }, // Mumbai, Goregaon East (Offset)
    '7M52376V+5R': { lat: 13.0604, lng: 80.2495 }, // Chennai, Nungambakkam
    '7J7JGVCC+5R': { lat: 18.5204, lng: 73.8567 }, // Pune
    '7J4RXJJ4+M8': { lat: 12.9716, lng: 77.5946 }, // Bengaluru
};


const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

const deg2rad = (deg: number) => deg * (Math.PI / 180);

type CustomerWithDistance = Member & { distance: number };
type LocationTab = 'planner' | 'path';

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2d2d2d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
];

const mapLibraries: ('marker')[] = ['marker'];

interface LocationServicesProps {
  members: Member[];
  addToast: (message: string, type?: 'success' | 'error') => void;
}

const LocationServices: React.FC<LocationServicesProps> = ({ members, addToast }) => {
  const [map, setMap] = useState<any | null>(null);
  const markersRef = useRef<any[]>([]);

  const [activeTab, setActiveTab] = useState<LocationTab>('planner');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortedCustomers, setSortedCustomers] = useState<CustomerWithDistance[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);

  const [suggestedTripIds, setSuggestedTripIds] = useState<string[] | null>(null);
  const [isSuggestingTrip, setIsSuggestingTrip] = useState(false);

  const [fromState, setFromState] = useState('Tamil Nadu');
  const [fromDistrict, setFromDistrict] = useState('');
  const [fromDistricts, setFromDistricts] = useState<string[]>([]);
  const [toState, setToState] = useState('Karnataka');
  const [toDistrict, setToDistrict] = useState('');
  const [toDistricts, setToDistricts] = useState<string[]>([]);
  const [clientsOnRoute, setClientsOnRoute] = useState<Member[]>([]);
  const [isFindingClients, setIsFindingClients] = useState(false);
  const [pathSearchPerformed, setPathSearchPerformed] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  
  const [viewMode, setViewMode] = useState<'nearby' | 'city'>('nearby');
  const [expandedCities, setExpandedCities] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');


  const hasApiKey = !!process.env.API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.API_KEY || "",
    libraries: mapLibraries,
  });

  const resolvedMembers = useMemo(() => {
    return members.map(member => {
        if (member.lat && member.lng) {
            return member;
        }

        if (member.digipin) {
            const coords = digipinToCoords[member.digipin];
            if (coords) {
                return {
                    ...member,
                    lat: coords.lat,
                    lng: coords.lng,
                };
            }
        }
        
        // Return member as is, it will be filtered out later if it still has no coords
        return member;
    });
}, [members]);


  useEffect(() => {
    const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser.");
        setIsLoadingLocation(false);
        return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const currentUserLocation = { lat: latitude, lng: longitude };
            setUserLocation(currentUserLocation);
            setIsLoadingLocation(false);
            setLocationError(null);
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setLocationError("Location access denied. Using a default location. Enable permissions for accurate routing.");
                    break;
                default:
                    setLocationError("Could not fetch your location. Using a default location.");
                    break;
            }
            setUserLocation({ lat: 20.5937, lng: 78.9629 });
            setIsLoadingLocation(false);
        }
    );
  }, []);

  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);
  
  useEffect(() => {
      if (userLocation) {
        const customersWithDistance = resolvedMembers
            .filter(member => member.lat && member.lng)
            .map(member => ({
                ...member,
                distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, member.lat!, member.lng!)
            }))
            .sort((a, b) => a.distance - b.distance);
        setSortedCustomers(customersWithDistance);
      } else {
        setSortedCustomers(resolvedMembers.map(m => ({...m, distance: -1})).sort((a, b) => a.name.localeCompare(b.name)));
      }
  }, [userLocation, resolvedMembers]);
  
    const customersByCity = useMemo(() => {
        return sortedCustomers.reduce((acc, customer) => {
            const city = customer.city || 'Uncategorized';
            if (!acc[city]) {
                acc[city] = [];
            }
            acc[city].push(customer);
            return acc;
        }, {} as Record<string, CustomerWithDistance[]>);
    }, [sortedCustomers]);

  useEffect(() => {
      if (fromState && indianStates[fromState]) {
          setFromDistricts(indianStates[fromState]);
          setFromDistrict(fromDistrict => indianStates[fromState].includes(fromDistrict) ? fromDistrict : fromDistricts[0] || '');
      }
  }, [fromState, fromDistricts]);

  useEffect(() => {
      if (toState && indianStates[toState]) {
          setToDistricts(indianStates[toState]);
          setToDistrict(toDistrict => indianStates[toState].includes(toDistrict) ? toDistrict : toDistricts[0] || '');
      }
  }, [toState, toDistricts]);
    
  useEffect(() => {
      if (indianStates[fromState]) setFromDistricts(indianStates[fromState]);
      if (indianStates[toState]) setToDistricts(indianStates[toState]);
  }, [fromState, toState]);
  
  const filteredSortedCustomers = useMemo(() => {
    if (!searchQuery) return sortedCustomers;
    return sortedCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.memberId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedCustomers, searchQuery]);

  const filteredCustomersByCity = useMemo(() => {
    if (!searchQuery) return customersByCity;
    const filtered = Object.entries(customersByCity).reduce((acc, [city, customers]) => {
        const filteredCustomers = customers.filter(customer =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.memberId.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredCustomers.length > 0) {
            acc[city] = filteredCustomers;
        }
        return acc;
    }, {} as Record<string, CustomerWithDistance[]>);
    return filtered;
  }, [customersByCity, searchQuery]);


  const displayCustomers = useMemo(() => {
    if (optimizedRoute.length > 0) {
        const customerMap = new Map(sortedCustomers.map(c => [c.id, c]));
        return optimizedRoute.map(id => customerMap.get(id)).filter(Boolean) as CustomerWithDistance[];
    }
    return filteredSortedCustomers;
  }, [filteredSortedCustomers, sortedCustomers, optimizedRoute]);

  const onMapLoad = useCallback((mapInstance: any) => {
    setMap(mapInstance);
  }, []);

  const onMapUnmount = useCallback((mapInstance: any) => {
    setMap(null);
  }, []);
  
  const visibleCustomersForMap = useMemo(() => {
    if (activeTab === 'path' && clientsOnRoute.length > 0) {
        return clientsOnRoute;
    }
    if (searchQuery) {
        if (viewMode === 'nearby') return filteredSortedCustomers;
        return Object.values(filteredCustomersByCity).flat();
    }
    return resolvedMembers;
  }, [activeTab, clientsOnRoute, searchQuery, viewMode, filteredSortedCustomers, filteredCustomersByCity, resolvedMembers]);

  useEffect(() => {
    if (map && isLoaded) {
      // Clear previous markers
      markersRef.current.forEach(marker => {
          marker.map = null;
      });
      markersRef.current = [];

      // Create new customer markers
      const customerMarkers = visibleCustomersForMap
          .filter(m => m.lat && m.lng)
          .map(member => new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat: member.lat!, lng: member.lng! },
              title: member.name,
          }));
      
      markersRef.current.push(...customerMarkers);

      // Create a distinct marker for the user's location
      if (userLocation && !locationError?.includes("denied")) {
          const userPin = new google.maps.marker.PinElement({
              background: "#4285F4",
              borderColor: "#ffffff",
              glyphColor: "#ffffff",
          });
          const userMarker = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: userLocation,
              title: "Your Location",
              content: userPin.element,
          });
          markersRef.current.push(userMarker);
      }

      // Auto-zoom logic
      const coordsToFit = visibleCustomersForMap
        .filter(m => m.lat && m.lng)
        .map(m => new google.maps.LatLng(m.lat, m.lng));

      if (optimizedRoute.length === 0 && userLocation && !locationError?.includes("denied")) {
        coordsToFit.push(new google.maps.LatLng(userLocation.lat, userLocation.lng));
      }

      if (coordsToFit.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        coordsToFit.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, 50); // 50px padding
      }
    }
    // Cleanup function to run when dependencies change or component unmounts
    return () => {
        markersRef.current.forEach(marker => {
            marker.map = null;
        });
    };
}, [map, isLoaded, visibleCustomersForMap, userLocation, locationError, optimizedRoute]);


  const flyToLocation = (lat: number, lng: number) => {
      map?.panTo({ lat, lng });
      map?.setZoom(15);
  };
  
    const flyToCity = (city: string) => {
        if (!map || !customersByCity[city]) return;

        const cityCustomers = customersByCity[city].filter(c => c.lat && c.lng);
        if (cityCustomers.length === 0) return;

        if (cityCustomers.length === 1) {
            map.panTo({ lat: cityCustomers[0].lat!, lng: cityCustomers[0].lng! });
            map.setZoom(14);
        } else {
            const bounds = new google.maps.LatLngBounds();
            cityCustomers.forEach(customer => {
                bounds.extend(new google.maps.LatLng(customer.lat!, customer.lng!));
            });
            map.fitBounds(bounds);
        }
    };
  
  const handleToggleCustomerSelection = (customerId: string) => {
      setSelectedCustomerIds(prev =>
          prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId]
      );
  };
  
  const handleSelectAllVisible = () => {
    const allVisibleIds = (viewMode === 'nearby' ? filteredSortedCustomers : Object.values(filteredCustomersByCity).flat()).map(c => c.id);
    const allSelected = allVisibleIds.every(id => selectedCustomerIds.includes(id));

    if (allSelected) {
        setSelectedCustomerIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
    } else {
        setSelectedCustomerIds(prev => [...new Set([...prev, ...allVisibleIds])]);
    }
  };


  const handlePlanRoute = useCallback(async () => {
    if (selectedCustomerIds.length < 2 || !userLocation) {
        addToast("Please select at least 2 customers and ensure location is enabled to plan a route.", 'error');
        return;
    }
    setIsPlanningRoute(true);
    const customersToVisit = resolvedMembers.filter(m => selectedCustomerIds.includes(m.id));
    try {
      const orderedIds = await getOptimalRoute(customersToVisit, userLocation, addToast);
      setOptimizedRoute(orderedIds);
    } catch (e) {
      console.error("Routing failed", e);
      setOptimizedRoute(customersToVisit.sort((a,b) => getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, a.lat!, a.lng!) - getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, b.lat!, b.lng!)).map(c => c.id));
    } finally {
      setIsPlanningRoute(false);
    }
  }, [selectedCustomerIds, userLocation, resolvedMembers, addToast]);
  
  const handleClearRoute = () => {
      setOptimizedRoute([]);
      setSelectedCustomerIds([]);
  };

  const handleSuggestTrip = async () => {
    if (!userLocation) return;
    setIsSuggestingTrip(true);
    const resultIds = await suggestSmartTrip(userLocation, resolvedMembers, addToast);
    setSuggestedTripIds(resultIds);
    setIsSuggestingTrip(false);
  };

  const handleAcceptSuggestion = () => {
    if (suggestedTripIds) {
        setSelectedCustomerIds(suggestedTripIds);
        setSuggestedTripIds(null);
    }
  };

  const handleFindClientsOnRoute = async () => {
    if (!fromState || !fromDistrict || !toState || !toDistrict) {
        addToast("Please select both a start and destination.", 'error');
        return;
    }
    setIsFindingClients(true);
    setClientsOnRoute([]);
    setPathSearchPerformed(true);
    try {
        const startLocation = `${fromDistrict}, ${fromState}`;
        const endLocation = `${toDistrict}, ${toState}`;
        const resultIds = await findClientsOnRoute(startLocation, endLocation, resolvedMembers, addToast);
        
        const foundClients = resolvedMembers.filter(m => resultIds.includes(m.id));
        setClientsOnRoute(foundClients);

    } catch (error) {
        console.error("Failed to find clients on route:", error);
    } finally {
        setIsFindingClients(false);
    }
  };

  const handleClearClientsOnRoute = () => {
      setClientsOnRoute([]);
      setFromDistrict('');
      setToDistrict('');
      setPathSearchPerformed(false);
  };

  const handleTabChange = (tab: LocationTab) => {
    setActiveTab(tab);
    if (tab === 'planner') {
      setClientsOnRoute([]);
      setPathSearchPerformed(false);
    } else if (tab === 'path') {
      setOptimizedRoute([]);
      setSelectedCustomerIds([]);
      setSuggestedTripIds(null);
    }
  }
  
  const allVisibleCustomers = useMemo(() => {
    return viewMode === 'nearby' ? filteredSortedCustomers : Object.values(filteredCustomersByCity).flat();
  }, [viewMode, filteredSortedCustomers, filteredCustomersByCity]);
  
  const areAllVisibleSelected = useMemo(() => {
    if (allVisibleCustomers.length === 0) return false;
    return allVisibleCustomers.every(c => selectedCustomerIds.includes(c.id));
  }, [allVisibleCustomers, selectedCustomerIds]);


  const PlannerCustomerCard = ({ customer }: { customer: CustomerWithDistance }) => {
    const isSelected = selectedCustomerIds.includes(customer.id);
    const routeIndex = optimizedRoute.indexOf(customer.id);
    
    const handleCopyDigipin = () => {
        if (customer.digipin) {
            navigator.clipboard.writeText(customer.digipin);
            addToast('Digipin copied to clipboard!', 'success');
        }
    };
    
    const handleOpenInMaps = () => {
        if (customer.digipin) {
            window.open(`https://plus.codes/${customer.digipin}`, '_blank');
        } else if (customer.lat && customer.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${customer.lat},${customer.lng}`, '_blank');
        }
    };

    return (
        <div className={`p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border flex flex-col gap-3 transition-all ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary' : 'dark:border-gray-600'}`}>
            <div className="flex items-start gap-3">
                <input 
                   type="checkbox" 
                   checked={isSelected}
                   onChange={() => handleToggleCustomerSelection(customer.id)}
                   className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary mt-1 flex-shrink-0"
               />
               {routeIndex !== -1 && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white font-bold text-xs flex-shrink-0 mt-0.5">
                        {routeIndex + 1}
                    </div>
               )}
               <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.address}</p>
                    {customer.distance > 0 && 
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2">{customer.distance.toFixed(1)} km away</p>
                    }
                </div>
                <button onClick={() => flyToLocation(customer.lat!, customer.lng!)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-md flex-shrink-0">
                    <MapPin size={18} />
                </button>
            </div>
            {customer.digipin && (
                <div className="pl-8 pt-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-600/50">
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{customer.digipin}</p>
                    <div className="flex items-center gap-1">
                        <Button type="button" variant="light" size="small" className="!p-1.5" onClick={handleCopyDigipin} title="Copy Digipin">
                            <Copy size={12} />
                        </Button>
                        <Button type="button" variant="light" size="small" className="!p-1.5" onClick={handleOpenInMaps} title="Open in Maps">
                            <ExternalLink size={12} />
                        </Button>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-2 pl-8">
                 <a href={`https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/80">
                    <Route size={14}/> Navigate
                </a>
                 <a href={`tel:${customer.mobile}`} className="flex-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/80">
                    <Phone size={14}/> Call
                </a>
            </div>
        </div>
    );
  };
  
  const TabButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        isActive
          ? 'bg-brand-primary text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700/60'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const mapCenter = useMemo(() => userLocation || { lat: 20.5937, lng: 78.9629 }, [userLocation]);
  
  const MapErrorDisplay = ({ error }: { error: Error }) => (
    <div className="flex flex-col items-center justify-center h-full text-red-600 dark:text-red-400 p-4 text-center bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="w-10 h-10 mb-4" />
        <h3 className="text-lg font-semibold">Map Loading Error</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            The map could not be loaded. This is often due to an invalid or misconfigured Google Maps API key.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Please ensure the <code>API_KEY</code> is correctly set up in your environment and that the "Maps JavaScript API" is enabled in your Google Cloud project.
        </p>
        {error.message && (
            <pre className="mt-4 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md text-left overflow-auto max-w-full">
                {error.message}
            </pre>
        )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Location Services</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Visualize locations, find nearby clients, and plan optimized routes with AI.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-14rem)]">
        
        <div className="lg:w-[40%] xl:w-1/3 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 flex-shrink-0">
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                  <TabButton label="Route Planner" icon={<Users size={16}/>} isActive={activeTab === 'planner'} onClick={() => handleTabChange('planner')} />
                  <TabButton label="Path Finder" icon={<Compass size={16} />} isActive={activeTab === 'path'} onClick={() => handleTabChange('path')} />
              </div>
            </div>

            {activeTab === 'planner' && (
              <>
                <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Customer Route Planner</h3>
                    <div className="mt-3">
                        <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Customers
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="text"
                                id="customer-search"
                                placeholder="Search by name, city, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                         <Button variant="light" onClick={handleSuggestTrip} disabled={isSuggestingTrip || !userLocation} size="small">
                            {isSuggestingTrip ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                            Suggest Trip
                         </Button>
                        <Button variant="primary" onClick={handlePlanRoute} disabled={isPlanningRoute || selectedCustomerIds.length < 2 || !userLocation} size="small" className="flex-1">
                            {isPlanningRoute ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                            Plan Route ({selectedCustomerIds.length})
                        </Button>
                    </div>
                     {optimizedRoute.length > 0 && 
                        <Button variant="danger" onClick={handleClearRoute} size="small" className="w-full mt-2">
                            <X size={16} /> Clear Planned Route
                        </Button>
                    }
                     <div className="mt-4 flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('nearby')}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'nearby' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                            <Users size={16} /> Nearby
                        </button>
                        <button
                            onClick={() => setViewMode('city')}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'city' ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-600 hover:bg-white/70 dark:text-gray-400 dark:hover:bg-gray-600'}`}>
                            <Building size={16} /> By City
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {isLoadingLocation && <div className="text-center p-4 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /><p className="mt-2 text-sm">Fetching your location...</p></div>}
                    {locationError && <div className="text-center p-4 text-sm bg-yellow-50 text-yellow-700 rounded-md dark:bg-yellow-900/50 dark:text-yellow-300">{locationError}</div>}
                    
                    {suggestedTripIds && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg animate-fade-in space-y-3">
                            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">AI Suggested Trip:</h4>
                            <ul className="list-decimal list-inside text-sm text-indigo-700 dark:text-indigo-300">
                                {suggestedTripIds.map(id => {
                                    const member = members.find(m => m.id === id);
                                    return <li key={id}>{member ? member.name : 'Unknown Client'}</li>
                                })}
                            </ul>
                            <div className="flex gap-2">
                               <Button variant="secondary" size="small" onClick={() => setSuggestedTripIds(null)}><X size={14}/> Dismiss</Button>
                               <Button variant="success" size="small" onClick={handleAcceptSuggestion}><Check size={14}/> Accept Suggestion</Button>
                           </div>
                        </div>
                    )}
                    
                    {allVisibleCustomers.length > 0 && (
                        <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-900 rounded-md">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                checked={areAllVisibleSelected}
                                onChange={handleSelectAllVisible}
                            />
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {areAllVisibleSelected ? 'Deselect All' : 'Select All'} ({allVisibleCustomers.length})
                            </label>
                            <span className="flex-1 text-right text-sm font-semibold text-brand-primary">
                                {selectedCustomerIds.length} Selected
                            </span>
                        </div>
                    )}


                    {viewMode === 'nearby' && (
                        displayCustomers.length > 0 ? (
                            displayCustomers.map(customer => <PlannerCustomerCard key={customer.id} customer={customer} />)
                        ) : (
                            !isLoadingLocation && <p className="text-center py-8 text-gray-500 dark:text-gray-400">No customers found.</p>
                        )
                    )}

                    {viewMode === 'city' && (
                         <div className="space-y-2">
                            {Object.keys(filteredCustomersByCity).sort().map(city => {
                                const customersInCity = filteredCustomersByCity[city];
                                const isExpanded = expandedCities.includes(city);
                                return (
                                    <div key={city}>
                                        <button 
                                            onClick={() => {
                                                setExpandedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
                                                flyToCity(city);
                                            }}
                                            className="w-full flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-left"
                                        >
                                            <span className="font-semibold text-gray-800 dark:text-white">{city}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold px-2 py-0.5 rounded-full">
                                                    {customersInCity.length}
                                                </span>
                                                <ChevronDown size={16} className={`transition-transform text-gray-500 dark:text-gray-400 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="pl-4 pt-3 mt-1 space-y-3 border-l-2 border-gray-200 dark:border-gray-600 ml-4 animate-fade-in">
                                                {customersInCity.map(customer => (
                                                    <PlannerCustomerCard key={customer.id} customer={customer} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
              </>
            )}

            {activeTab === 'path' && (
              <div className="flex flex-col flex-1">
                <div className="p-4 border-b dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Find Clients on Path</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a start and end point to find clients along the travel route.</p>
                </div>
                <div className="overflow-y-auto p-4 space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">From</h4>
                          <div className="space-y-3">
                              <select value={fromState} onChange={(e) => setFromState(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  {Object.keys(indianStates).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select value={fromDistrict} onChange={(e) => setFromDistrict(e.target.value)} disabled={fromDistricts.length === 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  <option value="">Select District</option>
                                  {fromDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                          </div>
                      </div>
                      <div>
                          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">To</h4>
                          <div className="space-y-3">
                              <select value={toState} onChange={(e) => setToState(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  {Object.keys(indianStates).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <select value={toDistrict} onChange={(e) => setToDistrict(e.target.value)} disabled={toDistricts.length === 0} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  <option value="">Select District</option>
                                  {toDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <Button variant="primary" onClick={handleFindClientsOnRoute} disabled={isFindingClients || !fromDistrict || !toDistrict}>
                          {isFindingClients ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                          Find Clients on Path
                      </Button>
                      {pathSearchPerformed && 
                          <Button variant="secondary" onClick={handleClearClientsOnRoute}>
                              <X size={16} /> Clear Path
                          </Button>
                      }
                  </div>
                  
                  {isFindingClients && (
                      <div className="text-center p-6 text-gray-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          <p className="mt-2 text-sm">Gemini is analyzing the route...</p>
                      </div>
                  )}

                  {pathSearchPerformed && !isFindingClients && (
                      <div className="mt-4">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Found {clientsOnRoute.length} client(s) on the path:</h4>
                          {clientsOnRoute.length > 0 ? (
                            <div className="space-y-3">
                                {clientsOnRoute.map(customer => (
                                    <div key={customer.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600/50">
                                        <p className="font-semibold text-gray-800 dark:text-white">{customer.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customer.address}</p>
                                        <div className="mt-2 flex items-center gap-4">
                                            <button onClick={() => flyToLocation(customer.lat!, customer.lng!)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1">
                                                <MapPin size={14}/> View on Map
                                            </button>
                                            <a href={`tel:${customer.mobile}`} className="text-green-600 hover:text-green-800 text-xs font-semibold flex items-center gap-1">
                                                <Phone size={14}/> Call Client
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                          ) : (
                             <p className="text-center py-6 text-gray-500 dark:text-gray-400">No clients found on this route.</p>
                          )}
                      </div>
                  )}

                </div>
              </div>
            )}
        </div>

        <div className="flex-1 min-h-[500px] lg:min-h-0 lg:h-full rounded-lg shadow-sm overflow-hidden border dark:border-gray-700 relative">
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700">
                {!hasApiKey ? (
                    <MapErrorDisplay error={new Error("Google Maps API key is not configured.")} />
                ) : !isLoaded ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="ml-4">Loading Map...</span>
                    </div>
                ) : loadError ? (
                    <MapErrorDisplay error={loadError} />
                ) : (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={5}
                        onLoad={onMapLoad}
                        onUnmount={onMapUnmount}
                        options={{
                            styles: isDarkMode ? mapStyles : undefined,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                            zoomControl: true,
                            mapId: 'FINROOTS_CRM_MAP'
                        }}
                    >
                        {optimizedRoute.length > 0 && userLocation && (
                            <Polyline
                                path={[
                                    userLocation,
                                    ...optimizedRoute.map(id => {
                                        const member = resolvedMembers.find(m => m.id === id);
                                        return member ? { lat: member.lat, lng: member.lng } : null;
                                    }).filter(Boolean) as any[]
                                ]}
                                options={{
                                    strokeColor: '#2563EB',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 5,
                                    geodesic: true,
                                }}
                            />
                        )}
                    </GoogleMap>
                )}
            </div>
          <button 
            onClick={() => userLocation && flyToLocation(userLocation.lat, userLocation.lng)} 
            disabled={!userLocation} 
            className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-gray-700/90 p-2 rounded-full shadow-lg text-gray-700 hover:bg-white disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-600"
            aria-label="Center on my location"
          >
            <Navigation size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationServices;