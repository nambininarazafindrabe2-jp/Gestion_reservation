import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Bus, Users, FileText, RefreshCw, LayoutDashboard, UserCheck,
  DollarSign, Receipt, Navigation, Car, Layers, Plus, Trash2, Search, Edit2, X, Info, LogOut, Menu,
  Bell, UserRound
} from 'lucide-react';
import './App.css';
import mpdImage from './assets/mpd.png';
import { AuthModal } from './AuthModal';
import { Pagination } from './paginations';
import { ReceiptModal } from './ReceiptModal';
import { nf, ariary, sanitizeContact, isValidPhone, firstEmpty, PHONE_HELP } from './format';

interface Client { codec: string; nomc: string; prenomc: string; contact: string; }
interface Voiture { numv: string; marqueV: string; capaciteV: number; }
interface Trajet { destinations: string; frais: string | number; }
interface Reservation {
  coder: string; datesr: string; departr: string; arriver: string;
  placesr: string; nombrep: number; codec?: string; numv?: string;
}
interface Contenir { id?: number; coder: string; destinations: string; montants: string | number; }
interface DepartureNotification {
  id: string;
  reservationCode: string;
  date: string;
  daysUntilDeparture: number;
}

type Tab = 'dashboard' | 'clients' | 'voitures' | 'trajets' | 'reservations' | 'contenirs' | 'apropos';

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'clients', label: 'Clients', icon: <UserCheck size={18} /> },
  { id: 'voitures', label: 'Voitures', icon: <Car size={18} /> },
  { id: 'trajets', label: 'Trajets', icon: <Navigation size={18} /> },
  { id: 'reservations', label: 'Réservations', icon: <Receipt size={18} /> },
  { id: 'contenirs', label: 'Contenir', icon: <Layers size={18} /> },
  { id: 'apropos', label: 'À propos', icon: <Info size={18} /> },
];

const has = (value: unknown, q: string) => String(value ?? '').toLowerCase().includes(q);
const asArray = <T,>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : []);
const sortByDescendingId = <T,>(items: T[], getId: (item: T) => string): T[] =>
  [...items].sort((left, right) => {
    const leftId = getId(left);
    const rightId = getId(right);
    return leftId < rightId ? 1 : leftId > rightId ? -1 : 0;
  });
