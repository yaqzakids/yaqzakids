import { useEffect, useRef, useState } from 'react'
import DiscovererPageShell from '@/components/discoverer/DiscovererPageShell'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSelectedChild } from '@/context/SelectedChildContext'
import { fetchChildCertificates } from '@/lib/discoverer'
import type { Certificate } from '@/lib/types'

function CertificateCard({ cert }: { cert: Certificate }) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const text = `${cert.child_name} completed ${cert.path_name} on YaqzaKids!`
    if (navigator.share) {
      await navigator.share({ title: 'YaqzaKids Certificate', text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  return (
    <div className="certificate-card bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div
        ref={printRef}
        className="certificate-print p-8 md:p-12 text-center bg-[#FFF8ED]"
      >
        <p className="text-teal font-extrabold tracking-widest text-sm mb-4">YAQZAKIDS</p>
        <h2 className="font-display text-2xl font-bold text-navy mb-6">
          Certificate of Completion
        </h2>
        <p className="text-muted mb-2">This certifies that</p>
        <p className="font-display text-4xl font-bold text-[#F5A623] mb-4">{cert.child_name}</p>
        <p className="text-muted mb-2">has successfully completed</p>
        <p className="text-xl font-extrabold text-navy mb-6">{cert.path_name}</p>
        <p className="text-sm text-muted mb-4">
          {new Date(cert.completed_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-4xl">⭐</p>
      </div>
      <div className="flex gap-3 p-4 border-t border-gray-100 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-2.5 bg-navy text-white rounded-full text-sm font-extrabold"
        >
          Download
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 py-2.5 border-2 border-navy text-navy rounded-full text-sm font-extrabold"
        >
          Share
        </button>
      </div>
    </div>
  )
}

export default function CertificatesPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild()
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])

  useEffect(() => {
    if (childLoading) return
    if (!selectedChild) {
      setLoading(false)
      return
    }
    fetchChildCertificates(selectedChild.id)
      .then(setCertificates)
      .finally(() => setLoading(false))
  }, [selectedChild?.id, childLoading])

  if (childLoading || loading) {
    return (
      <DiscovererPageShell>
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DiscovererPageShell>
    )
  }

  return (
    <DiscovererPageShell>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .certificate-print, .certificate-print * { visibility: visible; }
          .certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          nav, footer, .print\\:hidden { display: none !important; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-navy mb-2">My Certificates</h1>
        <p className="text-muted mb-8">
          Complete a learning path to earn a certificate you can print and share.
        </p>

        {certificates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-5xl mb-4">📜</p>
            <p className="text-navy font-bold mb-2">No certificates yet</p>
            <p className="text-muted text-sm">
              Finish a learning path to unlock your first certificate!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {certificates.map((c) => (
              <CertificateCard key={c.id} cert={c} />
            ))}
          </div>
        )}
      </div>
    </DiscovererPageShell>
  )
}
