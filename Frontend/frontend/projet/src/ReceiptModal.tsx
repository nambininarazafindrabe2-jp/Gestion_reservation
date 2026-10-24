import { useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { ariary } from './format';

interface ReceiptProps {
  reservation: {
    coder: string; datesr: string; departr: string; arriver: string;
    placesr: string; nombrep: number; codec?: string; numv?: string;
  };
  client?: { codec: string; nomc: string; prenomc: string; contact: string };
  voiture?: { numv: string; marqueV: string; capaciteV: number };
  contenus: { destinations: string; montants: string | number }[];
  onClose: () => void;
}

export function ReceiptModal({ reservation: r, client, voiture, contenus, onClose }: ReceiptProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = contenus.reduce((s, c) => s + (Number(c.montants) || 0), 0);
  const destinations = contenus.map((c) => c.destinations).join(', ');

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Reçu ${r.coder}`}>
      <div className="receipt-card">
        <div className="header">
          <div>
            <h1>Gestions_RT</h1>
            <small>Reçu Officiel de Réservation</small>
          </div>
          <div className="header-num">
            <small>Réservation</small>
            <strong>N° {r.coder}</strong>
          </div>
        </div>

        <div className="content">
          <div className="info-grid">
            <div className="info-item">
              <label>Date de réservation: </label>
              <span>{r.datesr}</span>
            </div>
            <div className="info-item">
              <label>Client: </label>
              <span>
                {client ? `${client.nomc} ${client.prenomc}` : (r.codec || 'Non spécifié')}
                {r.codec && <em className="muted"> ({r.codec})</em>}
              </span>
            </div>
            <div className="info-item">
              <label>Destination: </label>
              <span className="accent">{destinations || 'Non renseignée'}</span>
            </div>
            <div className="info-item">
              <label>Heure Départ ➔ Arrivée: </label>
              <span>{r.departr?.slice(0, 5)} ➔ {r.arriver?.slice(0, 5)}</span>
            </div>
            <div className="info-item">
              <label>Siège(s) réservé(s): </label>
              <span>{r.placesr}</span>
            </div>
            <div className="info-item">
              <label>Nombre de personnes: </label>
              <span>{r.nombrep || 1}</span>
            </div>
            <div className="info-item">
              <label>Véhicule: </label>
              <span>
                {voiture ? `${voiture.numv} (${voiture.marqueV})` : (r.numv || 'En attente')}
              </span>
            </div>
            <div className="info-item">
              <label>Téléphone: </label>
              <span>{client?.contact || '-'}</span>
            </div>
          </div>

          <div className="divider" />

          <div className="total-box">
            <label>Montant Total</label>
            <span>{ariary(total)}</span>
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn-back" onClick={onClose}>
            <ArrowLeft size={15} /> Retour à l'application
          </button>
          <button type="button" className="btn-print" onClick={() => window.print()}>
            <Printer size={15} /> Imprimer le Reçu
          </button>
        </div>
      </div>
    </div>
  );
}
