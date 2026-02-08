// ============================================================
// subnetting.js — IP-Adressen & Subnetting-Rechner (Modul 1)
// Interactive exercises for IPv4 subnetting, network splitting,
// public/private IP recognition, and IPv6 short notation.
// ============================================================

const SubnettingView = (() => {
  let keyHandler = null;
  let currentExercise = null;
  let currentTab = 'subnetting';

  // ---- IPv4 Utility Functions ----

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
    if (cidr === 0) return 0;
    return (0xffffffff << (32 - cidr)) >>> 0;
  }

  function maskToIp(mask) {
    return intToIp(mask);
  }

  function _maskToCidr(maskInt) {
    let cidr = 0;
    let m = maskInt;
    while (m & 0x80000000) {
      cidr++;
      m = (m << 1) >>> 0;
    }
    return cidr;
  }

  function getNetworkAddress(ipInt, maskInt) {
    return (ipInt & maskInt) >>> 0;
  }

  function getBroadcast(networkInt, maskInt) {
    return (networkInt | (~maskInt >>> 0)) >>> 0;
  }

  function getFirstHost(networkInt) {
    return (networkInt + 1) >>> 0;
  }

  function getLastHost(broadcastInt) {
    return (broadcastInt - 1) >>> 0;
  }

  function getHostCount(cidr) {
    if (cidr >= 31) return cidr === 31 ? 2 : 1;
    return 2 ** (32 - cidr) - 2;
  }

  function isPrivateIp(ipInt) {
    // 10.0.0.0/8
    if ((ipInt & 0xff000000) === 0x0a000000)
      return { private: true, range: '10.0.0.0/8 (Klasse A)' };
    // 172.16.0.0/12
    if ((ipInt & 0xfff00000) === 0xac100000)
      return { private: true, range: '172.16.0.0/12 (Klasse B)' };
    // 192.168.0.0/16
    if ((ipInt & 0xffff0000) === 0xc0a80000)
      return { private: true, range: '192.168.0.0/16 (Klasse C)' };
    // 127.0.0.0/8
    if ((ipInt & 0xff000000) === 0x7f000000)
      return { private: true, range: '127.0.0.0/8 (Loopback)' };
    // 169.254.0.0/16
    if ((ipInt & 0xffff0000) === 0xa9fe0000)
      return { private: true, range: '169.254.0.0/16 (APIPA/Link-Local)' };
    return { private: false, range: 'Oeffentliche IP-Adresse' };
  }

  function ipToBinary(ip) {
    return ip
      .split('.')
      .map((o) => parseInt(o, 10).toString(2).padStart(8, '0'))
      .join('.');
  }

  // ---- Random Exercise Generators ----

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateSubnettingExercise(difficulty) {
    let ip, cidr;

    if (difficulty === 1) {
      // Easy: Class C with common masks
      const thirdOctet = randomInt(0, 255);
      const fourthOctet = randomInt(1, 254);
      ip = `192.168.${thirdOctet}.${fourthOctet}`;
      cidr = [24, 25, 26, 27, 28][randomInt(0, 4)];
    } else if (difficulty === 2) {
      // Medium: Class B or mixed
      const secondOctet = randomInt(16, 31);
      const thirdOctet = randomInt(0, 255);
      const fourthOctet = randomInt(1, 254);
      ip = `172.${secondOctet}.${thirdOctet}.${fourthOctet}`;
      cidr = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26][randomInt(0, 10)];
    } else {
      // Hard: Any range, unusual masks
      const firstOctet = [10, 172, 192, randomInt(1, 223)][randomInt(0, 3)];
      let secondOctet, thirdOctet, fourthOctet;
      if (firstOctet === 10) {
        secondOctet = randomInt(0, 255);
        thirdOctet = randomInt(0, 255);
        fourthOctet = randomInt(1, 254);
      } else if (firstOctet === 172) {
        secondOctet = randomInt(16, 31);
        thirdOctet = randomInt(0, 255);
        fourthOctet = randomInt(1, 254);
      } else if (firstOctet === 192) {
        secondOctet = 168;
        thirdOctet = randomInt(0, 255);
        fourthOctet = randomInt(1, 254);
      } else {
        secondOctet = randomInt(0, 255);
        thirdOctet = randomInt(0, 255);
        fourthOctet = randomInt(1, 254);
      }
      ip = `${firstOctet}.${secondOctet}.${thirdOctet}.${fourthOctet}`;
      cidr = randomInt(8, 30);
    }

    const ipInt = ipToInt(ip);
    const maskInt = cidrToMask(cidr);
    const networkInt = getNetworkAddress(ipInt, maskInt);
    const broadcastInt = getBroadcast(networkInt, maskInt);

    return {
      type: 'subnetting',
      ip,
      cidr,
      solution: {
        subnetMask: maskToIp(maskInt),
        networkAddress: intToIp(networkInt),
        broadcast: intToIp(broadcastInt),
        firstHost: intToIp(getFirstHost(networkInt)),
        lastHost: intToIp(getLastHost(broadcastInt)),
        hostCount: getHostCount(cidr),
        cidrNotation: `${intToIp(networkInt)}/${cidr}`,
      },
      steps: generateSubnettingSteps(
        ip,
        cidr,
        ipInt,
        maskInt,
        networkInt,
        broadcastInt
      ),
    };
  }

  function generateSubnettingSteps(
    ip,
    cidr,
    _ipInt,
    maskInt,
    networkInt,
    broadcastInt
  ) {
    const ipBin = ipToBinary(ip);
    const maskBin = ipToBinary(maskToIp(maskInt));
    const netBin = ipToBinary(intToIp(networkInt));
    const bcBin = ipToBinary(intToIp(broadcastInt));
    const hostCount = getHostCount(cidr);

    // Hilfsfunktion fuer binaere Darstellung mit Abstaenden
    const formatBin = (b) => b.split('.').join(' ');

    return [
      {
        title: 'Schritt 1: Subnetzmaske berechnen',
        text: `CIDR /${cidr} bedeutet, dass die Maske aus ${cidr} Einsen besteht.`,
        detail: (() => {
          const fullOctets = Math.floor(cidr / 8);
          const remBits = cidr % 8;

          let explanation = '';

          if (remBits === 0) {
            explanation = `/${cidr} sind genau ${fullOctets} volle Oktette (je 8 Bits).\nDas bedeutet ${fullOctets}x 255 und der Rest ist 0.\nDezimal: ${maskToIp(maskInt)}`;
          } else {
            const bitValues = [];
            let currentSum = 0;
            for (let i = 0; i < remBits; i++) {
              const val = 128 >>> i;
              bitValues.push(val);
              currentSum += val;
            }

            explanation = `/${cidr} = ${fullOctets * 8} Bits (volle Oktette) + ${remBits} Bits (im ${fullOctets + 1}. Oktett).
\nVolle Oktette: ${'255.'.repeat(fullOctets).slice(0, -1)}
Berechnung ${fullOctets + 1}. Oktett (${remBits} Bits gesetzt):
Bit-Stellen: 128  64  32  16   8   4   2   1
Binaer:      ${'1    '.repeat(remBits)}${'0    '.repeat(8 - remBits)}
Rechnung:    ${bitValues.join(' + ')} = ${currentSum}
\nGesamte Maske: ${maskToIp(maskInt)}`;
          }

          return explanation;
        })(),
      },
      {
        title: 'Schritt 2: Netzadresse berechnen (AND-Verknuepfung)',
        text: 'Die IP-Adresse wird bitweise mit der Subnetzmaske UND-verknuepft. Nur wo beide Bits 1 sind, bleibt das Ergebnis 1.',
        detail: `IP (Binaer):     ${formatBin(ipBin)}
Maske (Binaer):  ${formatBin(maskBin)}
--------------------------------------------------- (AND)
Netz (Binaer):   ${formatBin(netBin)}
Netz (Dezimal):  ${intToIp(networkInt)}`,
      },
      {
        title: 'Schritt 3: Broadcast-Adresse berechnen',
        text: `Fuer die Broadcast-Adresse werden alle Host-Bits (die letzten ${32 - cidr} Bits) auf 1 gesetzt.`,
        detail: `Netz (Binaer):   ${formatBin(netBin)}
Host-Bits auf 1: ${'.'.repeat(Math.floor(cidr / 8)) + ' '.repeat(Math.floor(cidr / 8))}${'1'.repeat(32 - cidr).split('').join('')}
--------------------------------------------------- (OR)
Broadcast (Bin): ${formatBin(bcBin)}
Broadcast (Dez): ${intToIp(broadcastInt)}`,
      },
      {
        title: 'Schritt 4: Nutzbarer Host-Bereich und Anzahl',
        text: 'Der erste Host ist "Netzadresse + 1", der letzte Host ist "Broadcast - 1".',
        detail: `Netzadresse:   ${intToIp(networkInt)}
Erster Host:   ${intToIp(getFirstHost(networkInt))}
...
Letzter Host:  ${intToIp(getLastHost(broadcastInt))}
Broadcast:     ${intToIp(broadcastInt)}

Anzahl nutzbarer Hosts: 2^HostBits - 2
Host-Bits = 32 - ${cidr} = ${32 - cidr}
Rechnung: 2^${32 - cidr} - 2 = ${Math.pow(2, 32 - cidr)} - 2 = ${hostCount}`,
      },
    ];
  }

  function generateSplitExercise(difficulty) {
    let baseIp, baseCidr, numSubnets;

    if (difficulty === 1) {
      baseIp = `192.168.${randomInt(0, 255)}.0`;
      baseCidr = 24;
      numSubnets = [2, 4][randomInt(0, 1)];
    } else if (difficulty === 2) {
      baseIp = `172.${randomInt(16, 31)}.${randomInt(0, 255)}.0`;
      baseCidr = [22, 23, 24][randomInt(0, 2)];
      numSubnets = [2, 4, 8][randomInt(0, 2)];
    } else {
      baseIp = `10.${randomInt(0, 255)}.${randomInt(0, 255)}.0`;
      baseCidr = [16, 20, 22, 24][randomInt(0, 3)];
      numSubnets = [4, 8, 16][randomInt(0, 2)];
    }

    const bitsNeeded = Math.ceil(Math.log2(numSubnets));
    const newCidr = baseCidr + bitsNeeded;
    const baseInt = ipToInt(baseIp);
    const newMask = cidrToMask(newCidr);
    const subnetSize = 2 ** (32 - newCidr);

    const subnets = [];
    for (let i = 0; i < numSubnets; i++) {
      const netInt = (baseInt + i * subnetSize) >>> 0;
      const bcInt = getBroadcast(netInt, newMask);
      subnets.push({
        network: intToIp(netInt),
        broadcast: intToIp(bcInt),
        firstHost: intToIp(getFirstHost(netInt)),
        lastHost: intToIp(getLastHost(bcInt)),
        cidr: newCidr,
        hosts: getHostCount(newCidr),
      });
    }

    return {
      type: 'split',
      baseNetwork: `${baseIp}/${baseCidr}`,
      numSubnets,
      solution: {
        newCidr,
        newMask: maskToIp(newMask),
        bitsNeeded,
        subnets,
      },
      steps: [
        {
          title: 'Schritt 1: Benoetigte Bits und neue Maske',
          text: `Fuer ${numSubnets} Subnetze brauchen wir ${bitsNeeded} zusaetzliche Bits (2^${bitsNeeded} = ${2 ** bitsNeeded}).`,
          detail: `Basis-Netz:   /${baseCidr}
Neue Bits:    +${bitsNeeded}
Neue CIDR:    /${newCidr}
Neue Maske:   ${maskToIp(newMask)}`,
        },
        {
          title: 'Schritt 2: Blockgroesse (Magic Number) berechnen',
          text: 'Die Blockgroesse gibt an, in welchen Schritten die neuen Subnetze beginnen. Sie berechnet sich aus 2 hoch der verbleibenden Host-Bits im interessanten Oktett.',
          detail: `Verbleibende Host-Bits = 32 - ${newCidr} = ${32 - newCidr}
(Oder im relevanten Oktett: 8 - (${newCidr} % 8) = ${8 - (newCidr % 8)})

Blockgroesse = 2^${32 - newCidr} = ${subnetSize} Adressen pro Subnetz.`,
        },
        {
          title: 'Schritt 3: Subnetze auflisten',
          text: `Wir starten bei ${baseIp} und addieren jeweils die Blockgroesse von ${subnetSize}.`,
          detail: `
| Nr. | Netzadresse      | Erster Host      | Letzter Host     | Broadcast        |
|-----|------------------|------------------|------------------|------------------|
${subnets
              .map(
                (s, i) =>
                  `| ${(i + 1).toString().padEnd(3)} | ${s.network.padEnd(16)} | ${s.firstHost.padEnd(16)} | ${s.lastHost.padEnd(16)} | ${s.broadcast.padEnd(16)} |`
              )
              .join('\n')}
          `,
        },
      ],
    };
  }

  function generateIpRecognitionExercise() {
    const ips = [];
    // Ensure mix of public and private
    const privateRanges = [
      () => `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () =>
        `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () => `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () =>
        `127.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () => `169.254.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    ];
    const publicRanges = [
      () =>
        `${randomInt(1, 9)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () =>
        `${randomInt(11, 126)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () =>
        `${randomInt(128, 171)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () =>
        `${randomInt(173, 191)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      () =>
        `${randomInt(193, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
    ];

    // 3 private + 3 public, shuffled
    for (let i = 0; i < 3; i++) {
      const gen = privateRanges[randomInt(0, privateRanges.length - 1)];
      ips.push(gen());
    }
    for (let i = 0; i < 3; i++) {
      const gen = publicRanges[randomInt(0, publicRanges.length - 1)];
      ips.push(gen());
    }

    // Shuffle
    for (let i = ips.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [ips[i], ips[j]] = [ips[j], ips[i]];
    }

    return {
      type: 'iprecognition',
      ips: ips.map((ip) => ({
        ip,
        ...isPrivateIp(ipToInt(ip)),
      })),
    };
  }

  function generateIpv6Exercise() {
    // Generate a random IPv6 address with some zero groups for shortening practice
    const groups = [];
    const zeroStart = randomInt(1, 4);
    const zeroLen = randomInt(1, 3);

    for (let i = 0; i < 8; i++) {
      if (i >= zeroStart && i < zeroStart + zeroLen) {
        groups.push('0000');
      } else {
        // Some groups with leading zeros
        const val = randomInt(0, 0xffff);
        groups.push(val.toString(16).padStart(4, '0'));
      }
    }

    const fullAddress = groups.join(':');

    // Calculate short form
    const shortGroups = groups.map((g) => g.replace(/^0+/, '') || '0');

    // Find longest run of consecutive '0' groups for :: replacement
    let bestStart = -1,
      bestLen = 0,
      curStart = -1,
      curLen = 0;
    for (let i = 0; i < 8; i++) {
      if (shortGroups[i] === '0') {
        if (curStart === -1) curStart = i;
        curLen++;
        if (curLen > bestLen) {
          bestStart = curStart;
          bestLen = curLen;
        }
      } else {
        curStart = -1;
        curLen = 0;
      }
    }

    let shortAddress;
    if (bestLen >= 2) {
      const before = shortGroups.slice(0, bestStart).join(':');
      const after = shortGroups.slice(bestStart + bestLen).join(':');
      shortAddress = `${before}::${after}`;
      if (shortAddress.startsWith('::') && before === '') {
        shortAddress = `::${after}`;
      }
      if (shortAddress.endsWith('::') && after === '') {
        shortAddress = `${before}::`;
      }
    } else {
      shortAddress = shortGroups.join(':');
    }

    return {
      type: 'ipv6',
      fullAddress,
      shortAddress,
      groups,
      shortGroups,
      hasDoubleColon: bestLen >= 2,
      steps: [
        {
          title: 'Schritt 1: Fuehrende Nullen entfernen',
          text: 'In jeder Gruppe werden fuehrende Nullen entfernt.',
          detail: groups.map((g, i) => `${g} -> ${shortGroups[i]}`).join('\n'),
        },
        {
          title: 'Schritt 2: Laengste Nullgruppe mit :: ersetzen',
          text:
            bestLen >= 2
              ? `Die laengste zusammenhaengende Folge von Null-Gruppen (${bestLen} Gruppen ab Position ${bestStart + 1}) wird durch :: ersetzt.`
              : 'Keine zusammenhaengende Null-Gruppe mit 2+ Gruppen vorhanden, :: wird nicht verwendet.',
          detail: `Ergebnis: ${shortAddress}`,
        },
      ],
    };
  }

  // ---- Rendering Functions ----

  function render(container) {
    cleanup();
    currentTab = 'subnetting';
    renderView(container);
    setupKeyboard(container);
  }

  function renderView(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header">
          <div class="page-header-left">
            <a href="#/" class="btn btn-ghost btn-sm">&larr; Dashboard</a>
            <h1 class="page-title">IP-Adressen & Subnetting</h1>
          </div>
        </div>

        <div class="module-tabs">
          <button class="module-tab ${currentTab === 'subnetting' ? 'active' : ''}" data-tab="subnetting">
            Subnetting
          </button>
          <button class="module-tab ${currentTab === 'split' ? 'active' : ''}" data-tab="split">
            Netz aufteilen
          </button>
          <button class="module-tab ${currentTab === 'iprecognition' ? 'active' : ''}" data-tab="iprecognition">
            IP-Erkennung
          </button>
          <button class="module-tab ${currentTab === 'ipv6' ? 'active' : ''}" data-tab="ipv6">
            IPv6
          </button>
        </div>

        <div id="moduleContent"></div>
      </div>
    `;

    container.querySelectorAll('.module-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        currentTab = tab.dataset.tab;
        renderView(container);
      });
    });

    const content = container.querySelector('#moduleContent');
    switch (currentTab) {
      case 'subnetting':
        renderSubnettingTab(content);
        break;
      case 'split':
        renderSplitTab(content);
        break;
      case 'iprecognition':
        renderIpRecognitionTab(content);
        break;
      case 'ipv6':
        renderIpv6Tab(content);
        break;
    }
  }

  function renderDifficultySelector(activeDiff) {
    return `
      <div class="module-difficulty">
        <span class="module-difficulty-label">Schwierigkeit:</span>
        <button class="module-diff-btn ${activeDiff === 1 ? 'active' : ''}" data-diff="1">Leicht</button>
        <button class="module-diff-btn ${activeDiff === 2 ? 'active' : ''}" data-diff="2">Mittel</button>
        <button class="module-diff-btn ${activeDiff === 3 ? 'active' : ''}" data-diff="3">Schwer</button>
      </div>
    `;
  }

  function bindDifficultyButtons(container, callback) {
    container.querySelectorAll('.module-diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.module-diff-btn').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        callback(parseInt(btn.dataset.diff, 10));
      });
    });
  }

  // ---- Tab: Subnetting ----

  function renderSubnettingTab(container) {
    let difficulty = 1;
    currentExercise = generateSubnettingExercise(difficulty);

    function renderExercise() {
      const ex = currentExercise;
      container.innerHTML = `
        ${renderDifficultySelector(difficulty)}
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">Aufgabe</span>
          </div>
          <p class="module-exercise-question">
            Gegeben ist die IP-Adresse <strong>${ex.ip}/${ex.cidr}</strong>. Berechne die folgenden Werte:
          </p>

          <div class="module-input-grid">
            <div class="module-input-group">
              <label class="module-label">Subnetzmaske</label>
              <input type="text" class="module-input" id="answerMask" placeholder="z.B. 255.255.255.0" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Netzadresse</label>
              <input type="text" class="module-input" id="answerNetwork" placeholder="z.B. 192.168.1.0" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Broadcast</label>
              <input type="text" class="module-input" id="answerBroadcast" placeholder="z.B. 192.168.1.255" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Erster Host</label>
              <input type="text" class="module-input" id="answerFirstHost" placeholder="z.B. 192.168.1.1" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Letzter Host</label>
              <input type="text" class="module-input" id="answerLastHost" placeholder="z.B. 192.168.1.254" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Anzahl Hosts</label>
              <input type="text" class="module-input" id="answerHostCount" placeholder="z.B. 254" autocomplete="off" spellcheck="false">
            </div>
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="checkBtn">Pruefen</button>
            <button class="btn btn-ghost" id="newBtn">Neue Aufgabe</button>
            <button class="btn btn-ghost" id="showSolutionBtn">Loesung zeigen</button>
          </div>

          <div id="feedback"></div>
          <div id="steps"></div>
        </div>
      `;

      bindDifficultyButtons(container, (d) => {
        difficulty = d;
        currentExercise = generateSubnettingExercise(difficulty);
        renderExercise();
      });

      container
        .querySelector('#checkBtn')
        .addEventListener('click', () => checkSubnetting(container));
      container.querySelector('#newBtn').addEventListener('click', () => {
        currentExercise = generateSubnettingExercise(difficulty);
        renderExercise();
      });
      container
        .querySelector('#showSolutionBtn')
        .addEventListener('click', () => {
          showSolution(container, currentExercise);
        });

      // Enter key to check
      container.querySelectorAll('.module-input').forEach((input) => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') checkSubnetting(container);
        });
      });

      // Focus first input
      container.querySelector('#answerMask')?.focus();
    }

    renderExercise();
  }

  function checkSubnetting(container) {
    const ex = currentExercise;
    const sol = ex.solution;

    const fields = [
      { id: 'answerMask', correct: sol.subnetMask, label: 'Subnetzmaske' },
      {
        id: 'answerNetwork',
        correct: sol.networkAddress,
        label: 'Netzadresse',
      },
      { id: 'answerBroadcast', correct: sol.broadcast, label: 'Broadcast' },
      { id: 'answerFirstHost', correct: sol.firstHost, label: 'Erster Host' },
      { id: 'answerLastHost', correct: sol.lastHost, label: 'Letzter Host' },
      {
        id: 'answerHostCount',
        correct: String(sol.hostCount),
        label: 'Anzahl Hosts',
      },
    ];

    let allCorrect = true;
    const results = [];

    fields.forEach((f) => {
      const input = container.querySelector(`#${f.id}`);
      const userVal = input.value.trim();
      const isCorrect = userVal === f.correct;

      input.classList.remove('module-input-correct', 'module-input-wrong');
      if (userVal) {
        input.classList.add(
          isCorrect ? 'module-input-correct' : 'module-input-wrong'
        );
      }

      if (!isCorrect) allCorrect = false;
      results.push({ ...f, userVal, isCorrect });
    });

    const feedbackEl = container.querySelector('#feedback');
    if (allCorrect) {
      feedbackEl.innerHTML = `
        <div class="module-feedback module-feedback-success">
          Alles richtig! Sehr gut!
        </div>
      `;
    } else {
      const wrongOnes = results.filter((r) => !r.isCorrect);
      feedbackEl.innerHTML = `
        <div class="module-feedback module-feedback-error">
          ${wrongOnes.length} von ${fields.length} Feldern falsch oder leer.
          ${wrongOnes.map((r) => `<br><strong>${r.label}:</strong> ${r.userVal ? `Deine Antwort: ${escapeHtml(r.userVal)}` : 'Nicht ausgefuellt'} &rarr; Richtig: ${r.correct}`).join('')}
        </div>
      `;
    }

    showSteps(container, ex.steps);
  }

  // ---- Tab: Split ----

  function renderSplitTab(container) {
    let difficulty = 1;
    currentExercise = generateSplitExercise(difficulty);

    function renderExercise() {
      const ex = currentExercise;
      container.innerHTML = `
        ${renderDifficultySelector(difficulty)}
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">Aufgabe</span>
          </div>
          <p class="module-exercise-question">
            Teile das Netzwerk <strong>${ex.baseNetwork}</strong> in <strong>${ex.numSubnets} gleich grosse Subnetze</strong> auf.
          </p>

          <div class="module-input-grid">
            <div class="module-input-group">
              <label class="module-label">Neue Praefix-Laenge (CIDR)</label>
              <input type="text" class="module-input" id="answerNewCidr" placeholder="z.B. /26" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Neue Subnetzmaske</label>
              <input type="text" class="module-input" id="answerNewMask" placeholder="z.B. 255.255.255.192" autocomplete="off" spellcheck="false">
            </div>
            <div class="module-input-group">
              <label class="module-label">Hosts pro Subnetz</label>
              <input type="text" class="module-input" id="answerHostsPerSubnet" placeholder="z.B. 62" autocomplete="off" spellcheck="false">
            </div>
          </div>

          <p class="module-exercise-sublabel">Trage die Netzadressen der ${ex.numSubnets} Subnetze ein:</p>
          <div class="module-input-grid">
            ${ex.solution.subnets
          .map(
            (s, i) => `
              <div class="module-input-group">
                <label class="module-label">Subnetz ${i + 1} — Netzadresse</label>
                <input type="text" class="module-input subnet-answer" data-index="${i}" placeholder="z.B. ${i === 0 ? s.network : '...'}" autocomplete="off" spellcheck="false">
              </div>
            `
          )
          .join('')}
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="checkBtn">Pruefen</button>
            <button class="btn btn-ghost" id="newBtn">Neue Aufgabe</button>
            <button class="btn btn-ghost" id="showSolutionBtn">Loesung zeigen</button>
          </div>

          <div id="feedback"></div>
          <div id="steps"></div>
        </div>
      `;

      bindDifficultyButtons(container, (d) => {
        difficulty = d;
        currentExercise = generateSplitExercise(difficulty);
        renderExercise();
      });

      container
        .querySelector('#checkBtn')
        .addEventListener('click', () => checkSplit(container));
      container.querySelector('#newBtn').addEventListener('click', () => {
        currentExercise = generateSplitExercise(difficulty);
        renderExercise();
      });
      container
        .querySelector('#showSolutionBtn')
        .addEventListener('click', () => {
          showSolution(container, currentExercise);
        });

      container.querySelectorAll('.module-input').forEach((input) => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') checkSplit(container);
        });
      });

      container.querySelector('#answerNewCidr')?.focus();
    }

    renderExercise();
  }

  function checkSplit(container) {
    const ex = currentExercise;
    const sol = ex.solution;

    let allCorrect = true;
    const errors = [];

    // Check CIDR
    const cidrInput = container.querySelector('#answerNewCidr');
    const cidrVal = cidrInput.value.trim().replace(/^\//, '');
    const cidrCorrect = cidrVal === String(sol.newCidr);
    cidrInput.classList.remove('module-input-correct', 'module-input-wrong');
    if (cidrVal)
      cidrInput.classList.add(
        cidrCorrect ? 'module-input-correct' : 'module-input-wrong'
      );
    if (!cidrCorrect) {
      allCorrect = false;
      errors.push(
        `Praefix-Laenge: /${cidrVal || '?'} &rarr; Richtig: /${sol.newCidr}`
      );
    }

    // Check mask
    const maskInput = container.querySelector('#answerNewMask');
    const maskVal = maskInput.value.trim();
    const maskCorrect = maskVal === sol.newMask;
    maskInput.classList.remove('module-input-correct', 'module-input-wrong');
    if (maskVal)
      maskInput.classList.add(
        maskCorrect ? 'module-input-correct' : 'module-input-wrong'
      );
    if (!maskCorrect) {
      allCorrect = false;
      errors.push(
        `Subnetzmaske: ${maskVal || '?'} &rarr; Richtig: ${sol.newMask}`
      );
    }

    // Check hosts
    const hostsInput = container.querySelector('#answerHostsPerSubnet');
    const hostsVal = hostsInput.value.trim();
    const hostsCorrect = hostsVal === String(sol.subnets[0].hosts);
    hostsInput.classList.remove('module-input-correct', 'module-input-wrong');
    if (hostsVal)
      hostsInput.classList.add(
        hostsCorrect ? 'module-input-correct' : 'module-input-wrong'
      );
    if (!hostsCorrect) {
      allCorrect = false;
      errors.push(
        `Hosts pro Subnetz: ${hostsVal || '?'} &rarr; Richtig: ${sol.subnets[0].hosts}`
      );
    }

    // Check subnet addresses
    container.querySelectorAll('.subnet-answer').forEach((input) => {
      const idx = parseInt(input.dataset.index, 10);
      const val = input.value.trim();
      const correct = val === sol.subnets[idx].network;
      input.classList.remove('module-input-correct', 'module-input-wrong');
      if (val)
        input.classList.add(
          correct ? 'module-input-correct' : 'module-input-wrong'
        );
      if (!correct) {
        allCorrect = false;
        errors.push(
          `Subnetz ${idx + 1}: ${val || '?'} &rarr; Richtig: ${sol.subnets[idx].network}`
        );
      }
    });

    const feedbackEl = container.querySelector('#feedback');
    if (allCorrect) {
      feedbackEl.innerHTML = `<div class="module-feedback module-feedback-success">Alles richtig!</div>`;
    } else {
      feedbackEl.innerHTML = `
        <div class="module-feedback module-feedback-error">
          ${errors.length} Fehler:<br>${errors.map((e) => `<strong>${e}</strong>`).join('<br>')}
        </div>
      `;
    }

    showSteps(container, ex.steps);
  }

  // ---- Tab: IP Recognition ----

  function renderIpRecognitionTab(container) {
    currentExercise = generateIpRecognitionExercise();

    function renderExercise() {
      const ex = currentExercise;
      container.innerHTML = `
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">Aufgabe</span>
          </div>
          <p class="module-exercise-question">
            Ordne jede IP-Adresse zu: Ist sie <strong>privat</strong> oder <strong>oeffentlich</strong>?
          </p>

          <div class="module-ip-list">
            ${ex.ips
          .map(
            (item, i) => `
              <div class="module-ip-row" data-index="${i}">
                <code class="module-ip-addr">${item.ip}</code>
                <div class="module-ip-btns">
                  <button class="module-ip-btn" data-choice="private" data-index="${i}">Privat</button>
                  <button class="module-ip-btn" data-choice="public" data-index="${i}">Oeffentlich</button>
                </div>
                <span class="module-ip-result" id="ipResult${i}"></span>
              </div>
            `
          )
          .join('')}
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="checkBtn">Pruefen</button>
            <button class="btn btn-ghost" id="newBtn">Neue Aufgabe</button>
          </div>

          <div id="feedback"></div>
        </div>
      `;

      // Toggle selection
      container.querySelectorAll('.module-ip-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const row = btn.closest('.module-ip-row');
          row.querySelectorAll('.module-ip-btn').forEach((b) => {
            b.classList.remove('selected');
          });
          btn.classList.add('selected');
        });
      });

      container
        .querySelector('#checkBtn')
        .addEventListener('click', () => checkIpRecognition(container));
      container.querySelector('#newBtn').addEventListener('click', () => {
        currentExercise = generateIpRecognitionExercise();
        renderExercise();
      });
    }

    renderExercise();
  }

  function checkIpRecognition(container) {
    const ex = currentExercise;
    let correct = 0;

    ex.ips.forEach((item, i) => {
      const row = container.querySelector(`.module-ip-row[data-index="${i}"]`);
      const selected = row.querySelector('.module-ip-btn.selected');
      const resultEl = container.querySelector(`#ipResult${i}`);

      if (!selected) {
        resultEl.textContent = 'Nicht ausgewaehlt';
        resultEl.className = 'module-ip-result module-ip-result-wrong';
        return;
      }

      const userChoice = selected.dataset.choice;
      const isCorrect = (userChoice === 'private') === item.private;

      if (isCorrect) {
        correct++;
        resultEl.textContent = `Richtig! ${item.range}`;
        resultEl.className = 'module-ip-result module-ip-result-correct';
      } else {
        resultEl.textContent = `Falsch! ${item.range}`;
        resultEl.className = 'module-ip-result module-ip-result-wrong';
      }

      row.querySelectorAll('.module-ip-btn').forEach((b) => {
        b.disabled = true;
        const choice = b.dataset.choice;
        if ((choice === 'private') === item.private) {
          b.classList.add('correct-answer');
        }
      });
    });

    const feedbackEl = container.querySelector('#feedback');
    if (correct === ex.ips.length) {
      feedbackEl.innerHTML = `<div class="module-feedback module-feedback-success">${correct}/${ex.ips.length} richtig!</div>`;
    } else {
      feedbackEl.innerHTML = `<div class="module-feedback module-feedback-error">${correct}/${ex.ips.length} richtig.</div>`;
    }
  }

  // ---- Tab: IPv6 ----

  function renderIpv6Tab(container) {
    currentExercise = generateIpv6Exercise();

    function renderExercise() {
      const ex = currentExercise;
      container.innerHTML = `
        <div class="module-exercise-card">
          <div class="module-exercise-header">
            <span class="module-exercise-badge">Aufgabe</span>
          </div>
          <p class="module-exercise-question">
            Kuerze die folgende IPv6-Adresse in die kuerzeste gueltige Form:
          </p>
          <div class="module-ipv6-display">
            <code>${ex.fullAddress}</code>
          </div>

          <div class="module-input-grid">
            <div class="module-input-group module-input-wide">
              <label class="module-label">Gekuerzte IPv6-Adresse</label>
              <input type="text" class="module-input module-input-mono" id="answerIpv6" placeholder="z.B. 2001:db8::1" autocomplete="off" spellcheck="false">
            </div>
          </div>

          <div class="module-actions">
            <button class="btn btn-primary" id="checkBtn">Pruefen</button>
            <button class="btn btn-ghost" id="newBtn">Neue Aufgabe</button>
            <button class="btn btn-ghost" id="showSolutionBtn">Loesung zeigen</button>
          </div>

          <div id="feedback"></div>
          <div id="steps"></div>
        </div>
      `;

      container
        .querySelector('#checkBtn')
        .addEventListener('click', () => checkIpv6(container));
      container.querySelector('#newBtn').addEventListener('click', () => {
        currentExercise = generateIpv6Exercise();
        renderExercise();
      });
      container
        .querySelector('#showSolutionBtn')
        .addEventListener('click', () => {
          showSolution(container, currentExercise);
        });

      container
        .querySelector('#answerIpv6')
        ?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') checkIpv6(container);
        });

      container.querySelector('#answerIpv6')?.focus();
    }

    renderExercise();
  }

  function checkIpv6(container) {
    const ex = currentExercise;
    const input = container.querySelector('#answerIpv6');
    const userVal = input.value.trim().toLowerCase();
    const correctVal = ex.shortAddress.toLowerCase();

    // Also accept valid alternative shortenings
    const isCorrect = normalizeIpv6(userVal) === normalizeIpv6(correctVal);

    input.classList.remove('module-input-correct', 'module-input-wrong');
    input.classList.add(
      isCorrect ? 'module-input-correct' : 'module-input-wrong'
    );

    const feedbackEl = container.querySelector('#feedback');
    if (isCorrect) {
      feedbackEl.innerHTML = `<div class="module-feedback module-feedback-success">Richtig!</div>`;
    } else {
      feedbackEl.innerHTML = `
        <div class="module-feedback module-feedback-error">
          Nicht ganz. Die kuerzeste Form ist: <code>${ex.shortAddress}</code>
        </div>
      `;
    }

    showSteps(container, ex.steps);
  }

  function normalizeIpv6(addr) {
    // Expand :: to full form for comparison
    const parts = addr.split('::');
    let groups;
    if (parts.length === 2) {
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const missing = 8 - left.length - right.length;
      groups = [...left, ...Array(missing).fill('0'), ...right];
    } else {
      groups = addr.split(':');
    }
    return groups.map((g) => parseInt(g || '0', 16).toString(16)).join(':');
  }

  // ---- Shared UI Functions ----

  function showSteps(container, steps) {
    const stepsEl = container.querySelector('#steps');
    if (!stepsEl || !steps) return;

    stepsEl.innerHTML = `
      <div class="module-steps">
        <h3 class="module-steps-title">Loesungsweg</h3>
        ${steps
        .map(
          (s) => `
          <div class="module-step">
            <div class="module-step-title">${s.title}</div>
            <div class="module-step-text">${s.text}</div>
            ${s.detail ? `<pre class="module-step-detail">${escapeHtml(s.detail)}</pre>` : ''}
          </div>
        `
        )
        .join('')}
      </div>
    `;
  }

  function showSolution(container, exercise) {
    if (exercise.type === 'subnetting') {
      const sol = exercise.solution;
      const fields = {
        answerMask: sol.subnetMask,
        answerNetwork: sol.networkAddress,
        answerBroadcast: sol.broadcast,
        answerFirstHost: sol.firstHost,
        answerLastHost: sol.lastHost,
        answerHostCount: String(sol.hostCount),
      };
      Object.entries(fields).forEach(([id, val]) => {
        const input = container.querySelector(`#${id}`);
        if (input) {
          input.value = val;
          input.classList.add('module-input-correct');
        }
      });
    } else if (exercise.type === 'split') {
      const sol = exercise.solution;
      const cidrInput = container.querySelector('#answerNewCidr');
      if (cidrInput) {
        cidrInput.value = `/${sol.newCidr}`;
        cidrInput.classList.add('module-input-correct');
      }
      const maskInput = container.querySelector('#answerNewMask');
      if (maskInput) {
        maskInput.value = sol.newMask;
        maskInput.classList.add('module-input-correct');
      }
      const hostsInput = container.querySelector('#answerHostsPerSubnet');
      if (hostsInput) {
        hostsInput.value = String(sol.subnets[0].hosts);
        hostsInput.classList.add('module-input-correct');
      }
      container.querySelectorAll('.subnet-answer').forEach((input) => {
        const idx = parseInt(input.dataset.index, 10);
        input.value = sol.subnets[idx].network;
        input.classList.add('module-input-correct');
      });
    } else if (exercise.type === 'ipv6') {
      const input = container.querySelector('#answerIpv6');
      if (input) {
        input.value = exercise.shortAddress;
        input.classList.add('module-input-correct');
      }
    }

    showSteps(container, exercise.steps);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setupKeyboard(_container) {
    cleanup();
    keyHandler = (_e) => {
      // No global shortcuts needed for this module (inputs handle Enter)
    };
  }

  function cleanup() {
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  return { render, cleanup };
})();

export default SubnettingView;
