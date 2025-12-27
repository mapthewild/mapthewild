import { useState } from 'react'

export default function ZoomImage({ src, alt }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <figure style={{ margin: '2rem 0' }}>
        <img
          src={src}
          alt={alt}
          onClick={() => setExpanded(true)}
          style={{
            width: '100%',
            borderRadius: '8px',
            cursor: 'zoom-in',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        />
        <figcaption style={{
          marginTop: '0.5rem',
          fontSize: '0.875rem',
          color: '#94a3b8',
          textAlign: 'center'
        }}>
          {alt} <span style={{ opacity: 0.6 }}>(click to expand)</span>
        </figcaption>
      </figure>

      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        </div>
      )}
    </>
  )
}
