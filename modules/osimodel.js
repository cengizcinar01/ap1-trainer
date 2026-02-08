// ============================================================
// osimodel.js — OSI-Modell Interactive Learning Module
// 6 Tabs: Schichten, Protokolle, Hardware, Kapselung, TCP/UDP, Quiz
// ============================================================

const OSIModelView = (() => {
  let currentTab = 'overview';
  let cleanup_fns = [];
  let progress = loadProgress();

  // ---- Data Structures ----

  const OSI_LAYERS = [
    {
      number: 7,
      name: 'Anwendungsschicht',
      nameEn: 'Application',
      color: '#e74c3c',
      pdu: 'Daten',
      description:
        'Stellt Netzwerkdienste direkt fuer Anwendungen bereit. Hier interagieren Benutzer mit dem Netzwerk.',
      details: [
        'Schnittstelle zwischen Netzwerk und Anwendungssoftware',
        'Identifikation von Kommunikationspartnern',
        'Authentifizierung und Datenschutz',
        'Bereitstellung von Diensten wie E-Mail, Dateitransfer, Webzugriff',
      ],
      protocols: [
        'HTTP',
        'HTTPS',
        'FTP',
        'SMTP',
        'DNS',
        'DHCP',
        'SSH',
        'Telnet',
        'SNMP',
        'POP3',
        'IMAP',
      ],
      devices: ['Gateway', 'Proxy', 'Firewall (L7)'],
      examTip:
        'Die Anwendungsschicht ist NICHT die Anwendung selbst, sondern die Schnittstelle zum Netzwerk!',
    },
    {
      number: 6,
      name: 'Darstellungsschicht',
      nameEn: 'Presentation',
      color: '#e67e22',
      pdu: 'Daten',
      description:
        'Uebersetzt Datenformate, kuemmert sich um Verschluesselung und Komprimierung.',
      details: [
        'Datenkonvertierung (z.B. EBCDIC zu ASCII)',
        'Verschluesselung und Entschluesselung (TLS/SSL)',
        'Datenkomprimierung',
        'Serialisierung von Datenstrukturen',
      ],
      protocols: ['TLS/SSL', 'JPEG', 'GIF', 'MPEG', 'ASCII', 'MIME'],
      devices: [],
      examTip:
        'Merke: Darstellung = Datenformat. Oft mit Schicht 7 zusammengefasst in der Praxis (z.B. HTTPS).',
    },
    {
      number: 5,
      name: 'Sitzungsschicht',
      nameEn: 'Session',
      color: '#f1c40f',
      pdu: 'Daten',
      description:
        'Verwaltet Sitzungen (Sessions) zwischen Kommunikationspartnern.',
      details: [
        'Auf- und Abbau von Sitzungen',
        'Synchronisation und Wiederherstellung',
        'Dialog-Steuerung (Simplex, Halbduplex, Vollduplex)',
        'Token-Management fuer geordneten Zugriff',
      ],
      protocols: ['NetBIOS', 'RPC', 'PPTP', 'SAP'],
      devices: [],
      examTip:
        'Sessions = Verbindungskontrolle. Denke an Login-Sessions oder Videokonferenz-Sitzungen.',
    },
    {
      number: 4,
      name: 'Transportschicht',
      nameEn: 'Transport',
      color: '#2ecc71',
      pdu: 'Segment',
      description:
        'Stellt eine zuverlaessige oder unzuverlaessige Ende-zu-Ende-Verbindung her. Arbeitet mit Ports.',
      details: [
        'Segmentierung und Zusammensetzung von Daten',
        'Flusskontrolle und Fehlererkennung',
        'Verbindungsorientiert (TCP) oder verbindungslos (UDP)',
        'Adressierung ueber Portnummern (0-65535)',
      ],
      protocols: ['TCP', 'UDP'],
      devices: [],
      examTip:
        'TCP = zuverlaessig (3-Wege-Handshake), UDP = schnell aber unzuverlaessig. Ports identifizieren Dienste!',
    },
    {
      number: 3,
      name: 'Vermittlungsschicht',
      nameEn: 'Network',
      color: '#3498db',
      pdu: 'Paket',
      description:
        'Logische Adressierung (IP) und Routing. Bestimmt den besten Weg durch das Netzwerk.',
      details: [
        'Logische Adressierung mit IP-Adressen',
        'Routing zwischen verschiedenen Netzwerken',
        'Paketweiterleitung (Forwarding)',
        'Fragmentierung grosser Pakete',
      ],
      protocols: ['IP (IPv4/IPv6)', 'ICMP', 'ARP', 'OSPF', 'BGP', 'RIP'],
      devices: ['Router', 'Layer-3-Switch'],
      examTip:
        'Router arbeiten auf Schicht 3! IP-Adressen = logische Adressen (aenderbar, im Gegensatz zu MAC).',
    },
    {
      number: 2,
      name: 'Sicherungsschicht',
      nameEn: 'Data Link',
      color: '#9b59b6',
      pdu: 'Frame',
      description:
        'Physische Adressierung (MAC) und Fehlererkennung auf der Verbindungsebene.',
      details: [
        'MAC-Adressierung (48 Bit, z.B. AA:BB:CC:DD:EE:FF)',
        'Fehlererkennung mit CRC (Frame Check Sequence)',
        'Medienzugriffskontrolle (CSMA/CD, CSMA/CA)',
        'Aufgeteilt in LLC (Logical Link Control) und MAC (Media Access Control)',
      ],
      protocols: ['Ethernet (IEEE 802.3)', 'WLAN (IEEE 802.11)', 'PPP', 'HDLC'],
      devices: ['Switch', 'Bridge', 'Access Point'],
      examTip:
        'Switch = Schicht 2! Leitet Frames anhand von MAC-Adressen weiter. Kennt keine IP-Adressen!',
    },
    {
      number: 1,
      name: 'Bituebertragungs\u00ADschicht',
      nameEn: 'Physical',
      color: '#1abc9c',
      pdu: 'Bits',
      description:
        'Uebertragung roher Bits ueber das physische Medium (Kabel, Funk, Glasfaser).',
      details: [
        'Elektrische/optische Signale auf dem Medium',
        'Stecker- und Kabelspezifikationen (RJ45, LC, SC)',
        'Uebertragungsraten und Modulationsverfahren',
        'Topologien (Bus, Stern, Ring) auf physischer Ebene',
      ],
      protocols: ['Ethernet Physical', 'USB', 'Bluetooth', 'DSL', 'ISDN'],
      devices: ['Hub', 'Repeater', 'Modem', 'Netzwerkkabel'],
      examTip:
        'Hub = Schicht 1! Sendet an ALLE Ports (Broadcast). Unterschied zum Switch merken!',
    },
  ];

  const PROTOCOLS = [
    {
      name: 'HTTP',
      layer: 7,
      description: 'Webseiten-Uebertragung (unverschluesselt)',
    },
    {
      name: 'HTTPS',
      layer: 7,
      description: 'Verschluesselte Webseiten-Uebertragung',
    },
    { name: 'FTP', layer: 7, description: 'Dateitransfer-Protokoll' },
    { name: 'SMTP', layer: 7, description: 'E-Mail-Versand' },
    { name: 'DNS', layer: 7, description: 'Namensaufloesung (Domain zu IP)' },
    { name: 'DHCP', layer: 7, description: 'Automatische IP-Adressvergabe' },
    { name: 'SSH', layer: 7, description: 'Sichere Fernsteuerung' },
    { name: 'TLS/SSL', layer: 6, description: 'Verschluesselungsprotokoll' },
    { name: 'JPEG/MPEG', layer: 6, description: 'Bild-/Video-Codierung' },
    {
      name: 'TCP',
      layer: 4,
      description: 'Zuverlaessige, verbindungsorientierte Uebertragung',
    },
    {
      name: 'UDP',
      layer: 4,
      description: 'Schnelle, verbindungslose Uebertragung',
    },
    { name: 'IP', layer: 3, description: 'Logische Adressierung und Routing' },
    {
      name: 'ICMP',
      layer: 3,
      description: 'Fehlermeldungen und Diagnose (Ping)',
    },
    { name: 'ARP', layer: 3, description: 'Zuordnung IP zu MAC-Adresse' },
    { name: 'OSPF', layer: 3, description: 'Routing-Protokoll (Link-State)' },
    { name: 'Ethernet', layer: 2, description: 'LAN-Standard (IEEE 802.3)' },
    { name: 'WLAN', layer: 2, description: 'Drahtloses LAN (IEEE 802.11)' },
    { name: 'PPP', layer: 2, description: 'Point-to-Point Protokoll' },
    {
      name: 'Bluetooth',
      layer: 1,
      description: 'Kurzstrecken-Funktechnologie',
    },
  ];

  const HARDWARE = [
    {
      name: 'Hub',
      layer: 1,
      description: 'Leitet Signale an alle Ports weiter (kein Filtern)',
    },
    {
      name: 'Repeater',
      layer: 1,
      description: 'Verstaerkt und regeneriert Signale',
    },
    {
      name: 'Modem',
      layer: 1,
      description: 'Wandelt digitale in analoge Signale um',
    },
    {
      name: 'Switch',
      layer: 2,
      description: 'Leitet Frames gezielt anhand von MAC-Adressen weiter',
    },
    {
      name: 'Bridge',
      layer: 2,
      description: 'Verbindet zwei Netzwerksegmente auf Schicht 2',
    },
    {
      name: 'Access Point',
      layer: 2,
      description: 'Verbindet WLAN-Geraete mit dem kabelgebundenen Netzwerk',
    },
    {
      name: 'Router',
      layer: 3,
      description:
        'Verbindet verschiedene Netzwerke, routet anhand von IP-Adressen',
    },
    {
      name: 'Layer-3-Switch',
      layer: 3,
      description: 'Switch mit Routing-Faehigkeiten',
    },
    {
      name: 'Gateway',
      layer: 7,
      description: 'Uebersetzt zwischen verschiedenen Protokollen/Netzwerken',
    },
  ];

  const ENCAPSULATION_STEPS = [
    {
      name: 'Daten',
      layer: 7,
      color: '#e74c3c',
      description: 'Die Anwendung erzeugt Nutzdaten, z.B. eine HTTP-Anfrage.',
      detail: 'GET /index.html HTTP/1.1',
      headers: [],
    },
    {
      name: 'Segment',
      layer: 4,
      color: '#2ecc71',
      description:
        'Die Transportschicht fuegt einen TCP/UDP-Header mit Ports hinzu.',
      detail: 'Quellport: 49152 | Zielport: 80 (HTTP)',
      headers: ['TCP-Header'],
    },
    {
      name: 'Paket',
      layer: 3,
      color: '#3498db',
      description:
        'Die Vermittlungsschicht fuegt einen IP-Header mit Quell- und Ziel-IP hinzu.',
      detail: 'Quell-IP: 192.168.1.10 | Ziel-IP: 93.184.216.34',
      headers: ['IP-Header', 'TCP-Header'],
    },
    {
      name: 'Frame',
      layer: 2,
      color: '#9b59b6',
      description:
        'Die Sicherungsschicht fuegt MAC-Adressen und eine Pruefsumme (FCS) hinzu.',
      detail: 'Quell-MAC: AA:BB:CC:11:22:33 | Ziel-MAC: DD:EE:FF:44:55:66',
      headers: ['Eth-Header', 'IP-Header', 'TCP-Header'],
    },
    {
      name: 'Bits',
      layer: 1,
      color: '#1abc9c',
      description:
        'Die Bituebertragungsschicht wandelt alles in elektrische/optische Signale um.',
      detail: '01101001 01001000 01010100 01010100 01010000 ...',
      headers: ['Signal', 'Eth', 'IP', 'TCP'],
    },
  ];

  const TCP_UDP_COMPARISON = {
    rows: [
      {
        category: 'Verbindung',
        tcp: 'Verbindungsorientiert',
        udp: 'Verbindungslos',
      },
      {
        category: 'Zuverlaessigkeit',
        tcp: 'Zuverlaessig (Bestaetigungen)',
        udp: 'Unzuverlaessig (Best Effort)',
      },
      {
        category: 'Reihenfolge',
        tcp: 'Garantierte Reihenfolge',
        udp: 'Keine Garantie',
      },
      {
        category: 'Geschwindigkeit',
        tcp: 'Langsamer (Overhead)',
        udp: 'Schneller (wenig Overhead)',
      },
      { category: 'Flusskontrolle', tcp: 'Ja (Sliding Window)', udp: 'Nein' },
      { category: 'Header-Groesse', tcp: '20-60 Bytes', udp: '8 Bytes' },
      {
        category: 'Einsatz',
        tcp: 'Web, E-Mail, Dateitransfer',
        udp: 'Streaming, DNS, VoIP, Gaming',
      },
      { category: 'Handshake', tcp: '3-Wege-Handshake', udp: 'Keiner' },
    ],
    handshakeSteps: [
      {
        label: 'SYN',
        direction: 'right',
        description: 'Client sendet Synchronisationsanfrage',
      },
      {
        label: 'SYN-ACK',
        direction: 'left',
        description: 'Server bestaetigt und synchronisiert',
      },
      {
        label: 'ACK',
        direction: 'right',
        description: 'Client bestaetigt — Verbindung steht',
      },
    ],
  };

  const TCP_UDP_SCENARIOS = [
    {
      text: 'Webseite laden (HTTP)',
      answer: 'TCP',
      explanation:
        'Webseiten muessen vollstaendig und korrekt uebertragen werden.',
    },
    {
      text: 'Live-Video-Streaming',
      answer: 'UDP',
      explanation:
        'Geschwindigkeit wichtiger als Vollstaendigkeit — einzelne verlorene Frames sind akzeptabel.',
    },
    {
      text: 'E-Mail senden (SMTP)',
      answer: 'TCP',
      explanation: 'E-Mails muessen zuverlaessig und vollstaendig ankommen.',
    },
    {
      text: 'DNS-Abfrage',
      answer: 'UDP',
      explanation: 'Kurze Anfrage/Antwort — Geschwindigkeit ist entscheidend.',
    },
    {
      text: 'Online-Gaming (Echtzeit)',
      answer: 'UDP',
      explanation: 'Niedrige Latenz ist wichtiger als jedes einzelne Paket.',
    },
    {
      text: 'Datei herunterladen (FTP)',
      answer: 'TCP',
      explanation:
        'Dateien muessen fehlerfrei und vollstaendig uebertragen werden.',
    },
    {
      text: 'VoIP-Telefonat',
      answer: 'UDP',
      explanation:
        'Echtzeit-Audio vertraegt keine Verzoegerungen durch Neuuebertragungen.',
    },
    {
      text: 'Online-Banking',
      answer: 'TCP',
      explanation:
        'Transaktionen muessen zuverlaessig und in der richtigen Reihenfolge sein.',
    },
    {
      text: 'IoT-Sensordaten senden',
      answer: 'UDP',
      explanation: 'Viele kleine Pakete, einzelne Verluste sind tolerierbar.',
    },
    {
      text: 'Software-Update herunterladen',
      answer: 'TCP',
      explanation: 'Die Datei muss komplett und fehlerfrei sein.',
    },
  ];

  const QUIZ_POOL = [
    {
      type: 'choice',
      question: 'Welches Geraet arbeitet auf Schicht 2 des OSI-Modells?',
      options: ['Hub', 'Switch', 'Router', 'Repeater'],
      answer: 1,
      explanation: 'Switches nutzen MAC-Adressen zur Weiterleitung.',
    },
    {
      type: 'choice',
      question: 'Welche PDU verwendet die Transportschicht?',
      options: ['Frame', 'Paket', 'Segment', 'Bits'],
      answer: 2,
      explanation: 'Auf Schicht 4 werden Daten in Segmente zerteilt.',
    },
    {
      type: 'choice',
      question: 'Welches Protokoll gehoert zur Vermittlungsschicht?',
      options: ['TCP', 'HTTP', 'IP', 'Ethernet'],
      answer: 2,
      explanation:
        'IP ist fuer die logische Adressierung und das Routing zustaendig.',
    },
    {
      type: 'choice',
      question: 'Was ist der Hauptunterschied zwischen TCP und UDP?',
      options: [
        'TCP ist schneller',
        'UDP ist verbindungsorientiert',
        'TCP garantiert Zuverlaessigkeit',
        'UDP hat groessere Header',
      ],
      answer: 2,
      explanation:
        'TCP nutzt Handshakes und ACKs, um Daten sicher zu uebertragen.',
    },
    {
      type: 'choice',
      question: 'Welche Schicht ist fuer das Routing zustaendig?',
      options: ['Schicht 2', 'Schicht 3', 'Schicht 4', 'Schicht 5'],
      answer: 1,
      explanation: 'Routing findet auf Schicht 3 (Vermittlungsschicht) statt.',
    },
    {
      type: 'choice',
      question: 'Was passiert beim 3-Wege-Handshake?',
      options: [
        'SYN, ACK, FIN',
        'SYN, SYN-ACK, ACK',
        'ACK, SYN, FIN',
        'SYN, FIN, ACK',
      ],
      answer: 1,
      explanation:
        'Der Handshake baut eine synchrone Verbindung auf: SYN -> SYN-ACK -> ACK.',
    },
    {
      type: 'choice',
      question: 'Welche Adressierung verwendet Schicht 2?',
      options: ['IP-Adressen', 'MAC-Adressen', 'Portnummern', 'Hostnamen'],
      answer: 1,
      explanation: 'MAC-Adressen sind physische Adressen der Schicht 2.',
    },
    {
      type: 'choice',
      question: 'Welche Schicht kuemmert sich um Verschluesselung?',
      options: ['Schicht 7', 'Schicht 6', 'Schicht 4', 'Schicht 3'],
      answer: 1,
      explanation:
        'Schicht 6 (Darstellungsschicht) uebernimmt Formatierung und Verschluesselung.',
    },
    {
      type: 'choice',
      question: 'Wie heisst die Schicht 4 des OSI-Modells auf Deutsch?',
      options: [
        'Transportschicht',
        'Vermittlungsschicht',
        'Sicherungsschicht',
        'Bituebertragungsschicht',
      ],
      answer: 0,
      explanation: 'Schicht 4 ist die Transportschicht (Transport Layer).',
    },
    {
      type: 'choice',
      question: 'Welches Protokoll loest Domainnamen in IP-Adressen auf?',
      options: ['DNS', 'DHCP', 'ARP', 'HTTP'],
      answer: 0,
      explanation:
        'DNS (Domain Name System) ist wie ein Telefonbuch fuer das Internet.',
    },
    {
      type: 'choice',
      question: 'Wie heisst die Pruefsumme am Ende eines Ethernet-Frames?',
      options: [
        'FCS (Frame Check Sequence)',
        'CRC (Cyclic Redundancy Check)',
        'TTL (Time To Live)',
        'Checksum',
      ],
      answer: 0,
      explanation: 'Die Frame Check Sequence (FCS) dient der Fehlererkennung.',
    },
    {
      type: 'choice',
      question: 'Welches Geraet sendet eingehende Signale an alle Ports?',
      options: ['Hub', 'Switch', 'Router', 'Bridge'],
      answer: 0,
      explanation: 'Ein Hub "brüllt" dumm an alle (Broadcast).',
    },
    {
      type: 'layer',
      question: 'Auf welcher Schicht arbeitet ein Router?',
      answer: 3,
      explanation: 'Router arbeiten mit IP-Adressen auf Schicht 3.',
    },
    {
      type: 'layer',
      question: 'Auf welcher Schicht arbeitet ein Switch?',
      answer: 2,
      explanation: 'Switches arbeiten mit MAC-Adressen auf Schicht 2.',
    },
    {
      type: 'layer',
      question: 'Auf welcher Schicht arbeitet das Protokoll TCP?',
      answer: 4,
      explanation: 'TCP ist ein Protokoll der Transportschicht (Layer 4).',
    },
    {
      type: 'layer',
      question: 'Auf welcher Schicht arbeitet HTTP?',
      answer: 7,
      explanation: 'HTTP ist ein Anwendungsprotokoll der Schicht 7.',
    },
    {
      type: 'layer',
      question: 'Auf welcher Schicht werden MAC-Adressen verwendet?',
      answer: 2,
      explanation:
        'MAC-Adressen dienen der physischen Adressierung auf Schicht 2.',
    },
    {
      type: 'layer',
      question: 'Auf welcher Schicht findet die Bituebertragung statt?',
      answer: 1,
      explanation: 'Schicht 1 uebertraegt rohe Bits ueber das Medium.',
    },
    {
      type: 'choice',
      question: 'Was macht ARP?',
      options: [
        'Routet Pakete',
        'Loest IP in MAC auf',
        'Vergibt IP-Adressen',
        'Verschluesselt Daten',
      ],
      answer: 1,
      explanation:
        'ARP (Address Resolution Protocol) findet die MAC zu einer IP.',
    },
    {
      type: 'choice',
      question:
        'Welche Schicht fuegt beim Senden als letzte einen Header hinzu?',
      options: ['Schicht 7', 'Schicht 4', 'Schicht 2', 'Schicht 1'],
      answer: 2,
      explanation:
        'Schicht 2 verpackt das IP-Paket in einen Frame mit Header und Trailer.',
    },
  ];

  const MNEMONIC =
    '<strong>A</strong>nton <strong>D</strong>arf <strong>S</strong>itzen <strong>T</strong>rinkt <strong>V</strong>ermutlich <strong>S</strong>icheres <strong>B</strong>ier';

  // ---- Progress / Gamification ----

  function loadProgress() {
    try {
      const stored = localStorage.getItem('ap1_osi_progress');
      if (stored) return JSON.parse(stored);
    } catch (_) {
      /* ignore */
    }
    return {
      points: 0,
      bestStreak: 0,
      sectionsCompleted: [],
      quizHighScore: 0,
    };
  }

  function saveProgress() {
    try {
      localStorage.setItem('ap1_osi_progress', JSON.stringify(progress));
    } catch (_) {
      /* ignore */
    }
  }

  function completeSection(section) {
    if (!progress.sectionsCompleted.includes(section)) {
      progress.sectionsCompleted.push(section);
      saveProgress();
    }
  }

  function addPoints(pts) {
    progress.points += pts;
    saveProgress();
  }

  function showCelebration() {
    const el = document.createElement('div');
    el.className = 'osi-celebration';
    el.textContent = '\u{1F389}';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  // ---- Utility ----

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Main Render ----

  function render(container) {
    cleanup();
    progress = loadProgress();
    renderView(container);
  }

  function renderView(container) {
    const tabs = [
      { id: 'overview', label: 'Schichten' },
      { id: 'protocols', label: 'Protokolle' },
      { id: 'hardware', label: 'Hardware' },
      { id: 'encapsulation', label: 'Kapselung' },
      { id: 'tcpudp', label: 'TCP/UDP' },
      { id: 'quiz', label: 'Quiz' },
    ];

    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">OSI-Modell</h1>
              <p class="page-subtitle">7 Schichten, Protokolle, Hardware, Kapselung</p>
            </div>
          </div>
        </div>



        <div class="module-tabs">
          ${tabs
            .map(
              (t) => `
            <button class="module-tab ${currentTab === t.id ? 'active' : ''}" data-tab="${t.id}">
              ${t.label}
            </button>
          `
            )
            .join('')}
        </div>

        <div id="osiTabContent"></div>
      </div>
    `;

    container.querySelectorAll('.module-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        renderView(container);
      });
    });

    const content = container.querySelector('#osiTabContent');
    switch (currentTab) {
      case 'overview':
        renderOverviewTab(content);
        break;
      case 'protocols':
        renderDndTab(content, 'protocols');
        break;
      case 'hardware':
        renderDndTab(content, 'hardware');
        break;
      case 'encapsulation':
        renderEncapsulationTab(content);
        break;
      case 'tcpudp':
        renderTcpUdpTab(content);
        break;
      case 'quiz':
        renderQuizTab(content);
        break;
    }
  }

  // ---- Tab 1: Schichten-Uebersicht ----

  function renderOverviewTab(container) {
    const openLayers = new Set();

    function renderTower() {
      container.innerHTML = `
        <div class="osi-mnemonic">
          Merksatz (Schicht 7 → 1): ${MNEMONIC}
        </div>
        <div class="osi-tower">
          ${OSI_LAYERS.map(
            (layer) => `
            <div class="osi-layer ${openLayers.has(layer.number) ? 'open' : ''}" data-layer="${layer.number}">
              <div class="osi-layer-header">
                <div class="osi-layer-num" style="background: ${layer.color}">${layer.number}</div>
                <div class="osi-layer-names">
                  <span class="osi-layer-name-de">${layer.name}</span>
                  <span class="osi-layer-name-en">${layer.nameEn}</span>
                </div>
                <span class="osi-layer-pdu">${layer.pdu}</span>
                <span class="osi-layer-chevron">\u25BC</span>
              </div>
              <div class="osi-layer-detail">
                <p class="osi-layer-desc">${layer.description}</p>
                <ul class="osi-layer-details-list">
                  ${layer.details.map((d) => `<li>${d}</li>`).join('')}
                </ul>
                ${
                  layer.protocols.length
                    ? `
                  <div class="osi-section-subtitle">Protokolle:</div>
                  <div class="osi-layer-protocols">
                    ${layer.protocols.map((p) => `<span class="osi-layer-protocol-tag">${p}</span>`).join('')}
                  </div>
                `
                    : ''
                }
                ${
                  layer.devices?.length
                    ? `
                  <div class="osi-section-subtitle">Geraete/Beispiele:</div>
                  <div class="osi-layer-protocols">
                    ${layer.devices.map((d) => `<span class="osi-layer-protocol-tag">${d}</span>`).join('')}
                  </div>
                `
                    : ''
                }
                <div class="osi-layer-exam-tip">
                  <strong>Pruefungstipp:</strong> ${layer.examTip}
                </div>
              </div>
            </div>
          `
          ).join('')}
        </div>
      `;

      container.querySelectorAll('.osi-layer-header').forEach((header) => {
        header.addEventListener('click', () => {
          const layerNum = parseInt(
            header.closest('.osi-layer').dataset.layer,
            10
          );
          if (openLayers.has(layerNum)) {
            openLayers.delete(layerNum);
          } else {
            openLayers.add(layerNum);
          }
          renderTower();

          if (openLayers.size >= 4) {
            completeSection('overview');
          }
        });
      });
    }

    renderTower();
  }

  // ---- Tab 2+3: Drag & Drop (Protocols / Hardware) ----

  function renderDndTab(container, mode) {
    const items = mode === 'protocols' ? PROTOCOLS : HARDWARE;
    const title =
      mode === 'protocols' ? 'Protokoll-Zuordnung' : 'Hardware-Zuordnung';
    const sectionKey = mode;

    const layerNums = mode === 'protocols' ? [7, 6, 4, 3, 2, 1] : [7, 3, 2, 1];

    const shuffled = shuffle(items);
    const state = {
      placed: {}, // chipId -> zoneLayer
      zoneContents: {}, // layer -> [chipId]
      checked: false,
      results: {}, // chipId -> 'correct' | 'wrong'
      selectedChipId: null,
    };

    layerNums.forEach((l) => {
      state.zoneContents[l] = [];
    });

    function getLayerInfo(num) {
      return OSI_LAYERS.find((l) => l.number === num);
    }

    function renderDnd() {
      const availableChips = shuffled.filter((_, i) => !state.placed[i]);

      container.innerHTML = `
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">${title}</span>
          </div>
          <p class="module-exercise-question">
            Ziehe jedes ${mode === 'protocols' ? 'Protokoll' : 'Geraet'} in die richtige OSI-Schicht.
          </p>

          <div class="osi-dnd-layout">
            <div class="osi-dnd-source">
              <div class="osi-dnd-source-title">Verfuegbare ${mode === 'protocols' ? 'Protokolle' : 'Geraete'}</div>
              <div class="osi-dnd-chips" id="dndSourceChips">
                ${availableChips
                  .map((item) => {
                    const idx = shuffled.indexOf(item);
                    return `<div class="osi-chip" draggable="true" data-chip-id="${idx}" title="${escapeHtml(item.description)}">${escapeHtml(item.name)}</div>`;
                  })
                  .join('')}
              </div>
            </div>

            <div class="osi-dnd-zones">
              <div class="osi-dnd-zones-title">OSI-Schichten</div>
              ${layerNums
                .map((num) => {
                  const info = getLayerInfo(num);
                  const chips = state.zoneContents[num] || [];
                  return `
                  <div class="osi-drop-zone" data-layer="${num}" style="border-left: 4px solid ${info.color}">
                    <span class="osi-drop-zone-label" style="color: ${info.color}">Schicht ${num}</span>
                    ${chips
                      .map((chipId) => {
                        const item = shuffled[chipId];
                        const cls = state.checked
                          ? state.results[chipId] || ''
                          : 'placed';
                        return `<div class="osi-chip ${cls}" data-chip-id="${chipId}" data-in-zone="true" title="${escapeHtml(item.description)}">${escapeHtml(item.name)}</div>`;
                      })
                      .join('')}
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="dndCheckBtn" ${state.checked ? 'disabled' : ''}>Pruefen</button>
            <button class="btn btn-ghost" id="dndResetBtn">Zuruecksetzen</button>
            <button class="btn btn-ghost" id="dndShowBtn">Loesung zeigen</button>
          </div>

          <div id="dndFeedback">
            ${
              state.checked
                ? (
                    () => {
                      let correct = 0;
                      shuffled.forEach((item, idx) => {
                        if (
                          state.placed[idx] !== undefined &&
                          state.placed[idx] === item.layer
                        ) {
                          correct++;
                        }
                      });
                      const placed_count = Object.keys(state.placed).length;
                      const total = shuffled.length;

                      if (correct === total) {
                        return `<div class="module-feedback module-feedback-success">Perfekt! Alle ${total} richtig zugeordnet!</div>`;
                      } else {
                        return `<div class="module-feedback module-feedback-error">${correct} von ${placed_count} platzierten richtig. ${total - placed_count > 0 ? `${total - placed_count} noch nicht zugeordnet.` : ''}</div>`;
                      }
                    }
                  )()
                : ''
            }
          </div>
        </div>
      `;

      setupDndEvents(
        container,
        shuffled,
        state,
        layerNums,
        renderDnd,
        mode,
        sectionKey
      );
    }

    renderDnd();
  }

  function setupDndEvents(
    container,
    shuffled,
    state,
    layerNums,
    rerenderFn,
    _mode,
    sectionKey
  ) {
    // HTML5 Drag and Drop
    const chips = container.querySelectorAll('.osi-chip[draggable="true"]');
    const zones = container.querySelectorAll('.osi-drop-zone');

    let draggedChipId = null;

    chips.forEach((chip) => {
      chip.addEventListener('dragstart', (e) => {
        draggedChipId = chip.dataset.chipId;
        chip.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedChipId);
      });
      chip.addEventListener('dragend', () => {
        chip.classList.remove('dragging');
        draggedChipId = null;
      });
    });

    // Chips in zones (clickable to remove)
    container
      .querySelectorAll('.osi-chip[data-in-zone="true"]')
      .forEach((chip) => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const chipId = parseInt(chip.dataset.chipId, 10);
          const layer = parseInt(
            chip.closest('.osi-drop-zone').dataset.layer,
            10
          );
          state.zoneContents[layer] = state.zoneContents[layer].filter(
            (id) => id !== chipId
          );
          delete state.placed[chipId];
          state.selectedChipId = null; // Deselect if removed

          // Reset checked state on modification
          if (state.checked) {
            state.checked = false;
            state.results = {};
          }

          rerenderFn();
        });
      });

    zones.forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const chipId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (Number.isNaN(chipId) || state.placed[chipId] !== undefined) return;
        const layer = parseInt(zone.dataset.layer, 10);
        state.placed[chipId] = layer;
        state.zoneContents[layer].push(chipId);

        // Reset checked state on modification
        if (state.checked) {
          state.checked = false;
          state.results = {};
        }

        rerenderFn();
      });
    });

    // Touch support
    setupTouchDnd(container, shuffled, state, rerenderFn);

    // Buttons
    container.querySelector('#dndCheckBtn')?.addEventListener('click', () => {
      state.checked = true;
      let correct = 0;
      shuffled.forEach((item, idx) => {
        if (state.placed[idx] !== undefined) {
          if (state.placed[idx] === item.layer) {
            state.results[idx] = 'correct';
            correct++;
          } else {
            state.results[idx] = 'wrong';
          }
        }
      });

      const total = shuffled.length;

      if (correct === total) {
        completeSection(sectionKey);
        showCelebration();
      }

      rerenderFn();
    });

    container.querySelector('#dndResetBtn')?.addEventListener('click', () => {
      Object.keys(state.placed).forEach((k) => {
        delete state.placed[k];
      });
      Object.keys(state.results).forEach((k) => {
        delete state.results[k];
      });
      layerNums.forEach((l) => {
        state.zoneContents[l] = [];
      });
      state.checked = false;
      rerenderFn();
    });

    container.querySelector('#dndShowBtn')?.addEventListener('click', () => {
      Object.keys(state.placed).forEach((k) => {
        delete state.placed[k];
      });
      Object.keys(state.results).forEach((k) => {
        delete state.results[k];
      });
      layerNums.forEach((l) => {
        state.zoneContents[l] = [];
      });

      shuffled.forEach((item, idx) => {
        if (layerNums.includes(item.layer)) {
          state.placed[idx] = item.layer;
          state.zoneContents[item.layer].push(idx);
          state.results[idx] = 'correct';
        }
      });
      state.checked = true;
      rerenderFn();
    });
  }

  function setupTouchDnd(container, _shuffled, state, rerenderFn) {
    const chips = container.querySelectorAll('.osi-chip[draggable="true"]');
    let ghost = null;
    let dragChipId = null;

    function onTouchStart(e) {
      e.preventDefault();
      const chip = e.currentTarget;
      dragChipId = parseInt(chip.dataset.chipId, 10);
      state.selectedChipId = dragChipId;
      ghost = chip.cloneNode(true);
      ghost.className = 'osi-chip osi-touch-ghost';
      document.body.appendChild(ghost);
      positionGhost(e.touches[0]);
      chip.classList.add('dragging');
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (!ghost) return;
      positionGhost(e.touches[0]);

      // Highlight zone under touch
      container.querySelectorAll('.osi-drop-zone').forEach((z) => {
        z.classList.remove('drag-over');
      });
      const el = document.elementFromPoint(
        e.touches[0].clientX,
        e.touches[0].clientY
      );
      const zone = el?.closest?.('.osi-drop-zone');
      if (zone) zone.classList.add('drag-over');
    }

    function onTouchEnd(e) {
      if (!ghost) return;
      ghost.remove();
      ghost = null;

      container.querySelectorAll('.osi-drop-zone').forEach((z) => {
        z.classList.remove('drag-over');
      });
      container.querySelectorAll('.osi-chip.dragging').forEach((c) => {
        c.classList.remove('dragging');
      });

      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const zone = el?.closest?.('.osi-drop-zone');
      if (
        zone &&
        dragChipId !== null &&
        state.placed[dragChipId] === undefined
      ) {
        const layer = parseInt(zone.dataset.layer, 10);
        state.placed[dragChipId] = layer;
        state.zoneContents[layer].push(dragChipId);

        // Reset checked state on modification
        if (state.checked) {
          state.checked = false;
          state.results = {};
        }

        rerenderFn();
      }
      dragChipId = null;
      state.selectedChipId = null;
    }

    function positionGhost(touch) {
      if (!ghost) return;
      ghost.style.left = `${touch.clientX - 40}px`;
      ghost.style.top = `${touch.clientY - 20}px`;
    }

    chips.forEach((chip) => {
      chip.addEventListener('touchstart', onTouchStart, { passive: false });
      chip.addEventListener('touchmove', onTouchMove, { passive: false });
      chip.addEventListener('touchend', onTouchEnd);
    });

    // Click on chip in source to select it for touch placement
    container.querySelectorAll('.osi-dnd-source .osi-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        // Allow selection even if checked (will reset on placement)
        const chipId = parseInt(chip.dataset.chipId, 10);
        if (state.placed[chipId] === undefined) {
          state.selectedChipId = chipId;
          container.querySelectorAll('.osi-chip').forEach((c) => {
            c.classList.remove('selected');
          });
          chip.classList.add('selected');
        }
      });
    });

    // Click on zone to place selected chip
    container.querySelectorAll('.osi-drop-zone').forEach((zone) => {
      zone.addEventListener('click', () => {
        if (state.selectedChipId !== null) {
          const layer = parseInt(zone.dataset.layer, 10);
          state.placed[state.selectedChipId] = layer;
          state.zoneContents[layer].push(state.selectedChipId);
          state.selectedChipId = null;

          // Reset checked state on modification
          if (state.checked) {
            state.checked = false;
            state.results = {};
          }

          rerenderFn();
        }
      });
    });
  }

  // ---- Tab 4: Kapselung ----

  function renderEncapsulationTab(container) {
    let step = 0;
    let autoplayTimer = null;

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function addCleanup(fn) {
      cleanup_fns.push(fn);
    }

    addCleanup(stopAutoplay);

    function renderStep() {
      const current = ENCAPSULATION_STEPS[step];
      const colors = ['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'];

      // Build nested boxes
      let boxesHtml = `<div class="osi-encap-data">Daten</div>`;
      for (
        let i = Math.min(step, ENCAPSULATION_STEPS.length - 1);
        i >= 1;
        i--
      ) {
        const s = ENCAPSULATION_STEPS[i];
        boxesHtml = `
          <div class="osi-encap-box" style="border-color: ${colors[i]}">
            <div class="osi-encap-header-label" style="background: ${colors[i]}">${s.headers[0] || s.name}</div>
            ${boxesHtml}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">Datenkapselung</span>
          </div>
          <p class="module-exercise-question">
            Wie werden Daten Schicht fuer Schicht verpackt?
          </p>

          <div class="osi-encap-steps">
            ${ENCAPSULATION_STEPS.map(
              (s, i) => `
              <span class="osi-encap-step-indicator ${i === step ? 'active' : i < step ? 'completed' : ''}">${s.name}</span>
              ${i < ENCAPSULATION_STEPS.length - 1 ? '<span class="osi-encap-arrow">\u2192</span>' : ''}
            `
            ).join('')}
          </div>

          <div class="osi-encap-visual">
            ${boxesHtml}
          </div>

          <div class="osi-encap-explanation">
            <strong>Schicht ${current.layer} — ${current.name}:</strong> ${current.description}<br>
            <code>${escapeHtml(current.detail)}</code>
          </div>

          <div class="osi-encap-controls">
            <button class="btn btn-ghost btn-sm" id="encapPrev" ${step === 0 ? 'disabled' : ''}>&larr; Zurueck</button>
            <button class="btn btn-ghost btn-sm" id="encapAuto">${autoplayTimer ? 'Stopp' : 'Automatisch'}</button>
            <button class="btn btn-primary btn-sm" id="encapNext" ${step === ENCAPSULATION_STEPS.length - 1 ? 'disabled' : ''}>Weiter &rarr;</button>
          </div>
        </div>
      `;

      container.querySelector('#encapPrev')?.addEventListener('click', () => {
        if (step > 0) {
          step--;
          stopAutoplay();
          renderStep();
        }
      });

      container.querySelector('#encapNext')?.addEventListener('click', () => {
        if (step < ENCAPSULATION_STEPS.length - 1) {
          step++;
          stopAutoplay();
          renderStep();
        }
        if (step === ENCAPSULATION_STEPS.length - 1)
          completeSection('encapsulation');
      });

      container.querySelector('#encapAuto')?.addEventListener('click', () => {
        if (autoplayTimer) {
          stopAutoplay();
          renderStep();
        } else {
          autoplayTimer = setInterval(() => {
            if (step < ENCAPSULATION_STEPS.length - 1) {
              step++;
              renderStep();
            } else {
              stopAutoplay();
              completeSection('encapsulation');
              renderStep();
            }
          }, 2000);
          renderStep();
        }
      });
    }

    renderStep();
  }

  // ---- Tab 5: TCP vs UDP ----

  function renderTcpUdpTab(container) {
    let handshakeStep = -1;
    let handshakeTimer = null;
    let quizIndex = 0;
    let quizCorrect = 0;
    const scenarios = shuffle(TCP_UDP_SCENARIOS);

    function addCleanup(fn) {
      cleanup_fns.push(fn);
    }

    addCleanup(() => {
      if (handshakeTimer) clearInterval(handshakeTimer);
    });

    function renderAll() {
      container.innerHTML = `
        <div class="module-exercise-card">
          <!-- Comparison Table -->
          <h3 class="osi-section-title">TCP vs UDP Vergleich</h3>
          <table class="osi-comparison-table">
            <thead>
              <tr>
                <th>Kategorie</th>
                <th>TCP</th>
                <th>UDP</th>
              </tr>
            </thead>
            <tbody>
              ${TCP_UDP_COMPARISON.rows
                .map(
                  (r) => `
                <tr>
                  <td>${r.category}</td>
                  <td>${r.tcp}</td>
                  <td>${r.udp}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <!-- Handshake Animation -->
          <div class="osi-handshake">
            <h3 class="osi-handshake-title">TCP 3-Wege-Handshake</h3>
            <div class="osi-handshake-visual">
              <div class="osi-handshake-parties">
                <span class="osi-handshake-party">Client</span>
                <span class="osi-handshake-party">Server</span>
              </div>
              ${TCP_UDP_COMPARISON.handshakeSteps
                .map(
                  (s, i) => `
                <div class="osi-handshake-step ${i <= handshakeStep ? (i < handshakeStep ? 'completed' : 'active') : ''}">
                  <span class="osi-handshake-label">${s.label}</span>
                  <div class="osi-handshake-arrow ${s.direction === 'left' ? 'reverse' : ''}"></div>
                </div>
              `
                )
                .join('')}
              <div class="osi-handshake-controls">
                <button class="btn btn-ghost btn-sm" id="hsPlayBtn">${handshakeTimer ? 'Stopp' : 'Abspielen'}</button>
                <button class="btn btn-ghost btn-sm" id="hsResetBtn">Reset</button>
              </div>
            </div>
          </div>

          <!-- Quick Quiz -->
          <div class="osi-tcpudp-quiz">
            <h3 class="osi-tcpudp-quiz-title">Schnell-Quiz: TCP oder UDP?</h3>
            <div class="osi-tcpudp-progress">${quizIndex < scenarios.length ? `Frage ${quizIndex + 1} von ${scenarios.length}` : `Ergebnis: ${quizCorrect}/${scenarios.length}`}</div>
            <div id="tcpudpQuizContent"></div>
          </div>
        </div>
      `;

      // Handshake controls
      container.querySelector('#hsPlayBtn')?.addEventListener('click', () => {
        if (handshakeTimer) {
          clearInterval(handshakeTimer);
          handshakeTimer = null;
          renderAll();
        } else {
          handshakeStep = -1;
          handshakeTimer = setInterval(() => {
            handshakeStep++;
            if (handshakeStep >= TCP_UDP_COMPARISON.handshakeSteps.length) {
              clearInterval(handshakeTimer);
              handshakeTimer = null;
            }
            renderAll();
          }, 1000);
          renderAll();
        }
      });

      container.querySelector('#hsResetBtn')?.addEventListener('click', () => {
        if (handshakeTimer) clearInterval(handshakeTimer);
        handshakeTimer = null;
        handshakeStep = -1;
        renderAll();
      });

      // Quick quiz
      const quizContent = container.querySelector('#tcpudpQuizContent');
      if (quizIndex < scenarios.length) {
        renderTcpUdpQuizQuestion(
          quizContent,
          scenarios,
          quizIndex,
          quizCorrect,
          (newIdx, newCorrect) => {
            quizIndex = newIdx;
            quizCorrect = newCorrect;
            if (quizIndex >= scenarios.length) {
              completeSection('tcpudp');
              addPoints(quizCorrect * 10);
            }
            renderAll();
          }
        );
      } else {
        quizContent.innerHTML = `
          <div class="module-feedback module-feedback-success">
            Fertig! ${quizCorrect} von ${scenarios.length} richtig.
            <br><button class="btn btn-ghost btn-sm" id="tcpudpRetry" style="margin-top: var(--space-2)">Nochmal</button>
          </div>
        `;
        quizContent
          .querySelector('#tcpudpRetry')
          ?.addEventListener('click', () => {
            quizIndex = 0;
            quizCorrect = 0;
            renderAll();
          });
      }
    }

    renderAll();
  }

  function renderTcpUdpQuizQuestion(
    container,
    scenarios,
    index,
    correct,
    onNext
  ) {
    const scenario = scenarios[index];
    container.innerHTML = `
      <div class="osi-tcpudp-scenario">
        <div class="osi-tcpudp-scenario-text">${escapeHtml(scenario.text)}</div>
        <div class="osi-tcpudp-btns">
          <button class="osi-tcpudp-btn" data-answer="TCP">TCP</button>
          <button class="osi-tcpudp-btn" data-answer="UDP">UDP</button>
        </div>
        <div class="osi-tcpudp-feedback" id="tcpudpFb"></div>
        <button class="btn btn-primary" id="tcpudpNextBtn" style="display: none; margin-top: 1rem;">Weiter</button>
      </div>
    `;

    container.querySelectorAll('.osi-tcpudp-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const answer = btn.dataset.answer;
        const isCorrect = answer === scenario.answer;
        const newCorrect = isCorrect ? correct + 1 : correct;

        container.querySelectorAll('.osi-tcpudp-btn').forEach((b) => {
          b.disabled = true;
          if (b.dataset.answer === scenario.answer) b.classList.add('correct');
          if (b.dataset.answer === answer && !isCorrect)
            b.classList.add('wrong');
        });

        const fb = container.querySelector('#tcpudpFb');
        fb.textContent = `${isCorrect ? 'Richtig!' : 'Falsch!'} ${scenario.explanation}`;

        // Show Next button instead of auto-advance
        const nextBtn = container.querySelector('#tcpudpNextBtn');
        if (nextBtn) {
          nextBtn.style.display = 'block';
          // Remove old listeners to avoid stacking if re-rendered?
          // Actually, we re-render the whole question each time, so it's fine.
          nextBtn.addEventListener(
            'click',
            () => {
              onNext(index + 1, newCorrect);
            },
            { once: true }
          );
        }
      });
    });
  }

  // ---- Tab 6: Quiz ----

  function renderQuizTab(container) {
    const questions = shuffle(QUIZ_POOL).slice(0, 10);
    let qIndex = 0;
    let correctCount = 0;
    let answered = false;

    function renderQuestion() {
      if (qIndex >= questions.length) {
        renderQuizSummary(container, correctCount, questions.length);
        return;
      }

      const q = questions[qIndex];
      answered = false;

      container.innerHTML = `
        <div class="module-exercise-card">
          <div class="osi-quiz-progress">
            <div class="osi-quiz-progress-bar">
              <div class="osi-quiz-progress-fill" style="width: ${(qIndex / questions.length) * 100}%"></div>
            </div>
            <span class="osi-quiz-progress-text">${qIndex + 1}/${questions.length}</span>

          </div>

          <div class="osi-quiz-question">${escapeHtml(q.question)}</div>

          <div id="quizAnswerArea"></div>
          <div id="quizFeedback"></div>
          <button class="btn btn-primary" id="quizNextBtn" style="display: none; margin-top: 1rem;">Weiter</button>
        </div>
      `;

      const area = container.querySelector('#quizAnswerArea');
      const nextBtn = container.querySelector('#quizNextBtn');

      if (nextBtn) {
        nextBtn.addEventListener(
          'click',
          () => {
            qIndex++;
            renderQuestion();
          },
          { once: true }
        );
      }

      switch (q.type) {
        case 'choice':
          renderChoiceQuestion(area, q);
          break;

        case 'layer':
          renderLayerQuestion(area, q);
          break;
      }
    }

    function handleAnswer(isCorrect) {
      if (answered) return;
      answered = true;

      if (isCorrect) {
        correctCount++;
      }

      const fb = container.querySelector('#quizFeedback');
      if (fb) {
        let feedbackText = isCorrect ? 'Richtig!' : 'Falsch!';
        if (!isCorrect) {
          if (questions[qIndex].type === 'choice') {
            feedbackText += ` Die richtige Antwort ist: ${questions[qIndex].options[questions[qIndex].answer]}`;
          } else if (questions[qIndex].type === 'layer') {
            feedbackText += ` Die richtige Antwort ist: Schicht ${questions[qIndex].answer}`;
          }
        }

        if (questions[qIndex].explanation) {
          feedbackText += `<br><br><strong>Erklaerung:</strong> ${questions[qIndex].explanation}`;
        }

        fb.innerHTML = `<div class="module-feedback ${isCorrect ? 'module-feedback-success' : 'module-feedback-error'}">
          ${escapeHtml(feedbackText)
            .replace(/&lt;br&gt;/g, '<br>')
            .replace(/&lt;strong&gt;/g, '<strong>')
            .replace(/&lt;\/strong&gt;/g, '</strong>')}
        </div>`;
      }

      const nextBtn = container.querySelector('#quizNextBtn');
      if (nextBtn) nextBtn.style.display = 'block';
    }

    function renderChoiceQuestion(area, q) {
      const letters = ['A', 'B', 'C', 'D'];
      area.innerHTML = `
        <div class="osi-quiz-options">
          ${q.options
            .map(
              (opt, i) => `
            <button class="osi-quiz-option" data-index="${i}">
              <span class="osi-quiz-option-letter">${letters[i]}</span>
              ${escapeHtml(opt)}
            </button>
          `
            )
            .join('')}
        </div>
      `;

      area.querySelectorAll('.osi-quiz-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (answered) return;
          const idx = parseInt(btn.dataset.index, 10);
          const isCorrect = idx === q.answer;

          area.querySelectorAll('.osi-quiz-option').forEach((b, i) => {
            b.classList.add('disabled');
            if (i === q.answer) b.classList.add('correct');
            if (i === idx && !isCorrect) b.classList.add('wrong');
          });

          handleAnswer(isCorrect);
        });
      });
    }

    function renderLayerQuestion(area, q) {
      area.innerHTML = `
        <div class="osi-quiz-layers">
          ${OSI_LAYERS.map(
            (l) => `
            <button class="osi-quiz-layer-btn" data-layer="${l.number}" style="border-left: 4px solid ${l.color}">
              <div class="osi-layer-num" style="background: ${l.color}; width: 24px; height: 24px; font-size: 11px">${l.number}</div>
              ${l.name}
            </button>
          `
          ).join('')}
        </div>
      `;

      area.querySelectorAll('.osi-quiz-layer-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (answered) return;
          const layer = parseInt(btn.dataset.layer, 10);
          const isCorrect = layer === q.answer;

          area.querySelectorAll('.osi-quiz-layer-btn').forEach((b) => {
            b.disabled = true;
            if (parseInt(b.dataset.layer, 10) === q.answer)
              b.classList.add('correct');
            if (parseInt(b.dataset.layer, 10) === layer && !isCorrect)
              b.classList.add('wrong');
          });

          handleAnswer(isCorrect);
        });
      });
    }

    function renderQuizSummary(cont, correct, total) {
      const accuracy = Math.round((correct / total) * 100);
      const passed = accuracy >= 50;

      // Mark section as completed if passed, but don't track points
      if (passed) {
        completeSection('quiz');
        saveProgress();
      }

      if (accuracy >= 80) showCelebration();

      cont.innerHTML = `
        <div class="module-content">
          <div class="module-card">
            <div class="osi-intro-icon">${passed ? '🎉' : '📚'}</div>
            <h2>${passed ? 'Gut gemacht!' : 'Übung macht den Meister!'}</h2>
            <p style="text-align: center; font-size: 1.1rem; margin-bottom: 2rem;">
              Du hast <strong style="color: var(--accent-primary)">${correct}</strong> von <strong>${total}</strong> Fragen richtig beantwortet.
            </p>
            
            <div class="osi-quiz-summary-stats" style="justify-content: center;">
              <div class="osi-quiz-summary-stat">
                <span class="osi-quiz-summary-stat-value">${accuracy}%</span>
                <span class="osi-quiz-summary-stat-label">Genauigkeit</span>
              </div>
            </div>

            <button class="btn btn-primary" id="quizRetry" style="margin-top: 2rem; width: 100%;">Nochmal spielen</button>
          </div>
        </div>
      `;

      cont.querySelector('#quizRetry')?.addEventListener('click', () => {
        renderQuizTab(cont);
      });
    }

    renderQuestion();
  }

  // ---- Cleanup ----

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default OSIModelView;
