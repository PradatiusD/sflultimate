import * as React from 'react'
import { FieldContainer, FieldDescription, FieldInput, FieldLabel } from '@arch-ui/fields'

const dropZoneStyle = {
  border: '2px dashed #c0c7d1',
  borderRadius: '8px',
  padding: '1rem',
  backgroundColor: '#fafbfc',
  textAlign: 'center',
  cursor: 'pointer'
}

const listStyle = {
  marginTop: '1rem',
  marginBottom: 0,
  paddingLeft: '1.25rem',
  textAlign: 'left'
}

const formatFile = file => {
  const sizeInMb = file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'
  return `${file.name} (${file.type || 'unknown type'}, ${sizeInMb})`
}

const getAssetType = file => {
  if (file.type && file.type.startsWith('video/')) {
    return 'video'
  }

  return 'image'
}

const getTitleFromFile = file => file.name.replace(/\.[^.]+$/, '')

const graphqlRequest = ({ query, variables, file, onProgress }) => new Promise((resolve, reject) => {
  const operations = {
    query,
    variables: { ...variables, file: null }
  }

  const formData = new FormData()
  formData.append('operations', JSON.stringify(operations))
  formData.append('map', JSON.stringify({ 0: ['variables.file'] }))
  formData.append('0', file, file.name)

  const request = new XMLHttpRequest()
  request.open('POST', '/admin/api')
  request.withCredentials = true

  request.upload.addEventListener('progress', event => {
    if (event.lengthComputable && onProgress) {
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
  })

  request.addEventListener('load', () => {
    try {
      const payload = JSON.parse(request.responseText)
      if (request.status < 200 || request.status >= 300 || payload.errors) {
        const message = payload.errors && payload.errors[0] ? payload.errors[0].message : 'Upload failed'
        reject(new Error(message))
        return
      }

      resolve(payload.data)
    } catch (error) {
      reject(error)
    }
  })

  request.addEventListener('error', () => {
    reject(new Error('Upload failed'))
  })

  request.send(formData)
})

const graphQLJsonRequest = async ({ query, variables }) => {
  const response = await fetch('/admin/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables }),
    credentials: 'same-origin'
  })

  const payload = await response.json()

  if (!response.ok || payload.errors) {
    const message = payload.errors && payload.errors[0] ? payload.errors[0].message : 'Request failed'
    throw new Error(message)
  }

  return payload.data
}

const galleryAssetsQuery = `
  query GalleryAssetsManagerGallery($id: ID!) {
    Gallery(where: { id: $id }) {
      id
      assets(sortBy: sortOrder_ASC) {
        id
        title
        assetType
        sortOrder
        file {
          filename
          publicUrl
        }
      }
    }
  }
`

const createGalleryAssetMutation = `
  mutation GalleryAssetsManagerCreateAsset(
    $galleryId: ID!
    $file: Upload!
    $assetType: GalleryAssetAssetTypeType
    $sortOrder: Int
    $title: String
  ) {
    createGalleryAsset(data: {
      gallery: { connect: { id: $galleryId } }
      file: $file
      assetType: $assetType
      sortOrder: $sortOrder
      title: $title
    }) {
      id
      title
      assetType
      sortOrder
      file {
        filename
        publicUrl
      }
    }
  }
`

