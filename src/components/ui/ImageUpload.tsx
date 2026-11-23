import { useState, useCallback, useRef } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { uploadImage, deleteImage } from '../../lib/supabase'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  onUpload?: (file: File) => Promise<string | null>
  bucket?: string
  pathPrefix?: string
  label?: string
  accept?: string
  maxSizeMB?: number
  aspectRatio?: string
  disabled?: boolean
  placeholder?: string
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  bucket = 'public',
  pathPrefix = 'uploads',
  label = 'Imagem',
  accept = 'image/*',
  maxSizeMB = 5,
  aspectRatio,
  disabled = false,
  placeholder,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Built-in upload mutation (used when onUpload is not provided)
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop()
      const path = `${pathPrefix}/${Date.now()}.${ext}`
      return uploadImage(bucket, path, file)
    },
    onSuccess: (url) => {
      setPreview(url)
      onChange(url)
      setUploading(false)
      setError(null)
    },
    onError: (error) => {
      console.error('Upload error:', error)
      setError(error.message)
      setUploading(false)
    },
  })

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`
    }
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione um arquivo de imagem (PNG, JPG, WebP, GIF)'
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return 'Formato não suportado. Use PNG, JPG, WebP ou GIF'
    }
    return null
  }, [maxSizeMB])

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setError(null)

    if (onUpload) {
      try {
        const url = await onUpload(file)
        if (url) {
          setPreview(url)
          onChange(url)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido'
        console.error('Custom upload error:', error)
        setError(message)
      } finally {
        setUploading(false)
      }
    } else {
      uploadMutation.mutate(file)
    }
  }, [maxSizeMB, onUpload, uploadMutation, validateFile])

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await processFile(file)
      // Reset input to allow selecting same file again
      if (e.target) e.target.value = ''
    },
    [processFile]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !uploading) {
      setDragActive(e.type === 'dragenter' || e.type === 'dragover')
    }
  }, [disabled, uploading])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled || uploading) return

      const file = e.dataTransfer.files[0]
      if (file) {
        await processFile(file)
      }
    },
    [disabled, uploading, processFile]
  )

  const handleRemove = useCallback(async () => {
    if (value && bucket && pathPrefix) {
      try {
        const path = value.split(`${bucket}/`)[1]
        if (path) await deleteImage(bucket, path)
      } catch (e) {
        console.warn('Erro ao deletar imagem antiga:', e)
      }
    }
    setPreview(null)
    onChange(null)
    setError(null)
  }, [value, bucket, pathPrefix, onChange])

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        {preview ? (
          <div className={`relative rounded-lg overflow-hidden ${aspectRatio || 'aspect-video'}`}>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                aria-label="Remover imagem"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <label
            ref={(el) => {
              if (el) {
                el.addEventListener('dragenter', handleDrag as any)
                el.addEventListener('dragover', handleDrag as any)
                el.addEventListener('dragleave', handleDrag as any)
                el.addEventListener('drop', handleDrop as any)
              }
            }}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              disabled
                ? 'border-gray-200 text-gray-400'
                : dragActive
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
            } ${aspectRatio ? aspectRatio : 'min-h-[200px]'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
              id={`upload-${pathPrefix}-${Date.now()}`}
            />
            <Upload className="h-12 w-12 mb-3 text-gray-400" />
            <span className="text-center">
              <p className="font-medium">Clique ou arraste para fazer upload</p>
              {placeholder ? (
                <p className="text-sm text-gray-500 mt-1">{placeholder}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, WebP até {maxSizeMB}MB
                </p>
              )}
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {preview && !error && (
        <p className="mt-2 text-xs text-gray-500">
          Imagem selecionada •{' '}
          <button
            type="button"
            onClick={() => window.open(preview, '_blank')}
            className="text-blue-600 hover:underline"
          >
            Ver em tamanho original
          </button>
        </p>
      )}
    </div>
  )
}