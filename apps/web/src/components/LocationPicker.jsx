import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Input, Button, Space, Card } from 'antd'
import { EnvironmentOutlined, AimOutlined } from '@ant-design/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CORUMBA_CONFIG = {
  center: [-19.008, -57.651],
  zoom: 13,
  bounds: [
    [-22.0, -60.5], // Southwest
    [-16.0, -56.0], // Northeast
  ],
}

// Componente interno que captura cliques no mapa
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      onLocationSelect(lat, lng)
    },
  })
  return null
}

// Componente para forçar invalidate size e recentrar mapa
function MapController({ center, position }) {
  const map = useMap()
  
  useEffect(() => {
    // Invalidar tamanho do mapa após renderização
    setTimeout(() => {
      map.invalidateSize()
      if (position) {
        map.setView(position, map.getZoom())
      }
    }, 100)
  }, [map, position])
  
  return null
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [position, setPosition] = useState(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  // Inicializar posição quando receber props
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([parseFloat(latitude), parseFloat(longitude)])
      setManualLat(latitude.toString())
      setManualLng(longitude.toString())
    }
  }, [latitude, longitude])

  // Atualizar posição quando clicar no mapa
  const handleLocationSelect = (lat, lng) => {
    const newLat = parseFloat(lat.toFixed(8))
    const newLng = parseFloat(lng.toFixed(8))
    
    setPosition([newLat, newLng])
    setManualLat(newLat.toString())
    setManualLng(newLng.toString())
    
    if (onChange) {
      onChange({ latitude: newLat, longitude: newLng })
    }
  }

  // Atualizar quando digitar manualmente
  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setPosition([lat, lng])
      if (onChange) {
        onChange({ latitude: lat, longitude: lng })
      }
    }
  }

  // Centralizar em Corumbá
  const handleCenterCorumba = () => {
    const [lat, lng] = CORUMBA_CONFIG.center
    handleLocationSelect(lat, lng)
  }

  return (
    <Card 
      size="small" 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EnvironmentOutlined />
          <span>Selecione a Localização no Mapa</span>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <div style={{ marginBottom: 12 }}>
        <Space style={{ width: '100%' }} size="middle">
          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Latitude:
            </label>
            <Input
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              onBlur={handleManualUpdate}
              onPressEnter={handleManualUpdate}
              placeholder="-19.0078"
              style={{ width: '180px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Longitude:
            </label>
            <Input
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              onBlur={handleManualUpdate}
              onPressEnter={handleManualUpdate}
              placeholder="-57.6547"
              style={{ width: '180px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              &nbsp;
            </label>
            <Button 
              icon={<AimOutlined />} 
              onClick={handleCenterCorumba}
              title="Centralizar em Corumbá"
            >
              Centro
            </Button>
          </div>
        </Space>
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
        <strong>Instruções:</strong> Clique no mapa para selecionar a localização exata da unidade, 
        ou digite as coordenadas manualmente acima.
      </div>

      <div style={{ height: '400px', width: '100%', border: '1px solid #d9d9d9', borderRadius: '8px', overflow: 'hidden' }}>
        <MapContainer
          center={position || CORUMBA_CONFIG.center}
          zoom={CORUMBA_CONFIG.zoom}
          maxBounds={CORUMBA_CONFIG.bounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <MapController center={CORUMBA_CONFIG.center} position={position} />
          
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      {position && (
        <div style={{ marginTop: 8, fontSize: '12px', color: '#52c41a' }}>
          <EnvironmentOutlined /> Localização selecionada: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}
    </Card>
  )
}
