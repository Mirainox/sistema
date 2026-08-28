import { useRef } from 'react'

interface FotoInputProps {
  value: File | null
  onChange: (file: File | null) => void
}

export default function FotoInput({ value, onChange }: FotoInputProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={() => cameraRef.current?.click()}>
          📷 Tirar Foto
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={() => galeriaRef.current?.click()}>
          🖼️ Escolher da Galeria
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      {value && <p className="text-sm text-green-600">✓ {value.name}</p>}
    </div>
  )
}