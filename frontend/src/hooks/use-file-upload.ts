// https://github.com/origin-space/originui/blob/main/docs/use-file-upload.md

import * as React from 'react'

export type FileMetadata = {
  name: string
  size: number
  type: string
  url: string
  id: string
}

export type FileSource = File | FileMetadata

export type FileWithPreview = {
  file: FileSource
  id: string
  preview?: string
}

export type FileUploadOptions = {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  initialFiles?: FileMetadata[]
}

export type FileUploadState = {
  files: FileWithPreview[]
  isDragging: boolean
  errors: string[]
}

export type FileUploadActions = {
  addFiles: (files: FileList | File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  clearErrors: () => void
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void
  handleDrop: (e: React.DragEvent<HTMLElement>) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  openFileDialog: () => void
  getInputProps: (
    props?: React.InputHTMLAttributes<HTMLInputElement>
  ) => React.InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>
  }
}

const isFile = (file: FileSource): file is File => file instanceof File

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`
}

const revokeFilePreviews = (files: FileWithPreview[]) => {
  files.forEach((f) => {
    if (f.preview && isFile(f.file) && f.file.type.startsWith('image/')) {
      URL.revokeObjectURL(f.preview)
    }
  })
}

const generateUniqueId = (file: FileSource): string => {
  const randomId = Math.random().toString(36).substring(2, 9)
  return isFile(file) ? `${file.name}-${file.size}-${randomId}` : file.id
}

const createPreview = (file: FileSource): string | undefined => {
  return isFile(file) ? URL.createObjectURL(file) : file.url
}

const validateFile = (file: FileSource, accept: string, maxSize: number): string | null => {
  if (file.size > maxSize) {
    return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`
  }

  const acceptedTypes = accept.split(',').map((type) => type.trim())
  if (
    accept !== '*' &&
    !acceptedTypes.some((type) => {
      if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase())
      if (type.endsWith('/*')) return file.type.startsWith(`${type.slice(0, -2)}/`)
      return file.type === type
    })
  ) {
    return `File "${file.name}" is not an accepted file type.`
  }

  return null
}

const getErrors = (
  files: FileWithPreview[],
  accept: string,
  maxSize: number
): { files: FileWithPreview[]; errors: string[] } => {
  const errors: string[] = []
  const validFiles: FileWithPreview[] = []

  files.forEach((file) => {
    const error = validateFile(file.file, accept, maxSize)
    if (error) errors.push(error)
    else validFiles.push(file)
  })

  return { files: validFiles, errors }
}

export const useFileUpload = (
  options: FileUploadOptions = {}
): [FileUploadState, FileUploadActions] => {
  const {
    maxFiles = Infinity,
    maxSize = Infinity,
    accept = '*',
    multiple = false,
    initialFiles = []
  } = options

  const [state, setState] = React.useState<FileUploadState>({
    files: initialFiles.map((file) => ({
      file,
      id: file.id,
      preview: file.url
    })),
    isDragging: false,
    errors: []
  })

  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setState((prev) => {
      revokeFilePreviews(prev.files)
      const nextFiles = initialFiles.map((file) => ({ file, id: file.id, preview: file.url }))
      return { ...prev, files: nextFiles, errors: [] }
    })
  }, [initialFiles])

  const clearFiles = React.useCallback(() => {
    setState((prev) => {
      revokeFilePreviews(prev.files)
      if (inputRef.current) inputRef.current.value = ''
      return { ...prev, files: [], errors: [] }
    })
  }, [])

  const addFiles = React.useCallback(
    (_newFiles: FileList | File[]) => {
      if (!_newFiles || _newFiles.length === 0) return
      const newFiles = Array.from(_newFiles)

      if (!multiple) clearFiles()

      if (state.files.length + newFiles.length > maxFiles) {
        const error = `You can only upload a maximum of ${maxFiles} files.`
        setState((prev) => ({ ...prev, errors: [error] }))
        return
      }

      const { files, errors } = getErrors(
        newFiles.map((file) => ({
          file,
          id: generateUniqueId(file),
          preview: createPreview(file)
        })),
        accept,
        maxSize
      )

      if (files.length > 0 || errors.length > 0) {
        setState((prev) => ({
          ...prev,
          files: [...prev.files, ...files],
          errors: [...errors, ...prev.errors]
        }))
      }

      if (inputRef.current) inputRef.current.value = ''
    },
    [accept, clearFiles, maxFiles, maxSize, multiple, state]
  )

  const removeFile = React.useCallback(
    (id: string) => {
      if (!multiple) {
        clearFiles()
        return
      }

      setState((prev) => {
        const fileToRemove = prev.files.find((file) => file.id === id)
        if (!fileToRemove) return prev
        revokeFilePreviews([fileToRemove])

        const files = prev.files.filter((file) => file.id !== id)
        const errors =
          files.length > maxFiles
            ? [`You can only upload a maximum of ${maxFiles} files.`]
            : getErrors(files, accept, maxSize).errors

        return { ...prev, files, errors }
      })
    },
    [accept, clearFiles, maxFiles, maxSize, multiple]
  )

  const clearErrors = React.useCallback(() => {
    setState((prev) => ({ ...prev, errors: [] }))
  }, [])

  const handleDragEnter = React.useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setState((prev) => ({ ...prev, isDragging: true }))
  }, [])

  const handleDragLeave = React.useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setState((prev) => ({ ...prev, isDragging: false }))
  }, [])

  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setState((prev) => ({ ...prev, isDragging: false }))

      if (inputRef.current?.disabled) return

      if (e.dataTransfer.files?.length) {
        addFiles(!multiple ? [e.dataTransfer.files[0]!] : e.dataTransfer.files)
      }
    },
    [addFiles, multiple]
  )

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files)
    },
    [addFiles]
  )

  const openFileDialog = React.useCallback(() => {
    inputRef.current?.click()
  }, [])

  const getInputProps = React.useCallback(
    (props: React.InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      type: 'file' as const,
      onChange: handleFileChange,
      accept: props.accept || accept,
      multiple: props.multiple !== undefined ? props.multiple : multiple,
      ref: inputRef
    }),
    [accept, multiple, handleFileChange]
  )

  return [
    state,
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps
    }
  ]
}
