import { useState, useEffect } from 'react';

export interface Tambon {
  id: number;
  zip_code: number;
  name_th: string;
  name_en: string;
}

export interface Amphure {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
  tambon: Tambon[];
}

export interface Province {
  id: number;
  name_th: string;
  name_en: string;
  amphure: Amphure[];
}

export interface ThaiAddressData {
  provinces: Province[];
  loading: boolean;
  error: string | null;
}

export function useThaiAddress(): ThaiAddressData {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThaiAddressData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProvinces(data);
      } catch (err) {
        console.error('Error fetching Thai address data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch address data');
        
        // Fallback data in case of API failure
        setProvinces([
          {
            id: 1,
            name_th: 'กรุงเทพมหานคร',
            name_en: 'Bangkok',
            amphure: [
              {
                id: 1,
                name_th: 'เขตพระนคร',
                name_en: 'Phra Nakhon',
                province_id: 1,
                tambon: [
                  {
                    id: 1,
                    zip_code: 10200,
                    name_th: 'แขวงพระบรมมหาราชวัง',
                    name_en: 'Phra Borom Maha Ratchawang'
                  }
                ]
              }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchThaiAddressData();
  }, []);

  return { provinces, loading, error };
}

export function useAddressSelector() {
  const { provinces, loading, error } = useThaiAddress();
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedAmphure, setSelectedAmphure] = useState<Amphure | null>(null);
  const [selectedTambon, setSelectedTambon] = useState<Tambon | null>(null);

  const handleProvinceChange = (provinceId: string) => {
    const province = provinces.find(p => p.id.toString() === provinceId) || null;
    setSelectedProvince(province);
    setSelectedAmphure(null);
    setSelectedTambon(null);
  };

  const handleAmphureChange = (amphureId: string) => {
    if (!selectedProvince) return;
    const amphure = selectedProvince.amphure.find(a => a.id.toString() === amphureId) || null;
    setSelectedAmphure(amphure);
    setSelectedTambon(null);
  };

  const handleTambonChange = (tambonId: string) => {
    if (!selectedAmphure) return;
    const tambon = selectedAmphure.tambon.find(t => t.id.toString() === tambonId) || null;
    setSelectedTambon(tambon);
  };

  const resetSelection = () => {
    setSelectedProvince(null);
    setSelectedAmphure(null);
    setSelectedTambon(null);
  };

  const getFullAddress = () => {
    if (!selectedProvince || !selectedAmphure || !selectedTambon) return '';
    
    return {
      province: selectedProvince.name_th,
      amphure: selectedAmphure.name_th,
      tambon: selectedTambon.name_th,
      zipCode: selectedTambon.zip_code.toString(),
      fullAddress: `${selectedTambon.name_th} ${selectedAmphure.name_th} ${selectedProvince.name_th} ${selectedTambon.zip_code}`
    };
  };

  return {
    provinces,
    loading,
    error,
    selectedProvince,
    selectedAmphure,
    selectedTambon,
    handleProvinceChange,
    handleAmphureChange,
    handleTambonChange,
    resetSelection,
    getFullAddress
  };
}