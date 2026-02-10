// ============================================================
// subnetting.js — IHK Subnetting Trainer (Redesigned)
// ============================================================

const SubnettingView = (() => {
  let currentTab = 'explanation';
  let currentScenarioIdx = 0;
  let currentExercise = null;
  let difficulty = 1;
  let cleanup_fns = [];

  const SCENARIOS = [
    {
      id: 'basic',
      title: 'Standard-Berechnung',
      description:
        'Berechne Netz-ID, Broadcast und Hosts für eine gegebene IP/CIDR.',
    },
    {
      id: 'split',
      title: 'Netzplan-Erweiterung',
      description: 'Teile ein bestehendes Netzwerk in mehrere Subnetze auf.',
    },
    {
      id: 'check',
      title: 'IP-Klassifizierung',
      description:
        'Unterscheide zwischen privaten, öffentlichen und speziellen IP-Adressen.',
    },
    {
      id: 'ipv6',
      title: 'IPv6-Analyse',
      description:
        'Bestimme Länge, Volldarstellung und Interface-ID (EUI-64) einer IPv6-Adresse.',
    },
    {
      id: 'arp',
      title: 'ARP-Analyse',
      description:
        'Verstehe die Zuordnung von IP- zu MAC-Adressen (Address Resolution Protocol) im LAN.',
    },
  ];

  // ============================================================
  // CORE FUNCTIONS & DATA
  // ============================================================

  function ipToInt(ip) {
    return (
      ip
        .split('.')
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    );
  }

  function intToIp(int) {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255,
    ].join('.');
  }

  function cidrToMask(cidr) {
    return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  }

  function maskToIp(mask) {
    return intToIp(mask);
  }

  function getBroadcast(networkInt, maskInt) {
    return (networkInt | (~maskInt >>> 0)) >>> 0;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatIPv6(groups) {
    // Basic compression: remove leading zeros
    const noLeading = groups.map((g) => g.replace(/^0+/, '') || '0');

    // Find longest sequence of "0"
    let bestStart = -1;
    let bestLen = 0;
    let curStart = -1;
    let curLen = 0;

    for (let i = 0; i < 8; i++) {
      if (noLeading[i] === '0') {
        if (curStart === -1) curStart = i;
        curLen++;
      } else {
        if (curLen > bestLen) {
          bestLen = curLen;
          bestStart = curStart;
        }
        curStart = -1;
        curLen = 0;
      }
    }
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
    }

    if (bestLen < 2) return noLeading.join(':');

    // Apply ::
    const pre = noLeading.slice(0, bestStart).join(':');
    const post = noLeading.slice(bestStart + bestLen).join(':');
    return `${pre}::${post}`;
  }

  function normalizeIPv6(str, expectedGroups = 8) {
    if (!str) return '';
    const parts = str.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts.length > 1 && parts[1] ? parts[1].split(':') : [];

    if (parts.length > 1) {
      const missing = expectedGroups - (left.length + right.length);
      const middle = Array(Math.max(0, missing)).fill('0');
      const groups = [...left, ...middle, ...right];
      return groups.map((g) => g.padStart(4, '0')).join(':');
    }
    return left.map((g) => g.padStart(4, '0')).join(':');
  }

  // ============================================================
  // GENERATORS
  // ============================================================

  function generateBasicExercise(diff) {
    let ip;
    let cidr;
    if (diff === 1) {
      ip = `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`;
      cidr = randomInt(24, 30);
    } else if (diff === 2) {
      ip = `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
      cidr = randomInt(16, 24);
    } else {
      ip = `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
      cidr = randomInt(8, 30);
    }

    const ipInt = ipToInt(ip);
    const maskInt = cidrToMask(cidr);
    const netInt = (ipInt & maskInt) >>> 0;
    const bcInt = getBroadcast(netInt, maskInt);

    return {
      type: 'basic',
      ip,
      cidr,
      sol: {
        mask: maskToIp(maskInt),
        net: intToIp(netInt),
        first: intToIp(netInt + 1),
        last: intToIp(bcInt - 1),
        bc: intToIp(bcInt),
        hosts: 2 ** (32 - cidr) - 2,
      },
    };
  }

  function generateSplitExercise(_diff) {
    const baseIp = `192.168.${randomInt(1, 250)}.0`;
    const baseCidr = 24;
    const neededSubnets = [2, 4, 8][randomInt(0, 2)];
    const newCidr = baseCidr + Math.log2(neededSubnets);
    const subnets = [];
    const blockSize = 2 ** (32 - newCidr);
    for (let i = 0; i < neededSubnets; i++) {
      const netInt = ipToInt(baseIp) + i * blockSize;
      subnets.push(intToIp(netInt));
    }
    return {
      type: 'split',
      baseIp,
      baseCidr,
      neededSubnets,
      sol: { newCidr, newMask: maskToIp(cidrToMask(newCidr)), subnets },
    };
  }

  function generateIpCheckExercise() {
    const types = [
      {
        ip: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'private',
        explanation:
          'Privater Bereich (Class C): 192.168.0.0 bis 192.168.255.255. Reserviert nach RFC 1918 für lokale Netzwerke.',
      },
      {
        ip: `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'private',
        explanation:
          'Privater Bereich (Class A): 10.0.0.0 bis 10.255.255.255. Reserviert nach RFC 1918 für große Firmennetze.',
      },
      {
        ip: `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'private',
        explanation:
          'Privater Bereich (Class B): 172.16.0.0 bis 172.31.255.255. Reserviert nach RFC 1918.',
      },
      {
        ip: `${randomInt(1, 9)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'public',
        explanation:
          'Öffentliche IP: Liegt außerhalb der reservierten privaten Bereiche und ist im Internet routbar.',
      },
      {
        ip: `${randomInt(11, 126)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'public',
        explanation:
          'Öffentliche IP: Liegt außerhalb der reservierten privaten Bereiche und ist im Internet routbar.',
      },
      {
        ip: `8.8.8.8`,
        type: 'public',
        explanation:
          'Öffentliche IP (Google DNS): Liegt nicht im privaten oder speziellen Adressraum.',
      },
      {
        ip: `169.254.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'special',
        explanation:
          'APIPA (Automatic Private IP Addressing): 169.254.0.0/16. Wird genutzt, wenn kein DHCP-Server antwortet.',
      },
      {
        ip: `127.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'special',
        explanation:
          'Loopback-Bereich: 127.0.0.0/8. Adressen für Testzwecke, die den eigenen Host (Localhost) ansprechen.',
      },
      {
        ip: `224.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'special',
        explanation:
          'Multicast-Bereich (Class D): 224.0.0.0 bis 239.255.255.255. Für Nachrichten an eine Gruppe von Empfängern.',
      },
    ];
    const picked = types.sort(() => Math.random() - 0.5).slice(0, 5);
    return { type: 'check', items: picked };
  }

  function generateIPv6Exercise() {
    // 80% Chance für EUI-64 (sehr prüfungsrelevant)

    const isEUI64 = Math.random() < 0.8;

    let mac = null;

    let macBytes = [];

    let groups = [];

    if (isEUI64) {
      // Generiere eine realistische MAC

      const firstByteOptions = [0x00, 0x02, 0x50, 0x1a, 0xac];

      const b1 = firstByteOptions[randomInt(0, firstByteOptions.length - 1)];

      macBytes = [b1, ...Array.from({ length: 5 }, () => randomInt(0, 255))];

      mac = macBytes

        .map((b) => b.toString(16).padStart(2, '0'))

        .join(':');

      const firstByte = macBytes[0];

      const firstByteModified = firstByte ^ 0x02; // Das berühmte 7. Bit invertieren

      const iid = [
        `${firstByteModified.toString(16).padStart(2, '0')}${macBytes[1].toString(16).padStart(2, '0')}`,

        `${macBytes[2].toString(16).padStart(2, '0')}ff`,

        `fe${macBytes[3].toString(16).padStart(2, '0')}`,

        `${macBytes[4].toString(16).padStart(2, '0')}${macBytes[5].toString(16).padStart(2, '0')}`,
      ];

      // Prefix: Meist fe80 (Link-Local), manchmal Global (2001)

      const prefix = Math.random() > 0.3 ? 'fe80' : '2001';

      groups = [prefix, '0', '0', '0', ...iid];
    } else {
      // Generiere zufällige Adresse (kein EUI-64)

      groups = Array.from({ length: 8 }, () =>
        randomInt(0, 65535).toString(16)
      );

      // Force some zeros for compression potential

      const zeroStart = randomInt(1, 4);

      const zeroLen = randomInt(1, 3);

      for (let i = zeroStart; i < zeroStart + zeroLen; i++) groups[i] = '0';

      const type = Math.random() > 0.5 ? 'fe80' : '2001';

      groups[0] = type;
    }

    // Prefix Length: 64 bei EUI-64/Link-Local fast immer Standard

    let prefixLen = 64;

    if (!isEUI64 && groups[0] !== 'fe80') {
      const lengths = [32, 48, 56, 64];

      prefixLen = lengths[randomInt(0, lengths.length - 1)];
    }

    const short = formatIPv6([...groups]);

    const full = groups.map((g) => g.padStart(4, '0')).join(':');

    const interfaceId = groups

      .slice(4)

      .map((g) => g.padStart(4, '0'))

      .join(':');

    return {
      type: 'ipv6',

      short,

      prefixLen,

      mac,

      macBytes, // Für die detaillierte Erklärung

      isEUI64,

      sol: {
        length: 128,

        full,

        prefix: prefixLen,

        interfaceId,
      },
    };
  }

  // ============================================================
  // RENDER LOGIC
  // ============================================================

  function render(container) {
    cleanup();
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Subnetting Trainer</h1>
              <p class="page-subtitle">Berechnung von Netzbereichen, Masken und Subnetzen nach IHK-Standard.</p>
            </div>
          </div>
        </div>

        <nav class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Anleitung</button>
          <button class="module-tab ${currentTab === 'exercise' ? 'active' : ''}" data-tab="exercise">Übung</button>
        </nav>

        <div id="subnetContent" class="view-enter"></div>
      </div>
    `;

    setupTabEvents(container);
    renderCurrentTab();
  }

  function setupTabEvents(container) {
    container.querySelectorAll('.module-tab').forEach((btn) => {
      const handler = () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderCurrentTab();
      };
      btn.addEventListener('click', handler);
      cleanup_fns.push(() => btn.removeEventListener('click', handler));
    });
  }

  function renderCurrentTab() {
    const content = document.getElementById('subnetContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderExerciseLayout(content);
  }

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="module-explanation">
        <div class="module-exercise-card">
          <h3 class="module-section-title">Berechnungslogik & IP-Grundlagen</h3>
          <p class="module-text">Das Beherrschen von IP-Adressbereichen und Subnetting ist essenziell fuer die IHK-Pruefung.</p>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">1. Private IP-Adressen (RFC 1918)</h3>
          <p class="module-text">Diese Adressen werden im Internet nicht geroutet und sind fuer lokale Netze reserviert:</p>
          <div class="module-info-box">
            <strong>10.0.0.0 - 10.255.255.255</strong> (Class A, /8)<br>
            <strong>172.16.0.0 - 172.31.255.255</strong> (Class B, /12)<br>
            <strong>192.168.0.0 - 192.168.255.255</strong> (Class C, /16)
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">2. Spezielle Adressbereiche</h3>
          <p class="module-text">Wichtige reservierte Bereiche fuer Sonderfunktionen:</p>
          <div class="module-info-box">
            <strong>127.0.0.0/8</strong>: Loopback (Localhost)<br>
            <strong>169.254.0.0/16</strong>: APIPA (Link-Local, wenn kein DHCP verfuegbar)<br>
            <strong>224.0.0.0 - 239.255.255.255</strong>: Multicast (Class D)
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">3. Die Magic Number (Subnetting)</h3>
          <p class="module-text">Berechne die Blockgroesse eines Subnetzes: <strong>256 - [Masken-Oktett]</strong>.</p>
          <div class="module-tip-box">
            <strong>Beispiel:</strong> Bei /26 (Maske .192): 256 - 192 = 64er Schritte.
          </div>
        </div>

        <div class="module-exercise-card">
          <h3 class="module-section-title">4. EUI-64 Erkennungsmerkmale</h3>
          <p class="module-text">Woran erkenne ich in der IHK-Pruefung eine EUI-64 Adresse?</p>
          <div class="module-info-box">
            <strong>FFFE-Marker:</strong> In der Mitte der Interface-ID stehen immer die Hex-Werte ff:fe.<br>
            <strong>7. Bit (U/L):</strong> Das erste Byte wurde modifiziert (meist +2 im Hex-Wert, z.B. 00 &rarr; 02).<br>
            <strong>Herkunft:</strong> Die Adresse wurde direkt aus der 48-Bit MAC-Adresse des Geraets generiert.
          </div>
        </div>
      </div>
    `;
  }

  function renderExerciseLayout(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    container.innerHTML = `
      <div class="scenario-nav">
        <span class="scenario-nav-label">Aufgaben</span>
        <div class="scenario-nav-controls">
          <button class="scenario-nav-btn" id="prevScen" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
          <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
          <button class="scenario-nav-btn" id="nextScen" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
        </div>
      </div>
      <div class="module-exercise-card">
        <div class="module-exercise-header">
          <span class="module-exercise-badge">${sc.title}</span>
        </div>
        <p class="module-text">${sc.description}</p>

        <div id="exerciseSpecificContent"></div>
      </div>
    `;

    const exContent = container.querySelector('#exerciseSpecificContent');
    if (sc.id === 'basic') renderBasic(exContent);
    else if (sc.id === 'split') renderSplit(exContent);
    else if (sc.id === 'check') renderCheck(exContent);
    else if (sc.id === 'ipv6') renderIPv6(exContent);
    else renderARP(exContent);

    setupNav(container);
  }

  function setupNav(container) {
    container.querySelector('#prevScen')?.addEventListener('click', () => {
      if (currentScenarioIdx > 0) {
        currentScenarioIdx--;
        currentExercise = null;
        renderCurrentTab();
      }
    });
    container.querySelector('#nextScen')?.addEventListener('click', () => {
      if (currentScenarioIdx < SCENARIOS.length - 1) {
        currentScenarioIdx++;
        currentExercise = null;
        renderCurrentTab();
      }
    });
  }

  // ============================================================
  // EXERCISE MODES
  // ============================================================

  function renderBasic(container) {
    if (!currentExercise || currentExercise.type !== 'basic') {
      currentExercise = generateBasicExercise(difficulty);
    }
    const ex = currentExercise;

    container.innerHTML = `
      <div class="subnet-terminal">
        <div class="subnet-terminal-header">
            <div class="subnet-terminal-dots"><span></span><span></span><span></span></div>
            <div class="subnet-terminal-title">IP Calculator</div>
        </div>
        <div class="subnet-terminal-body">
            <div class="subnet-terminal-row"><span class="subnet-terminal-prompt">root@calc:~#</span><span>analyze_ip -target ${ex.ip}/${ex.cidr}</span></div>
            <div class="subnet-terminal-output" id="termOutput">Target locked. Calculate parameters.</div>
        </div>
      </div>

      <div class="module-difficulty" style="margin-bottom: var(--space-6)">
        <button class="module-diff-btn ${difficulty === 1 ? 'active' : ''}" data-d="1">Leicht</button>
        <button class="module-diff-btn ${difficulty === 2 ? 'active' : ''}" data-d="2">Mittel</button>
        <button class="module-diff-btn ${difficulty === 3 ? 'active' : ''}" data-d="3">Schwer</button>
      </div>

      <div class="subnet-grid">
        ${['mask', 'net', 'first', 'last', 'bc', 'hosts']
          .map(
            (k) => `
            <div class="subnet-input-group">
                <label class="subnet-label">${k.toUpperCase()}</label>
                <input type="text" class="subnet-input" data-key="${k}" placeholder="...">
            </div>
        `
          )
          .join('')}
      </div>

      <div class="module-actions">
        <button class="btn btn-primary" id="btnCheck">Prüfen</button>
        <button class="btn" id="btnShowSol">Lösungsweg</button>
        <button class="btn" id="btnNext">Neu</button>
      </div>
      <div id="basicSolution" style="display:none; margin-top: var(--space-6)"></div>
    `;

    container.querySelectorAll('.module-diff-btn').forEach((b) => {
      b.addEventListener('click', () => {
        difficulty = parseInt(b.dataset.d, 10);
        currentExercise = null;
        renderBasic(container);
      });
    });

    container.querySelector('#btnNext').addEventListener('click', () => {
      currentExercise = generateBasicExercise(difficulty);
      renderBasic(container);
    });
    container.querySelector('#btnCheck').addEventListener('click', () => {
      let correct = 0;
      container.querySelectorAll('.subnet-input').forEach((inp) => {
        const isC = inp.value.trim() === String(ex.sol[inp.dataset.key]);
        inp.classList.toggle('correct', isC);
        inp.classList.toggle('wrong', !isC);
        if (isC) correct++;
      });
      container.querySelector('#termOutput').innerHTML =
        correct === 6
          ? '<span style="color:var(--success)">Verified.</span>'
          : '<span style="color:var(--danger)">Mismatch.</span>';
    });

    container.querySelector('#btnShowSol').addEventListener('click', () => {
      const solEl = container.querySelector('#basicSolution');
      if (solEl.style.display === 'block') {
        solEl.style.display = 'none';
        return;
      }
      const hostBits = 32 - ex.cidr;
      const relevantOctetIdx = Math.floor((ex.cidr - 1) / 8);
      const blockSize = 2 ** (8 - (ex.cidr % 8 || 8));

      solEl.innerHTML = `
            <div class="module-steps">
                <div class="module-step">
                    <div class="module-step-title">1. Subnetzmaske & Host-Bits</div>
                    <div class="module-step-text">
                        Präfix <b>/${ex.cidr}</b> bedeutet: Die ersten ${ex.cidr} Bits sind für das Netz, die restlichen <b>${hostBits} Bits</b> für die Hosts.<br>
                        Daraus ergibt sich die Maske: <b>${ex.sol.mask}</b>.
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">2. Anzahl der Hosts (Nutzbar)</div>
                    <div class="module-step-text">
                        Formel: <b>2<sup>n</sup> - 2</b> (n = Host-Bits).<br>
                        2<sup>${hostBits}</sup> = ${ex.sol.hosts + 2}.<br>
                        Abzüglich Netz-ID und Broadcast: <b>${ex.sol.hosts} nutzbare Adressen</b>.
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">3. Blockgröße (Magic Number)</div>
                    <div class="module-step-text">
                        Wir schauen auf das veränderte Oktett (Nr. ${relevantOctetIdx + 1}).<br>
                        Berechnung: 256 - ${ex.sol.mask.split('.')[relevantOctetIdx]} = <b>${blockSize}</b>.<br>
                        Das Netz springt also immer in <b>${blockSize}er Schritten</b>.
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">4. Netz-Bereiche bestimmen</div>
                    <div class="module-step-text">
                        • <b>Netz-ID:</b> Die IP ${ex.ip} abgerundet auf den nächsten ${blockSize}er Schritt &rarr; <b>${ex.sol.net}</b>.<br>
                        • <b>Erster Host:</b> Netz-ID + 1 &rarr; <b>${ex.sol.first}</b>.<br>
                        • <b>Broadcast:</b> Nächstes Netz (${blockSize}er Schritt weiter) minus 1 &rarr; <b>${ex.sol.bc}</b>.<br>
                        • <b>Letzter Host:</b> Broadcast - 1 &rarr; <b>${ex.sol.last}</b>.
                    </div>
                </div>
            </div>
        `;
      solEl.style.display = 'block';
    });
  }

  function renderSplit(container) {
    if (!currentExercise || currentExercise.type !== 'split') {
      currentExercise = generateSplitExercise(difficulty);
    }
    const ex = currentExercise;

    container.innerHTML = `
      <div class="subnet-split-visual">
        <div class="subnet-block-base">${ex.baseIp}/${ex.baseCidr}</div>
        <div class="subnet-arrow-down">↓</div>
        <div class="subnet-blocks-row">
            ${Array(ex.neededSubnets)
              .fill(0)
              .map(
                (_, i) => `
                <div class="subnet-block-sub"><span class="subnet-label">Netz ${i + 1}</span><input type="text" class="subnet-input" data-idx="${i}" style="font-size:11px"></div>
            `
              )
              .join('')}
        </div>
      </div>
      <div class="subnet-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="subnet-input-group"><label class="subnet-label">Neue CIDR</label><input type="text" class="subnet-input" id="newCidr"></div>
        <div class="subnet-input-group"><label class="subnet-label">Neue Maske</label><input type="text" class="subnet-input" id="newMask"></div>
      </div>
      <div class="module-actions">
        <button class="btn btn-primary" id="btnCheckSplit">Prüfen</button>
        <button class="btn" id="btnShowSolSplit">Lösungsweg</button>
        <button class="btn" id="btnNextSplit">Neu</button>
      </div>
      <div id="splitSolution" style="display:none; margin-top: var(--space-6)"></div>
    `;

    container.querySelector('#btnNextSplit').addEventListener('click', () => {
      currentExercise = generateSplitExercise(difficulty);
      renderSplit(container);
    });
    container.querySelector('#btnCheckSplit').addEventListener('click', () => {
      const cidrOk =
        container.querySelector('#newCidr').value.replace('/', '') ===
        String(ex.sol.newCidr);
      container.querySelector('#newCidr').classList.toggle('correct', cidrOk);
      container.querySelector('#newCidr').classList.toggle('wrong', !cidrOk);
      container
        .querySelectorAll('.subnet-block-sub .subnet-input')
        .forEach((inp) => {
          const isC =
            inp.value.trim() === ex.sol.subnets[parseInt(inp.dataset.idx, 10)];
          inp.classList.toggle('correct', isC);
          inp.classList.toggle('wrong', !isC);
        });
    });

    container
      .querySelector('#btnShowSolSplit')
      .addEventListener('click', () => {
        const solEl = container.querySelector('#splitSolution');
        if (solEl.style.display === 'block') {
          solEl.style.display = 'none';
          return;
        }
        const bits = Math.log2(ex.neededSubnets);
        const newBlockSize = 2 ** (32 - ex.sol.newCidr);

        solEl.innerHTML = `
            <div class="module-steps">
                <div class="module-step">
                    <div class="module-step-title">1. Benötigte Bits berechnen</div>
                    <div class="module-step-text">
                        Du willst <b>${ex.neededSubnets} Subnetze</b> erstellen.<br>
                        Suche die Potenz von 2, die passt: 2<sup>${bits}</sup> = ${ex.neededSubnets}.<br>
                        Du musst dir also <b>${bits} Bits</b> vom Host-Anteil "ausleihen".
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">2. Neue CIDR & Maske</div>
                    <div class="module-step-text">
                        Alte CIDR: /${ex.baseCidr} + ${bits} Bits = <b>/${ex.sol.newCidr}</b>.<br>
                        Die neue Subnetzmaske ist somit: <b>${ex.sol.newMask}</b>.
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">3. Neue Blockgröße</div>
                    <div class="module-step-text">
                        Berechnung: 2<sup>(32 - ${ex.sol.newCidr})</sup> = <b>${newBlockSize}</b>.<br>
                        Jedes neue Subnetz hat also einen Abstand von ${newBlockSize} IP-Adressen (inkl. Netz-ID & BC).
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">4. Die neuen Netze</div>
                    <div class="module-step-text">
                        Wir starten bei ${ex.baseIp} und addieren immer ${newBlockSize}:<br>
                        • Netz 1: <b>${ex.sol.subnets[0]}</b><br>
                        • Netz 2: <b>${ex.sol.subnets[1]}</b><br>
                        ${ex.sol.subnets.length > 2 ? `• ... usw. in ${newBlockSize}er Schritten.` : ''}
                    </div>
                </div>
            </div>
        `;
        solEl.style.display = 'block';
      });
  }

  function renderCheck(container) {
    if (!currentExercise || currentExercise.type !== 'check') {
      currentExercise = generateIpCheckExercise();
    }
    const ex = currentExercise;
    container.innerHTML = `
      <div class="subnet-ip-list">
        ${ex.items
          .map(
            (it, i) => `
            <div class="subnet-ip-item" data-idx="${i}"><span class="subnet-ip-addr">${it.ip}</span><div class="subnet-ip-actions">
                ${['public', 'private', 'special'].map((t) => `<button class="subnet-btn-small" data-type="${t}">${t}</button>`).join('')}
            </div></div>
        `
          )
          .join('')}
      </div>
      <div class="module-actions" style="margin-top: var(--space-6)">
        <button class="btn btn-primary" id="btnCheckIP">Prüfen</button>
        <button class="btn" id="btnShowSolIP">Lösungsweg</button>
        <button class="btn" id="btnNextIP">Neu</button>
      </div>
      <div id="checkSolution" style="display:none; margin-top: var(--space-6)"></div>
    `;

    container.querySelectorAll('.subnet-ip-item').forEach((row) => {
      row.querySelectorAll('.subnet-btn-small').forEach((btn) => {
        btn.addEventListener('click', () => {
          row.querySelectorAll('.subnet-btn-small').forEach((b) => {
            b.classList.remove('selected', 'correct', 'wrong');
          });
          btn.classList.add('selected');
        });
      });
    });
    container.querySelector('#btnNextIP').addEventListener('click', () => {
      currentExercise = generateIpCheckExercise();
      renderCheck(container);
    });
    container.querySelector('#btnCheckIP').addEventListener('click', () => {
      ex.items.forEach((it, i) => {
        const sel = container.querySelector(
          `.subnet-ip-item[data-idx="${i}"] .selected`
        );
        if (sel) {
          const isC = sel.dataset.type === it.type;
          sel.classList.remove('selected', 'correct', 'wrong');
          sel.classList.add(isC ? 'correct' : 'wrong');
        }
      });
    });

    container.querySelector('#btnShowSolIP').addEventListener('click', () => {
      const solEl = container.querySelector('#checkSolution');
      if (solEl.style.display === 'block') {
        solEl.style.display = 'none';
        return;
      }
      solEl.innerHTML = `
        <div class="module-steps">
          ${ex.items
            .map(
              (it) => `
            <div class="module-step">
              <div class="module-step-title">${it.ip} &rarr; <span style="color: var(--brand-primary)">${it.type.toUpperCase()}</span></div>
              <div class="module-step-text">${it.explanation}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
      solEl.style.display = 'block';
    });
  }

  function renderIPv6(container) {
    if (!currentExercise || currentExercise.type !== 'ipv6') {
      currentExercise = generateIPv6Exercise();
    }
    const ex = currentExercise;

    container.innerHTML = `
      <div class="subnet-terminal">
        <div class="subnet-terminal-header">
            <div class="subnet-terminal-dots"><span></span><span></span><span></span></div>
            <div class="subnet-terminal-title">IPv6 Analyzer</div>
        </div>
        <div class="subnet-terminal-body">
            <div class="subnet-terminal-row">
                <span class="subnet-terminal-prompt">root@calc:~#</span>
                <span>ipv6_info -addr ${ex.short}/${ex.prefixLen}</span>
            </div>
            ${
              ex.isEUI64
                ? `<div class="subnet-terminal-row"><span class="subnet-terminal-prompt">root@calc:~#</span><span style="color:var(--text-tertiary)">hw_detect --target eth0: [MAC ${ex.mac}]</span></div>`
                : ''
            }
            <div class="subnet-terminal-output" id="ipv6Output">Analysis pending...</div>
        </div>
      </div>

      <div class="subnet-grid">
        <div class="subnet-input-group">
            <label class="subnet-label">Adresslänge (Bits)</label>
            <input type="text" class="subnet-input" data-key="length" placeholder="z.B. 128">
        </div>
        <div class="subnet-input-group">
            <label class="subnet-label">Präfixlänge (Bits)</label>
            <input type="text" class="subnet-input" data-key="prefix" placeholder="z.B. 64">
        </div>
        <div class="subnet-input-group" style="grid-column: 1 / -1">
            <label class="subnet-label">Ungekürzte Darstellung (Hexadezimal)</label>
            <input type="text" class="subnet-input" data-key="full" placeholder="0000:0000:...">
        </div>
        <div class="subnet-input-group" style="grid-column: 1 / -1">
            <label class="subnet-label">Interface-Identifier (Berechnung via EUI-64)</label>
            <input type="text" class="subnet-input" data-key="interfaceId" placeholder="xxxx:xxxx:xxxx:xxxx">
        </div>
      </div>

      <div class="module-actions">
        <button class="btn btn-primary" id="btnCheckIPv6">Prüfen</button>
        <button class="btn" id="btnShowSolIPv6">Lösungsweg</button>
        <button class="btn" id="btnNextIPv6">Neu</button>
      </div>
      <div id="ipv6Solution" style="display:none; margin-top: var(--space-6)"></div>
    `;

    container.querySelector('#btnNextIPv6').addEventListener('click', () => {
      currentExercise = generateIPv6Exercise();
      renderIPv6(container);
    });

    container.querySelector('#btnCheckIPv6').addEventListener('click', () => {
      let correct = 0;
      const inputs = container.querySelectorAll('.subnet-input');
      inputs.forEach((inp) => {
        const key = inp.dataset.key;
        const valRaw = inp.value.trim().toLowerCase();
        const sol = String(ex.sol[key]).toLowerCase();

        let isC = false;
        if (key === 'full') {
          isC = normalizeIPv6(valRaw, 8) === normalizeIPv6(sol, 8);
        } else if (key === 'interfaceId') {
          isC = normalizeIPv6(valRaw, 4) === normalizeIPv6(sol, 4);
        } else {
          isC = valRaw === sol;
        }

        inp.classList.toggle('correct', isC);
        inp.classList.toggle('wrong', !isC);
        if (isC) correct++;
      });

      container.querySelector('#ipv6Output').innerHTML =
        correct === 4
          ? '<span style="color:var(--success)">Analysis Complete. Verified.</span>'
          : '<span style="color:var(--danger)">Errors detected.</span>';
    });

    container.querySelector('#btnShowSolIPv6').addEventListener('click', () => {
      const solEl = container.querySelector('#ipv6Solution');
      if (solEl.style.display === 'block') {
        solEl.style.display = 'none';
        return;
      }

      solEl.innerHTML = `
            <div class="module-steps">
                <div class="module-step">
                    <div class="module-step-title">1. Länge & Präfix</div>
                    <div class="module-step-text">
                        IPv6-Adressen sind immer <strong>128 Bit</strong> lang.<br>
                        Das Präfix ist hier angegeben: /${
                          ex.prefixLen
                        } (die ersten ${ex.prefixLen} Bits sind das Netz).
                    </div>
                </div>
                <div class="module-step">
                    <div class="module-step-title">2. Volldarstellung</div>
                    <div class="module-step-text">
                        1. <strong>::</strong> ersetzen durch fehlende Null-Gruppen.<br>
                        2. Jede Gruppe auf 4 Stellen auffüllen (führende Nullen).
                    </div>
                    <div class="module-step-detail">${ex.sol.full}</div>
                </div>
                                                                                                                                                <div class="module-step">
                                                                                                                                                    <div class="module-step-title">3. Interface Identifier ${
                                                                                                                                                      ex.isEUI64
                                                                                                                                                        ? '(Herkunft & EUI-64)'
                                                                                                                                                        : ''
                                                                                                                                                    }</div>
                                                                                                                                                    <div class="module-step-text">
                                                                                                                                                        ${
                                                                                                                                                          ex.isEUI64
                                                                                                                                                            ? '<b>Das Ergebnis:</b> Du kannst die Interface-ID einfach aus der Adresse ablesen (die letzten 64 Bit).<br><br><b>Die Herleitung (IHK-Wissen):</b> Weil dies eine EUI-64 Adresse ist, wurde dieser Teil aus der MAC-Adresse errechnet:'
                                                                                                                                                            : 'Die Interface-ID entspricht bei einer Standard-IPv6-Adresse immer den <b>letzten 64 Bit</b> (die letzten 4 Blöcke):'
                                                                                                                                                        }
                                                                                                                                                    </div>
                                                                                                                                                    ${
                                                                                                                                                      ex.isEUI64 &&
                                                                                                                                                      ex.mac
                                                                                                                                                        ? `
                                                                                                                                                    <div class="eui-solution-box" style="margin-top:12px; font-family: monospace; border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden;">
                                                                                                                                                        
                                                                                                                                                        <!-- Step 1 -->
                                                                                                                                                        <div style="padding: 12px; background: var(--surface-submerged); border-bottom: 1px solid var(--border-subtle);">
                                                                                                                                                          <div style="font-size: 10px; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px;">Schritt 1: MAC-Adresse teilen & ff:fe einfügen</div>
                                                                                                                                                          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                                                                                                                                                            <span>${ex.mac.substring(0, 8).replace(/:/g, '')}</span>
                                                                                                                                                            <span style="color: var(--brand-primary); font-weight: bold; background: rgba(var(--brand-primary-rgb), 0.1); padding: 2px 6px; border-radius: 4px;">fffe</span>
                                                                                                                                                            <span>${ex.mac.substring(9).replace(/:/g, '')}</span>
                                                                                                                                                          </div>
                                                                                                                                                        </div>
                                                                                                                                
                                                                                                                                                                                                                <!-- Step 2 -->
                                                                                                                                                                                                                <div style="padding: 12px;">
                                                                                                                                                                                                                  <div style="font-size: 10px; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 12px;">Schritt 2: Bit-Flip (7. Bit des 1. Bytes)</div>
                                                                                                                                                                                                                  
                                                                                                                                                                                                                  <div style="display: flex; flex-direction: column; gap: 8px; background: var(--surface-card); padding: 16px; border-radius: 8px; border: 1px dashed var(--border-subtle);">
                                                                                                                                                                                                                    
                                                                                                                                                                                                                    <!-- Bit Positions Header -->
                                                                                                                                                                                                                    <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 4px; margin-left: 2px;">
                                                                                                                                                                                                                      ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<span style="width: 10px; text-align: center; font-size: 8px; color: var(--text-tertiary); font-weight: bold;">${n}</span>`).join('')}
                                                                                                                                                                                                                    </div>
                                                                                                                                                        
                                                                                                                                                                                                                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center;">
                                                                                                                                                                                                                      <!-- Before -->
                                                                                                                                                                                                                      <div style="text-align: center;">
                                                                                                                                                                                                                        <div style="font-size: 20px; font-weight: bold; font-family: var(--font-mono);">${ex.mac.substring(0, 2)}</div>
                                                                                                                                                                                                                        <div style="display: flex; justify-content: center; gap: 6px; font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary);">
                                                                                                                                                                                                                          ${parseInt(
                                                                                                                                                                                                                            ex
                                                                                                                                                                                                                              .macBytes[0],
                                                                                                                                                                                                                            10
                                                                                                                                                                                                                          )
                                                                                                                                                                                                                            .toString(
                                                                                                                                                                                                                              2
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .padStart(
                                                                                                                                                                                                                              8,
                                                                                                                                                                                                                              '0'
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .split(
                                                                                                                                                                                                                              ''
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .map(
                                                                                                                                                                                                                              (
                                                                                                                                                                                                                                bit,
                                                                                                                                                                                                                                i
                                                                                                                                                                                                                              ) =>
                                                                                                                                                                                                                                `<span style="${i === 6 ? 'color:var(--danger); font-weight:bold; border-bottom: 2px solid;' : ''}">${bit}</span>`
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .join(
                                                                                                                                                                                                                              ''
                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                      </div>
                                                                                                                                                                                          
                                                                                                                                                                                                                      <div style="color: var(--text-tertiary); font-size: 24px;">&rarr;</div>
                                                                                                                                                                                          
                                                                                                                                                                                                                      <!-- After -->
                                                                                                                                                                                                                      <div style="text-align: center;">
                                                                                                                                                                                                                        <div style="font-size: 20px; font-weight: bold; font-family: var(--font-mono); color: var(--brand-primary);">${ex.sol.interfaceId.substring(0, 2)}</div>
                                                                                                                                                                                                                        <div style="display: flex; justify-content: center; gap: 6px; font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary);">
                                                                                                                                                                                                                          ${parseInt(
                                                                                                                                                                                                                            ex.sol.interfaceId.substring(
                                                                                                                                                                                                                              0,
                                                                                                                                                                                                                              2
                                                                                                                                                                                                                            ),
                                                                                                                                                                                                                            16
                                                                                                                                                                                                                          )
                                                                                                                                                                                                                            .toString(
                                                                                                                                                                                                                              2
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .padStart(
                                                                                                                                                                                                                              8,
                                                                                                                                                                                                                              '0'
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .split(
                                                                                                                                                                                                                              ''
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .map(
                                                                                                                                                                                                                              (
                                                                                                                                                                                                                                bit,
                                                                                                                                                                                                                                i
                                                                                                                                                                                                                              ) =>
                                                                                                                                                                                                                                `<span style="${i === 6 ? 'color:var(--success); font-weight:bold; border-bottom: 2px solid;' : ''}">${bit}</span>`
                                                                                                                                                                                                                            )
                                                                                                                                                                                                                            .join(
                                                                                                                                                                                                                              ''
                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                    </div>
                                                                                                                                                        
                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                  
                                                                                                                                                                                                                  <div style="margin-top: 12px; padding: 10px; background: rgba(var(--brand-primary-rgb), 0.05); border-radius: 6px; border-left: 3px solid var(--brand-primary);">
                                                                                                                                                                                                                    <p style="font-size: 11px; color: var(--text-primary); line-height: 1.5; margin: 0;">
                                                                                                                                                                                                                      <strong>IHK-Shortcut:</strong> Das 7. Bit hat den Wert <b>2</b>. Meistens erhöhst du einfach die zweite Stelle der Hex-Zahl um 2 (aus <code>c</code> wird <code>e</code>, aus <code>0</code> wird <code>2</code>).
                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                </div>                                                                                                                                
                                                                                                                                                        <!-- Result -->
                                                                                                                                                        <div style="padding: 12px; background: var(--brand-primary); color: white; text-align: center;">
                                                                                                                                                          <div style="font-size: 9px; text-transform: uppercase; opacity: 0.8;">Interface-ID (Ergebnis)</div>
                                                                                                                                                          <div style="font-size: 15px; font-weight: bold; letter-spacing: 1px;">${ex.sol.interfaceId}</div>
                                                                                                                                                        </div>
                                                                                                                                
                                                                                                                                                    </div>
                                                                                                                                                    `
                                                                                                                                                        : `<div class="module-step-detail">${ex.sol.interfaceId}</div>`
                                                                                                                                                    }
                                                                                                                                                </div>            </div>
        `;
      solEl.style.display = 'block';
    });
  }

  function renderARP(container) {
    container.innerHTML = `
      <div class="subnet-terminal" style="margin-bottom: var(--space-6)">
        <div class="subnet-terminal-header">
            <div class="subnet-terminal-dots"><span></span><span></span><span></span></div>
            <div class="subnet-terminal-title">Windows PowerShell</div>
        </div>
        <div class="subnet-terminal-body" style="font-size: 12px; line-height: 1.4;">
            <div class="subnet-terminal-row"><span class="subnet-terminal-prompt">PS C:\\WINDOWS\\system32></span><span>arp -a</span></div>
            <div style="margin-top: 8px; color: #aaa;">
              Schnittstelle: 192.168.0.52 --- 0x5<br>
              <div style="display: grid; grid-template-columns: 180px 180px 100px; margin-top: 4px; border-bottom: 1px solid #333; padding-bottom: 2px;">
                <span>Internetadresse</span><span>Physische Adresse</span><span>Typ</span>
              </div>
              <div style="display: grid; grid-template-columns: 180px 180px 100px; margin-top: 4px;">
                <span style="color: #fff;">192.168.0.1</span><span style="color: #fff;">d4-3f-cb-8c-37-8b</span><span style="color: #fff;">dynamisch</span>
              </div>
            </div>
        </div>
      </div>

      <div class="module-exercise-question" style="font-size: 14px; margin-bottom: var(--space-6)">
        <strong>Prüfungsfrage:</strong> Erläutern Sie anhand des Beispiels die grundlegende Aufgabe des Address Resolution Protocol (ARP) bei der Netzwerkkommunikation in einem LAN.
      </div>

      <div class="module-actions">
        <button class="btn btn-primary" id="btnShowArpSol">Lösung anzeigen</button>
      </div>

      <div id="arpSolution" style="display:none; margin-top: var(--space-6)">
        <div class="module-steps">
            <div class="module-step">
                <div class="module-step-title">1. Die Kernaufgabe</div>
                <div class="module-step-text">
                    ARP dient dazu, die zu einer bekannten <b>logischen IP-Adresse</b> (Layer 3) gehörende <b>physische MAC-Adresse</b> (Layer 2) zu ermitteln.
                </div>
            </div>
            <div class="module-step">
                <div class="module-step-title">2. Bezug zum Beispiel</div>
                <div class="module-step-text">
                    Der Rechner (192.168.0.52) möchte Daten an das Standardgateway (192.168.0.1) senden. Damit das Datenpaket im Ethernet (LAN) adressiert und zugestellt werden kann, muss die MAC-Adresse des Empfängers bekannt sein.
                </div>
            </div>
            <div class="module-step">
                <div class="module-step-title">3. Der Prozess (IHK-Key-Facts)</div>
                <div class="module-step-text">
                    • <b>ARP-Request:</b> Host sendet Broadcast ("Wer hat die IP 192.168.0.1?").<br>
                    • <b>ARP-Reply:</b> Ziel antwortet per Unicast ("Ich habe sie, hier ist meine MAC d4-3f...").<br>
                    • <b>ARP-Cache:</b> Das Ergebnis wird (wie in der Tabelle zu sehen) dynamisch gespeichert, um zukünftige Anfragen zu vermeiden.
                </div>
            </div>
        </div>
      </div>
    `;

    container.querySelector('#btnShowArpSol').addEventListener('click', () => {
      const solEl = container.querySelector('#arpSolution');
      solEl.style.display = solEl.style.display === 'none' ? 'block' : 'none';
    });
  }

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default SubnettingView;
