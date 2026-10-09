import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

export default function GalleryLightbox ({ slides, index, onClose }) {
  return (
    <Lightbox
      open
      close={onClose}
      slides={slides}
      index={index}
      plugins={[Captions, Counter, Zoom]}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      animation={{ swipe: 0, navigation: 0 }}
      carousel={{ preload: 1 }}
      render={slides.length === 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
      captions={{ descriptionTextAlign: 'center', descriptionMaxLines: 3 }}
      styles={{
        container: { backgroundColor: 'rgba(12, 15, 18, 0.96)' },
        captionsDescription: { fontSize: '0.875rem', color: '#d1d5db' }
      }}
    />
  )
}
