import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Check,
  CreditCard,
  ChevronDown,
  CircleHelp,
  Clock3,
  Droplets,
  History,
  Monitor,
  Pause,
  Play,
  Plus,
  QrCode,
  Search,
  Settings2,
  Sparkles,
  Square,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';

const STORAGE = {
  services: 'jatopague-services-v1',
  sessions: 'jatopague-sessions-v1',
  history: 'jatopague-history-v1',
};

const DEFAULT_SERVICES = [
  { id: 'pressao', name: 'Água pressurizada', rate: 1.5, unit: 'Pista', color: 'blue', Icon: Waves },
  { id: 'espuma', name: 'Espuma ativa', rate: 1.2, unit: 'Pista', color: 'coral', Icon: Sparkles },
  { id: 'aspirador', name: 'Aspirador', rate: 1, unit: 'Box', color: 'green', Icon: Wind },
  { id: 'cera', name: 'Cera líquida', rate: 1.5, unit: 'Pista', color: 'yellow', Icon: Droplets },
];

const EQUIPMENT = [
  { id: 'P01', number: '01', name: 'Pista 01', description: 'Box principal' },
  { id: 'P02', number: '02', name: 'Pista 02', description: 'Box principal' },
  { id: 'A01', number: '03', name: 'Aspirador 01', description: 'Área de aspiração' },
  { id: 'A02', number: '04', name: 'Aspirador 02', description: 'Área de aspiração' },
];

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadServices() {
  const saved = loadStorage(STORAGE.services, null);
  if (!Array.isArray(saved)) return DEFAULT_SERVICES;
  return DEFAULT_SERVICES.map((service) => ({
    ...service,
    rate: saved.find((item) => item.id === service.id)?.rate ?? service.rate,
  }));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function getElapsed(session, now) {
  return Math.max(0, session.elapsedMs + (session.runningSince ? now - session.runningSince : 0));
}

function isToday(timestamp) {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

function App() {
  const [services, setServices] = useState(loadServices);
  const [sessions, setSessions] = useState(() => loadStorage(STORAGE.sessions, {}));
  const [history, setHistory] = useState(() => loadStorage(STORAGE.history, []));
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState('operation');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => localStorage.setItem(STORAGE.services, JSON.stringify(services)), [services]);
  useEffect(() => localStorage.setItem(STORAGE.sessions, JSON.stringify(sessions)), [sessions]);
  useEffect(() => localStorage.setItem(STORAGE.history, JSON.stringify(history)), [history]);

  const activeCount = Object.keys(sessions).length;
  const todayHistory = history.filter((item) => isToday(item.closedAt));
  const todayRevenue = todayHistory.reduce((total, item) => total + item.amount, 0);
  const currentTotal = Object.values(sessions).reduce((total, session) => {
    const service = services.find((item) => item.id === session.serviceId);
    return total + (service ? (getElapsed(session, now) / 60000) * session.rate : 0);
  }, 0);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  }

  function startSession(equipmentId, serviceId) {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    const startedAt = Date.now();
    setSessions((current) => ({
      ...current,
      [equipmentId]: { serviceId, serviceName: service.name, rate: service.rate, elapsedMs: 0, runningSince: startedAt, startedAt },
    }));
    notify('Sessão iniciada');
  }

  function togglePause(equipmentId) {
    setSessions((current) => {
      const session = current[equipmentId];
      if (!session) return current;
      const isRunning = Boolean(session.runningSince);
      return {
        ...current,
        [equipmentId]: {
          ...session,
          elapsedMs: isRunning ? getElapsed(session, Date.now()) : session.elapsedMs,
          runningSince: isRunning ? null : Date.now(),
        },
      };
    });
  }

  function finishSession(equipment) {
    const session = sessions[equipment.id];
    if (!session) return;
    const finishedAt = Date.now();
    const elapsedMs = getElapsed(session, finishedAt);
    const service = services.find((item) => item.id === session.serviceId);
    const entry = {
      id: `${finishedAt}-${equipment.id}`,
      equipment: equipment.name,
      service: session.serviceName ?? service?.name ?? 'Serviço removido',
      durationMs: elapsedMs,
      amount: (elapsedMs / 60000) * session.rate,
      startedAt: session.startedAt,
      closedAt: finishedAt,
    };
    setHistory((current) => [entry, ...current]);
    setSessions((current) => {
      const next = { ...current };
      delete next[equipment.id];
      return next;
    });
    notify('Sessão encerrada e adicionada ao histórico');
  }

  const visibleHistory = history.filter((item) => {
    const matchesDate = historyFilter === 'all' || isToday(item.closedAt);
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !query || `${item.equipment} ${item.service}`.toLocaleLowerCase('pt-BR').includes(query);
    return matchesDate && matchesSearch;
  });
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (view === 'totem') {
    return (
      <TotemScreen
        services={services}
        sessions={sessions}
        now={now}
        onStart={startSession}
        onPause={togglePause}
        onFinish={finishSession}
        onExit={() => setView('operation')}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#operacao" onClick={() => setView('operation')} aria-label="JatoPague, início">
          <span className="brand-mark"><Zap size={21} fill="currentColor" strokeWidth={2.4} /></span>
          <span className="brand-name">jato<span>pague</span><small>AUTO SERVICE</small></span>
        </a>

        <div className="side-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <button className={view === 'operation' ? 'nav-item selected' : 'nav-item'} onClick={() => setView('operation')}>
            <Activity size={18} strokeWidth={1.8} /> <span>Operação</span>
            {activeCount > 0 && <span className="nav-count">{activeCount}</span>}
          </button>
          <button className="nav-item" onClick={() => setView('totem')}>
            <Monitor size={18} strokeWidth={1.8} /> <span>Totem</span>
          </button>
          <button className={view === 'history' ? 'nav-item selected' : 'nav-item'} onClick={() => setView('history')}>
            <History size={18} strokeWidth={1.8} /> <span>Histórico</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection"><span className="connection-dot" /><span>Sistema operacional</span></div>
          <button className="settings-link" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={18} strokeWidth={1.8} /><span>Configurar tarifas</span>
          </button>
          <div className="sidebar-foot">JATOPAGUE <span>•</span> PAINEL LOCAL</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">JatoPague <span>/</span> <strong>{view === 'operation' ? 'Operação' : 'Histórico'}</strong></div>
          <div className="topbar-right">
            <span className="live-status"><span className="live-dot" /> AO VIVO</span>
            <span className="topbar-date"><CalendarDays size={15} /> {new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(now)}</span>
            <button className="icon-button top-settings" aria-label="Configurar tarifas" title="Configurar tarifas" onClick={() => setSettingsOpen(true)}><Settings2 size={19} /></button>
          </div>
        </header>

        {view === 'operation' ? (
          <section className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> CENTRAL DE CONTROLE</div>
                <h1>{greeting}, operação<span className="heading-period">.</span></h1>
                <p>Acompanhe os equipamentos e as sessões em tempo real.</p>
              </div>
              <div className="shift-label"><span className="shift-icon"><Clock3 size={17} /></span><span><strong>Turno de hoje</strong><small>Atualizado agora</small></span></div>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-top"><span>EM OPERAÇÃO</span><span className="stat-icon stat-icon-blue"><Activity size={17} /></span></div>
                <div className="stat-main"><strong>{String(activeCount).padStart(2, '0')}</strong><span className="stat-unit">/ 04</span></div>
                <div className="stat-caption">equipamentos em uso</div>
                <div className="stat-track"><span style={{ width: `${(activeCount / EQUIPMENT.length) * 100}%` }} /></div>
              </article>
              <article className="stat-card">
                <div className="stat-top"><span>EM SESSÕES ATIVAS</span><span className="stat-icon stat-icon-green"><Zap size={17} /></span></div>
                <div className="stat-main stat-currency"><strong>{formatCurrency(currentTotal)}</strong></div>
                <div className="stat-caption">valor acumulado neste momento</div>
                <div className="stat-trend"><ArrowUpRight size={14} /> calculado por segundo</div>
              </article>
              <article className="stat-card stat-card-accent">
                <div className="stat-top"><span>ARRECADADO HOJE</span><span className="stat-icon stat-icon-white"><ArrowDownRight size={17} /></span></div>
                <div className="stat-main stat-currency"><strong>{formatCurrency(todayRevenue)}</strong></div>
                <div className="stat-caption">{todayHistory.length} {todayHistory.length === 1 ? 'sessão encerrada' : 'sessões encerradas'}</div>
                <div className="stat-accent-foot"><span /> FECHAMENTO DO DIA</div>
              </article>
            </div>

            <div className="section-heading">
              <div><div className="section-kicker">EQUIPAMENTOS</div><h2>Painel de uso <span className="equipment-total">04</span></h2></div>
              <button className="text-button" onClick={() => setSettingsOpen(true)}><Settings2 size={15} /> Gerenciar tarifas</button>
            </div>

            <div className="equipment-grid">
              {EQUIPMENT.map((equipment) => {
                const session = sessions[equipment.id];
                const service = services.find((item) => item.id === session?.serviceId);
                const isRunning = Boolean(session?.runningSince);
                const elapsed = session ? getElapsed(session, now) : 0;
                const amount = service ? (elapsed / 60000) * session.rate : 0;
                const ServiceIcon = service?.Icon ?? CircleHelp;
                const isVacuum = equipment.id.startsWith('A');
                const availableServices = services.filter((item) => isVacuum ? item.id === 'aspirador' : item.id !== 'aspirador');
                return (
                  <article className={`equipment-card ${session ? 'is-active' : ''} ${session && !isRunning ? 'is-paused' : ''}`} key={equipment.id}>
                    <div className="equipment-top">
                      <div className="equipment-id"><span className={`machine-icon ${isVacuum ? 'machine-vacuum' : ''}`}>{isVacuum ? <Wind size={19} /> : <Waves size={19} />}</span><span className="machine-number">EQP. {equipment.number}</span></div>
                      <span className={`status-badge ${session ? (isRunning ? 'status-running' : 'status-paused') : 'status-idle'}`}><span />{session ? (isRunning ? 'EM USO' : 'PAUSADO') : 'DISPONÍVEL'}</span>
                    </div>
                    <div className="equipment-name-row"><div><h3>{equipment.name}</h3><p>{equipment.description}</p></div>{session && <div className={`service-chip ${service?.color ?? 'blue'}`}><ServiceIcon size={14} /></div>}</div>

                    {session ? (
                      <>
                        <div className="running-panel">
                          <div className="timer-label"><span className={isRunning ? 'timer-pulse' : 'timer-pulse paused'} /> TEMPO DE USO</div>
                          <div className="timer-value">{formatDuration(elapsed)}</div>
                          <div className="running-meta"><span>{session.serviceName ?? service?.name ?? 'Serviço'}</span><span>{formatCurrency(session.rate)}<small>/min</small></span></div>
                        </div>
                        <div className="session-total"><span>Parcial da sessão</span><strong>{formatCurrency(amount)}</strong></div>
                        <div className="equipment-actions">
                          <button className="pause-button" onClick={() => togglePause(equipment.id)}>{isRunning ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}<span>{isRunning ? 'Pausar' : 'Retomar'}</span></button>
                          <button className="finish-button" onClick={() => finishSession(equipment)}><Square size={13} fill="currentColor" /><span>Encerrar</span></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="idle-panel">
                          <div className="idle-mark"><span /><span /><span /></div>
                          <span>Pronto para iniciar</span>
                        </div>
                        <label className="service-select-label" htmlFor={`service-${equipment.id}`}>SERVIÇO</label>
                        <div className="select-wrap"><select id={`service-${equipment.id}`} defaultValue={availableServices[0]?.id} key={services.map((item) => item.id).join('-')}>
                          {availableServices.map((item) => <option value={item.id} key={item.id}>{item.name} · {formatCurrency(item.rate)}/min</option>)}
                        </select><ChevronDown size={15} /></div>
                        <button className="start-button" disabled={!availableServices.length} onClick={(event) => startSession(equipment.id, event.currentTarget.parentElement.querySelector('select').value)}><Play size={15} fill="currentColor" /><span>Iniciar sessão</span><Plus className="start-plus" size={16} /></button>
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            <footer className="page-footer"><span><span className="footer-dot" /> TODOS OS EQUIPAMENTOS CONECTADOS</span><span>JatoPague <b>·</b> Operação local</span></footer>
          </section>
        ) : (
          <section className="page-content history-page">
            <div className="page-heading">
              <div><div className="eyebrow"><span className="eyebrow-line" /> REGISTROS</div><h1>Histórico<span className="heading-period">.</span></h1><p>Consulte as sessões finalizadas e seus valores.</p></div>
              <div className="history-summary"><span className="history-summary-icon"><History size={18} /></span><span><small>SESSÕES REGISTRADAS</small><strong>{String(history.length).padStart(2, '0')}</strong></span></div>
            </div>

            <div className="history-toolbar">
              <div className="filter-tabs" role="group" aria-label="Filtrar sessões">
                <button className={historyFilter === 'all' ? 'filter-tab active' : 'filter-tab'} onClick={() => setHistoryFilter('all')}>Todas <span>{history.length}</span></button>
                <button className={historyFilter === 'today' ? 'filter-tab active' : 'filter-tab'} onClick={() => setHistoryFilter('today')}>Hoje <span>{todayHistory.length}</span></button>
              </div>
              <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar equipamento ou serviço" /></label>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <thead><tr><th>DATA E HORA</th><th>EQUIPAMENTO</th><th>SERVIÇO</th><th>DURAÇÃO</th><th className="amount-heading">VALOR</th></tr></thead>
                <tbody>
                  {visibleHistory.map((item) => (
                    <tr key={item.id}>
                      <td><div className="date-cell"><span className="date-icon"><CalendarDays size={15} /></span><span><strong>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(item.closedAt)}</strong><small>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(item.closedAt)}</small></span></div></td>
                      <td><span className="table-equipment"><span className="table-eqp-icon"><Waves size={15} /></span>{item.equipment}</span></td>
                      <td><span className="table-service">{item.service}</span></td>
                      <td><span className="table-duration"><Clock3 size={14} />{formatDuration(item.durationMs)}</span></td>
                      <td className="amount-cell">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleHistory.length === 0 && <div className="empty-history"><span className="empty-history-icon"><History size={22} /></span><strong>{search || history.length ? 'Nenhuma sessão encontrada' : 'Seu histórico começa aqui'}</strong><p>{search || history.length ? 'Ajuste a busca ou o período selecionado.' : 'As sessões encerradas aparecerão neste painel.'}</p></div>}
            </div>
            <footer className="page-footer"><span>{visibleHistory.length} {visibleHistory.length === 1 ? 'REGISTRO EXIBIDO' : 'REGISTROS EXIBIDOS'}</span><span>JatoPague <b>·</b> Operação local</span></footer>
          </section>
        )}
      </main>

      {settingsOpen && <SettingsDialog services={services} onClose={() => setSettingsOpen(false)} onSave={(nextServices) => { setServices(nextServices); setSettingsOpen(false); notify('Tarifas atualizadas'); }} />}
      {notice && <div className="toast"><span><Check size={14} /></span>{notice}</div>}
    </div>
  );
}

function TotemScreen({ services, sessions, now, onStart, onPause, onFinish, onExit }) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(() => sessionStorage.getItem('jatopague-totem-equipment'));
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const equipment = EQUIPMENT.find((item) => item.id === selectedEquipmentId);
  const session = equipment ? sessions[equipment.id] : null;
  const service = services.find((item) => item.id === (session?.serviceId ?? selectedServiceId));
  const isVacuum = equipment?.id.startsWith('A');
  const availableServices = services.filter((item) => isVacuum ? item.id === 'aspirador' : item.id !== 'aspirador');
  const isRunning = Boolean(session?.runningSince);
  const elapsed = session ? getElapsed(session, now) : 0;
  const total = session ? (elapsed / 60000) * session.rate : 0;

  useEffect(() => {
    if (selectedEquipmentId && !sessions[selectedEquipmentId]) {
      sessionStorage.removeItem('jatopague-totem-equipment');
    }
  }, [selectedEquipmentId, sessions]);

  function startTotemSession() {
    if (!equipment || !selectedServiceId) return;
    sessionStorage.setItem('jatopague-totem-equipment', equipment.id);
    onStart(equipment.id, selectedServiceId);
  }

  function completeSession() {
    if (!equipment || !session) return;
    setReceipt({
      equipment: equipment.name,
      service: session.serviceName ?? service?.name ?? 'Serviço',
      duration: getElapsed(session, Date.now()),
      amount: (getElapsed(session, Date.now()) / 60000) * session.rate,
    });
    sessionStorage.removeItem('jatopague-totem-equipment');
    setConfirmFinish(false);
    onFinish(equipment);
  }

  function startAnother() {
    sessionStorage.removeItem('jatopague-totem-equipment');
    setReceipt(null);
    setSelectedEquipmentId(null);
    setSelectedServiceId(null);
  }

  return (
    <div className="totem-shell">
      <header className="totem-topbar">
        <a className="brand totem-brand" href="#totem" onClick={(event) => event.preventDefault()} aria-label="JatoPague">
          <span className="brand-mark"><Zap size={22} fill="currentColor" strokeWidth={2.4} /></span>
          <span className="brand-name">jato<span>pague</span><small>AUTO SERVICE</small></span>
        </a>
        <div className="totem-live"><span className="connection-dot" /> TOTEM DE AUTOATENDIMENTO</div>
        <button className="totem-exit" onClick={onExit}><ArrowLeft size={17} /><span>Painel</span></button>
      </header>

      <main className="totem-main">
        <div className="totem-progress" aria-label="Etapas do atendimento">
          <div className={!selectedEquipmentId && !receipt ? 'totem-step current' : 'totem-step complete'}><span>{selectedEquipmentId || receipt ? <Check size={15} /> : '01'}</span><b>Equipamento</b></div>
          <i className={selectedEquipmentId ? 'step-line complete' : 'step-line'} />
          <div className={selectedEquipmentId && !session && !receipt ? 'totem-step current' : session || receipt ? 'totem-step complete' : 'totem-step'}><span>{session || receipt ? <Check size={15} /> : '02'}</span><b>Serviço</b></div>
          <i className={session || receipt ? 'step-line complete' : 'step-line'} />
          <div className={session || receipt ? 'totem-step current' : 'totem-step'}><span>{receipt ? <Check size={15} /> : '03'}</span><b>Lavagem</b></div>
        </div>

        {receipt ? (
          <PaymentExperience receipt={receipt} onStartAnother={startAnother} />
        ) : session ? (
          <section className="totem-session">
            <div className="totem-eyebrow"><span className="totem-eyebrow-dot" /> LAVAGEM EM ANDAMENTO</div>
            <h1>Boa lavagem<span>.</span></h1>
            <p className="totem-lead">Acompanhe seu tempo e o valor parcial por aqui.</p>
            <div className="session-live-card">
              <div className="session-live-head"><span className="session-machine-icon">{isVacuum ? <Wind size={23} /> : <Waves size={23} />}</span><span><strong>{equipment.name}</strong><small>{session.serviceName ?? service?.name}</small></span><span className={`session-running-badge ${isRunning ? '' : 'paused'}`}><i />{isRunning ? 'EM USO' : 'PAUSADO'}</span></div>
              <div className="totem-timer-label"><span className={isRunning ? 'timer-pulse' : 'timer-pulse paused'} /> TEMPO DE USO</div>
              <div className="totem-timer">{formatDuration(elapsed)}</div>
              <div className="totem-cost-row"><span>{formatCurrency(session.rate)} por minuto</span><span>VALOR PARCIAL</span></div>
              <div className="totem-cost">{formatCurrency(total)}</div>
            </div>
            <div className="totem-session-actions">
              <button className="totem-secondary" onClick={() => onPause(equipment.id)}>{isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />} {isRunning ? 'Pausar lavagem' : 'Retomar lavagem'}</button>
              <button className="totem-stop" onClick={() => setConfirmFinish(true)}>Encerrar lavagem <ArrowDownRight size={17} /></button>
            </div>
            <p className="totem-session-foot"><Clock3 size={15} /> O cronômetro é pausado junto com o equipamento.</p>
          </section>
        ) : !equipment ? (
          <section className="totem-choice">
            <div className="totem-eyebrow"><span className="totem-eyebrow-line" /> BEM-VINDO AO JATOPAGUE</div>
            <div className="totem-heading-row"><div><h1>Escolha seu equipamento<span>.</span></h1><p className="totem-lead">Toque no box que você está utilizando.</p></div><div className="totem-step-count">01 <span>/ 03</span></div></div>
            <div className="totem-machine-grid">
              {EQUIPMENT.map((item) => {
                const occupied = Boolean(sessions[item.id]);
                const vacuum = item.id.startsWith('A');
                return <button className={`totem-machine ${occupied ? 'occupied' : ''}`} key={item.id} disabled={occupied} onClick={() => setSelectedEquipmentId(item.id)}>
                  <span className={`totem-machine-icon ${vacuum ? 'vacuum' : ''}`}>{vacuum ? <Wind size={24} /> : <Waves size={24} />}</span>
                  <span className="totem-machine-copy"><strong>{item.name}</strong><small>{item.description}</small></span>
                  <span className={`totem-machine-status ${occupied ? 'busy' : ''}`}><i />{occupied ? 'EM USO' : 'DISPONÍVEL'}</span>
                  <span className="totem-machine-arrow">→</span>
                </button>;
              })}
            </div>
            <div className="totem-bottom-note"><span><Clock3 size={17} /> COBRANÇA POR TEMPO DE USO</span><span>Tarifas exibidas antes de iniciar</span></div>
          </section>
        ) : (
          <section className="totem-choice">
            <button className="totem-back" onClick={() => { setSelectedEquipmentId(null); setSelectedServiceId(null); sessionStorage.removeItem('jatopague-totem-equipment'); }}><ArrowLeft size={16} /> Trocar equipamento</button>
            <div className="totem-eyebrow"><span className="totem-eyebrow-line" /> {equipment.name.toLocaleUpperCase('pt-BR')} SELECIONADO</div>
            <div className="totem-heading-row"><div><h1>O que vamos usar?</h1><p className="totem-lead">Escolha um serviço para continuar.</p></div><div className="totem-step-count">02 <span>/ 03</span></div></div>
            <div className="totem-service-grid">
              {availableServices.map((item) => {
                const Icon = item.Icon;
                return <button className={`totem-service ${selectedServiceId === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedServiceId(item.id)}>
                  <span className={`totem-service-icon ${item.color}`}><Icon size={24} /></span>
                  <span className="totem-service-name"><strong>{item.name}</strong><small>{item.unit === 'Box' ? 'Área de aspiração' : 'Pista de lavagem'}</small></span>
                  <span className="totem-service-rate"><strong>{formatCurrency(item.rate)}</strong><small>por minuto</small></span>
                  <span className="totem-service-check">{selectedServiceId === item.id && <Check size={16} />}</span>
                </button>;
              })}
            </div>
            <div className="totem-confirm-bar"><div><strong>{equipment.name}</strong><span>{service?.name ?? 'Selecione um serviço'}{service ? ` · ${formatCurrency(service.rate)}/min` : ''}</span></div><button className="totem-primary" disabled={!selectedServiceId} onClick={startTotemSession}>Iniciar lavagem <Play size={17} fill="currentColor" /></button></div>
            <p className="totem-price-note">A cobrança começa quando a lavagem é iniciada.</p>
          </section>
        )}
      </main>

      <footer className="totem-footer"><span><span className="connection-dot" /> EQUIPAMENTOS CONECTADOS</span><span>Precisa de ajuda? Procure um atendente.</span></footer>

      {confirmFinish && <div className="totem-modal-backdrop"><section className="totem-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="totem-confirm-title"><span className="confirm-stop-icon"><CarFront size={24} /></span><h2 id="totem-confirm-title">Encerrar lavagem?</h2><p>O valor final será calculado pelo tempo de uso.</p><div className="confirm-total"><span>VALOR ATUAL</span><strong>{formatCurrency(total)}</strong></div><div className="confirm-actions"><button className="totem-secondary" onClick={() => setConfirmFinish(false)}>Continuar lavagem</button><button className="totem-stop" onClick={completeSession}>Encerrar agora</button></div></section></div>}
    </div>
  );
}

function PaymentExperience({ receipt, onStartAnother }) {
  const [stage, setStage] = useState('summary');
  const [cardType, setCardType] = useState('credit');
  const [paymentMethod, setPaymentMethod] = useState('');
  const demoQrValue = `JATOPAGUE-DEMO-NAO-PAGAVEL-${receipt.equipment}-${receipt.amount.toFixed(2)}`;

  function simulatePayment(method) {
    setPaymentMethod(method);
    setStage('success');
  }

  if (stage === 'summary') {
    return (
      <section className="totem-receipt">
        <div className="receipt-check"><Check size={28} strokeWidth={2.5} /></div>
        <div className="totem-eyebrow">SESSÃO ENCERRADA</div>
        <h1>Lavagem concluída<span>.</span></h1>
        <p className="receipt-subtitle">Confira o resumo da sua sessão.</p>
        <div className="receipt-total"><span>VALOR TOTAL</span><strong>{formatCurrency(receipt.amount)}</strong></div>
        <div className="receipt-details">
          <div><span>Equipamento</span><strong>{receipt.equipment}</strong></div>
          <div><span>Serviço</span><strong>{receipt.service}</strong></div>
          <div><span>Tempo utilizado</span><strong>{formatDuration(receipt.duration)}</strong></div>
        </div>
        <p className="receipt-note">O valor foi calculado pelo tempo efetivo de uso.</p>
        <button className="totem-primary receipt-home" onClick={() => setStage('methods')}>Escolher pagamento <ArrowLeft className="receipt-restart-icon" size={18} /></button>
      </section>
    );
  }

  if (stage === 'success') {
    return (
      <section className="totem-receipt payment-success">
        <div className="receipt-check"><Check size={28} strokeWidth={2.5} /></div>
        <div className="totem-eyebrow">SIMULAÇÃO CONCLUÍDA</div>
        <h1>Pagamento simulado<span>.</span></h1>
        <p className="receipt-subtitle">{paymentMethod} · {formatCurrency(receipt.amount)}</p>
        <div className="payment-demo-notice"><strong>Nenhum pagamento real foi realizado.</strong><span>Esta confirmação existe apenas para demonstrar o fluxo do MVP.</span></div>
        <button className="totem-primary receipt-home" onClick={onStartAnother}>Voltar ao início <ArrowLeft className="receipt-restart-icon" size={18} /></button>
      </section>
    );
  }

  if (stage === 'pix') {
    return (
      <section className="payment-screen">
        <button className="payment-back" onClick={() => setStage('methods')}><ArrowLeft size={16} /> Formas de pagamento</button>
        <div className="totem-eyebrow"><span className="totem-eyebrow-line" /> PIX DEMONSTRATIVO</div>
        <div className="payment-heading-row"><div><h1>Pagamento via Pix<span>.</span></h1><p>Valor desta lavagem: <strong>{formatCurrency(receipt.amount)}</strong></p></div><span className="payment-method-icon pix"><QrCode size={23} /></span></div>
        <div className="pix-layout">
          <div className="pix-qr-card"><QRCodeSVG value={demoQrValue} size={178} level="M" bgColor="#ffffff" fgColor="#203027" /><span>QR CODE DE DEMONSTRAÇÃO</span></div>
          <div className="pix-instructions"><span className="demo-tag">NÃO PAGÁVEL</span><h2>Pix de demonstração</h2><p>Este QR não contém uma cobrança Pix válida. Ele serve apenas para apresentar a tela do totem.</p><div className="payment-amount-row"><span>Total da lavagem</span><strong>{formatCurrency(receipt.amount)}</strong></div><button className="totem-primary payment-simulate" onClick={() => simulatePayment('Pix demonstrativo')}>Simular pagamento <Check size={17} /></button><small>Nenhuma transação será enviada.</small></div>
        </div>
        <div className="payment-demo-notice"><strong>Modo de demonstração.</strong><span>Não escaneie como forma de pagamento. O conteúdo do QR não é um código Pix.</span></div>
      </section>
    );
  }

  if (stage === 'card') {
    const method = cardType === 'credit' ? 'Crédito' : 'Débito';
    return (
      <section className="payment-screen">
        <button className="payment-back" onClick={() => setStage('methods')}><ArrowLeft size={16} /> Formas de pagamento</button>
        <div className="totem-eyebrow"><span className="totem-eyebrow-line" /> CARTÃO DEMONSTRATIVO</div>
        <div className="payment-heading-row"><div><h1>Pagamento no cartão<span>.</span></h1><p>Valor desta lavagem: <strong>{formatCurrency(receipt.amount)}</strong></p></div><span className="payment-method-icon card"><CreditCard size={23} /></span></div>
        <div className="card-payment-panel">
          <div className="payment-tabs" role="group" aria-label="Tipo de cartão">
            <button className={cardType === 'credit' ? 'payment-tab selected' : 'payment-tab'} onClick={() => setCardType('credit')}><CreditCard size={17} /> Crédito</button>
            <button className={cardType === 'debit' ? 'payment-tab selected' : 'payment-tab'} onClick={() => setCardType('debit')}><CreditCard size={17} /> Débito</button>
          </div>
          <div className="mock-terminal"><span className="terminal-mark"><CreditCard size={24} /></span><span><strong>Terminal de demonstração</strong><small>Modo de teste · sem conexão bancária</small></span><span className="terminal-light" /></div>
          <div className="payment-amount-row"><span>Total da lavagem</span><strong>{formatCurrency(receipt.amount)}</strong></div>
          <button className="totem-primary payment-simulate" onClick={() => simulatePayment(`${method} demonstrativo`)}>Simular pagamento no {method.toLowerCase()} <Check size={17} /></button>
          <p className="card-demo-note">Nenhum número de cartão, senha ou dado pessoal será solicitado.</p>
        </div>
        <div className="payment-demo-notice"><strong>Modo de demonstração.</strong><span>Esta ação não autoriza nem processa uma transação real.</span></div>
      </section>
    );
  }

  return (
    <section className="payment-screen">
      <button className="payment-back" onClick={() => setStage('summary')}><ArrowLeft size={16} /> Voltar ao resumo</button>
      <div className="totem-eyebrow"><span className="totem-eyebrow-line" /> PAGAMENTO</div>
      <div className="payment-heading-row"><div><h1>Como deseja pagar<span>?</span></h1><p>Selecione uma forma para continuar com a demonstração.</p></div><div className="payment-total"><small>TOTAL</small><strong>{formatCurrency(receipt.amount)}</strong></div></div>
      <div className="payment-method-grid">
        <button className="payment-method-card" onClick={() => setStage('pix')}><span className="payment-method-icon pix"><QrCode size={24} /></span><span className="payment-method-copy"><strong>Pix</strong><small>QR Code demonstrativo</small></span><span className="payment-method-arrow">→</span></button>
        <button className="payment-method-card" onClick={() => setStage('card')}><span className="payment-method-icon card"><CreditCard size={24} /></span><span className="payment-method-copy"><strong>Cartão</strong><small>Crédito ou débito</small></span><span className="payment-method-arrow">→</span></button>
      </div>
      <div className="payment-demo-notice"><strong>Pagamento fictício para demonstração do MVP.</strong><span>Nenhum valor será cobrado e nenhum dado financeiro será enviado ou armazenado.</span></div>
    </section>
  );
}

function SettingsDialog({ services, onClose, onSave }) {
  const [draft, setDraft] = useState(() => services.map(({ id, name, rate, unit, color, Icon }) => ({ id, name, rate, unit, color, Icon })));
  function updateRate(id, value) {
    setDraft((current) => current.map((item) => item.id === id ? { ...item, rate: Math.max(0, Number(value)) } : item));
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-top"><span className="modal-icon"><Settings2 size={20} /></span><button className="icon-button modal-close" onClick={onClose} aria-label="Fechar"><X size={19} /></button></div>
        <div className="modal-eyebrow">CONFIGURAÇÃO DO SISTEMA</div><h2 id="settings-title">Tarifas por serviço</h2><p className="modal-description">O valor é calculado proporcionalmente ao tempo de uso, por minuto.</p>
        <div className="rate-list">
          {draft.map((service) => {
            const Icon = service.Icon;
            return <label className="rate-row" key={service.id}><span className={`rate-service-icon ${service.color}`}><Icon size={17} /></span><span className="rate-service-name"><strong>{service.name}</strong><small>{service.unit} <span>·</span> por minuto</small></span><span className="rate-input-wrap"><span>R$</span><input aria-label={`Tarifa de ${service.name} por minuto`} type="number" min="0" step="0.1" value={service.rate} onChange={(event) => updateRate(service.id, event.target.value)} /><small>/min</small></span></label>;
          })}
        </div>
        <div className="modal-actions"><button className="cancel-button" onClick={onClose}>Cancelar</button><button className="save-button" onClick={() => onSave(draft)}>Salvar tarifas <Check size={16} /></button></div>
      </section>
    </div>
  );
}

export default App;