type Notice = { kind: 'error' | 'success'; text: string } | null;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('token')
  );

  const [tab, setTab] = useState<Tab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('username') || 'Utilisateur');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmBox, setConfirmBox] = useState<{ message: string; onYes: () => void } | null>(null);
  const fail = useCallback((text: string) => setNotice({ kind: 'error', text }), []);
  const ok = useCallback((text: string) => setNotice({ kind: 'success', text }), []);
  const [selectedResa, setSelectedResa] = useState<Reservation | null>(null);
    

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const todayStr = new Date().toISOString().split('T')[0];

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [contenirs, setContenirs] = useState<Contenir[]>([]);

  const [newClient, setNewClient] = useState<Client>({ codec: '', nomc: '', prenomc: '', contact: '' });
  const [newVoiture, setNewVoiture] = useState<Voiture>({ numv: '', marqueV: '', capaciteV: 32 });
  const [newTrajet, setNewTrajet] = useState<Trajet>({ destinations: '', frais: '' });
  const [newResa, setNewResa] = useState<Reservation>({
    coder: '', datesr: todayStr, departr: '08:00', arriver: '12:00',
    placesr: '1', nombrep: 1, codec: '', numv: ''
  });
  const [newContenir, setNewContenir] = useState<Contenir>({ coder: '', destinations: '', montants: '' });

  const [editItem, setEditItem] = useState<{ type: Tab; data: any } | null>(null);

  const fetchAll = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Token ${token}` } };

    Promise.all([
      axios.get('/api/reservations/', config),
      axios.get('/api/clients/', config),
      axios.get('/api/trajets/', config),
      axios.get('/api/voitures/', config),
      axios.get('/api/contenirs/', config),
    ])
      .then(([r, c, t, v, k]) => {
        setReservations(sortByDescendingId(asArray<Reservation>(r.data), (item) => item.coder));
        setClients(sortByDescendingId(asArray<Client>(c.data), (item) => item.codec));
        setTrajets(asArray<Trajet>(t.data));
        setVoitures(asArray<Voiture>(v.data));
        setContenirs(asArray<Contenir>(k.data));
      })
      .catch((err) => {
        console.error('Erreur API :', err);
        fail('Impossible de récupérer les données du serveur.');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, fail]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    }
  }, [fetchAll, isAuthenticated]);

  useEffect(() => {
    setPage(1);
  }, [tab, query, dateStart, dateEnd, pageSize]);

  useEffect(() => {
    if (notice?.kind !== 'success') return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  const doLogout = () => {
    const token = localStorage.getItem('token');
    axios.post('/api/logout/', {}, {
      headers: { Authorization: `Token ${token}` }
    }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUserName('Utilisateur');
      setReservations([]);
      setClients([]);
      setTrajets([]);
      setVoitures([]);
      setContenirs([]);
      setReadNotificationIds([]);
      setNotificationsOpen(false);
      setIsAuthenticated(false);
    });
  };

  const handleLogout = () =>
    setConfirmBox({ message: 'Voulez-vous vraiment vous déconnecter ?', onYes: doLogout });

  if (!isAuthenticated) {
    return (
      <AuthModal
        onSuccess={() => {
          setUserName(localStorage.getItem('username') || 'Utilisateur');
          setReadNotificationIds([]);
          setNotificationsOpen(false);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const goTo = (t: Tab) => {
    setTab(t);
    setQuery('');
    setDateStart('');
    setDateEnd('');
    setNotice(null);
    setMobileNavOpen(false);
  };
  const upcomingDepartures: DepartureNotification[] = reservations.flatMap((reservation) => {
    const [year, month, day] = reservation.datesr.split('-').map(Number);
    const departureDay = Date.UTC(year, month - 1, day);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysUntilDeparture = Math.round((departureDay - today) / 86_400_000);
    if (!Number.isFinite(departureDay) || daysUntilDeparture < 0 || daysUntilDeparture > 3) return [];
    return [{
      id: `${reservation.coder}-${reservation.datesr}`,
      reservationCode: reservation.coder,
      date: reservation.datesr,
      daysUntilDeparture,
    }];
  }).sort((left, right) => left.daysUntilDeparture - right.daysUntilDeparture);
  const unreadNotifications = upcomingDepartures.filter(
    (notification) => !readNotificationIds.includes(notification.id)
  );
  const markNotificationsAsRead = () => {
    setReadNotificationIds((current) => [
      ...new Set([...current, ...upcomingDepartures.map((notification) => notification.id)]),
    ]);
  };
  const handleContactPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    const input = event.currentTarget;
    const candidate = input.value.slice(0, input.selectionStart ?? input.value.length)
      + pasted
      + input.value.slice(input.selectionEnd ?? input.value.length);
    if (!/^[0-9]*$/.test(pasted) || candidate.length > 10) {
      event.preventDefault();
      fail(PHONE_HELP);
    }
  };
  const handleContactChange = (value: string, update: (contact: string) => void) => {
    if (!/^[0-9]*$/.test(value) || value.length > 10) fail(PHONE_HELP);
    update(sanitizeContact(value));
  };

  const post = (endpoint: string, body: object, reset: () => void) => {
    const token = localStorage.getItem('token');
    axios.post(`/api/${endpoint}/`, body, { headers: { Authorization: `Token ${token}` } })
      .then(() => { reset(); setPage(1); fetchAll(); ok('Enregistrement réussi.'); })
      
    .catch((err) => {
      const apiErrors = err.response?.data;
      if (apiErrors && typeof apiErrors === 'object') {
      const allMessages = Object.values(apiErrors)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === 'string');

      const message = allMessages.join(' ').toLowerCase();

      const erreurDoublon =
        message.includes('already exists') ||
        message.includes('must make a unique set') ||
        message.includes('unique together') ||
        message.includes('unique constraint');

      if (erreurDoublon) {
        if (endpoint === 'contenirs') {
          fail(
            'Cette réservation possède déjà cette destination. ' +
            'Veuillez choisir une autre destination ou vérifier les informations.'
          );
        } else if (endpoint === 'trajets') {
          fail(
            'Cette destination existe déjà. Veuillez saisir une destination différente.'
          );
        } else if (endpoint === 'reservations') {
          fail(
            'Ce code de réservation existe déjà. Veuillez saisir un code différent.'
          );
        } else if (endpoint === 'clients') {
          fail(
            'Ce code client existe déjà. Veuillez saisir un code différent.'
          );
        } else if (endpoint === 'voitures') {
          fail(
            'Ce numéro de voiture existe déjà. Veuillez saisir un numéro différent.'
          );
        } else {
          fail('Cet élément existe déjà. Veuillez vérifier les informations saisies.');
        }

        return;
      }

      fail(
        allMessages.length > 0
          ? `Erreur : ${allMessages.join(' ')}`
          : 'Les données saisies sont invalides. Veuillez vérifier les champs.'
      );
    } else {
      fail(
        "Impossible d'enregistrer les données. Vérifiez votre connexion au serveur."
      );
    }
      
    });

  };

  const put = (endpoint: string, id: string | number, body: object) => {
    const token = localStorage.getItem('token');
    axios.put(`/api/${endpoint}/${encodeURIComponent(String(id))}/`, body, { headers: { Authorization: `Token ${token}` } })
      .then(() => { setEditItem(null); fetchAll(); ok('Modification enregistrée.'); })
      .catch((err) => fail('Erreur de modification : ' + JSON.stringify(err.response?.data || err.message)));
  };

  const remove = (endpoint: string, id: string | number) => {
    setConfirmBox({
      message: `Voulez-vous vraiment supprimer cet élément (${id}) ?`,
      onYes: () => {
        const token = localStorage.getItem('token');
        axios.delete(`/api/${endpoint}/${encodeURIComponent(String(id))}/`, { headers: { Authorization: `Token ${token}` } })
          .then(() => { fetchAll(); ok('Suppression effectuée.'); })
          .catch((err) => fail('Erreur de suppression : ' + err.message));
      },
    });
  };

  const q = query.trim().toLowerCase();

  const filterByDate = (dateStr: string) => {
    if (!dateStart && !dateEnd) return true;
    const d = new Date(dateStr);
    const start = dateStart ? new Date(dateStart) : new Date('1970-01-01');
    const end = dateEnd ? new Date(dateEnd) : new Date('2099-12-31');
    return d >= start && d <= end;
  };

  const fClients = clients.filter((c) => has(c.codec, q) || has(c.nomc, q) || has(c.prenomc, q) || has(c.contact, q));
  const fVoitures = voitures.filter((v) => has(v.numv, q) || has(v.marqueV, q));
  const fTrajets = trajets.filter((t) => has(t.destinations, q));

  const fReservations = reservations.filter((r) => {
    const matchText = has(r.coder, q) || has(r.datesr, q) || has(r.departr, q) || has(r.arriver, q) || has(r.placesr, q) || has(r.codec, q) || has(r.numv, q);
    return matchText && filterByDate(r.datesr);
  });

  const fContenirs = contenirs.filter((c) => {
    const matchingResa = reservations.find(r => r.coder === c.coder);
    const matchText = has(c.coder, q) || has(c.destinations, q);
    return matchText && (matchingResa ? filterByDate(matchingResa.datesr) : true);
  });

  const slice = <T,>(arr: T[]): T[] => {
    const maxPage = Math.max(1, Math.ceil(arr.length / pageSize));
    const p = Math.min(page, maxPage);
    return arr.slice((p - 1) * pageSize, p * pageSize);
  };

  const pager = (total: number) => (
    <Pagination
      page={Math.min(page, Math.max(1, Math.ceil(total / pageSize)))}
      total={total}
      pageSize={pageSize}
      onPage={setPage}
      onPageSize={setPageSize}
    />
  );

  const capacite = voitures.reduce((s, v) => s + (v.capaciteV || 0), 0) || 32;
  const placesOccupees = reservations.reduce((s, r) => s + (r.nombrep || 0), 0);
  const placesRestantes = capacite - placesOccupees;
  const montantTotal = contenirs.reduce((s, c) => s + (Number(c.montants) || 0), 0);

  const empty = (cols: number, text: string) => (
    <tr><td className="empty" colSpan={cols}>{text}</td></tr>
  );

  const actionBtns = (endpoint: string, id: string | number, item: any, type: Tab) => (
    <span className="actions">
      <button className="btn yellow" aria-label={`Modifier ${id}`} onClick={() => setEditItem({ type, data: { ...item } })}>
        <Edit2 size={14} />
      </button>
      <button className="btn red" aria-label={`Supprimer ${id}`} onClick={() => remove(endpoint, id)}>
        <Trash2 size={14} />
      </button>
    </span>
  );

  const reservationDetails = (reservation: Reservation) => {
    const client = clients.find((item) => item.codec === reservation.codec);
    const voiture = voitures.find((item) => item.numv === reservation.numv);
    return {
      clientName: client
        ? `${client.nomc} ${client.prenomc}`
        : (reservation.codec || '-'),
      vehicleName: voiture
        ? `${voiture.numv}${voiture.marqueV ? ` (${voiture.marqueV})` : ''}`
        : (reservation.numv || '-'),
    };
  };

  const ReservationsTable = (
    <>
      <div className="table-scroll reservation-table-scroll">
        <table className="reservation-table">
          <thead>
            <tr>
              <th>CODE</th><th>DATE</th><th>HORAIRE</th><th>SIÈGE</th>
              <th>CLIENT</th><th>VOITURE</th><th>NB</th>
              <th className="right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {fReservations.length === 0 && empty(8, 'Aucune réservation trouvée.')}
            {slice(fReservations).map((r) => {
              const { clientName, vehicleName } = reservationDetails(r);

              return (
                <tr key={r.coder}>
                  <td className="code">{r.coder}</td>
                  <td>{r.datesr}</td>
                  <td>{r.departr?.slice(0, 5)} ➔ {r.arriver?.slice(0, 5)}</td>
                  <td><span className="chip cyan">{r.placesr}</span></td>
                  <td>
                    <strong>{r.codec}</strong>
                    <br />
                    <small>{clientName}</small>
                  </td>
                  <td><strong>{vehicleName}</strong></td>
                  <td>{r.nombrep || 1} p.</td>
                  <td className="right">
                    <span className="actions">
                      <button type="button" className="btn blue" onClick={() => setSelectedResa(r)} title="Afficher le reçu">
                        <FileText size={13} /> PDF
                      </button>
                      {actionBtns('reservations', r.coder, r, 'reservations')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="reservation-cards">
        {fReservations.length === 0 && (
          <p className="reservation-cards-empty">Aucune réservation trouvée.</p>
        )}
        {slice(fReservations).map((r) => {
          const { clientName, vehicleName } = reservationDetails(r);
          return (
            <article className="reservation-card" key={r.coder}>
              <header className="reservation-card-header">
                <h3>{r.coder}</h3>
              </header>
              <dl className="reservation-card-details">
                <div><dt>Date</dt><dd>{r.datesr}</dd></div>
                <div><dt>Horaire</dt><dd>{r.departr?.slice(0, 5)} – {r.arriver?.slice(0, 5)}</dd></div>
                <div><dt>Place</dt><dd><span className="chip cyan">{r.placesr}</span></dd></div>
                <div><dt>Client</dt><dd><strong>{r.codec || '-'}</strong><span>{clientName}</span></dd></div>
                <div><dt>Voiture</dt><dd>{vehicleName}</dd></div>
                <div><dt>Nombre de places</dt><dd>{r.nombrep || 1}</dd></div>
              </dl>
              <div className="reservation-card-actions">
                <button
                  type="button"
                  className="btn blue"
                  onClick={() => setSelectedResa(r)}
                  aria-label={`Afficher le reçu PDF de la réservation ${r.coder}`}
                >
                  <FileText size={16} /> PDF
                </button>
                {actionBtns('reservations', r.coder, r, 'reservations')}
              </div>
            </article>
          );
        })}
      </div>
      {pager(fReservations.length)}
    </>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-name">
            <Bus size={24} color="#38bdf8" />
            <div>Gestions_RT</div>
          </div>
          <button
            type="button"
            className="menu-toggle"
            aria-label={mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <nav
          id="primary-navigation"
          className={`nav${mobileNavOpen ? ' nav-open' : ''}`}
          aria-label="Navigation principale"
        >
          {NAV.map((n) => (
            <button key={n.id} className={tab === n.id ? 'active' : ''} onClick={() => goTo(n.id)}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="refresh" onClick={fetchAll}><RefreshCw size={15} /><span>Actualiser</span></button>
          <button className="btn red full-width" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1>{NAV.find((item) => item.id === tab)?.label}</h1>
          <div className="topbar-actions">
            <div className="notification-control" ref={notificationsRef}>
              <button
                type="button"
                className="notification-toggle"
                aria-label={`Notifications${unreadNotifications.length ? `, ${unreadNotifications.length} non lue${unreadNotifications.length > 1 ? 's' : ''}` : ''}`}
                aria-expanded={notificationsOpen}
                aria-controls="notifications-panel"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={20} />
                {unreadNotifications.length > 0 && (
                  <span className="notification-count" aria-hidden="true">
                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                  </span>
                )}
              </button>
              <section
                className="notifications-panel"
                id="notifications-panel"
                aria-label="Notifications"
                hidden={!notificationsOpen}
              >
                  <div className="notifications-heading">
                    <h2>Notifications</h2>
                    {unreadNotifications.length > 0 && (
                      <button type="button" onClick={markNotificationsAsRead}>
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {upcomingDepartures.length > 0 ? (
                    <ul>
                      {upcomingDepartures.map((notification) => (
                        <li
                          key={notification.id}
                          className={readNotificationIds.includes(notification.id) ? '' : 'unread'}
                        >
                          <span>
                            {notification.daysUntilDeparture === 0
                              ? "Départ aujourd'hui"
                              : `Départ dans ${notification.daysUntilDeparture} jour${notification.daysUntilDeparture > 1 ? 's' : ''}`}
                          </span>
                          <small>Réservation {notification.reservationCode} · {notification.date}</small>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="notifications-empty">Aucune nouvelle notification</p>
                  )}
              </section>
            </div>
            <div className="topbar-user">
              <UserRound size={19} aria-hidden="true" />
              <span title={userName}>{userName}</span>
            </div>
          </div>
        </header>
        <div className="page-summary">
          <div className="page-head">
            <div>
              <p>Gestion et administration du module {tab}</p>
            </div>
            {tab !== 'dashboard' && tab !== 'apropos' && (
              <div className="filters-container">
                {(tab === 'reservations' || tab === 'contenirs') && (
                  <div className="date-filter">
                    <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} title="Date début" />
                    <span>à</span>
                    <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} title="Date fin" />
                  </div>
                )}
                <div className="search">
                  <Search size={16} />
                  <input type="search" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {tab === 'dashboard' && (
            <div className="stats">
              <div className="stat">
                <div className="stat-top">Total clients <UserCheck size={16} /></div>
                <div className="stat-value">{nf(clients.length)}</div>
              </div>
              <div className="stat">
                <div className="stat-top">Flotte voitures <Car size={16} /></div>
                <div className="stat-value">{nf(voitures.length)}</div>
              </div>
              <div className="stat">
                <div className="stat-top">Réservations <FileText size={16} /></div>
                <div className="stat-value">{nf(reservations.length)}</div>
              </div>
              <div className="stat">
                <div className="stat-top">Places occupées <Users size={16} /></div>
                <div className="stat-value">{nf(placesOccupees)} / {nf(capacite)}</div>
              </div>
              <div className="stat">
                <div className="stat-top">Places restantes <Bus size={16} /></div>
                <div className="stat-value" style={{ color: placesRestantes < 5 ? 'var(--danger)' : undefined }}>
                  {nf(placesRestantes)}
                </div>
              </div>
              <div className="stat">
                <div className="stat-top">Montant total <DollarSign size={16} /></div>
                <div className="stat-value">{ariary(montantTotal)}</div>
              </div>
            </div>
          )}
        </div>

        {loading && <div className="banner info">Chargement des données...</div>}
        {notice && (
          <div className={`banner ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
            <span>{notice.kind === 'error' ? '⚠️' : '✅'} {notice.text}</span>
            <button type="button" className="banner-close" aria-label="Fermer" onClick={() => setNotice(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {tab === 'dashboard' && ReservationsTable}

        {tab === 'clients' && (
          <>
            <form noValidate className="form form-inline" onSubmit={(e) => {
              e.preventDefault();
              setNotice(null);

              const vide = firstEmpty([
                ['Code client', newClient.codec],
                ['Nom', newClient.nomc],
                ['Prénom', newClient.prenomc],
                ['Téléphone', newClient.contact],
              ]);
              if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }

              const existeCode = clients.some(
                (c) => c.codec?.trim().toLowerCase() === newClient.codec.trim().toLowerCase()
              );
              if (existeCode) { fail(`Le code client "${newClient.codec.trim()}" existe déjà.`); return; }

              if (!isValidPhone(newClient.contact)) { fail(PHONE_HELP); return; }

              post('clients', {
                ...newClient,
                codec: newClient.codec.trim(),
                nomc: newClient.nomc.trim(),
                prenomc: newClient.prenomc.trim(),
                contact: newClient.contact,
              }, () => setNewClient({ codec: '', nomc: '', prenomc: '', contact: '' }));
            }}>
              <div className="input-group">
                <label>Code client <span className="required"></span></label>
                <input
                  placeholder='Ex: C1'
                  value={newClient.codec}
                  required
                  onChange={(e) => setNewClient({ ...newClient, codec: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Nom <span className="required"></span></label>
                <input
                  value={newClient.nomc}
                  required
                  onChange={(e) => setNewClient({ ...newClient, nomc: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Prénom <span className="required"></span></label>
                <input
                  value={newClient.prenomc}
                  required
                  onChange={(e) => setNewClient({ ...newClient, prenomc: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Contact  <span className="required"></span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={newClient.contact}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  onPaste={handleContactPaste}
                  onChange={(e) => handleContactChange(e.target.value, (contact) => setNewClient({ ...newClient, contact }))}
                />
              </div>

              <button className="btn" type="submit">
                <Plus size={16} /> Ajouter client
              </button>
            </form>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CODE CLIENT</th><th>NOM</th><th>PRÉNOM</th><th>TÉLÉPHONE</th>
                    <th className="right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {fClients.length === 0 && empty(5, 'Aucun client trouvé.')}
                  {slice(fClients).map((c) => (
                    <tr key={c.codec}>
                      <td className="code">{c.codec}</td>
                      <td>{c.nomc}</td>
                      <td>{c.prenomc}</td>
                      <td>{c.contact}</td>
                      <td className="right">{actionBtns('clients', c.codec, c, 'clients')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pager(fClients.length)}
          </>
        )}

        {tab === 'voitures' && (
          <>
            <form noValidate
              className="form form-inline"
              onSubmit={(e) => {
                e.preventDefault();
                setNotice(null);

                const vide = firstEmpty([
                  ['N° Voiture', newVoiture.numv],
                  ['Marque', newVoiture.marqueV],
                  ['Capacité', newVoiture.capaciteV],
                ]);
                if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }

                const existeDeja = voitures.some(
                  (v) => v.numv?.trim().toLowerCase() === newVoiture.numv?.trim().toLowerCase()
                );
                if (existeDeja) {
                  fail(`Erreur : Le numéro de voiture "${newVoiture.numv}" existe déjà !`);
                  return;
                }

                const capVal = Number(newVoiture.capaciteV);
                if (isNaN(capVal) || capVal < 18 || capVal > 32) {
                  fail(`Erreur : La capacité doit être comprise entre 18 et 32 places ! (Vous avez saisi ${capVal})`);
                  return;
                }

                const payload = {
                  numv: newVoiture.numv.trim(),
                  marqueV: newVoiture.marqueV.trim(),
                  capaciteV: capVal,
                };

                post('voitures', payload, () =>
                  setNewVoiture({ numv: '', marqueV: '', capaciteV: 32 })
                );
              }}
            >
              <div className="input-group">
                <label>N° Voiture <span className="required"></span></label>
                <input
                  value={newVoiture.numv}
                  required
                  onChange={(e) => setNewVoiture({ ...newVoiture, numv: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Marque de la voiture <span className="required"></span></label>
                <input
                  value={newVoiture.marqueV}
                  required
                  onChange={(e) => setNewVoiture({ ...newVoiture, marqueV: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Capacité  <span className="required"></span></label>
                <input
                  placeholder="32"
                  type="number"
                  min={18}
                  max={32}
                  value={newVoiture.capaciteV || ''}
                  required
                  onChange={(e) => setNewVoiture({ ...newVoiture, capaciteV: Number(e.target.value) })}
                />
              </div>

              <button className="btn" type="submit">
                <Plus size={16} /> Ajouter voiture
              </button>
            </form>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>N° VOITURE</th><th>MARQUE</th><th>CAPACITÉ</th>
                    <th className="right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {fVoitures.length === 0 && empty(4, 'Aucune voiture trouvée.')}
                  {slice(fVoitures).map((v) => (
                    <tr key={v.numv}>
                      <td className="code">{v.numv}</td>
                      <td>{v.marqueV}</td>
                      <td>{v.capaciteV} places</td>
                      <td className="right">{actionBtns('voitures', v.numv, v, 'voitures')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pager(fVoitures.length)}
          </>
        )}

        {tab === 'trajets' && (
          <>
            <form noValidate className="form" onSubmit={(e) => {
              e.preventDefault();
              setNotice(null);
              const vide = firstEmpty([['Destination', newTrajet.destinations], ['Frais de transport', newTrajet.frais]]);
              if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }
              if (Number(newTrajet.frais) < 0) { fail('Les frais de transport ne peuvent pas être négatifs.'); return; }
              post('trajets', { ...newTrajet, destinations: newTrajet.destinations.trim() }, () => setNewTrajet({ destinations: '', frais: '' }));
            }}>
              <div className="input-group">
                <label>Destination / Ville <span className="required"></span></label>
                <input
                  value={newTrajet.destinations}
                  required
                  onChange={(e) => setNewTrajet({ ...newTrajet, destinations: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Frais de transport (Ar) <span className="required"></span></label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newTrajet.frais}
                  required
                  onChange={(e) => setNewTrajet({ ...newTrajet, frais: e.target.value })}
                />
              </div>

              <button className="btn" type="submit">
                <Plus size={16} /> Ajouter trajet
              </button>
            </form>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>DESTINATION</th><th>FRAIS</th>
                    <th className="right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {fTrajets.length === 0 && empty(3, 'Aucun trajet trouvé.')}
                  {slice(fTrajets).map((t) => (
                    <tr key={t.destinations}>
                      <td className="code">{t.destinations}</td>
                      <td>{ariary(t.frais)}</td>
                      <td className="right">{actionBtns('trajets', t.destinations, t, 'trajets')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pager(fTrajets.length)}
          </>
        )}

        {tab === 'reservations' && (
          <>
            <form noValidate className="form form-grid-reservation" onSubmit={(e) => {
              e.preventDefault();
              setNotice(null);
              const vide = firstEmpty([
                ['Code Réservation', newResa.coder],
                ['Date de voyage', newResa.datesr],
                ['Heure de départ', newResa.departr],
                ["Heure d'arrivée", newResa.arriver],
                ['Numéro de Siège', newResa.placesr],
                ['Client', newResa.codec],
                ['Voiture', newResa.numv],
              ]);
              if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }
              if (newResa.datesr < todayStr) {
                fail('Erreur : La date de réservation ne peut pas être dans le passé !');
                return;
              }
              if (newResa.arriver <= newResa.departr) {
                fail(`L'heure d'arrivée (${newResa.arriver}) doit être après l'heure de départ (${newResa.departr}).`);
                return;
              }
              setNotice(null);
              if (!newResa.codec || !newResa.numv) {
                fail('Veuillez sélectionner un client et une voiture.');
                return;
              }

              const siegePris = reservations.some(
                r => r.numv === newResa.numv && r.datesr === newResa.datesr && r.placesr === newResa.placesr
              );
              if (siegePris) {
                fail(`Erreur : Le siège "${newResa.placesr}" de la voiture ${newResa.numv} est déjà occupé pour le ${newResa.datesr} !`);
                return;
              }

              post('reservations', newResa, () => setNewResa({
                coder: '',
                datesr: todayStr,
                departr: '08:00',
                arriver: '12:00',
                placesr: '1',
                nombrep: 1,
                codec: '',
                numv: ''
              }));
            }}>

              <div className="input-group">
                <label>Code Réservation</label>
                <input
                  placeholder="Ex: R1"
                  value={newResa.coder}
                  required
                  onChange={(e) => setNewResa({ ...newResa, coder: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Date de voyage</label>
                <input
                  type="date"
                  value={newResa.datesr}
                  min={todayStr}
                  required
                  onChange={(e) => setNewResa({ ...newResa, datesr: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Heure de départ</label>
                <input
                  type="time"
                  value={newResa.departr}
                  required
                  onChange={(e) => {
                    const dep = e.target.value;
                    let arr = newResa.arriver;
                    if (arr <= dep) {
                      const [h, m] = dep.split(':').map(Number);
                      arr = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    }
                    setNotice(null);
                    setNewResa({ ...newResa, departr: dep, arriver: arr });
                  }}
                />
              </div>

              <div className="input-group">
                <label>Heure d'arrivée</label>
                <input
                  type="time"
                  value={newResa.arriver}
                  min={newResa.departr}
                  required
                  onChange={(e) => { setNotice(null); setNewResa({ ...newResa, arriver: e.target.value }); }}
                />
              </div>

              <div className="input-group">
                <label>Numéro de Siège</label>
                <input
                  placeholder="Ex: 1"
                  value={newResa.placesr}
                  required
                  onChange={(e) => setNewResa({ ...newResa, placesr: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Client</label>
                <select
                  value={newResa.codec || ''}
                  required
                  onChange={(e) => setNewResa({ ...newResa, codec: e.target.value })}
                >
                  <option value="" disabled> Choisir un Client </option>
                  {clients.map(c => (
                    <option key={c.codec} value={c.codec}>
                      {c.codec} - {c.nomc} {c.prenomc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Voiture</label>
                <select
                  value={newResa.numv || ''}
                  required
                  onChange={(e) => setNewResa({ ...newResa, numv: e.target.value })}
                >
                  <option value="" disabled> Choisir une Voiture </option>
                  {voitures.map((v) => (
                    <option key={v.numv} value={v.numv}>
                      {v.numv} {v.marqueV ? `(${v.marqueV})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="nombrep">Nombre de personnes</label>
                <input
                  id="nombrep"
                  type="number"
                  name="nombrep"
                  min={1}
                  max={voitures.find(v => v.numv === newResa.numv)?.capaciteV || 32}
                  step={1}
                  value={newResa.nombrep}
                  required
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setNewResa({ ...newResa, nombrep: 1 });
                      return;
                    }

                    const nombre = Number(value);
                    if (Number.isInteger(nombre) && nombre >= 1) {
                      setNewResa({ ...newResa, nombrep: nombre });
                    }
                  }}
                />
              </div>

              <button className="btn" type="submit">
                <Plus size={16} /> Ajouter réservation
              </button>
            </form>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CODE</th><th>DATE</th><th>HORAIRE</th><th>NUMÉRO DE PLACE</th>
                    <th>CLIENT</th><th>VOITURE</th><th>NOMBRE DE PLACE</th>
                    <th className="right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {fReservations.length === 0 && empty(8, 'Aucune réservation trouvée.')}
                  {slice(fReservations).map((r) => {
                    const clientObj = clients.find(c => c.codec === r.codec);
                    const voitureObj = voitures.find((v) => v.numv === r.numv);
                    const clientNom = clientObj ? `${clientObj.nomc} ${clientObj.prenomc}` : r.codec;
                    const voitureNom = voitureObj
                      ? `${voitureObj.numv}${voitureObj.marqueV ? ` (${voitureObj.marqueV})` : ''}`
                      : (r.numv || '-');

                    return (
                      <tr key={r.coder}>
                        <td className="code">{r.coder}</td>
                        <td>{r.datesr}</td>
                        <td>{r.departr?.slice(0, 5)} - {r.arriver?.slice(0, 5)}</td>
                        <td><span className="chip cyan">{r.placesr}</span></td>
                        <td><strong>{r.codec}</strong> - {clientNom}</td>
                        <td><strong>{voitureNom}</strong></td>
                        <td>{r.nombrep || 1} p.</td>
                        <td className="right">{actionBtns('reservations', r.coder, r, 'reservations')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pager(fReservations.length)}
          </>
        )}

        {tab === 'contenirs' && (
          <>
            <form noValidate className="form" onSubmit={(e) => {
              e.preventDefault();
              setNotice(null);
              const vide = firstEmpty([['Code Réservation', newContenir.coder], ['Destination', newContenir.destinations], ['Montant', newContenir.montants]]);
              if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }
              if (Number(newContenir.montants) < 0) { fail('Le montant ne peut pas être négatif.'); return; }
              post('contenirs', newContenir, () => setNewContenir({ coder: '', destinations: '', montants: '' }));
            }}>
              <div className="input-group">
                <label>Code Réservation <span className="required"></span></label>
                <select value={newContenir.coder} required onChange={(e) => setNewContenir({ ...newContenir, coder: e.target.value })}>
                  <option value=""> Sélectionner Réservation </option>
                  {reservations.map(r => <option key={r.coder} value={r.coder}>{r.coder} ({r.datesr})</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Destination <span className="required"></span></label>
                <select value={newContenir.destinations} required onChange={(e) => {
                  const dest = e.target.value;
                  const t = trajets.find(tr => tr.destinations === dest);
                  setNewContenir({ ...newContenir, destinations: dest, montants: t ? t.frais : newContenir.montants });
                }}>
                  <option value=""> Sélectionner Destination </option>
                  {trajets.map(t => <option key={t.destinations} value={t.destinations}>{t.destinations} ({ariary(t.frais)})</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Montant (Ar) <span className="required"></span></label>
                <input
                  placeholder="Montant"
                  type="number"
                  value={newContenir.montants}
                  required
                  onChange={(e) => setNewContenir({ ...newContenir, montants: e.target.value })}
                />
              </div>

              <button className="btn" type="submit">
                <Plus size={16} /> Enregistrer Contenir
              </button>
            </form>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CODE RÉSERVATION</th><th>DESTINATION</th><th>MONTANT</th>
                    <th className="right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {fContenirs.length === 0 && empty(4, 'Aucune attribution trouvée.')}
                  {slice(fContenirs).map((c) => (
                    <tr key={c.id ?? `${c.coder}-${c.destinations}`}>
                      <td className="code">{c.coder}</td>
                      <td><span className="chip amber">{c.destinations}</span></td>
                      <td>{ariary(c.montants)}</td>
                      <td className="right">{c.id ? actionBtns('contenirs', c.id, c, 'contenirs') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pager(fContenirs.length)}
          </>
        )}

        {tab === 'apropos' && (
          <div className="apropos-container">
            <div className="apropos-card">
              <h3>Informations Projet</h3>

              <div className="apropos-info-item">
                <span className="label">Nom de l'application</span>
                <span className="value">Gestions_RT (Réservation de Transport)</span>
              </div>

              <div className="apropos-info-item">
                <span className="label">Technologies utilisées</span>
                <div className="tech-tags">
                  <span className="tech-tag">React + Vite</span>
                  <span className="tech-tag">TypeScript</span>
                  <span className="tech-tag">Django </span>
                  <span className="tech-tag">Sqlite</span>
                  <span className="tech-tag">REST API</span>
                </div>
              </div>
            </div>

            <div className="apropos-card">
              <h3>Modèle Physique des Données (MPD)</h3>
              <div className="mpd-image-wrapper">
                <img src={mpdImage} alt="Modèle Physique des Données" />
              </div>
            </div>
          </div>
        )}

        {editItem && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-head">
                <h3>Modifier {editItem.type === 'apropos' ? '' : editItem.type}</h3>
                <button className="btn-close" onClick={() => setEditItem(null)}><X size={16} /></button>
              </div>

              {editItem.type === 'clients' && (
                <form noValidate className="modal-form modal-form-grid" onSubmit={(e) => {
                  e.preventDefault();
                  setNotice(null);
                  const vide = firstEmpty([['Nom', editItem.data.nomc], ['Prénom', editItem.data.prenomc], ['Téléphone', editItem.data.contact]]);
                  if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }
                  if (!isValidPhone(editItem.data.contact)) { fail(PHONE_HELP); return; }
                  put('clients', editItem.data.codec, { ...editItem.data });
                }}>
                  <div className="full-width">
                    <label>Code Client</label>
                    <input value={editItem.data.codec} disabled />
                  </div>
                  <div>
                    <label>Nom</label>
                    <input value={editItem.data.nomc} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, nomc: e.target.value } })} required />
                  </div>
                  <div>
                    <label>Prénom</label>
                    <input value={editItem.data.prenomc} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, prenomc: e.target.value } })} required />
                  </div>
                  <div className="full-width">
                    <label>Téléphone / Contact</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={editItem.data.contact}
                      onPaste={handleContactPaste}
                      onChange={(e) => handleContactChange(e.target.value, (contact) => setEditItem({ ...editItem, data: { ...editItem.data, contact } }))}
                      required
                    />
                  </div>
                  <button className="btn full-width" type="submit">Enregistrer</button>
                </form>
              )}

              {editItem.type === 'voitures' && (
                <form noValidate
                  className="modal-form modal-form-grid"
                  onSubmit={(e) => {
                    e.preventDefault();

                    setNotice(null);
                    if (firstEmpty([['Marque', editItem.data.marqueV]])) { fail('Le champ « Marque » est obligatoire.'); return; }
                    const capVal = Number(editItem.data.capaciteV);
                    if (isNaN(capVal) || capVal < 18 || capVal > 32) {
                      fail(`Erreur : La capacité doit être comprise entre 18 et 32 places ! (Vous avez saisi ${capVal})`);
                      return;
                    }

                    const updatePayload = {
                      numv: editItem.data.numv,
                      marqueV: editItem.data.marqueV,
                      capaciteV: capVal,
                    };

                    put('voitures', editItem.data.numv, updatePayload);
                  }}
                >
                  <div className="full-width">
                    <label>N° Voiture</label>
                    <input value={editItem.data.numv} disabled />
                  </div>

                  <div>
                    <label>Marque</label>
                    <input
                      value={editItem.data.marqueV ?? ''}
                      onChange={(e) =>
                        setEditItem({ ...editItem, data: { ...editItem.data, marqueV: e.target.value } })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>Capacité (18 à 32 places)</label>
                    <input
                      type="number"
                      min={18}
                      max={32}
                      value={editItem.data.capaciteV ?? 32}
                      onChange={(e) =>
                        setEditItem({ ...editItem, data: { ...editItem.data, capaciteV: Number(e.target.value) } })
                      }
                      required
                    />
                  </div>

                  <button className="btn full-width" type="submit">Enregistrer</button>
                </form>
              )}

              {editItem.type === 'trajets' && (
                <form noValidate className="modal-form modal-form-grid" onSubmit={(e) => {
                  e.preventDefault();
                  setNotice(null);
                  if (firstEmpty([['Frais', editItem.data.frais]])) { fail('Le champ « Frais » est obligatoire.'); return; }
                  if (Number(editItem.data.frais) < 0) { fail('Les frais de transport ne peuvent pas être négatifs.'); return; }
                  put('trajets', editItem.data.destinations, editItem.data);
                }}>
                  <div className="full-width">
                    <label>Destination</label>
                    <input value={editItem.data.destinations} disabled />
                  </div>
                  <div className="full-width">
                    <label>Frais (Ar)</label>
                    <input type="number" step="0.01" value={editItem.data.frais} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, frais: e.target.value } })} required />
                  </div>
                  <button className="btn full-width" type="submit">Enregistrer</button>
                </form>
              )}

              {editItem.type === 'reservations' && (
                <form noValidate className="modal-form modal-form-grid" onSubmit={(e) => {
                  e.preventDefault();
                  if (editItem.data.arriver <= editItem.data.departr) {
                    fail("Erreur : L'heure d'arrivée doit être supérieure à l'heure de départ !");
                    return;
                  }
                  const siegePris = reservations.some(
                    r => r.coder !== editItem.data.coder &&
                      r.numv === editItem.data.numv &&
                      r.datesr === editItem.data.datesr &&
                      r.placesr === editItem.data.placesr
                  );
                  if (siegePris) {
                    fail(`Erreur : Le Numéro du siège "${editItem.data.placesr}" de la voiture ${editItem.data.numv} est déjà occupé pour le ${editItem.data.datesr} !`);
                    return;
                  }
                  put('reservations', editItem.data.coder, editItem.data);
                }}>
                  <div className="full-width">
                    <label>Code Réservation</label>
                    <input value={editItem.data.coder} disabled />
                  </div>

                  <div>
                    <label>Date</label>
                    <input type="date" value={editItem.data.datesr} min={todayStr} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, datesr: e.target.value } })} required />
                  </div>

                  <div>
                    <label>Siège(s)</label>
                    <input value={editItem.data.placesr} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, placesr: e.target.value } })} required />
                  </div>

                  <div>
                    <label>Départ</label>
                    <input type="time" value={editItem.data.departr} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, departr: e.target.value } })} required />
                  </div>

                  <div>
                    <label>Arrivée</label>
                    <input type="time" value={editItem.data.arriver} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, arriver: e.target.value } })} required />
                  </div>

                  <div className="full-width">
                    <label>Nombre de Places</label>
                    <input type="number" min={1} value={editItem.data.nombrep} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, nombrep: Number(e.target.value) } })} required />
                  </div>

                  <div className="full-width">
                    <label>Client</label>
                    <select
                      value={editItem.data.codec || ''}
                      required
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, codec: e.target.value } })}
                    >
                      <option value="" disabled> Choisir Client </option>
                      {clients.map(c => (
                        <option key={c.codec} value={c.codec}>
                          {c.codec} - {c.nomc} {c.prenomc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="full-width">
                    <label>Voiture</label>
                    <select
                      value={editItem.data.numv || ''}
                      required
                      onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, numv: e.target.value } })}
                    >
                      <option value="" disabled> Choisir Voiture </option>
                      {voitures.map(v => (
                        <option key={v.numv} value={v.numv}>
                          {v.numv} - {v.marqueV}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button className="btn full-width" type="submit">Enregistrer</button>
                </form>
              )}

              {editItem.type === 'contenirs' && (
                <form noValidate className="modal-form modal-form-grid" onSubmit={(e) => {
                  e.preventDefault();
                  setNotice(null);
                  const vide = firstEmpty([['Destination', editItem.data.destinations], ['Montant', editItem.data.montants]]);
                  if (vide) { fail(`Le champ « ${vide} » est obligatoire.`); return; }
                  put('contenirs', editItem.data.id, editItem.data);
                }}>
                  <div className="full-width">
                    <label>Code Réservation</label>
                    <input value={editItem.data.coder} disabled />
                  </div>
                  <div className="full-width">
                    <label>Destination</label>
                    <select
                      value={editItem.data.destinations}
                      required
                      onChange={(e) => {
                        const dest = e.target.value;
                        const t = trajets.find(tr => tr.destinations === dest);
                        setEditItem({
                          ...editItem,
                          data: { ...editItem.data, destinations: dest, montants: t ? t.frais : editItem.data.montants }
                        });
                      }}
                    >
                      <option value="" disabled> Sélectionner Destination </option>
                      {trajets.map(t => (
                        <option key={t.destinations} value={t.destinations}>
                          {t.destinations} ({ariary(t.frais)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="full-width">
                    <label>Montant (Ar)</label>
                    <input type="number" value={editItem.data.montants} onChange={(e) => setEditItem({ ...editItem, data: { ...editItem.data, montants: e.target.value } })} required />
                  </div>
                  <button className="btn full-width" type="submit">Enregistrer</button>
                </form>
              )}
            </div>
          </div>
        )}
        {selectedResa && (
          <ReceiptModal
            reservation={selectedResa}
            client={clients.find((c) => c.codec === selectedResa.codec)}
            voiture={voitures.find((v) => v.numv === selectedResa.numv)}
            contenus={contenirs.filter((c) => c.coder === selectedResa.coder)}
            onClose={() => setSelectedResa(null)}
          />
        )}

        {confirmBox && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal modal-confirm">
              <div className="modal-head"><h3>Confirmation</h3></div>
              <div className="confirm-body">
                <p>{confirmBox.message}</p>
                <div className="confirm-actions">
                  <button type="button" className="btn gray" onClick={() => setConfirmBox(null)}>Annuler</button>
                  <button
                    type="button"
                    className="btn red"
                    onClick={() => { const run = confirmBox.onYes; setConfirmBox(null); run(); }}
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
