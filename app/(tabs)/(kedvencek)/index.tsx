import React, { useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronUp, FileText, Home, Printer, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCalculationArchive } from '@/contexts/CalculationArchiveContext';
import type { CalculationRecord } from '@/domain/calculationRecord';

const BG = '#0D0F12', CARD = '#161A1F', BORDER = '#2A2F38', TEXT = '#E8ECF0', MUTED = '#98A3AF', BLUE = '#1E90FF';

function esc(value: unknown) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] ?? char)); }
function printableHtml(record: CalculationRecord) {
  const rows = (items: CalculationRecord['inputs']) => items.map(item => `<tr><td>${esc(item.label)}</td><td>${esc(item.value)}</td><td>${esc(item.unit ?? '')}</td><td>${esc(item.origin)}</td></tr>`).join('');
  return `<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>${esc(record.toolTitle)} – ${esc(record.id)}</title><style>body{font-family:Arial,sans-serif;color:#17202a;margin:32px}h1{font-size:24px}h2{font-size:17px;margin-top:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #bbc3cc;padding:7px;text-align:left;font-size:12px}.meta{font-size:12px;color:#4b5563}.warning{border:2px solid #d97706;padding:12px;background:#fff7ed}.footer{margin-top:24px;font-size:10px;color:#6b7280}@media print{button{display:none}}</style></head><body><h1>HVAC Pro számítási jegyzőkönyv</h1><p class="meta">Azonosító: ${esc(record.id)}<br>Dátum: ${esc(record.createdAt)}<br>Ujjlenyomat: ${esc(record.contentFingerprint)}<br>Országprofil: ${esc(record.jurisdiction)}</p><h2>${esc(record.toolTitle)}</h2><p><b>Módszer:</b> ${esc(record.method.name)} (${esc(record.method.id)} / ${esc(record.method.version)})</p><p>${esc(record.method.formulaSummary)}</p><h2>Bemenő adatok</h2><table><tr><th>Adat</th><th>Érték</th><th>Egység</th><th>Eredet</th></tr>${rows(record.inputs)}</table><h2>Eredmények</h2><table><tr><th>Eredmény</th><th>Érték</th><th>Egység</th><th>Eredet</th></tr>${rows(record.outputs)}</table><h2>Feltételezések</h2><ul>${record.assumptions.map(item => `<li>${esc(item)}</li>`).join('') || '<li>Nincs rögzített feltételezés.</li>'}</ul><h2>Források</h2><ul>${record.sources.map(item => `<li>${esc(item.title)} ${esc(item.edition ?? '')} ${esc(item.pageOrSection ?? '')}</li>`).join('') || '<li>Nincs rögzített forrás.</li>'}</ul><div class="warning"><b>Pontossági osztály:</b> ${esc(record.quality.level)} · Adatkitöltöttség: ${esc(record.quality.dataCompletenessPercent)}%<br><b>Hiányzó mezők:</b> ${esc(record.quality.missingRequiredInputKeys.join(', ') || 'nincs')}<br><b>Megfelelőségi állapot:</b> ${esc(record.complianceState)}<br><b>Végleges ellenőrzés:</b> ${esc(record.requiredVerification.join('; '))}</div><p class="footer">A jegyzőkönyv a számítás időpontjában rögzített bemeneteket, módszert és eredményt dokumentálja. A helyszíni mérés, beszabályozás és a jogszabály szerint szükséges tervezői ellenőrzés felelősségét nem helyettesíti.</p><script>window.onload=()=>window.print()</script></body></html>`;
}

function printRecord(record: CalculationRecord) {
  if (Platform.OS !== 'web') return;
  const browserWindow = globalThis.window?.open('', '_blank', 'noopener,noreferrer');
  if (!browserWindow) return;
  browserWindow.document.write(printableHtml(record));
  browserWindow.document.close();
}

export default function CalculationArchiveScreen() {
  const router = useRouter();
  const { records, loaded, deleteCalculation } = useCalculationArchive();
  const [openId, setOpenId] = useState<string | null>(null);
  return <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
    <TouchableOpacity onPress={() => router.push('/(tabs)/(home)')} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF14', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}><Home size={22} color="#60A5FA" /></TouchableOpacity>
    <Text style={{ color: TEXT, fontSize: 26, fontWeight: '900' }}>Számítási jegyzőkönyvek</Text>
    <Text style={{ color: MUTED, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 }}>A mentés a bemeneteket, hiányokat, feltételezéseket, forrást, módszerverziót és eredményt együtt őrzi meg.</Text>
    {!loaded ? <Text style={{ color: MUTED }}>Archívum betöltése…</Text> : null}
    {loaded && records.length === 0 ? <View style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, padding: 22, alignItems: 'center' }}><FileText size={36} color={BLUE} /><Text style={{ color: TEXT, fontSize: 17, fontWeight: '900', marginTop: 10 }}>Még nincs mentett jegyzőkönyv</Text><Text style={{ color: MUTED, textAlign: 'center', lineHeight: 19, marginTop: 6 }}>A számítások eredményénél a „Számítás és bemenetek mentése” gombbal hozható létre.</Text></View> : null}
    {records.map(record => {
      const open = openId === record.id;
      return <View key={record.id} style={{ backgroundColor: CARD, borderColor: BORDER, borderWidth: 1, borderRadius: 16, marginBottom: 10, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setOpenId(open ? null : record.id)} style={{ padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }}><FileText size={20} color={BLUE} /><View style={{ flex: 1 }}><Text style={{ color: TEXT, fontWeight: '900' }}>{record.toolTitle}</Text><Text style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>{new Date(record.createdAt).toLocaleString('hu-HU')} · {record.quality.dataCompletenessPercent}% kitöltve</Text></View>{open ? <ChevronUp size={19} color={MUTED} /> : <ChevronDown size={19} color={MUTED} />}</TouchableOpacity>
        {open ? <View style={{ padding: 15, paddingTop: 0, gap: 8 }}>
          <Text style={{ color: '#D1D7DE', fontSize: 13 }}><Text style={{ fontWeight: '900' }}>Módszer: </Text>{record.method.name} · {record.method.version}</Text>
          <Text style={{ color: '#D1D7DE', fontSize: 13 }}><Text style={{ fontWeight: '900' }}>Pontosság: </Text>{record.quality.level} · {record.quality.dataCompletenessPercent}%</Text>
          <Text style={{ color: record.quality.missingRequiredInputKeys.length ? '#FBBF24' : '#22C55E', fontSize: 13 }}><Text style={{ fontWeight: '900' }}>Hiányzó kötelező adat: </Text>{record.quality.missingRequiredInputKeys.join(', ') || 'nincs'}</Text>
          <Text style={{ color: MUTED, fontSize: 11 }}>Ujjlenyomat: {record.contentFingerprint}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 }}>
            {Platform.OS === 'web' ? <TouchableOpacity onPress={() => printRecord(record)} style={{ backgroundColor: '#2563EB', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', gap: 7 }}><Printer size={17} color="#fff" /><Text style={{ color: '#fff', fontWeight: '900' }}>Nyomtatás / PDF</Text></TouchableOpacity> : null}
            <TouchableOpacity onPress={() => deleteCalculation(record.id)} style={{ backgroundColor: '#7F1D1D', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', gap: 7 }}><Trash2 size={17} color="#fff" /><Text style={{ color: '#fff', fontWeight: '900' }}>Törlés</Text></TouchableOpacity>
          </View>
        </View> : null}
      </View>;
    })}
  </ScrollView>;
}
