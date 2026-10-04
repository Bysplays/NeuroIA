import { jsPDF } from 'jspdf';
import { ACTIVITY_EXERCISES } from './activityExercises';
import type { ActivityInsights, AiAnalysis } from './activityInsights';
import type {responseMetrics} from './responseMetrics';

interface ReportInput { insights: ActivityInsights; text: string; reference: string; provenance?: AiAnalysis['provenance']; responses?: ReturnType<typeof responseMetrics> }
const ink = '#173B55', blue = '#276A93', muted = '#566F81', pale = '#EAF3F8', border = '#D4E4EE';
const number = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const day = (s: string | null) => s ? new Date(`${s}T12:00:00Z`).toLocaleDateString('es-ES', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin datos';
const base64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
};
async function font(path: string, signal: AbortSignal) {
  const response = await fetch(`${import.meta.env.BASE_URL}fonts/manrope/${path}`, { signal });
  if (!response.ok) throw Error('No se ha podido cargar la tipografía del informe.');
  return base64(await response.arrayBuffer());
}
async function logo(signal: AbortSignal) {
  const response = await fetch(`${import.meta.env.BASE_URL}brand/neuroia-logo.svg`, { signal });
  if (!response.ok) throw Error('No se ha podido cargar el logo del informe.');
  const url = URL.createObjectURL(await response.blob());
  try {
    const img = new Image(); img.src = url; await img.decode(); signal.throwIfAborted();
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 320;
    const context = canvas.getContext('2d'); if (!context) throw Error('No se ha podido preparar el logo.');
    context.drawImage(img, 0, 0, 1200, 320);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

/** Fixed A4 template. Text stays selectable; model/user text is never executed as HTML. */
export async function createActivityReportPdf(input: ReportInput, signal: AbortSignal): Promise<Blob> {
  const [regular, bold, mark] = await Promise.all([font('Manrope-Regular.ttf', signal), font('Manrope-Bold.ttf', signal), logo(signal)]);
  signal.throwIfAborted();
  const { insights, provenance } = input;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.addFileToVFS('Manrope-Regular.ttf', regular); doc.addFont('Manrope-Regular.ttf', 'Manrope', 'normal');
  doc.addFileToVFS('Manrope-Bold.ttf', bold); doc.addFont('Manrope-Bold.ttf', 'Manrope', 'bold');
  doc.setProperties({ title: 'NeuroIA · Informe de actividad', subject: 'Actividad y sugerencias de práctica', author: 'NeuroIA', creator: 'NeuroIA' });
  doc.setLanguage('es-ES');
  let y = 48;
  const style = (size = 10, weight = 'normal', color = ink) => { doc.setFont('Manrope', weight); doc.setFontSize(size); doc.setTextColor(color); };
  const header = () => {
    doc.addImage(mark, 'PNG', 18, 15, 48, 12.8);
    style(8, 'bold', muted); doc.text('INFORME DE ACTIVIDAD', 190, 23, { align: 'right' });
    doc.setDrawColor(border); doc.setLineWidth(.25); doc.line(20, 35, 190, 35);
  };
  const nextPage = () => { doc.addPage(); header(); y = 48; };
  const ensure = (height: number) => { if (y + height > 270) nextPage(); };
  const lines = (text: string, width: number, size = 10, weight = 'normal') => { style(size, weight); return doc.splitTextToSize(text, width) as string[]; };
  const paragraph = (text: string, size = 10, color = ink, x = 20, width = 170, weight = 'normal') => {
    const content = lines(text, width, size, weight); const height = size * .48;
    for (const line of content) { ensure(height); style(size, weight, color); doc.text(line, x, y); y += height; }
    y += 3;
  };
  const section = (index: string, title: string) => {
    ensure(48); y += 7;
    doc.setFillColor(blue); doc.rect(20, y - 6, 9, 9, 'F');
    style(8, 'bold', '#FFFFFF'); doc.text(index, 24.5, y, { align: 'center' });
    style(16, 'bold'); doc.text(title, 34, y + .5);
    doc.setDrawColor(border); doc.setLineWidth(.25); doc.line(20, y + 7, 190, y + 7); y += 16;
  };
  header();
  style(26, 'bold'); doc.text('Informe de actividad', 20, y); y += 11;
  paragraph(input.reference.trim() || 'Mi actividad', 12, muted);
  paragraph(`${day(insights.firstDay)} — ${day(insights.lastDay)}`, 9, muted);
  const cards = [
    { value: number(insights.count), label: 'Partidas completadas' },
    { value: number(insights.activeDays), label: 'Días con actividad' },
    { value: number(insights.seconds / 60), label: 'Minutos registrados' },
  ];
  ensure(34);
  cards.forEach((card, i) => {
    const x = 20 + i * 58;
    doc.setFillColor(pale); doc.rect(x, y, 54, 29, 'F');
    style(21, 'bold', blue); doc.text(card.value, x + 27, y + 13, { align: 'center' });
    style(8, 'normal', muted); doc.text(card.label, x + 27, y + 22, { align: 'center' });
  }); y += 38;
  paragraph(`${insights.partial ? 'Historial parcial' : 'Historial disponible'} · ${provenance ? 'Generado con IA' : 'Resumen de actividad'}`, 8, muted);
  // Vector radars stay sharp in the downloaded PDF and use the same measures as Resumen.
  ensure(126);
  y += 6;
  const chartY = y;
  const radar = (cx: number, title: string, items: { title: string; value: number | null }[], max: number, suffix: string, rings: number) => {
    style(11, 'bold'); doc.text(title, cx, chartY + 2, { align: 'center' });
    const cy = chartY + 48, radius = 22;
    const point = (i: number, r: number): [number, number] => {
      const angle = -Math.PI / 2 + i * 2 * Math.PI / items.length;
      return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
    };
    const polygon = (points: [number, number][], color: string, width: number) => {
      doc.setDrawColor(color); doc.setLineWidth(width);
      points.forEach((p, i) => { const next = points[(i + 1) % points.length]; doc.line(...p, ...next); });
    };
    for (let ring = 1; ring <= rings; ring++) polygon(items.map((_, i) => point(i, radius * ring / rings)), border, .2);
    items.forEach((item, i) => {
      doc.setDrawColor(border); doc.setLineWidth(.2); doc.line(cx, cy, ...point(i, radius));
      const [lx, ly] = point(i, radius + 12);
      const label = lines(item.title, 29, 6.8);
      style(6.8, 'normal', muted);
      label.forEach((line, j) => doc.text(line, lx, ly + (j - (label.length - 1) / 2) * 3, { align: 'center' }));
      style(7, 'bold', blue);
      doc.text(item.value === null ? 'Sin probar' : `${number(item.value)}${suffix}`, lx, ly + (label.length + 1) / 2 * 3 + 1, { align: 'center' });
    });
    if (items.every(item => item.value !== null)) polygon(items.map((item, i) => point(i, radius * item.value! / max)), blue, .65);
    doc.setFillColor(blue);
    items.forEach((item, i) => { if (item.value !== null) doc.circle(...point(i, radius * item.value / max), .9, 'F'); });
  };
  const domains = [ ['attention', 'Atención'], ['language', 'Lenguaje'], ['memory', 'Memoria'], ['executive', 'Organización'], ['motor', 'Coordinación'] ];
  const areas = domains.map(([id, title]) => ({ title, value: insights.games.filter(game => ACTIVITY_EXERCISES.find(exercise => exercise.id === game.id)?.domain === id).reduce((sum, game) => sum + game.count, 0) }));
  radar(59, 'Práctica por área', areas, Math.max(1, ...areas.map(area => area.value)), '', 4);
  radar(151, 'Niveles actuales', insights.currentLevels.map(game => ({ title: game.title, value: game.level ?? 0 })), 10, '/10', 5);
  y = chartY + 98;
  const chartNote = lines('Áreas: partidas del periodo seleccionado. Niveles: situación actual, de 1 a 10. Los juegos sin probar se representan como nivel 0.', 170, 8);
  ensure(chartNote.length * 4 + 3); style(8, 'normal', muted);
  chartNote.forEach(line => { doc.text(line, 105, y, { align: 'center' }); y += 4; });
  y += 3;
  // The opening page belongs to activity and charts; narrative starts afterwards.
  nextPage();
  section('01', 'Resumen y recomendaciones');
  const narrativePanel = (text: string, title: string, emphasis: boolean) => {
    const content = lines(text, 150, 10);
    let offset = 0;
    while (offset < content.length) {
      ensure(40);
      const count = Math.min(content.length - offset, Math.max(1, Math.floor((268 - y - 25) / 5)));
      const height = 23 + count * 5;
      doc.setFillColor(emphasis ? pale : '#F5F8FA'); doc.rect(20, y, 170, height, 'F');
      doc.setFillColor(emphasis ? blue : border); doc.rect(20, y, 1, height, 'F');
      style(9, 'bold', blue); doc.text(offset ? `${title} · continuación` : title, 28, y + 9);
      style(10);
      content.slice(offset, offset + count).forEach((line, i) => doc.text(line, 28, y + 18 + i * 5));
      y += height + 5; offset += count;
      if (offset < content.length) nextPage();
    }
  };
  let recommendation = 0;
  input.text.trim().split(/\n\s*\n/).forEach((block, index) => {
    const suggestion = insights.suggestions.find(item => block.startsWith(`${item.title}\n`));
    if (index === 0) narrativePanel(block, 'UNA MIRADA A TU PRÁCTICA', true);
    else if (suggestion) {
      recommendation++;
      narrativePanel(block.slice(suggestion.title.length + 1), `${String(recommendation).padStart(2, '0')}  ${suggestion.title}`, false);
    } else { paragraph(block, 10, ink, 24, 162); }
  });
  ensure(55);
  section('02', 'Actividad por juego');
  paragraph('Juegos con partidas en la selección o un nivel registrado. El nivel actual es independiente del periodo.', 9, muted);
  const columns = [23, 99, 122, 150, 178];
  const tableHeader = () => {
    doc.setFillColor(blue); doc.rect(20, y - 4, 170, 11, 'F');
    style(8, 'bold', '#FFFFFF');
    ['Juego', 'Partidas', 'Precisión', 's/pregunta', 'Nivel actual'].forEach((t, i) => doc.text(t, columns[i], y + 2, { align: i === 0 ? 'left' : 'center' }));
    y += 13;
  };
  tableHeader();
  const recordedGames = insights.games.filter(game => game.count > 0 || game.currentLevel !== null);
  recordedGames.forEach((game, i) => {
    const title = lines(game.title, 63, 9); const height = Math.max(13, title.length * 4.5 + 7);
    if (y + height > 265) { nextPage(); tableHeader(); }
    if (i % 2 === 0) { doc.setFillColor(pale); doc.rect(20, y - 4, 170, height, 'F'); }
    doc.setDrawColor(border); doc.setLineWidth(.15); doc.line(20, y + height - 4, 190, y + height - 4);
    style(9, 'bold'); title.forEach((line, j) => doc.text(line, 23, y + 3 + j * 4.5));
    [String(game.count), game.accuracy === null ? '—' : `${number(game.accuracy)}%`, game.secondsPerQuestion === null ? '—' : number(game.secondsPerQuestion), game.currentLevel === null ? 'Sin probar' : String(game.currentLevel)]
      .forEach((text, j) => { style(8.5); doc.text(text, columns[j + 1], y + 3, { align: 'center' }); });
    y += height;
  });
  y += 5; section('03', 'Observaciones de actividad');
  const cited = new Set(insights.suggestions.flatMap(suggestion => suggestion.evidence));
  const tableFacts = new Set(recordedGames.map(game => `game:${game.id}`));
  for (const fact of insights.facts.filter(fact => !tableFacts.has(fact.id) && (!fact.id.startsWith('game:') || cited.has(fact.id) || input.text.includes(fact.id)))) {
    ensure(22);
    doc.setFillColor(blue); doc.circle(22, y - 1, .8, 'F');
    paragraph(fact.text, 9, ink, 27, 163); y += 2;
  }
  section('04', 'Alcance del informe');
  const areaNames: Record<string, string> = { attention: 'Atención', memory: 'Memoria', language: 'Lenguaje', executive: 'Organización', motor: 'Coordinación' };
  paragraph(`Periodo solicitado: ${insights.filters.from ? day(insights.filters.from) : 'sin límite inicial'} — ${insights.filters.to ? day(insights.filters.to) : 'sin límite final'}. Zona horaria: ${insights.filters.timeZone}.`, 9, muted);
  paragraph(`Área: ${areaNames[insights.filters.domain] || 'todas'}. Juego: ${insights.games.find(g => g.id === insights.filters.exercise)?.title || 'todos'}.`, 9, muted);
  for (const limitation of insights.limitations) {
    ensure(16); doc.setDrawColor(border); doc.setLineWidth(.6); doc.line(20, y - 3, 20, y + 1);
    paragraph(limitation, 8, muted, 24, 166);
  }
  if(input.responses){
    nextPage();section('05','Respuestas medidas · anexo');
    paragraph('Archivo completo de respuestas verificables, independiente del periodo y los filtros del informe. Solo partidas normales completadas y vinculadas; se agrupan por juego y nivel.',9,muted);
    paragraph('Tiempo activo hasta cada respuesta, sin pausas. Se reinicia tras cada intento o selección previa. No equivale a segundos por pregunta ni a tiempo de reacción clínico. Las ayudas cuentan aperturas durante una oportunidad activa.',9,muted);
    const measured=input.responses;
    paragraph(`Intentos excluidos: ${measured.excluded}. Documentos no válidos: ${measured.malformed}.`,9,muted);
    if(!measured.complete)paragraph('Archivo incompleto: no se muestran totales.',10);
    else if(!measured.rows.length)paragraph('No hay partidas con medidas verificables.',10);
    else for(const row of measured.rows){
      ensure(90);
      paragraph(`${ACTIVITY_EXERCISES.find(game=>game.id===row.exercise)?.title??'Juego'} · Nivel ${row.level}`,12,blue,20,170,'bold');
      const cells=[['Partidas',String(row.sessions)],['Respuestas',String(row.responses)],['Media por respuesta',row.meanResponseMs===null?'Sin respuestas discretas':`${number(row.meanResponseMs/1000)} s`],['Intentos incorrectos',String(row.errors)],['Ayudas abiertas',String(row.hints)],['Selecciones previas',String(row.selections)]];
      const top=y;
      cells.forEach(([label,value],index)=>{
        const x=20+(index%3)*58,cy=top+Math.floor(index/3)*22;
        doc.setFillColor(pale);doc.rect(x,cy,54,20,'F');
        style(7.5,'normal',muted);doc.text(label,x+27,cy+7,{align:'center'});
        style(10,'bold',ink);doc.text(value,x+27,cy+15,{align:'center'});
      });y+=49;
      if(row.contactRatio!==null)paragraph(`Seguimiento en contacto: ${number(row.contactRatio*100)} % de ${number(row.trackingMs/1000)} s medidos.`,9,muted);
    }
    paragraph('Sin estimaciones para partidas antiguas sin registro, pruebas iniciales, prácticas, intentos incompletos o enlaces no confirmados. El seguimiento continuo mide contacto; no produce respuestas discretas. La lectura paginada no es una instantánea atómica.',8,muted);
  }
  y += 4;
  paragraph(`Documento generado: ${new Date().toLocaleString('es-ES')}. NeuroIA no guarda una copia de este documento.`, 8, muted);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setDrawColor(border); doc.line(20, 280, 190, 280);
    style(7, 'normal', muted); doc.text('NeuroIA · Actividad y práctica · No es un informe clínico', 20, 286);
    doc.text(`${i} / ${pages}`, 190, 286, { align: 'right' });
  }
  signal.throwIfAborted();
  return doc.output('blob');
}

export function downloadActivityReport(blob: Blob) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `neuroia-informe-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
