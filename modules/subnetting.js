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
      },
      {
        ip: `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'private',
      },
      {
        ip: `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'private',
      },
      { ip: `8.8.8.8`, type: 'public' },
      {
        ip: `169.254.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        type: 'special',
      },
      { ip: `127.0.0.1`, type: 'special' },
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

          groups = Array.from({ length: 8 }, () => randomInt(0, 65535).toString(16));

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

        <div id="subnetContent" class="view-enter" style="margin-top: var(--space-6)"></div>
      </div>
    `;

    container.querySelectorAll('.module-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderTabContent();
      });
    });

    renderTabContent();
  }

  function renderTabContent() {
    const content = document.getElementById('subnetContent');
    if (!content) return;
    if (currentTab === 'explanation') renderExplanation(content);
    else renderExerciseLayout(content);
  }

  function renderExplanation(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="module-exercise-card">
          <h3 class="comm-section-title">Berechnungslogik im Subnetting</h3>
          <p class="comm-text">Das Aufteilen von Netzwerken ist ein Standard-Thema der IHK. Hier sind die zwei wichtigsten Schritte:</p>
          
          <div class="module-steps">
            <div class="module-step">
              <div class="module-step-title">1. Die Magic Number (Blockgroesse)</div>
              <div class="module-step-text">Berechne, wie gross ein Subnetz ist: <strong>256 - [letztes Masken-Oktett]</strong>.</div>
              <div class="module-step-text" style="font-size: 12px; color: var(--text-tertiary)">Beispiel bei /26 (Maske .192): 256 - 192 = 64er Schritte.</div>
            </div>
            <div class="module-step">
              <div class="module-step-title">2. Die Host-Anzahl</div>
              <div class="module-step-text">Anzahl nutzbarer IP-Adressen = <strong>2<sup>n</sup> - 2</strong> (n = Host-Bits).</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderExerciseLayout(container) {
    const sc = SCENARIOS[currentScenarioIdx];
    container.innerHTML = `
      <div class="module-exercise-card view-enter">
        <div class="scenario-nav">
          <span class="scenario-nav-label">Übungstyp</span>
          <div class="scenario-nav-controls">
            <button class="scenario-nav-btn" id="prevScen" ${currentScenarioIdx === 0 ? 'disabled' : ''}>&larr;</button>
            <span class="scenario-nav-current">${currentScenarioIdx + 1} / ${SCENARIOS.length}</span>
            <button class="scenario-nav-btn" id="nextScen" ${currentScenarioIdx === SCENARIOS.length - 1 ? 'disabled' : ''}>&rarr;</button>
          </div>
        </div>

        <h3 style="margin-bottom: var(--space-2)">${sc.title}</h3>
        <p class="comm-text" style="margin-bottom: var(--space-6)">${sc.description}</p>

        <div id="exerciseSpecificContent"></div>
      </div>
    `;

    const exContent = container.querySelector('#exerciseSpecificContent');
    if (sc.id === 'basic') renderBasic(exContent);
    else if (sc.id === 'split') renderSplit(exContent);
    else if (sc.id === 'check') renderCheck(exContent);
    else renderIPv6(exContent);

    setupNav(container);
  }

  function setupNav(container) {
    container.querySelector('#prevScen')?.addEventListener('click', () => {
      if (currentScenarioIdx > 0) {
        currentScenarioIdx--;
        currentExercise = null;
        renderTabContent();
      }
    });
    container.querySelector('#nextScen')?.addEventListener('click', () => {
      if (currentScenarioIdx < SCENARIOS.length - 1) {
        currentScenarioIdx++;
        currentExercise = null;
        renderTabContent();
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
      const blockSize = 2 ** (8 - (ex.cidr % 8 || 8));
      solEl.innerHTML = `
            <div class="module-steps">
                <div class="module-step"><div class="module-step-title">1. Maske</div><div class="module-step-text">/${ex.cidr} = ${ex.sol.mask}</div></div>
                <div class="module-step"><div class="module-step-title">2. Hosts</div><div class="module-step-text">2<sup>${hostBits}</sup> - 2 = ${ex.sol.hosts}</div></div>
                <div class="module-step"><div class="module-step-title">3. Netz & Block</div><div class="module-step-text">Block: ${blockSize}. Start: ${ex.sol.net}</div></div>
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
        solEl.innerHTML = `<div class="module-steps"><div class="module-step"><div class="module-step-title">Bits</div><div class="module-step-text">2<sup>${bits}</sup> = ${ex.neededSubnets} Subnetze. Neue CIDR: /${ex.sol.newCidr}</div></div></div>`;
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
      <div class="module-actions" style="margin-top: var(--space-6)"><button class="btn btn-primary" id="btnCheckIP">Prüfen</button><button class="btn" id="btnNextIP">Neu</button></div>
    `;

    container.querySelectorAll('.subnet-ip-item').forEach((row) => {
      row.querySelectorAll('.subnet-btn-small').forEach((btn) => {
        btn.addEventListener('click', () => {
          row.querySelectorAll('.subnet-btn-small').forEach((b) => {
            b.classList.remove('selected');
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
          sel.classList.remove('selected');
          sel.classList.add(isC ? 'correct' : 'wrong');
        }
      });
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
                                                      ex.isEUI64 ? '(EUI-64)' : ''
                                                    }</div>
                                                    <div class="module-step-text">
                                                        Der Host-Anteil bei IPv6 (Interface ID) sind die letzten 64 Bits.
                                                        ${
                                                          ex.isEUI64
                                                            ? '<br>Berechnung nach dem <b>EUI-64 Verfahren</b>:'
                                                            : ''
                                                        }
                                                    </div>
                                                    ${
                                                      ex.isEUI64 && ex.mac
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
                                                          <div style="font-size: 10px; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 8px;">Schritt 2: Bit-Flip (7. Bit des 1. Bytes)</div>
                                                          
                                                          <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; background: var(--surface-card); padding: 12px; border-radius: 8px; border: 1px dashed var(--border-subtle);">
                                                            
                                                            <!-- Before -->
                                                            <div style="text-align: center;">
                                                              <div style="font-size: 18px; font-weight: bold;">${ex.mac.substring(0, 2)}</div>
                                                              <div style="font-size: 11px; letter-spacing: 2px; color: var(--text-secondary);">
                                                                ${parseInt(ex.macBytes[0], 10).toString(2).padStart(8, '0').substring(0, 6)}<span style="color:var(--danger); font-weight:bold; border-bottom: 2px solid;">${parseInt(ex.macBytes[0], 10).toString(2).padStart(8, '0')[6]}</span>${parseInt(ex.macBytes[0], 10).toString(2).padStart(8, '0')[7]}
                                                              </div>
                                                            </div>
                                
                                                            <div style="color: var(--text-tertiary); font-size: 20px;">&rarr;</div>
                                
                                                            <!-- After -->
                                                            <div style="text-align: center;">
                                                              <div style="font-size: 18px; font-weight: bold; color: var(--brand-primary);">${ex.sol.interfaceId.substring(0, 2)}</div>
                                                              <div style="font-size: 11px; letter-spacing: 2px; color: var(--text-secondary);">
                                                                ${parseInt(ex.sol.interfaceId.substring(0, 2), 16).toString(2).padStart(8, '0').substring(0, 6)}<span style="color:var(--success); font-weight:bold; border-bottom: 2px solid;">${parseInt(ex.sol.interfaceId.substring(0, 2), 16).toString(2).padStart(8, '0')[6]}</span>${parseInt(ex.sol.interfaceId.substring(0, 2), 16).toString(2).padStart(8, '0')[7]}
                                                              </div>
                                                            </div>
                                
                                                          </div>
                                                          
                                                          <p style="font-size: 11px; color: var(--text-tertiary); margin-top: 10px; line-height: 1.4;">
                                                            Das 7. Bit (Universal/Local) wurde invertiert. Aus Hex <b>${ex.mac.substring(0, 2)}</b> wird <b>${ex.sol.interfaceId.substring(0, 2)}</b>.
                                                          </p>
                                                        </div>
                                
                                                        <!-- Result -->
                                                        <div style="padding: 12px; background: var(--brand-primary); color: white; text-align: center;">
                                                          <div style="font-size: 9px; text-transform: uppercase; opacity: 0.8;">Interface-ID</div>
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

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default SubnettingView;