const GalleryAssetsManagerField = ({ errors, field, item, onChange }) => {
  const [files, setFiles] = React.useState([])
  const [assets, setAssets] = React.useState([])
  const [isLoadingAssets, setIsLoadingAssets] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [uploadState, setUploadState] = React.useState({
    currentFileIndex: 0,
    currentFileName: '',
    currentFileProgress: 0,
    totalFiles: 0
  })
  const inputRef = React.useRef(null)
  const htmlID = `ks-input-${field.path}`
  const hasItemId = Boolean(item && item.id)

  const loadAssets = React.useCallback(async () => {
    if (!hasItemId) {
      setAssets([])
      return
    }

    setIsLoadingAssets(true)

    try {
      const data = await graphQLJsonRequest({
        query: galleryAssetsQuery,
        variables: { id: item.id }
      })

      setAssets(data.Gallery ? data.Gallery.assets : [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoadingAssets(false)
    }
  }, [hasItemId, item])

  React.useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const uploadFiles = React.useCallback(async (incomingFiles) => {
    const normalizedFiles = Array.from(incomingFiles || [])
    if (!normalizedFiles.length) {
      return
    }

    if (!hasItemId) {
      setErrorMessage('Save this gallery before uploading files.')
      return
    }

    setErrorMessage('')
    setStatusMessage(`Uploading ${normalizedFiles.length} file${normalizedFiles.length === 1 ? '' : 's'}...`)
    setIsUploading(true)
    setFiles(currentFiles => currentFiles.concat(normalizedFiles))
    setUploadState({
      currentFileIndex: 0,
      currentFileName: normalizedFiles[0].name,
      currentFileProgress: 0,
      totalFiles: normalizedFiles.length
    })

    let nextSortOrder = assets.length

    try {
      for (const [index, file] of normalizedFiles.entries()) {
        setUploadState({
          currentFileIndex: index,
          currentFileName: file.name,
          currentFileProgress: 0,
          totalFiles: normalizedFiles.length
        })

        await graphqlRequest({
          query: createGalleryAssetMutation,
          variables: {
            galleryId: item.id,
            assetType: getAssetType(file),
            sortOrder: nextSortOrder,
            title: getTitleFromFile(file)
          },
          file,
          onProgress: progress => {
            setUploadState(currentState => ({
              ...currentState,
              currentFileIndex: index,
              currentFileName: file.name,
              currentFileProgress: progress,
              totalFiles: normalizedFiles.length
            }))
          }
        })

        nextSortOrder += 1
      }

      onChange(JSON.stringify({
        updatedAt: new Date().toISOString(),
        fileCount: normalizedFiles.length
      }))

      setStatusMessage(`Uploaded ${normalizedFiles.length} file${normalizedFiles.length === 1 ? '' : 's'}.`)
      setFiles([])
      setUploadState({
        currentFileIndex: normalizedFiles.length,
        currentFileName: '',
        currentFileProgress: 100,
        totalFiles: normalizedFiles.length
      })
      await loadAssets()
    } catch (error) {
      setErrorMessage(error.message)
      setStatusMessage('')
    } finally {
      setIsUploading(false)
    }
  }, [assets.length, hasItemId, item, loadAssets, onChange])

  const handleDrop = event => {
    event.preventDefault()
    uploadFiles(event.dataTransfer.files)
  }

  const helpText = hasItemId
    ? 'Drop files here or click to select multiple files. Each file is saved as a GalleryAsset record.'
    : 'Save this gallery first so dropped files can be attached to a real Gallery record.'

  const completedFileCount = isUploading
    ? uploadState.currentFileIndex
    : uploadState.totalFiles
  const overallProgress = uploadState.totalFiles
    ? Math.round(((completedFileCount + (uploadState.currentFileProgress / 100)) / uploadState.totalFiles) * 100)
    : 0

  return (
    <FieldContainer>
      <FieldLabel htmlFor={htmlID} field={field} errors={errors} />
      <FieldDescription text={field.adminDoc} />
      <FieldInput>
        <div
          id={htmlID}
          onClick={() => hasItemId && inputRef.current && inputRef.current.click()}
          onDragOver={event => event.preventDefault()}
          onDrop={handleDrop}
          role='button'
          style={{
            ...dropZoneStyle,
            opacity: hasItemId ? 1 : 0.6
          }}
          tabIndex={0}
        >
          <strong>{hasItemId ? 'Drop gallery files here' : 'Save gallery before uploading files'}</strong>
          <div style={{ marginTop: '0.5rem' }}>{helpText}</div>
          {isUploading && (
            <div style={{ marginTop: '1rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Uploading file {uploadState.currentFileIndex + 1} of {uploadState.totalFiles}
              </div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {uploadState.currentFileName}
              </div>
              <div style={{ marginTop: '0.75rem', height: '10px', backgroundColor: '#e9ecef', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${overallProgress}%`,
                    height: '100%',
                    backgroundColor: '#0d6efd',
                    transition: 'width 120ms linear'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <span>{overallProgress}% uploaded</span>
                <span>Please wait on this page until upload completes.</span>
              </div>
            </div>
          )}
          {!isUploading && statusMessage && (
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              {statusMessage}
            </div>
          )}
          {!!errorMessage && (
            <div style={{ marginTop: '1rem', color: '#b42318', fontSize: '0.875rem' }}>
              {errorMessage}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          accept='image/*,video/*'
          multiple
          onChange={event => uploadFiles(event.target.files)}
          style={{ display: 'none' }}
          type='file'
        />
        {!!files.length && (
          <ol style={listStyle}>
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>{formatFile(file)}</li>
            ))}
          </ol>
        )}
        {(isLoadingAssets || !!assets.length) && (
          <div style={{ marginTop: '1rem', textAlign: 'left' }}>
            <strong>Saved assets</strong>
            {isLoadingAssets && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Loading assets...
              </div>
            )}
            {!isLoadingAssets && !!assets.length && (
              <ol style={listStyle}>
                {assets.map(asset => (
                  <li key={asset.id}>
                    {asset.sortOrder || asset.sortOrder === 0 ? `${asset.sortOrder}. ` : ''}
                    {asset.title || asset.file.filename}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </FieldInput>
    </FieldContainer>
  )
}

export default GalleryAssetsManagerField
