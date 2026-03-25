import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Camera, 
  Search, 
  Package, 
  Building2,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Search as SearchIcon
} from 'lucide-react';

// Types
interface AssetQuickCard {
  id: string;
  asset_tag: string;
  name: string;
  clinic_name: string;
  room_location: string;
  condition_score: number;
  status: string;
  next_action?: string;
  next_action_due?: string;
}

// Mock scanned asset
const mockScannedAsset: AssetQuickCard = {
  id: '1',
  asset_tag: 'AIM-EDM-001-T001',
  name: 'Electric Treatment Table',
  clinic_name: 'AIM Edmonton',
  room_location: 'Treatment Room 1',
  condition_score: 8.5,
  status: 'active',
  next_action: 'Annual Service Due',
  next_action_due: '2026-04-15'
};

const mockSearchResults: AssetQuickCard[] = [
  mockScannedAsset,
  {
    id: '2',
    asset_tag: 'AIM-EDM-001-T002',
    name: 'Standard Treatment Table',
    clinic_name: 'AIM Edmonton',
    room_location: 'Treatment Room 2',
    condition_score: 7.0,
    status: 'active'
  },
  {
    id: '3',
    asset_tag: 'AIM-EDM-001-S001',
    name: 'Shockwave Therapy Unit',
    clinic_name: 'AIM Edmonton',
    room_location: 'Treatment Room 3',
    condition_score: 9.0,
    status: 'active'
  }
];

// Main Component
export const MobileAssetLookup: React.FC = () => {
  const [mode, setMode] = useState<'scan' | 'search'>('scan');
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedAsset, setScannedAsset] = useState<AssetQuickCard | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate QR scan
    setTimeout(() => {
      setScannedAsset(mockScannedAsset);
      setIsScanning(false);
    }, 2000);
  };

  const handleSearch = () => {
    // Search happens automatically as user types
  };

  const filteredResults = searchTerm 
    ? mockSearchResults.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Asset Lookup</h1>
        <p className="text-sm text-gray-500">Scan QR code or search manually</p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white p-4 border-b">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setMode('scan')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'scan' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera size={18} className="inline mr-2" />
            Scan QR
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'search' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SearchIcon size={18} className="inline mr-2" />
            Search
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Scan Mode */}
        {mode === 'scan' && (
          <div className="space-y-4">
            {!scannedAsset ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className={`w-32 h-32 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  isScanning ? 'bg-purple-100 animate-pulse' : 'bg-gray-100'
                }`}>
                  <QrCode size={64} className={isScanning ? 'text-purple-600' : 'text-gray-400'} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {isScanning ? 'Scanning...' : 'Ready to Scan'}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  {isScanning 
                    ? 'Point your camera at the asset QR code' 
                    : 'Tap the button below to start scanning'
                  }
                </p>
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className={`w-full py-4 rounded-lg font-semibold text-white ${
                    isScanning 
                      ? 'bg-purple-400' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isScanning ? 'Scanning...' : 'Start Scanning'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scanned Asset Card */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-sm font-medium text-green-600">Asset Found</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Asset Tag</p>
                      <p className="font-mono font-bold text-gray-900">{scannedAsset.asset_tag}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{scannedAsset.name}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Clinic</p>
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <Building2 size={14} />
                          {scannedAsset.clinic_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPin size={14} />
                          {scannedAsset.room_location}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Condition</p>
                        <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                          scannedAsset.condition_score >= 8 ? 'bg-green-100 text-green-800' :
                          scannedAsset.condition_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {scannedAsset.condition_score}/10
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span className="inline-flex px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                          {scannedAsset.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Action */}
                  {scannedAsset.next_action && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Next Action</span>
                      </div>
                      <p className="text-sm text-purple-900">{scannedAsset.next_action}</p>
                      {scannedAsset.next_action_due && (
                        <p className="text-xs text-purple-600">Due: {scannedAsset.next_action_due}</p>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium">
                      Start Inspection
                    </button>
                    <button className="py-2 px-3 bg-orange-600 text-white rounded-lg text-sm font-medium">
                      Create Work Order
                    </button>
                  </div>

                  <button 
                    onClick={() => setScannedAsset(null)}
                    className="w-full mt-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Mode */}
        {mode === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or asset tag..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg"
              />
            </div>

            {searchTerm && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{filteredResults.length} results</p>
                {filteredResults.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => setScannedAsset(asset)}
                    className="w-full bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-gray-900">{asset.asset_tag}</p>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.clinic_name} • {asset.room_location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          asset.condition_score >= 8 ? 'bg-green-100 text-green-800' :
                          asset.condition_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {asset.condition_score}/10
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searchTerm && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <SearchIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Search by asset name or tag to find assets</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAssetLookup;
