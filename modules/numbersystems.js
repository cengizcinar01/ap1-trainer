// ============================================================
// numbersystems.js — Zahlensysteme & Speichergroessen (Modul 4)
// 4 Tabs: Erklaerung, Zahlensysteme, Speicherrechner, Aufgaben
// IHK AP1-focused: KiB vs KB, Transfer-Zeit, Bildspeicher
// ============================================================

const NumberSystemsView = (() => {
  let currentTab = 'explanation';
  let cleanup_fns = [];
  const progress = loadProgress();
  let currentExercise = 0;
  let _exerciseState = {};

  // ============================================================
  // DATA: IHK Exam Exercises
  // ============================================================

  const EXERCISES = [
    {
      id: 1,
      title: 'Dezimal zu Binaer',
      difficulty: 'Leicht',
      source: 'Grundlagen',
      type: 'dec_to_bin',
      description:
        'Wandle die folgenden Dezimalzahlen in ihre <strong>8-Bit Binaerdarstellung</strong> um. Zeige, dass du die Restwertmethode beherrschst.',
      tasks: [
        { value: 42, bits: 8, label: 'Dezimal 42' },
        { value: 78, bits: 8, label: 'Dezimal 78' },
        { value: 200, bits: 8, label: 'Dezimal 200' },
      ],
      hint: 'Teile die Zahl wiederholt durch 2 und notiere die Reste von unten nach oben.',
    },
    {
      id: 2,
      title: 'Hexadezimal-Umrechnung',
      difficulty: 'Leicht',
      source: 'AP1 Grundlagen',
      type: 'hex_conversion',
      description:
        'Rechne zwischen <strong>Hexadezimal</strong> und <strong>Dezimal</strong> um. Denke daran: Hex-Ziffern gehen von 0-9 und A-F.',
      tasks: [
        { from: 'hex', to: 'dec', value: '4E', label: 'Hex 4E → Dezimal' },
        { from: 'dec', to: 'hex', value: 255, label: 'Dezimal 255 → Hex' },
        { from: 'hex', to: 'dec', value: 'FF', label: 'Hex FF → Dezimal' },
        { from: 'dec', to: 'hex', value: 171, label: 'Dezimal 171 → Hex' },
      ],
      hint: 'Hex → Dez: Jede Stelle mit 16^Position multiplizieren. Dez → Hex: Wiederholt durch 16 teilen.',
    },
    {
      id: 3,
      title: 'Binaer zu Hexadezimal',
      difficulty: 'Mittel',
      source: 'AP1 H2022 (angelehnt)',
      type: 'bin_to_hex',
      description:
        'Nutze die <strong>4er-Gruppierung</strong>, um Binaerzahlen direkt in Hexadezimal umzurechnen. Gruppiere von rechts nach links!',
      tasks: [
        { binary: '11111010', label: '1111 1010' },
        { binary: '10110011', label: '1011 0011' },
        { binary: '0100111011010010', label: '0100 1110 1101 0010' },
      ],
      hint: 'Gruppiere die Binaerzahl in 4er-Bloecke (von rechts). Jeder Block ergibt eine Hex-Ziffer (0000=0, 1111=F).',
    },
    {
      id: 4,
      title: 'KiB vs. KB — Die Pruefungsfalle',
      difficulty: 'Mittel',
      source: 'AP1 F2024 / H2022',
      type: 'storage_units',
      description:
        'In der IHK-Pruefung wird <strong>exakt</strong> zwischen SI-Einheiten (KB, MB, GB) und IEC-Einheiten (KiB, MiB, GiB) unterschieden. <strong>Achtung:</strong> Ein falscher Divisor kostet alle Punkte!',
      tasks: [
        {
          question: 'Wie viele KiB sind 5 MiB?',
          answer: 5120,
          unit: 'KiB',
          explanation: '5 × 1.024 = 5.120 KiB',
        },
        {
          question: 'Rechne 2.048 KiB in MiB um.',
          answer: 2,
          unit: 'MiB',
          explanation: '2.048 / 1.024 = 2 MiB',
        },
        {
          question: 'Wie viele Byte sind 4 KiB?',
          answer: 4096,
          unit: 'Byte',
          explanation: '4 × 1.024 = 4.096 Byte',
        },
        {
          question: 'Rechne 1.500.000 Byte in MB (SI) um.',
          answer: 1.5,
          unit: 'MB',
          explanation: '1.500.000 / 1.000.000 = 1,5 MB',
        },
        {
          question:
            'Rechne 1.500.000 Byte in MiB (IEC) um. Runde auf 2 Nachkommastellen.',
          answer: 1.43,
          unit: 'MiB',
          explanation: '1.500.000 / 1.048.576 ≈ 1,43 MiB',
        },
      ],
      hint: 'SI: 1 KB = 1.000 Byte, 1 MB = 1.000.000 Byte | IEC: 1 KiB = 1.024 Byte, 1 MiB = 1.048.576 Byte',
    },
    {
      id: 5,
      title: 'Datenuebertragungszeit',
      difficulty: 'Mittel',
      source: 'AP1 F2024 Aufg. 4f',
      type: 'transfer_time',
      description:
        'Berechne die Uebertragungszeit. <strong>Wichtig:</strong> Das Ergebnis muss in <strong>Minuten und Sekunden</strong> angegeben werden (auf volle Sekunden aufrunden).',
      tasks: [
        {
          fileSize: 2.5,
          fileSizeUnit: 'GiB',
          speed: 100,
          speedUnit: 'Mbit/s',
          label: '2,5 GiB bei 100 Mbit/s',
          answerSeconds: 215,
          answerMinutes: 3,
          answerRestSeconds: 35,
          explanation:
            '2,5 GiB = 2,5 × 1.073.741.824 Byte = 2.684.354.560 Byte\n→ × 8 = 21.474.836.480 Bit\n÷ 100.000.000 = 214,75 Sekunden\n→ aufgerundet: 215 Sekunden = 3 Minuten und 35 Sekunden',
        },
        {
          fileSize: 750,
          fileSizeUnit: 'MB',
          speed: 50,
          speedUnit: 'Mbit/s',
          label: '750 MB bei 50 Mbit/s',
          answerSeconds: 120,
          answerMinutes: 2,
          answerRestSeconds: 0,
          explanation:
            '750 MB = 750.000.000 Byte\n→ × 8 = 6.000.000.000 Bit\n÷ 50.000.000 = 120 Sekunden\n→ 2 Minuten und 0 Sekunden',
        },
        {
          fileSize: 4,
          fileSizeUnit: 'GiB',
          speed: 250,
          speedUnit: 'Mbit/s',
          label: '4 GiB bei 250 Mbit/s',
          answerSeconds: 138,
          answerMinutes: 2,
          answerRestSeconds: 18,
          explanation:
            '4 GiB = 4 × 1.073.741.824 Byte = 4.294.967.296 Byte\n→ × 8 = 34.359.738.368 Bit\n÷ 250.000.000 = 137,44 Sekunden\n→ aufgerundet: 138 Sekunden = 2 Minuten und 18 Sekunden',
        },
      ],
      hint: 'Formel: Zeit = (Datenmenge in Byte × 8) / (Geschwindigkeit in Bit/s). Byte zu Bit: ×8! GiB: ×1.073.741.824',
    },
    {
      id: 6,
      title: 'Bildspeicher berechnen',
      difficulty: 'Mittel',
      source: 'AP1 F2024 Aufg. 2',
      type: 'image_storage',
      description:
        'Berechne den Speicherbedarf von Bildern. <strong>Formel:</strong> Breite × Hoehe × Farbtiefe (Bit) / 8 = Byte',
      tasks: [
        {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          label: '1920×1080 bei 24 Bit Farbtiefe',
          answerBytes: 6220800,
          answerMiB: 5.93,
          explanation:
            '1.920 × 1.080 × 24 Bit = 49.766.400 Bit\n÷ 8 = 6.220.800 Byte\n÷ 1.048.576 ≈ 5,93 MiB',
        },
        {
          width: 1920,
          height: 1080,
          colorDepth: 32,
          label: '1920×1080 bei 32 Bit Farbtiefe',
          answerBytes: 8294400,
          answerMiB: 7.91,
          explanation:
            '1.920 × 1.080 × 32 Bit = 66.355.200 Bit\n÷ 8 = 8.294.400 Byte\n÷ 1.048.576 ≈ 7,91 MiB',
        },
        {
          width: 3840,
          height: 2160,
          colorDepth: 24,
          label: '4K (3840×2160) bei 24 Bit',
          answerBytes: 24883200,
          answerMiB: 23.73,
          explanation:
            '3.840 × 2.160 × 24 Bit = 199.065.600 Bit\n÷ 8 = 24.883.200 Byte\n÷ 1.048.576 ≈ 23,73 MiB',
        },
      ],
      bonusQuestion: {
        question:
          'Wie viel Prozent mehr Speicher braucht 32 Bit gegenueber 24 Bit Farbtiefe?',
        answer: 33.33,
        tolerance: 0.5,
        explanation: '(32 - 24) / 24 × 100 = 33,33% mehr Speicher',
      },
      hint: 'Formel: Breite × Hoehe × Farbtiefe (Bit). Das Ergebnis durch 8 teilen fuer Byte.',
    },
    {
      id: 7,
      title: 'Gemischte Pruefungsaufgabe',
      difficulty: 'Schwer',
      source: 'AP1 Pruefungsniveau',
      type: 'mixed',
      description:
        'Eine typische AP1-Pruefungsaufgabe mit mehreren Teilaufgaben zu Zahlensystemen und Speicherberechnung.',
      tasks: [
        {
          question: 'Wandle Dezimal 156 in Binaer um (8 Bit).',
          type: 'dec_to_bin',
          answer: '10011100',
          label: 'a)',
        },
        {
          question: 'Wandle Binaer 10101011 in Hexadezimal um.',
          type: 'bin_to_hex',
          answer: 'AB',
          label: 'b)',
        },
        {
          question: 'Wie viele MiB sind 3 GiB?',
          type: 'unit',
          answer: 3072,
          unit: 'MiB',
          label: 'c)',
        },
        {
          question:
            'Ein Bild hat 2560×1440 Pixel bei 32 Bit Farbtiefe. Wie gross ist es in MiB? (2 Nachkommastellen)',
          type: 'image',
          answer: 14.07,
          unit: 'MiB',
          label: 'd)',
          explanation:
            '2.560 × 1.440 × 32 = 117.964.800 Bit\n÷ 8 = 14.745.600 Byte\n÷ 1.048.576 ≈ 14,07 MiB',
        },
        {
          question:
            'Wie lange dauert die Uebertragung von 500 MiB bei 80 Mbit/s? (Minuten und Sekunden, aufrunden)',
          type: 'transfer',
          answerMinutes: 1,
          answerSeconds: 53,
          label: 'e)',
          totalSeconds: 53,
          explanation:
            '500 MiB = 524.288.000 Byte\n× 8 = 4.194.304.000 Bit\n÷ 80.000.000 = 52,43 s\n→ aufgerundet: 53 Sekunden = 0 Minuten und 53 Sekunden',
        },
      ],
      hint: 'Lies jede Teilaufgabe genau: Achte auf KiB vs. KB und auf die geforderte Einheit!',
    },
  ];

  // ============================================================
  // PERSISTENCE
  // ============================================================

  function loadProgress() {
    try {
      return (
        JSON.parse(localStorage.getItem('ap1_numbersystems_progress')) || {
          exercises: {},
        }
      );
    } catch {
      return { exercises: {} };
    }
  }

  function saveProgress() {
    localStorage.setItem(
      'ap1_numbersystems_progress',
      JSON.stringify(progress)
    );
  }

  // ============================================================
  // CONVERSION HELPERS
  // ============================================================

  function decToBin(dec, bits = 8) {
    if (dec < 0) return '';
    const result = dec.toString(2);
    return result.padStart(bits, '0');
  }

  function decToHex(dec) {
    return dec.toString(16).toUpperCase();
  }

  function decToOct(dec) {
    return dec.toString(8);
  }

  function binToDec(bin) {
    return Number.parseInt(bin, 2);
  }

  function hexToDec(hex) {
    return Number.parseInt(hex, 16);
  }

  function _octToDec(oct) {
    return Number.parseInt(oct, 8);
  }

  function binToHex(bin) {
    const dec = binToDec(bin);
    return decToHex(dec);
  }

  function _hexToBin(hex, bits = 0) {
    const dec = hexToDec(hex);
    const bin = dec.toString(2);
    const targetBits = bits || Math.ceil(bin.length / 4) * 4;
    return bin.padStart(targetBits, '0');
  }

  // Step-by-step: Decimal to Binary (Restwertmethode)
  function decToBinSteps(dec) {
    const steps = [];
    let n = dec;
    if (n === 0) {
      steps.push({ dividend: 0, quotient: 0, remainder: 0 });
      return { steps, result: '0' };
    }
    while (n > 0) {
      steps.push({
        dividend: n,
        quotient: Math.floor(n / 2),
        remainder: n % 2,
      });
      n = Math.floor(n / 2);
    }
    const result = steps
      .map((s) => s.remainder)
      .reverse()
      .join('');
    return { steps, result };
  }

  // Step-by-step: Decimal to Hex
  function decToHexSteps(dec) {
    const hexChars = '0123456789ABCDEF';
    const steps = [];
    let n = dec;
    if (n === 0) {
      steps.push({ dividend: 0, quotient: 0, remainder: 0, hexChar: '0' });
      return { steps, result: '0' };
    }
    while (n > 0) {
      const rem = n % 16;
      steps.push({
        dividend: n,
        quotient: Math.floor(n / 16),
        remainder: rem,
        hexChar: hexChars[rem],
      });
      n = Math.floor(n / 16);
    }
    const result = steps
      .map((s) => s.hexChar)
      .reverse()
      .join('');
    return { steps, result };
  }

  // Step-by-step: Binary to Hex (4er-Gruppierung)
  function binToHexSteps(bin) {
    // Pad to multiple of 4
    const padded = bin.padStart(Math.ceil(bin.length / 4) * 4, '0');
    const groups = [];
    const hexChars = '0123456789ABCDEF';
    for (let i = 0; i < padded.length; i += 4) {
      const group = padded.substring(i, i + 4);
      const dec = Number.parseInt(group, 2);
      groups.push({ binary: group, decimal: dec, hex: hexChars[dec] });
    }
    return { groups, result: groups.map((g) => g.hex).join('') };
  }

  // Step-by-step: Hex to Decimal
  function hexToDecSteps(hex) {
    const hexStr = hex.toUpperCase();
    const steps = [];
    for (let i = 0; i < hexStr.length; i++) {
      const char = hexStr[i];
      const value = Number.parseInt(char, 16);
      const position = hexStr.length - 1 - i;
      const contribution = value * 16 ** position;
      steps.push({
        char,
        value,
        position,
        power: 16 ** position,
        contribution,
      });
    }
    const result = steps.reduce((sum, s) => sum + s.contribution, 0);
    return { steps, result };
  }

  // Storage unit conversion
  const SI_UNITS = {
    Byte: 1,
    KB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,
  };

  const IEC_UNITS = {
    Byte: 1,
    KiB: 1024,
    MiB: 1024 ** 2,
    GiB: 1024 ** 3,
    TiB: 1024 ** 4,
  };

  function convertStorageUnit(value, fromUnit, toUnit) {
    const allUnits = { ...SI_UNITS, ...IEC_UNITS };
    const bytes = value * allUnits[fromUnit];
    return bytes / allUnits[toUnit];
  }

  function formatNumber(num) {
    if (Number.isInteger(num)) return num.toLocaleString('de-DE');
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  function render(container) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-2)">
          <div class="page-header-left">
            <div>
              <h1 class="page-title">Zahlensysteme & Speicher</h1>
              <p class="page-subtitle">Dez/Bin/Hex/Okt, KiB vs. KB, Transfer & Bildspeicher</p>
            </div>
          </div>

        </div>

        <div class="module-tabs">
          <button class="module-tab ${currentTab === 'explanation' ? 'active' : ''}" data-tab="explanation">Erklaerung</button>
          <button class="module-tab ${currentTab === 'converter' ? 'active' : ''}" data-tab="converter">Zahlensysteme</button>
          <button class="module-tab ${currentTab === 'storage' ? 'active' : ''}" data-tab="storage">Speicherrechner</button>
          <button class="module-tab ${currentTab === 'exercises' ? 'active' : ''}" data-tab="exercises">Aufgaben</button>
        </div>

        <div id="nsTabContent"></div>
      </div>
    `;

    container.querySelectorAll('.module-tab').forEach((tab) => {
      const handler = (e) => {
        currentTab = e.target.dataset.tab;
        container.querySelectorAll('.module-tab').forEach((t) => {
          t.classList.remove('active');
        });
        e.target.classList.add('active');
        renderTabContent();
      };
      tab.addEventListener('click', handler);
      cleanup_fns.push(() => tab.removeEventListener('click', handler));
    });

    renderTabContent();
  }

  function renderTabContent() {
    const el = document.getElementById('nsTabContent');
    if (!el) return;
    switch (currentTab) {
      case 'explanation':
        renderExplanation(el);
        break;
      case 'converter':
        renderConverter(el);
        break;
      case 'storage':
        renderStorage(el);
        break;
      case 'exercises':
        renderExercises(el);
        break;
    }
  }

  // ============================================================
  // TAB 1: ERKLAERUNG
  // ============================================================

  function renderExplanation(el) {
    el.innerHTML = `
      <div class="ns-explanation">
        <div class="ns-section">
          <h2 class="ns-section-title">Zahlensysteme im Ueberblick</h2>
          <div class="ns-card-grid">
            <div class="ns-info-card">
              <div class="ns-info-card-header">Dezimal (Basis 10)</div>
              <div class="ns-info-card-body">
                <p>Unser Alltagssystem mit den Ziffern <strong>0-9</strong>.</p>
                <div class="module-step-detail">Beispiel: 78 = 7×10¹ + 8×10⁰</div>
              </div>
            </div>
            <div class="ns-info-card">
              <div class="ns-info-card-header">Binaer (Basis 2)</div>
              <div class="ns-info-card-body">
                <p>Computer-Grundlage mit den Ziffern <strong>0</strong> und <strong>1</strong>.</p>
                <div class="module-step-detail">Beispiel: 1001110 = 78 dezimal</div>
              </div>
            </div>
            <div class="ns-info-card">
              <div class="ns-info-card-header">Hexadezimal (Basis 16)</div>
              <div class="ns-info-card-body">
                <p>Kompakte Darstellung mit <strong>0-9</strong> und <strong>A-F</strong>.</p>
                <div class="module-step-detail">Beispiel: 4E = 78 dezimal</div>
              </div>
            </div>
            <div class="ns-info-card">
              <div class="ns-info-card-header">Oktal (Basis 8)</div>
              <div class="ns-info-card-body">
                <p>Weniger verbreitet, Ziffern <strong>0-7</strong>. Kommt bei Unix-Berechtigungen vor.</p>
                <div class="module-step-detail">Beispiel: 116 = 78 dezimal</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ns-section">
          <h2 class="ns-section-title">Umrechnungsmethoden</h2>

          <div class="ns-method-card">
            <h3>Dezimal → Binaer: Restwertmethode (Modulo)</h3>
            <p>Teile die Zahl wiederholt durch 2. Notiere die <strong>Reste</strong>. Lies sie von <strong>unten nach oben</strong>.</p>
            <div class="module-step-detail">78 ÷ 2 = 39  Rest <strong>0</strong>
39 ÷ 2 = 19  Rest <strong>1</strong>
19 ÷ 2 =  9  Rest <strong>1</strong>
 9 ÷ 2 =  4  Rest <strong>1</strong>
 4 ÷ 2 =  2  Rest <strong>0</strong>
 2 ÷ 2 =  1  Rest <strong>0</strong>
 1 ÷ 2 =  0  Rest <strong>1</strong>
↑ Von unten lesen: <strong>1001110</strong></div>
          </div>

          <div class="ns-method-card">
            <h3>Binaer → Hexadezimal: 4er-Gruppierung</h3>
            <p>Gruppiere die Bits von <strong>rechts nach links</strong> in 4er-Bloecke. Jeder Block = 1 Hex-Ziffer.</p>
            <div class="module-step-detail">Binaer: 1111 1010
         ↓    ↓
Hex:     F    A
Ergebnis: <strong>FA</strong></div>
            <div class="ns-hex-table">
              <table>
                <tr><th>Bin</th><th>Hex</th><th>Dez</th><th></th><th>Bin</th><th>Hex</th><th>Dez</th></tr>
                <tr><td>0000</td><td>0</td><td>0</td><td></td><td>1000</td><td>8</td><td>8</td></tr>
                <tr><td>0001</td><td>1</td><td>1</td><td></td><td>1001</td><td>9</td><td>9</td></tr>
                <tr><td>0010</td><td>2</td><td>2</td><td></td><td>1010</td><td>A</td><td>10</td></tr>
                <tr><td>0011</td><td>3</td><td>3</td><td></td><td>1011</td><td>B</td><td>11</td></tr>
                <tr><td>0100</td><td>4</td><td>4</td><td></td><td>1100</td><td>C</td><td>12</td></tr>
                <tr><td>0101</td><td>5</td><td>5</td><td></td><td>1101</td><td>D</td><td>13</td></tr>
                <tr><td>0110</td><td>6</td><td>6</td><td></td><td>1110</td><td>E</td><td>14</td></tr>
                <tr><td>0111</td><td>7</td><td>7</td><td></td><td>1111</td><td>F</td><td>15</td></tr>
              </table>
            </div>
          </div>
        </div>

        <div class="ns-section">
          <h2 class="ns-section-title ns-alert-title">KiB vs. KB — Die Pruefungsfalle!</h2>
          <div class="ns-alert-card">
            <p><strong>In der IHK-Pruefung wird exakt unterschieden!</strong> Ein falscher Divisor = 0 Punkte.</p>
            <div class="ns-comparison-grid">
              <div class="ns-comparison-col ns-comparison-si">
                <h4>SI-Einheiten (Basis 10)</h4>
                <ul>
                  <li>1 KB = 1.000 Byte</li>
                  <li>1 MB = 1.000.000 Byte</li>
                  <li>1 GB = 1.000.000.000 Byte</li>
                  <li>1 TB = 1.000.000.000.000 Byte</li>
                </ul>
                <p class="ns-comparison-note">Verwendet von: Festplatten-Hersteller, Netzwerk</p>
              </div>
              <div class="ns-comparison-col ns-comparison-iec">
                <h4>IEC-Einheiten (Basis 2)</h4>
                <ul>
                  <li>1 KiB = 1.024 Byte</li>
                  <li>1 MiB = 1.048.576 Byte</li>
                  <li>1 GiB = 1.073.741.824 Byte</li>
                  <li>1 TiB = 1.099.511.627.776 Byte</li>
                </ul>
                <p class="ns-comparison-note">Verwendet von: Betriebssysteme, RAM</p>
              </div>
            </div>
          </div>
        </div>

        <div class="ns-section">
          <h2 class="ns-section-title">Wichtige Formeln</h2>

          <div class="ns-formula-grid">
            <div class="ns-formula-card">
              <h4>Bildspeicher</h4>
              <div class="module-step-detail">Speicher (Bit) = Breite × Hoehe × Farbtiefe
Speicher (Byte) = Speicher (Bit) / 8</div>
              <p class="ns-formula-example">1920×1080 bei 24 Bit = 6.220.800 Byte ≈ 5,93 MiB</p>
            </div>

            <div class="ns-formula-card">
              <h4>Datenuebertragung</h4>
              <div class="module-step-detail">Zeit (s) = Datenmenge (Bit) / Geschwindigkeit (Bit/s)

Achtung: Byte → Bit = ×8
         Mbit/s = 1.000.000 Bit/s</div>
              <p class="ns-formula-example">Ergebnis in Min:Sek umrechnen! (Pruefungsanforderung F2024)</p>
            </div>

            <div class="ns-formula-card">
              <h4>Farbtiefe & Speicher-Vergleich</h4>
              <div class="module-step-detail">Mehrverbrauch (%) = (neue - alte) / alte × 100

Beispiel: 24 Bit → 32 Bit
(32 - 24) / 24 × 100 = 33,33%</div>
              <p class="ns-formula-example">Kam in AP1 F2024 als Teilaufgabe dran!</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TAB 2: ZAHLENSYSTEME CONVERTER
  // ============================================================

  function renderConverter(el) {
    el.innerHTML = `
      <div class="ns-converter">
        <div class="ns-converter-section">
          <h2 class="ns-section-title">Interaktiver Zahlensystem-Umrechner</h2>
          <p class="ns-section-desc">Gib eine Zahl ein und sieh die Umrechnung <strong>mit Rechenweg</strong> in alle Systeme.</p>

          <div class="ns-converter-input-row">
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsConvInput">Eingabe</label>
              <input type="text" id="nsConvInput" class="module-input module-input-mono" value="78" placeholder="Zahl eingeben...">
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsConvBase">Eingabe-System</label>
              <select id="nsConvBase" class="module-input">
                <option value="10" selected>Dezimal (Basis 10)</option>
                <option value="2">Binaer (Basis 2)</option>
                <option value="16">Hexadezimal (Basis 16)</option>
                <option value="8">Oktal (Basis 8)</option>
              </select>
            </div>
          </div>

          <div id="nsConvResults" class="ns-conv-results"></div>
          <div id="nsConvSteps" class="ns-conv-steps"></div>
        </div>
      </div>
    `;

    const input = document.getElementById('nsConvInput');
    const base = document.getElementById('nsConvBase');

    function doConvert() {
      updateConversionResults();
    }

    input.addEventListener('input', doConvert);
    base.addEventListener('change', doConvert);
    cleanup_fns.push(() => {
      input.removeEventListener('input', doConvert);
      base.removeEventListener('change', doConvert);
    });

    doConvert();
  }

  function updateConversionResults() {
    const input = document.getElementById('nsConvInput');
    const base = document.getElementById('nsConvBase');
    const resultsEl = document.getElementById('nsConvResults');
    const stepsEl = document.getElementById('nsConvSteps');

    if (!input || !resultsEl || !stepsEl) return;

    const inputVal = input.value.trim().toUpperCase();
    const baseVal = Number.parseInt(base.value, 10);

    if (!inputVal) {
      resultsEl.innerHTML =
        '<p class="ns-conv-empty">Gib eine Zahl ein, um die Umrechnung zu sehen.</p>';
      stepsEl.innerHTML = '';
      return;
    }

    // Validate input
    const validChars = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^[0-9]+$/,
      16: /^[0-9A-F]+$/,
    };
    if (!validChars[baseVal].test(inputVal)) {
      resultsEl.innerHTML = `<div class="module-feedback module-feedback-error">Ungueltige Eingabe fuer Basis ${baseVal}.</div>`;
      stepsEl.innerHTML = '';
      return;
    }

    const decValue = Number.parseInt(inputVal, baseVal);
    if (Number.isNaN(decValue) || decValue < 0 || decValue > 4294967295) {
      resultsEl.innerHTML =
        '<div class="module-feedback module-feedback-error">Zahl ausserhalb des gueltigen Bereichs (0 - 4.294.967.295).</div>';
      stepsEl.innerHTML = '';
      return;
    }

    const bits = decValue <= 255 ? 8 : decValue <= 65535 ? 16 : 32;

    resultsEl.innerHTML = `
      <div class="ns-result-grid">
        <div class="ns-result-card ${baseVal === 10 ? 'ns-result-active' : ''}">
          <span class="ns-result-label">Dezimal</span>
          <span class="ns-result-value">${decValue}</span>
        </div>
        <div class="ns-result-card ${baseVal === 2 ? 'ns-result-active' : ''}">
          <span class="ns-result-label">Binaer (${bits} Bit)</span>
          <span class="ns-result-value">${formatBinary(decToBin(decValue, bits))}</span>
        </div>
        <div class="ns-result-card ${baseVal === 16 ? 'ns-result-active' : ''}">
          <span class="ns-result-label">Hexadezimal</span>
          <span class="ns-result-value">${decToHex(decValue)}</span>
        </div>
        <div class="ns-result-card ${baseVal === 8 ? 'ns-result-active' : ''}">
          <span class="ns-result-label">Oktal</span>
          <span class="ns-result-value">${decToOct(decValue)}</span>
        </div>
      </div>
    `;

    // Show conversion steps
    let stepsHtml = '<h3 class="ns-steps-title">Rechenweg</h3>';

    if (baseVal !== 10 && baseVal !== 2) {
      // Show step to decimal first if input is hex or octal
    }

    // Always show Dez → Bin steps
    if (decValue <= 1024) {
      const binSteps = decToBinSteps(decValue);
      stepsHtml += `
        <div class="ns-step-block">
          <h4>Dezimal ${decValue} → Binaer (Restwertmethode)</h4>
          <div class="module-step-detail">${binSteps.steps
            .map(
              (s) =>
                `${String(s.dividend).padStart(4)} ÷ 2 = ${String(s.quotient).padStart(4)}  Rest <strong>${s.remainder}</strong>`
            )
            .join('\n')}
↑ Von unten lesen: <strong>${binSteps.result}</strong></div>
        </div>
      `;
    }

    // Show Dez → Hex steps
    if (decValue > 0) {
      const hexSteps = decToHexSteps(decValue);
      stepsHtml += `
        <div class="ns-step-block">
          <h4>Dezimal ${decValue} → Hexadezimal</h4>
          <div class="module-step-detail">${hexSteps.steps
            .map(
              (s) =>
                `${String(s.dividend).padStart(6)} ÷ 16 = ${String(s.quotient).padStart(5)}  Rest ${String(s.remainder).padStart(2)} → <strong>${s.hexChar}</strong>`
            )
            .join('\n')}
↑ Von unten lesen: <strong>${hexSteps.result}</strong></div>
        </div>
      `;
    }

    // Show Bin → Hex (4er Gruppierung) if appropriate
    const binStr = decToBin(decValue, bits);
    const hexGroupSteps = binToHexSteps(binStr);
    stepsHtml += `
      <div class="ns-step-block">
        <h4>Binaer → Hexadezimal (4er-Gruppierung)</h4>
        <div class="module-step-detail">${hexGroupSteps.groups
          .map(
            (g) =>
              `${g.binary} → ${g.decimal.toString().padStart(2)} → <strong>${g.hex}</strong>`
          )
          .join('\n')}
Ergebnis: <strong>${hexGroupSteps.result}</strong></div>
      </div>
    `;

    // If input was hex, show Hex → Dez steps
    if (baseVal === 16) {
      const hdSteps = hexToDecSteps(inputVal);
      stepsHtml += `
        <div class="ns-step-block">
          <h4>Hexadezimal ${inputVal} → Dezimal (Stellenwertverfahren)</h4>
          <div class="module-step-detail">${hdSteps.steps
            .map(
              (s) =>
                `${s.char} × 16^${s.position} = ${s.value} × ${s.power} = <strong>${s.contribution}</strong>`
            )
            .join('\n')}
Summe: <strong>${hdSteps.result}</strong></div>
        </div>
      `;
    }

    stepsEl.innerHTML = stepsHtml;
  }

  function formatBinary(bin) {
    // Add spaces every 4 bits for readability
    const parts = [];
    for (let i = 0; i < bin.length; i += 4) {
      parts.push(bin.substring(i, i + 4));
    }
    return parts.join(' ');
  }

  // ============================================================
  // TAB 3: SPEICHERRECHNER
  // ============================================================

  function renderStorage(el) {
    el.innerHTML = `
      <div class="ns-storage">
        <!-- UNIT CONVERTER -->
        <div class="ns-storage-section">
          <h2 class="ns-section-title">Einheiten-Umrechner</h2>
          <div class="ns-unit-toggle">
            <span class="ns-toggle-label">Einheitensystem:</span>
            <button class="ns-toggle-btn ns-toggle-active" data-system="iec" id="nsToggleIEC">IEC (KiB, MiB, GiB) — Basis 2</button>
            <button class="ns-toggle-btn" data-system="si" id="nsToggleSI">SI (KB, MB, GB) — Basis 10</button>
          </div>

          <div class="ns-unit-converter-row">
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsUnitValue">Wert</label>
              <input type="number" id="nsUnitValue" class="module-input module-input-mono" value="1" step="any" min="0">
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsUnitFrom">Von</label>
              <select id="nsUnitFrom" class="module-input">
                <option value="Byte">Byte</option>
                <option value="KiB" selected>KiB</option>
                <option value="MiB">MiB</option>
                <option value="GiB">GiB</option>
                <option value="TiB">TiB</option>
              </select>
            </div>
            <span class="ns-arrow">→</span>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsUnitTo">Nach</label>
              <select id="nsUnitTo" class="module-input">
                <option value="Byte">Byte</option>
                <option value="KiB">KiB</option>
                <option value="MiB" selected>MiB</option>
                <option value="GiB">GiB</option>
                <option value="TiB">TiB</option>
              </select>
            </div>
          </div>
          <div id="nsUnitResult" class="ns-unit-result"></div>
        </div>

        <!-- TRANSFER CALCULATOR -->
        <div class="ns-storage-section">
          <h2 class="ns-section-title">Transfer-Rechner</h2>
          <p class="ns-section-desc">Eingabe: Datenmenge und Geschwindigkeit. Ausgabe: <strong>Zeit in Minuten und Sekunden</strong> (IHK-Anforderung F2024).</p>

          <div class="ns-transfer-grid">
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsTransferSize">Datenmenge</label>
              <input type="number" id="nsTransferSize" class="module-input module-input-mono" value="2.5" step="any" min="0">
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsTransferSizeUnit">Einheit</label>
              <select id="nsTransferSizeUnit" class="module-input">
                <option value="Byte">Byte</option>
                <option value="KB">KB (SI)</option>
                <option value="KiB">KiB (IEC)</option>
                <option value="MB">MB (SI)</option>
                <option value="MiB">MiB (IEC)</option>
                <option value="GB">GB (SI)</option>
                <option value="GiB" selected>GiB (IEC)</option>
                <option value="TB">TB (SI)</option>
                <option value="TiB">TiB (IEC)</option>
              </select>
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsTransferSpeed">Geschwindigkeit</label>
              <input type="number" id="nsTransferSpeed" class="module-input module-input-mono" value="100" step="any" min="0">
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsTransferSpeedUnit">Einheit</label>
              <select id="nsTransferSpeedUnit" class="module-input">
                <option value="bit">Bit/s</option>
                <option value="kbit">Kbit/s</option>
                <option value="mbit" selected>Mbit/s</option>
                <option value="gbit">Gbit/s</option>
              </select>
            </div>
          </div>
          <div id="nsTransferResult" class="ns-transfer-result"></div>
        </div>

        <!-- IMAGE STORAGE CALCULATOR -->
        <div class="ns-storage-section">
          <h2 class="ns-section-title">Bildspeicher-Rechner</h2>
          <p class="ns-section-desc">Formel: <strong>Breite × Hoehe × Farbtiefe (Bit) / 8 = Byte</strong></p>

          <div class="ns-image-grid">
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsImgWidth">Breite (Pixel)</label>
              <input type="number" id="nsImgWidth" class="module-input module-input-mono" value="1920" min="1">
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsImgHeight">Hoehe (Pixel)</label>
              <input type="number" id="nsImgHeight" class="module-input module-input-mono" value="1080" min="1">
            </div>
            <div class="ns-converter-input-group">
              <label class="module-label" for="nsImgDepth">Farbtiefe (Bit)</label>
              <select id="nsImgDepth" class="module-input">
                <option value="1">1 Bit (Schwarzweiss)</option>
                <option value="8">8 Bit (256 Farben)</option>
                <option value="16">16 Bit (High Color)</option>
                <option value="24" selected>24 Bit (True Color)</option>
                <option value="32">32 Bit (True Color + Alpha)</option>
                <option value="48">48 Bit (Deep Color)</option>
              </select>
            </div>
          </div>
          <div id="nsImageResult" class="ns-image-result"></div>
          <div id="nsImageCompare" class="ns-image-compare"></div>
        </div>
      </div>
    `;

    setupUnitConverter();
    setupTransferCalculator();
    setupImageCalculator();
  }

  function setupUnitConverter() {
    const valueEl = document.getElementById('nsUnitValue');
    const fromEl = document.getElementById('nsUnitFrom');
    const toEl = document.getElementById('nsUnitTo');
    const toggleIEC = document.getElementById('nsToggleIEC');
    const toggleSI = document.getElementById('nsToggleSI');
    const resultEl = document.getElementById('nsUnitResult');

    let _currentSystem = 'iec';

    function switchSystem(system) {
      _currentSystem = system;
      toggleIEC.classList.toggle('ns-toggle-active', system === 'iec');
      toggleSI.classList.toggle('ns-toggle-active', system === 'si');

      const units =
        system === 'iec'
          ? [
              ['Byte', 'Byte'],
              ['KiB', 'KiB'],
              ['MiB', 'MiB'],
              ['GiB', 'GiB'],
              ['TiB', 'TiB'],
            ]
          : [
              ['Byte', 'Byte'],
              ['KB', 'KB'],
              ['MB', 'MB'],
              ['GB', 'GB'],
              ['TB', 'TB'],
            ];

      const fromVal = fromEl.selectedIndex;
      const toVal = toEl.selectedIndex;

      fromEl.innerHTML = units
        .map(([v, l]) => `<option value="${v}">${l}</option>`)
        .join('');
      toEl.innerHTML = units
        .map(([v, l]) => `<option value="${v}">${l}</option>`)
        .join('');

      fromEl.selectedIndex = Math.min(fromVal, units.length - 1);
      toEl.selectedIndex = Math.min(toVal, units.length - 1);

      updateUnit();
    }

    function updateUnit() {
      const value = Number.parseFloat(valueEl.value);
      if (Number.isNaN(value) || value < 0) {
        resultEl.innerHTML = '';
        return;
      }

      const from = fromEl.value;
      const to = toEl.value;
      const result = convertStorageUnit(value, from, to);
      const allUnits = { ...SI_UNITS, ...IEC_UNITS };
      const bytes = value * allUnits[from];
      const _factor = allUnits[from] / allUnits[to];

      resultEl.innerHTML = `
        <div class="ns-calc-result">
          <div class="ns-calc-main">${formatNumber(value)} ${from} = <strong>${formatResultNumber(result)} ${to}</strong></div>
          <div class="ns-calc-detail">
            <div class="module-step-detail">${formatNumber(value)} ${from}
= ${formatNumber(bytes)} Byte
= ${formatResultNumber(result)} ${to}

Faktor: 1 ${from} = ${formatNumber(allUnits[from])} Byte
        1 ${to} = ${formatNumber(allUnits[to])} Byte</div>
          </div>
        </div>
      `;
    }

    toggleIEC.addEventListener('click', () => switchSystem('iec'));
    toggleSI.addEventListener('click', () => switchSystem('si'));
    valueEl.addEventListener('input', updateUnit);
    fromEl.addEventListener('change', updateUnit);
    toEl.addEventListener('change', updateUnit);

    cleanup_fns.push(() => {
      toggleIEC.removeEventListener('click', () => switchSystem('iec'));
      toggleSI.removeEventListener('click', () => switchSystem('si'));
      valueEl.removeEventListener('input', updateUnit);
      fromEl.removeEventListener('change', updateUnit);
      toEl.removeEventListener('change', updateUnit);
    });

    updateUnit();
  }

  function setupTransferCalculator() {
    const sizeEl = document.getElementById('nsTransferSize');
    const sizeUnitEl = document.getElementById('nsTransferSizeUnit');
    const speedEl = document.getElementById('nsTransferSpeed');
    const speedUnitEl = document.getElementById('nsTransferSpeedUnit');
    const resultEl = document.getElementById('nsTransferResult');

    const speedMultipliers = {
      bit: 1,
      kbit: 1000,
      mbit: 1000000,
      gbit: 1000000000,
    };

    function updateTransfer() {
      const size = Number.parseFloat(sizeEl.value);
      const speed = Number.parseFloat(speedEl.value);

      if (
        Number.isNaN(size) ||
        Number.isNaN(speed) ||
        size <= 0 ||
        speed <= 0
      ) {
        resultEl.innerHTML = '';
        return;
      }

      const allUnits = { ...SI_UNITS, ...IEC_UNITS };
      const bytes = size * allUnits[sizeUnitEl.value];
      const bits = bytes * 8;
      const bitsPerSec = speed * speedMultipliers[speedUnitEl.value];
      const rawSeconds = bits / bitsPerSec;
      const totalSeconds = Math.ceil(rawSeconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      let timeStr = '';
      if (hours > 0) {
        timeStr = `${hours} Stunde${hours !== 1 ? 'n' : ''}, ${minutes} Minute${minutes !== 1 ? 'n' : ''} und ${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
      } else if (minutes > 0) {
        timeStr = `${minutes} Minute${minutes !== 1 ? 'n' : ''} und ${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
      } else {
        timeStr = `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
      }

      resultEl.innerHTML = `
        <div class="ns-calc-result">
          <div class="ns-calc-main ns-calc-time">${timeStr}</div>
          <div class="ns-calc-sub">${totalSeconds} Sekunden (aufgerundet)</div>
          <div class="ns-calc-detail">
            <div class="module-step-detail">Rechenweg:
1. Datenmenge in Byte:  ${formatNumber(size)} ${sizeUnitEl.value} = ${formatNumber(bytes)} Byte
2. Byte → Bit (×8):    ${formatNumber(bytes)} × 8 = ${formatNumber(bits)} Bit
3. Geschwindigkeit:     ${formatNumber(speed)} ${speedUnitEl.options[speedUnitEl.selectedIndex].text} = ${formatNumber(bitsPerSec)} Bit/s
4. Zeit = Bit / (Bit/s): ${formatNumber(bits)} / ${formatNumber(bitsPerSec)} = ${rawSeconds.toFixed(4)} s
5. Aufgerundet:         <strong>${totalSeconds} Sekunden</strong>
6. Umrechnung:          <strong>${hours > 0 ? `${hours}h ` : ''}${minutes} Min ${seconds} Sek</strong></div>
          </div>
        </div>
      `;
    }

    [sizeEl, speedEl].forEach((el) => {
      el.addEventListener('input', updateTransfer);
      cleanup_fns.push(() => el.removeEventListener('input', updateTransfer));
    });
    [sizeUnitEl, speedUnitEl].forEach((el) => {
      el.addEventListener('change', updateTransfer);
      cleanup_fns.push(() => el.removeEventListener('change', updateTransfer));
    });

    updateTransfer();
  }

  function setupImageCalculator() {
    const widthEl = document.getElementById('nsImgWidth');
    const heightEl = document.getElementById('nsImgHeight');
    const depthEl = document.getElementById('nsImgDepth');
    const resultEl = document.getElementById('nsImageResult');
    const compareEl = document.getElementById('nsImageCompare');

    function updateImage() {
      const width = Number.parseInt(widthEl.value, 10);
      const height = Number.parseInt(heightEl.value, 10);
      const depth = Number.parseInt(depthEl.value, 10);

      if (
        Number.isNaN(width) ||
        Number.isNaN(height) ||
        width <= 0 ||
        height <= 0
      ) {
        resultEl.innerHTML = '';
        compareEl.innerHTML = '';
        return;
      }

      const pixels = width * height;
      const totalBits = pixels * depth;
      const totalBytes = totalBits / 8;
      const kiB = totalBytes / 1024;
      const miB = totalBytes / 1024 ** 2;
      const giB = totalBytes / 1024 ** 3;

      let sizeDisplay = '';
      if (giB >= 1) sizeDisplay = `${formatNumber(giB)} GiB`;
      else if (miB >= 1) sizeDisplay = `${formatNumber(miB)} MiB`;
      else sizeDisplay = `${formatNumber(kiB)} KiB`;

      resultEl.innerHTML = `
        <div class="ns-calc-result">
          <div class="ns-calc-main">${formatNumber(pixels)} Pixel × ${depth} Bit = <strong>${sizeDisplay}</strong></div>
          <div class="ns-calc-detail">
            <div class="module-step-detail">Rechenweg:
1. Pixel gesamt:    ${formatNumber(width)} × ${formatNumber(height)} = ${formatNumber(pixels)} Pixel
2. Speicher (Bit):  ${formatNumber(pixels)} × ${depth} = ${formatNumber(totalBits)} Bit
3. Speicher (Byte): ${formatNumber(totalBits)} / 8 = ${formatNumber(totalBytes)} Byte
4. In MiB:          ${formatNumber(totalBytes)} / 1.048.576 = <strong>${formatNumber(miB)} MiB</strong></div>
          </div>
        </div>
      `;

      // Color depth comparison
      const depths = [8, 16, 24, 32, 48];
      const _baseBytes24 = (pixels * 24) / 8;
      compareEl.innerHTML = `
        <h3 class="ns-compare-title">Farbtiefe-Vergleich (${formatNumber(width)}×${formatNumber(height)})</h3>
        <div class="ns-compare-bars">
          ${depths
            .map((d) => {
              const bytes = (pixels * d) / 8;
              const mib = bytes / 1024 ** 2;
              const pct = (bytes / ((pixels * 48) / 8)) * 100;
              const diff24 =
                d !== 24
                  ? ` (${d > 24 ? '+' : ''}${(((d - 24) / 24) * 100).toFixed(1)}% vs 24 Bit)`
                  : ' (Referenz)';
              return `
              <div class="ns-compare-bar-row">
                <span class="ns-compare-bar-label">${d} Bit${diff24}</span>
                <div class="ns-compare-bar-track">
                  <div class="ns-compare-bar-fill ${d === depth ? 'ns-compare-bar-active' : ''}" style="width:${pct}%"></div>
                </div>
                <span class="ns-compare-bar-value">${formatNumber(mib)} MiB</span>
              </div>
            `;
            })
            .join('')}
        </div>
      `;
    }

    [widthEl, heightEl].forEach((el) => {
      el.addEventListener('input', updateImage);
      cleanup_fns.push(() => el.removeEventListener('input', updateImage));
    });
    depthEl.addEventListener('change', updateImage);
    cleanup_fns.push(() => depthEl.removeEventListener('change', updateImage));

    updateImage();
  }

  function formatResultNumber(num) {
    if (Number.isInteger(num)) return num.toLocaleString('de-DE');
    // Show up to 6 significant decimals, trim trailing zeros
    const str = num.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    const parts = str.split('.');
    const intPart = Number.parseInt(parts[0], 10).toLocaleString('de-DE');
    return parts.length > 1 ? `${intPart},${parts[1]}` : intPart;
  }

  // ============================================================
  // TAB 4: AUFGABEN
  // ============================================================

  function renderExercises(el) {
    el.innerHTML = `
      <div class="ns-exercises">
        <div class="ns-exercise-nav" id="nsExerciseNav">
          ${EXERCISES.map(
            (ex, i) => `
            <button class="ns-exercise-btn ${i === currentExercise ? 'active' : ''} ${progress.exercises[ex.id]?.solved ? 'completed' : ''}"
                    data-index="${i}">
              <span class="ns-exercise-btn-num">${i + 1}</span>
              <span class="ns-exercise-btn-title">${ex.title}</span>
              <span class="ns-diff-badge ns-diff-${ex.difficulty.toLowerCase()}">${ex.difficulty}</span>
            </button>
          `
          ).join('')}
        </div>
        <div id="nsExerciseContent"></div>
      </div>
    `;

    el.querySelectorAll('.ns-exercise-btn').forEach((btn) => {
      const handler = () => {
        currentExercise = Number.parseInt(btn.dataset.index, 10);
        _exerciseState = {};
        el.querySelectorAll('.ns-exercise-btn').forEach((b) => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        renderExerciseContent();
      };
      btn.addEventListener('click', handler);
      cleanup_fns.push(() => btn.removeEventListener('click', handler));
    });

    renderExerciseContent();
  }

  function renderExerciseContent() {
    const contentEl = document.getElementById('nsExerciseContent');
    if (!contentEl) return;
    const ex = EXERCISES[currentExercise];

    contentEl.innerHTML = `
      <div class="module-exercise-card">
        <div class="module-exercise-header">
          <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
            <span class="ns-diff-badge ns-diff-${ex.difficulty.toLowerCase()}">${ex.difficulty}</span>
            <span class="module-exercise-badge">${ex.source}</span>
            ${progress.exercises[ex.id]?.solved ? '<span class="ns-solved-badge">Geloest</span>' : ''}
          </div>
          <h3 style="margin-top:var(--space-2);font-size:var(--font-size-xl)">${ex.title}</h3>
        </div>
        <div class="module-exercise-question">${ex.description}</div>

        <div id="nsExerciseTasks"></div>

        <div class="module-actions">
          <button class="btn btn-primary" id="nsCheckBtn">Pruefen</button>
          <button class="btn btn-ghost" id="nsHintBtn">Hinweis</button>
          <button class="btn btn-ghost" id="nsSolutionBtn">Loesung anzeigen</button>
        </div>

        <div id="nsExerciseFeedback"></div>
        <div id="nsExerciseHint" style="display:none"></div>
        <div id="nsExerciseSolution" style="display:none"></div>
      </div>
    `;

    renderExerciseTasks(ex);
    setupExerciseButtons(ex);
  }

  function renderExerciseTasks(ex) {
    const tasksEl = document.getElementById('nsExerciseTasks');
    if (!tasksEl) return;

    switch (ex.type) {
      case 'dec_to_bin':
        tasksEl.innerHTML = `
          <div class="module-input-grid">
            ${ex.tasks
              .map(
                (t, i) => `
              <div class="module-input-group">
                <label class="module-label">${t.label} → Binaer (${t.bits} Bit)</label>
                <input type="text" class="module-input module-input-mono ns-task-input" data-index="${i}" placeholder="z.B. 00101010" maxlength="${t.bits}">
              </div>
            `
              )
              .join('')}
          </div>
        `;
        break;

      case 'hex_conversion':
        tasksEl.innerHTML = `
          <div class="module-input-grid">
            ${ex.tasks
              .map(
                (t, i) => `
              <div class="module-input-group">
                <label class="module-label">${t.label}</label>
                <input type="text" class="module-input module-input-mono ns-task-input" data-index="${i}" placeholder="${t.to === 'hex' ? 'z.B. FF' : 'z.B. 255'}">
              </div>
            `
              )
              .join('')}
          </div>
        `;
        break;

      case 'bin_to_hex':
        tasksEl.innerHTML = `
          <div class="module-input-grid">
            ${ex.tasks
              .map(
                (t, i) => `
              <div class="module-input-group">
                <label class="module-label">${t.label} → Hex</label>
                <input type="text" class="module-input module-input-mono ns-task-input" data-index="${i}" placeholder="z.B. FA">
              </div>
            `
              )
              .join('')}
          </div>
        `;
        break;

      case 'storage_units':
        tasksEl.innerHTML = `
          <div class="module-input-grid">
            ${ex.tasks
              .map(
                (t, i) => `
              <div class="module-input-group">
                <label class="module-label">${t.question}</label>
                <div style="display:flex;align-items:center;gap:var(--space-2)">
                  <input type="text" class="module-input module-input-mono ns-task-input" data-index="${i}" placeholder="Ergebnis" style="flex:1">
                  <span class="ns-unit-label">${t.unit}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `;
        break;

      case 'transfer_time':
        tasksEl.innerHTML = `
          ${ex.tasks
            .map(
              (t, i) => `
            <div class="ns-transfer-task">
              <label class="module-label">${t.label}</label>
              <div class="ns-transfer-inputs">
                <div class="module-input-group">
                  <label class="module-label">Gesamtsekunden (aufgerundet)</label>
                  <input type="number" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="seconds" placeholder="z.B. 215">
                </div>
                <div class="module-input-group">
                  <label class="module-label">Minuten</label>
                  <input type="number" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="minutes" placeholder="z.B. 3">
                </div>
                <div class="module-input-group">
                  <label class="module-label">Restsekunden</label>
                  <input type="number" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="restseconds" placeholder="z.B. 35">
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        `;
        break;

      case 'image_storage':
        tasksEl.innerHTML = `
          ${ex.tasks
            .map(
              (t, i) => `
            <div class="ns-image-task">
              <label class="module-label">${t.label}</label>
              <div class="module-input-grid">
                <div class="module-input-group">
                  <label class="module-label">Speicher in Byte</label>
                  <input type="number" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="bytes" placeholder="z.B. 6220800">
                </div>
                <div class="module-input-group">
                  <label class="module-label">Speicher in MiB (2 Nachkommastellen)</label>
                  <input type="text" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="mib" placeholder="z.B. 5,93">
                </div>
              </div>
            </div>
          `
            )
            .join('')}
          ${
            ex.bonusQuestion
              ? `
            <div class="ns-bonus-task">
              <label class="module-label ns-bonus-label">Bonus: ${ex.bonusQuestion.question}</label>
              <div style="display:flex;align-items:center;gap:var(--space-2)">
                <input type="text" class="module-input module-input-mono ns-task-input" data-index="bonus" data-field="bonus" placeholder="z.B. 33,33" style="max-width:200px">
                <span class="ns-unit-label">%</span>
              </div>
            </div>
          `
              : ''
          }
        `;
        break;

      case 'mixed':
        tasksEl.innerHTML = `
          ${ex.tasks
            .map((t, i) => {
              if (t.type === 'transfer') {
                return `
                <div class="ns-mixed-task">
                  <label class="module-label"><strong>${t.label}</strong> ${t.question}</label>
                  <div class="ns-transfer-inputs">
                    <div class="module-input-group">
                      <label class="module-label">Minuten</label>
                      <input type="number" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="minutes" placeholder="Min">
                    </div>
                    <div class="module-input-group">
                      <label class="module-label">Sekunden</label>
                      <input type="number" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="seconds" placeholder="Sek">
                    </div>
                  </div>
                </div>
              `;
              }
              return `
              <div class="ns-mixed-task">
                <label class="module-label"><strong>${t.label}</strong> ${t.question}</label>
                <div style="display:flex;align-items:center;gap:var(--space-2)">
                  <input type="text" class="module-input module-input-mono ns-task-input" data-index="${i}" data-field="answer" placeholder="Antwort" style="max-width:300px">
                  ${t.unit ? `<span class="ns-unit-label">${t.unit}</span>` : ''}
                </div>
              </div>
            `;
            })
            .join('')}
        `;
        break;
    }
  }

  function setupExerciseButtons(ex) {
    const checkBtn = document.getElementById('nsCheckBtn');
    const hintBtn = document.getElementById('nsHintBtn');
    const solutionBtn = document.getElementById('nsSolutionBtn');

    if (checkBtn) {
      const handler = () => checkExercise(ex);
      checkBtn.addEventListener('click', handler);
      cleanup_fns.push(() => checkBtn.removeEventListener('click', handler));
    }

    if (hintBtn) {
      const handler = () => {
        const hintEl = document.getElementById('nsExerciseHint');
        if (hintEl) {
          hintEl.style.display =
            hintEl.style.display === 'none' ? 'block' : 'none';
          hintEl.innerHTML = `<div class="module-feedback" style="background:var(--warning-bg);color:var(--warning);border:1px solid var(--warning)"><strong>Hinweis:</strong> ${ex.hint}</div>`;
        }
      };
      hintBtn.addEventListener('click', handler);
      cleanup_fns.push(() => hintBtn.removeEventListener('click', handler));
    }

    if (solutionBtn) {
      const handler = () => showSolution(ex);
      solutionBtn.addEventListener('click', handler);
      cleanup_fns.push(() => solutionBtn.removeEventListener('click', handler));
    }
  }

  function checkExercise(ex) {
    const feedbackEl = document.getElementById('nsExerciseFeedback');
    if (!feedbackEl) return;

    const _inputs = document.querySelectorAll('.ns-task-input');
    let allCorrect = true;
    let correctCount = 0;
    let totalCount = 0;

    switch (ex.type) {
      case 'dec_to_bin': {
        ex.tasks.forEach((t, i) => {
          const input = document.querySelector(
            `.ns-task-input[data-index="${i}"]`
          );
          if (!input) return;
          totalCount++;
          const userVal = input.value.trim().replace(/\s/g, '');
          const expected = decToBin(t.value, t.bits);
          if (userVal === expected) {
            input.classList.add('module-input-correct');
            input.classList.remove('module-input-wrong');
            correctCount++;
          } else {
            input.classList.add('module-input-wrong');
            input.classList.remove('module-input-correct');
            allCorrect = false;
          }
        });
        break;
      }

      case 'hex_conversion': {
        ex.tasks.forEach((t, i) => {
          const input = document.querySelector(
            `.ns-task-input[data-index="${i}"]`
          );
          if (!input) return;
          totalCount++;
          const userVal = input.value.trim().toUpperCase();
          let expected;
          if (t.to === 'dec') {
            expected = hexToDec(t.value).toString();
          } else {
            expected = decToHex(t.value);
          }
          if (userVal === expected) {
            input.classList.add('module-input-correct');
            input.classList.remove('module-input-wrong');
            correctCount++;
          } else {
            input.classList.add('module-input-wrong');
            input.classList.remove('module-input-correct');
            allCorrect = false;
          }
        });
        break;
      }

      case 'bin_to_hex': {
        ex.tasks.forEach((t, i) => {
          const input = document.querySelector(
            `.ns-task-input[data-index="${i}"]`
          );
          if (!input) return;
          totalCount++;
          const userVal = input.value.trim().toUpperCase();
          const expected = binToHex(t.binary);
          if (userVal === expected) {
            input.classList.add('module-input-correct');
            input.classList.remove('module-input-wrong');
            correctCount++;
          } else {
            input.classList.add('module-input-wrong');
            input.classList.remove('module-input-correct');
            allCorrect = false;
          }
        });
        break;
      }

      case 'storage_units': {
        ex.tasks.forEach((t, i) => {
          const input = document.querySelector(
            `.ns-task-input[data-index="${i}"]`
          );
          if (!input) return;
          totalCount++;
          const userVal = Number.parseFloat(input.value.replace(',', '.'));
          if (!Number.isNaN(userVal) && Math.abs(userVal - t.answer) < 0.01) {
            input.classList.add('module-input-correct');
            input.classList.remove('module-input-wrong');
            correctCount++;
          } else {
            input.classList.add('module-input-wrong');
            input.classList.remove('module-input-correct');
            allCorrect = false;
          }
        });
        break;
      }

      case 'transfer_time': {
        ex.tasks.forEach((t, i) => {
          const secInput = document.querySelector(
            `.ns-task-input[data-index="${i}"][data-field="seconds"]`
          );
          const minInput = document.querySelector(
            `.ns-task-input[data-index="${i}"][data-field="minutes"]`
          );
          const restInput = document.querySelector(
            `.ns-task-input[data-index="${i}"][data-field="restseconds"]`
          );

          // Check total seconds
          if (secInput) {
            totalCount++;
            const userSec = Number.parseInt(secInput.value, 10);
            if (userSec === t.answerSeconds) {
              secInput.classList.add('module-input-correct');
              secInput.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              secInput.classList.add('module-input-wrong');
              secInput.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }

          // Check minutes
          if (minInput) {
            totalCount++;
            const userMin = Number.parseInt(minInput.value, 10);
            if (userMin === t.answerMinutes) {
              minInput.classList.add('module-input-correct');
              minInput.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              minInput.classList.add('module-input-wrong');
              minInput.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }

          // Check rest seconds
          if (restInput) {
            totalCount++;
            const userRest = Number.parseInt(restInput.value, 10);
            if (userRest === t.answerRestSeconds) {
              restInput.classList.add('module-input-correct');
              restInput.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              restInput.classList.add('module-input-wrong');
              restInput.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }
        });
        break;
      }

      case 'image_storage': {
        ex.tasks.forEach((t, i) => {
          const bytesInput = document.querySelector(
            `.ns-task-input[data-index="${i}"][data-field="bytes"]`
          );
          const mibInput = document.querySelector(
            `.ns-task-input[data-index="${i}"][data-field="mib"]`
          );

          if (bytesInput) {
            totalCount++;
            const userBytes = Number.parseInt(bytesInput.value, 10);
            if (userBytes === t.answerBytes) {
              bytesInput.classList.add('module-input-correct');
              bytesInput.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              bytesInput.classList.add('module-input-wrong');
              bytesInput.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }

          if (mibInput) {
            totalCount++;
            const userMiB = Number.parseFloat(mibInput.value.replace(',', '.'));
            if (
              !Number.isNaN(userMiB) &&
              Math.abs(userMiB - t.answerMiB) < 0.02
            ) {
              mibInput.classList.add('module-input-correct');
              mibInput.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              mibInput.classList.add('module-input-wrong');
              mibInput.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }
        });

        // Bonus
        if (ex.bonusQuestion) {
          const bonusInput = document.querySelector(
            '.ns-task-input[data-index="bonus"]'
          );
          if (bonusInput?.value.trim()) {
            totalCount++;
            const userBonus = Number.parseFloat(
              bonusInput.value.replace(',', '.')
            );
            if (
              !Number.isNaN(userBonus) &&
              Math.abs(userBonus - ex.bonusQuestion.answer) <=
                ex.bonusQuestion.tolerance
            ) {
              bonusInput.classList.add('module-input-correct');
              bonusInput.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              bonusInput.classList.add('module-input-wrong');
              bonusInput.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }
        }
        break;
      }

      case 'mixed': {
        ex.tasks.forEach((t, i) => {
          if (t.type === 'transfer') {
            const minInput = document.querySelector(
              `.ns-task-input[data-index="${i}"][data-field="minutes"]`
            );
            const secInput = document.querySelector(
              `.ns-task-input[data-index="${i}"][data-field="seconds"]`
            );

            if (minInput) {
              totalCount++;
              const userMin = Number.parseInt(minInput.value, 10);
              if (userMin === t.answerMinutes) {
                minInput.classList.add('module-input-correct');
                minInput.classList.remove('module-input-wrong');
                correctCount++;
              } else {
                minInput.classList.add('module-input-wrong');
                minInput.classList.remove('module-input-correct');
                allCorrect = false;
              }
            }

            if (secInput) {
              totalCount++;
              const userSec = Number.parseInt(secInput.value, 10);
              if (userSec === t.answerSeconds || userSec === t.totalSeconds) {
                secInput.classList.add('module-input-correct');
                secInput.classList.remove('module-input-wrong');
                correctCount++;
              } else {
                secInput.classList.add('module-input-wrong');
                secInput.classList.remove('module-input-correct');
                allCorrect = false;
              }
            }
          } else {
            const input = document.querySelector(
              `.ns-task-input[data-index="${i}"][data-field="answer"]`
            );
            if (!input) return;
            totalCount++;
            const userVal = input.value
              .trim()
              .toUpperCase()
              .replace(',', '.')
              .replace(/\s/g, '');

            let correct = false;
            if (t.type === 'dec_to_bin') {
              correct = userVal === t.answer;
            } else if (t.type === 'bin_to_hex') {
              correct = userVal === t.answer;
            } else if (t.type === 'unit') {
              const num = Number.parseFloat(userVal);
              correct = !Number.isNaN(num) && Math.abs(num - t.answer) < 0.01;
            } else if (t.type === 'image') {
              const num = Number.parseFloat(userVal);
              correct = !Number.isNaN(num) && Math.abs(num - t.answer) < 0.02;
            }

            if (correct) {
              input.classList.add('module-input-correct');
              input.classList.remove('module-input-wrong');
              correctCount++;
            } else {
              input.classList.add('module-input-wrong');
              input.classList.remove('module-input-correct');
              allCorrect = false;
            }
          }
        });
        break;
      }
    }

    if (allCorrect && totalCount > 0) {
      feedbackEl.innerHTML = `<div class="module-feedback module-feedback-success"><strong>Richtig!</strong> Alle ${correctCount} Antworten sind korrekt.</div>`;
      progress.exercises[ex.id] = { solved: true, timestamp: Date.now() };
      saveProgress();

      // Update nav button
      const navBtn = document.querySelector(
        `.ns-exercise-btn[data-index="${currentExercise}"]`
      );
      if (navBtn) navBtn.classList.add('completed');
    } else if (totalCount > 0) {
      feedbackEl.innerHTML = `<div class="module-feedback module-feedback-error"><strong>${correctCount}/${totalCount}</strong> richtig. Pruefe die rot markierten Felder.</div>`;
    }
  }

  function showSolution(ex) {
    const solutionEl = document.getElementById('nsExerciseSolution');
    if (!solutionEl) return;

    solutionEl.style.display =
      solutionEl.style.display === 'none' ? 'block' : 'none';

    let solutionHtml =
      '<div class="module-steps"><h4 class="module-steps-title">Loesung mit Rechenweg</h4>';

    switch (ex.type) {
      case 'dec_to_bin': {
        ex.tasks.forEach((t) => {
          const steps = decToBinSteps(t.value);
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">${t.label} → Binaer</div>
              <div class="module-step-detail">${steps.steps
                .map(
                  (s) =>
                    `${String(s.dividend).padStart(4)} ÷ 2 = ${String(s.quotient).padStart(4)}  Rest ${s.remainder}`
                )
                .join('\n')}
→ Ergebnis: <strong>${decToBin(t.value, t.bits)}</strong></div>
            </div>
          `;
        });
        break;
      }

      case 'hex_conversion': {
        ex.tasks.forEach((t) => {
          if (t.to === 'dec') {
            const steps = hexToDecSteps(t.value);
            solutionHtml += `
              <div class="module-step">
                <div class="module-step-title">${t.label}</div>
                <div class="module-step-detail">${steps.steps
                  .map(
                    (s) =>
                      `${s.char} × 16^${s.position} = ${s.value} × ${s.power} = ${s.contribution}`
                  )
                  .join('\n')}
→ Summe: <strong>${steps.result}</strong></div>
              </div>
            `;
          } else {
            const steps = decToHexSteps(t.value);
            solutionHtml += `
              <div class="module-step">
                <div class="module-step-title">${t.label}</div>
                <div class="module-step-detail">${steps.steps
                  .map(
                    (s) =>
                      `${s.dividend} ÷ 16 = ${s.quotient}  Rest ${s.remainder} → ${s.hexChar}`
                  )
                  .join('\n')}
→ Ergebnis: <strong>${steps.result}</strong></div>
              </div>
            `;
          }
        });
        break;
      }

      case 'bin_to_hex': {
        ex.tasks.forEach((t) => {
          const steps = binToHexSteps(t.binary);
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">${t.label} → Hex</div>
              <div class="module-step-detail">4er-Gruppierung:
${steps.groups.map((g) => `  ${g.binary} → ${g.decimal} → ${g.hex}`).join('\n')}
→ Ergebnis: <strong>${steps.result}</strong></div>
            </div>
          `;
        });
        break;
      }

      case 'storage_units': {
        ex.tasks.forEach((t) => {
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">${t.question}</div>
              <div class="module-step-text">${t.explanation}</div>
              <div class="module-step-detail">Antwort: <strong>${t.answer} ${t.unit}</strong></div>
            </div>
          `;
        });
        break;
      }

      case 'transfer_time': {
        ex.tasks.forEach((t) => {
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">${t.label}</div>
              <div class="module-step-detail">${t.explanation}

→ Gesamt: <strong>${t.answerSeconds} Sekunden</strong>
→ <strong>${t.answerMinutes} Minuten und ${t.answerRestSeconds} Sekunden</strong></div>
            </div>
          `;
        });
        break;
      }

      case 'image_storage': {
        ex.tasks.forEach((t) => {
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">${t.label}</div>
              <div class="module-step-detail">${t.explanation}

→ <strong>${formatNumber(t.answerBytes)} Byte = ${formatNumber(t.answerMiB)} MiB</strong></div>
            </div>
          `;
        });
        if (ex.bonusQuestion) {
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">Bonus: ${ex.bonusQuestion.question}</div>
              <div class="module-step-detail">${ex.bonusQuestion.explanation}

→ <strong>${formatNumber(ex.bonusQuestion.answer)}%</strong></div>
            </div>
          `;
        }
        break;
      }

      case 'mixed': {
        ex.tasks.forEach((t) => {
          solutionHtml += `
            <div class="module-step">
              <div class="module-step-title">${t.label} ${t.question}</div>
              ${t.explanation ? `<div class="module-step-detail">${t.explanation}</div>` : ''}
              <div class="module-step-detail">Antwort: <strong>${
                t.type === 'transfer'
                  ? `${t.totalSeconds} Sekunden = ${t.answerMinutes} Min ${t.answerSeconds} Sek`
                  : `${t.answer}${t.unit ? ` ${t.unit}` : ''}`
              }</strong></div>
            </div>
          `;
        });
        break;
      }
    }

    solutionHtml += '</div>';
    solutionEl.innerHTML = solutionHtml;
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  function cleanup() {
    cleanup_fns.forEach((fn) => {
      fn();
    });
    cleanup_fns = [];
  }

  return { render, cleanup };
})();

export default NumberSystemsView;
